import { core } from "./core";
import { $Data, Mutation } from "./data";
import { Observable } from "./observe";
import { $Array } from "./utils";

export function Graph() {
    Object.defineProperty(this, 'source', { enumerable: false, writable: true });

    /** @type {GraphNode} */
    Object.defineProperty(this, 'root', { enumerable: false, writable: true });

    /** @type {boolean} Tell if graph remain available in memory after context dispose*/
    this.permanent;

    this.setSource = function (data) {
        if (data) {
            if (data.$$typeof !== Symbol.for('es.dataobject')) {
                data = $Data.build(data, this.root, this);
            }
            else {
                data.node = this.root;//invertire?
                data.parent = this;
            }
        }
        console.log("GRAPH SET SOUCE", data);
        this.source = data;
        return this;
    }

    this.parse = function (etype, collection, name) {
        this.root = new GraphNode(null, { ...core.typeDef[etype], etype, collection, name }, this);
        return this;
    }
}

export const FLOW_STOP = "S";

export function GraphNode(parent, schemaInfo, graph, path) {
    Observable.call(this);

    Object.defineProperty(this, 'parent', { enumerable: false, writable: true, value: parent });
    Object.defineProperty(this, 'graph', { enumerable: false, writable: true, value: graph });
    Object.defineProperty(this, 'type', { enumerable: false, writable: true });

    this.path = path || "root";
    this.isCollection;
    this.children = [];
    this.Mutation = [];
    this.primarykey;
    this.identity;
    this.link;
    this.name = "root";
    this.etype;
    this.TypeSchema = null;

    if (schemaInfo) this.parse(schemaInfo, graph);
}

core.prototypeOf(Observable, GraphNode, {

    parse: function (info, graph) {
        this.name = info.name;
        this.isCollection = info.collection;
        this.etype = info.etype;
        this.primarykey = info.primarykey || "id";
        this.identity = info.hasOwnProperty("identity") ? info.identity : true;
        this.link = Link.parse(info.link || Link.DOWN_WISE, this);

        const schema = core.typeDef[this.etype];
        if (!schema) throw new Error("GraphNode PARSER: Schema not defined for Entity " + this.etype); //DEV CODE => WARNING SYSTEM
        this.type = schema.type;
        this.TypeSchema = schema.fields;
        schema.children && schema.children.forEach(info => this.children.push(new GraphNode(this, info, graph, this.path + '.' + info.name)));
        return this;
    },

    getChild: function (name) {
        return this.children ? this.children.find(child => child.name === name) : null;
    },

    replace: function (name, node) {
        const index = this.children ? this.children.findIndex(child => child.name === name) : -1;
        if (index !== -1) {
            node.link = this.children[index].link;
            //dovrei sistemare anche path
            this.children[index] = node;
        }
    },

    discendant: function (path) {
        if (!path) return null;
        let n = this;
        path.split('.').forEach(name => n = n.getChild(name));
        return n;
    },

    /**
     * @param {traverseCallback} callback 
     * @param {boolean} deep 
     * @param {*} source 
     * @param {*} ancestor 
     * @param {boolean} generate 
     * @returns 
     */
    traverse: function (callback, deep, source, ancestor, generate) {
        const stop = callback(this, source, ancestor);
        if (!this.children || FLOW_STOP === stop) return stop;
        for (let k = 0; k < this.children.length; k++) {
            if (generate)
                source[this.children[k].name] = {};
            if (deep) {
                if (source) {
                    if (Array.isArray(source)) {
                        for (let j = 0; j < source.length; j++) {
                            const parent = source[j];
                            if (!parent) continue;
                            if (this.children[k].traverse(callback, deep, parent[this.children[k].name], parent, generate) === FLOW_STOP) break;
                        }
                    }
                    else
                        this.children[k].traverse(callback, deep, source[this.children[k].name], source, generate);
                }
                else
                    this.children[k].traverse(callback, deep, null, source, generate);
            }
            else
                callback(this.children[k], source ? source[this.children[k].name] : null, source, generate);
        }
    },

    /**
   * @param {*} data 
   * @param {*} parent 
   * @returns 
   * consider root element has graph as parent
   */
    formatData: function (data, parent, notrack) {
        console.log("DEBUG-NODE-FORMAT", data, parent);

        if (!Array.isArray(data))
            data = [data];

        if (!data[0]) return;
        //here we assume that if first element are linked then all element are linked
        if (this.link?.connected(data[0]) || (!parent && data[0].hasOwnProperty("id"))) return FLOW_STOP; // oppure id > 0

        for (let k = 0; k < data.length; k++) {
            const source = data[k];

            if (!source) continue;

            if (!source.hasOwnProperty("id") && Object.isExtensible(source)) {
                //notrack??
                if (!notrack) {
                    const mutation = source.mutation;
                    for (const key in core.typeDef[this.etype].fields) {
                        if (Object.hasOwnProperty.call(source, key)) {
                            mutation.setValue(key, source[key])
                        }
                    }
                }

                source.id = $Data.entities.nextIndex(this.etype);
                if (source.hasMutation) source.__mutation.id = source.id;
            }

            parent && this.link && this.link.apply(source, this, parent); //if parent === graph => non esiste link....

            //console.log("DEBUG-NODE-FORMAT-SOURCE", parent, source, this.link, this);
        }
    },

    deepFormat: function (data, parent, notrack) {
        this.traverse((node, data, parent) => {
            node.formatData(data, parent, notrack);
        }, true, data, parent);
    },

    /** TODO: handle case of dataobject =>  */
    sync: function (source, item) {
        let syncronized = false;
        const mutation = item.mutation;
        this.traverse((node, data, parent) => {
            if (node.etype === item.$$etype) {
                if (!data) return;
                const isCollection = Array.isArray(data);

                if (mutation.crud === 1) { //da gestire condition di appartenenza x aggiungere
                    isCollection ? data.push(item) : null; // da gestire caso parent in base a link...parent[node.name] = mutation;
                    syncronized = true;
                }
                else {
                    if (!isCollection) data = [data];
                    let obj;
                    for (let k = 0; k < data.length; k++) {
                        obj = data[k];
                        if (obj && item.id === obj.id) {
                            if (mutation.crud === 3) {
                                isCollection ? data.splice(k, 1) : parent[node.name] = null;
                                syncronized = true;
                            }
                            else if (item !== obj) {
                                obj.update(mutation);
                                syncronized = true;
                            }
                        }
                    }
                }
            }
        }, true, source);
        return syncronized;
    },

    save: function (option) {
        const defaultOpt = { queryOp: this.api.queryOp, excludeParams: true };
        Object.assign(defaultOpt, option);
        console.log(JSON.stringify(this));
        return this.api.call(defaultOpt.queryOp, this, defaultOpt).then((result) => {
            console.log("Node Save RESULT:", result);
            result.items = []
            this.Mutation.forEach(m => result.items.push(m.target));
            if (result.items.length > 0) result.item = result.items[0];
            this.traverse((node) => {
                /**
                 * update id key from remote insert
                 * TODO: add other value to update from remote other then id
                 */
                if (result.data.mutation) {
                    const m = result.data.mutation[node.etype];
                    if (m) {
                        m.forEach(el => {
                            if (el.index < 1) {
                                const item = node.Mutation.find(m => m.id === el.index);
                                console.log("NODE-SAVE-REMOTE-INDEX", el, item);
                                if (item) {
                                    item.id = el.id;
                                    item.target.id = el.id;
                                }
                            }
                        });
                    }
                }

                node.Mutation.forEach(function (m, key) {
                    console.log("MUTATION-CLEAR-LOG", m, key);
                    core.source.sync(m.target);
                    m.clear();
                });
                node.Mutation = [];
            }, true);
            return result;
        }, er => {
            console.log("ERROR GraphNode Save", er);
            throw er;
        });
    },

    delete: function (data, option) {
        const defaultOpt = { delOp: "api/jdelete", excludeParams: true };
        Object.assign(defaultOpt, option);

        if (!Array.isArray(data))
            data = [data];

        const mutation = [];
        data.forEach(function (item) {
            //item.mutation.crud = 3;

            mutation.push(item.mutation);
        });

        return this.api.call(defaultOpt.delOp, { etype: this.etype, Mutation: mutation }, defaultOpt).then(() => {
            this.remove(data);
        });
    },

    remove: function (data) {
        if (!Array.isArray(data))
            data = [data];

        data.forEach(function (item) {
            item.mutation.crud = 3;
            core.source.sync(item);
        });
    }
});

core.inject(GraphNode, "IApi");

export const Link = {
    DOWN_WISE: 'd', UP_WISE: 'u', BIDIRECTIONAL: 'b',
    parse: function (direction, node) {
        if (direction === Link.DOWN_WISE) {
            const schema = node.parent;
            if (!schema) return null;
            //per ora non gestisco multi key
            return new BottomLink(schema.primarykey, schema.primarykey + schema.etype, direction);
        }
        else if (direction === Link.UP_WISE) {
            //per ora non gestisco multi key
            return new TopLink(node.primarykey, node.primarykey + node.etype, direction);
        }
        else if (direction === Link.BIDIRECTIONAL) {
            const pschema = node.parent;
            if (!pschema) return null;
            return new DoubleLink(pschema.etype + pschema.primarykey, node.etype + node.primarykey, direction, pschema.etype + "_" + node.etype);
        }
    }
};

export function GraphLink(pk, fk, direction, association) {
    this.pk = pk;
    this.fk = fk;
    this.direction = direction;
    this.association = association;
}

export function BottomLink(pk, fk, direction, association) {
    GraphLink.call(this, pk, fk, direction, association);
    /**
     * @param {*} parent 
     * @param {*} child 
     * @param {GraphNode} node 
     */
    this.apply = function (child, node, parent) {
        //const parent = child.parent;
        if (!parent) return;

        const schema = node.parent; //node.parent.schema;
        const metadata = child.mutation;
        if (parent.id <= 0) {
            metadata.tempkey = {};
            metadata.tempkey[this.fk] = parent.id;
        }
        if (schema.identity) {
            child['$' + this.fk] = parent[this.pk];
            //child.mutate(this.fk, parent[this.pk]);
        }
        else {
            const keys = this.pk.split(',');
            let field;
            for (let k = 0; k < keys.length; k++) {
                field = keys[k];
                child['$' + field + schema.etype] = parent[field];
                //child.mutate(field + schema.etype, parent[field]);
            }
        }
        metadata.linked = true;
    }

    this.connected = function (obj) {
        return obj.parent && obj[this.fk] === obj.parent[this.pk];
    }
}

export function TopLink(pk, fk, direction, association) {
    GraphLink.call(this, pk, fk, direction, association);
    this.apply = function (child, node, parent) {
        //const parent = child.parent;
        const metadata = child.mutation;

        if (child.id < 1) {
            metadata.tempkey = {};
            metadata.tempkey[this.fk] = parent.id;
        }

        if (node.identity) {
            parent['$' + this.fk] = child[this.pk];
            //parent.mutate(this.fk, child[this.pk]);
        }
        else {
            const keys = this.pk.split(',');
            let field;
            for (let k = 0; k < keys.length; k++) {
                field = keys[k];
                parent['$' + field + node.etype] = child[field];
                //parent.mutate(field + node.etype, child[field]);
            }
        }

        metadata.linked = true;
    }

    this.connected = function (obj) {
        return obj.parent && obj.parent[this.fk] === obj[this.pk];
    }
}

export function DoubleLink(pk, fk, direction, association) {
    GraphLink.call(this, pk, fk, direction, association);
    this.apply = function (child, node, parent) {
        //const parent = child.parent;
        const linked = {};
        const mutation = {};
        linked.tempkey = {};

        if (parent.id < 1)
            linked.tempkey[this.pk] = parent.id;

        mutation[this.pk] = parent.id;

        if (child.id < 1)
            linked.tempkey[this.fk] = child.id;

        mutation[this.fk] = child.id;
        linked.mutated = mutation;

        child.mutation.linked = linked;
    }

    this.connected = function (obj) {
        const linked = obj.__mutation?.linked;
        return linked && obj.parent && linked.mutated[this.pk] === obj.parent.id && linked.mutated[this.fk] === obj.id;
    }
}