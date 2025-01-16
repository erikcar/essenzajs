import { core } from "./core";
import { $Data, PendingData, Mutation } from "./data";
import { Observable } from "./observe";
import { $Array } from "./utils";

export function Graph() {
    Object.defineProperty(this, 'source', { enumerable: false, writable: true });

    /** @type {GraphNode} */
    Object.defineProperty(this, 'root', { enumerable: false, writable: true });

    /** @type {boolean} Tell if graph remain available in memory after context dispose*/
    this.permanent;

    this.render = null;
}

Graph.prototype = {
    setSource: function (data) {
        if (data) {
            if (data.$$typeof !== Symbol.for('es.dataobject')) {
                data = $Data.build(data, this.root, this);
            }
            else {
                data.node = this.root;//invertire?
                data.parent = this;
            }
        }

        this.source = data;

        return this;
    },

    parse: function (etype, collection, name) {
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
        this.link = Link.parse(info.link || Link.DOWN_WISE, this, info);

        const schema = core.typeDef[this.etype];
        if (!schema) throw new Error("GraphNode PARSER: Schema not defined for Entity " + this.etype); //DEV CODE => WARNING SYSTEM
        this.type = schema.type;
        this.TypeSchema = schema.fields;
        if(info.link === Link.BIDIRECTIONAL){
            this.TypeSchema[this.primarykey + this.etype] = 6;
            this.TypeSchema[this.parent.primarykey + this.parent.etype] = 6;
        }
        schema.children && schema.children.forEach(info => this.children.push(new GraphNode(this, info, graph, this.path + '.' + info.name)));
        return this;
    },

    getChild: function (name) {
        return this.children ? this.children.find(child => child.name === name) : null;
    },

    clone() {
        return new Graph().parse(this.etype, this.isCollection, "root").root;
    },

    replace: function (name, source, parent) {
        const node = source.node;
        const index = this.children ? this.children.findIndex(child => child.name === name) : -1;
        const oldnode = this.children[index];
        if (oldnode) {
            node.link = oldnode.link;
            node.name = oldnode.name;
            node.path = oldnode.path;
            node.parent = oldnode.parent;
            node.graph = oldnode.graph;

            if (oldnode.pending) {
                const ids = new Set();
                Array.isArray(source) ? source.forEach(el => ids.add(el.id)) : ids.add(source.id);
                oldnode.Mutation.forEach(item => {
                    if (item.disconnected && !ids.has(item.id)) {
                        node.Mutation.push(item);
                        node.pending = true;
                    }
                });
            }

            const graph = new Graph();
            graph.root = oldnode;
            oldnode.parent = graph;

            source.parent = parent;
            node.formatData(source, parent);

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
    traverse: function (callback, deep, source, ancestor, twin, generate) {
        const stop = callback(this, source, ancestor, twin);
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
                            if (this.children[k].traverse(callback, deep, parent[this.children[k].name], parent, twin?.children[k], generate) === FLOW_STOP) break;
                        }
                    }
                    else
                        this.children[k].traverse(callback, deep, source[this.children[k].name], source, twin?.children[k], generate);
                }
                else
                    this.children[k].traverse(callback, deep, null, source, twin?.children[k], generate);
            }
            else
                callback(this.children[k], source ? source[this.children[k].name] : null, source, twin?.children[k]);
        }
    },

    /**
   * @param {*} data 
   * @param {*} parent 
   * @returns 
   * consider root element has graph as parent
   */
    formatData: function (data, parent, notrack) {

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
                            if (mutation.crud > 2) { //3 delete - 4 remove
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

    getDataGraph: function(source){
        let root = this.clone();
        let count = 0;

        root.traverse((node, data, _, twin) => {
            if(twin.hasOwnProperty("returning"))
                node.returning = twin.returning;
            if(!data) return;
            if (!Array.isArray(data))
                data = [data];
            else if(data.parent?.isPending)
                count += data.parent.mutation.loadPendingData(node, true);

            data.forEach(item => {
                if(!item) return;
                if (item.hasMutation) {
                    const mutation = item.mutation;
                    //prima pending nel caso ci fossero entrambe le mutazioni nella stessa sessione save
                    if(mutation.pending)
                         count += mutation.loadPendingData(node);

                    if (mutation.isMutated) {
                        node.Mutation.push(mutation);
                        count++;
                    }
                    else if (mutation.isLinked) {
                        mutation.mutated = null;
                        node.Mutation.push(mutation);
                        count++;
                    }
                }
            });
        }, true, source, null, this);

        return count === 0 ? null : root;
    },

    save: function (source, option) {

        if (!source) return;

        let root = this.getDataGraph(source);
    
        if (root === null) return Promise.resolve();

        const defaultOpt = { queryOp: this.api.queryOp, excludeParams: true };

        let params = root;
        
        if (option && option.data) {
            params = {Root: root, Value: option.data};
            delete option.data;
        }

        Object.assign(defaultOpt, option);

        return this.api.call(defaultOpt.queryOp, params, defaultOpt).then((result) => {
            result.items = []
            root.Mutation.forEach(m => result.items.push(m.target));
            if (result.items.length > 0) result.item = result.items[0];
            root.traverse((node) => {
                /**
                 * update id key from remote insert
                 * TODO: add other value to update from remote other then id
                 */
                if (result.data.mutation) {
                    const m = result.data.mutation[node.etype];
                    if (m) {
                        const type = core.getType(node.etype);
                        m.forEach(el => {
                            type.pending?.has(el.id) && type.pending.delete(el.id);
                            if (el.index < 1) { //in questo caso pending non dovrebbero esistere
                                const item = node.Mutation.find(m => m.id === el.index);
                                if (item) {
                                    item.id = el.id;
                                    item.target.id = el.id;
                                }
                            }
                        });
                    }
                }

                node.Mutation.forEach(function (m, key) {
                    // se è pending non faccio sync, una volta rimosso ha già stato pending se altro parent lo ha cabiato (ma non salvato altrimenti pending non sarebbe aggiunto) non devo sync
                    //if (m instanceof PendingData) return;
                    core.source.sync(m.target);
                    m.clear(); //in teoria qui dispose all anche pending
                });
                //node.Mutation = [];
            }, true);
            return result;
        }, er => {
            //gestire eccezioni remote distinguendo se il salvataggio è stato fatto o no in base all'errore
            console.log("ERROR GraphNode Save", er);
            throw er;
        });
    },

    saveold: function (option) {
        const defaultOpt = { queryOp: this.api.queryOp, excludeParams: true };
        Object.assign(defaultOpt, option);
        return this.api.call(defaultOpt.queryOp, this, defaultOpt).then((result) => {
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
                                if (item) {
                                    item.id = el.id;
                                    item.target.id = el.id;
                                }
                            }
                        });
                    }
                }

                node.Mutation.forEach(function (m, key) {
                    core.source.sync(m.target);
                    m.clear();
                });
                node.Mutation = [];
            }, true);
            return result;
        }, er => {
            throw er;
        });
    },

    delete: function (data, option) {
        const defaultOpt = { delOp: "api/jdelete", excludeParams: true };
        Object.assign(defaultOpt, option);

        if (!Array.isArray(data))
            data = [data];

        const mutation = [];
        data.forEach(item => {
            //item.mutation.crud = 3;
            item.id < 1 ? this.remove(data) : mutation.push(item.mutation);
        });

        return this.api.call(defaultOpt.delOp, { etype: this.etype, Mutation: mutation }, defaultOpt).then(() => {
            data.forEach(item => {
                item.mutation.crud = 3;
                core.source.sync(item);
                $Array.removeItem(this.Mutation, item.mutation);
            });
            
        });
    },

    /*remove: function (data) {
        if (!Array.isArray(data))
            data = [data];

        data.forEach(item => {
            item.mutation.crud = 3;
            core.source.sync(item);
            $Array.removeItem(this.Mutation, item.mutation);
        });
    },*/

    remove: function (data, parent) {
        if (parent) {
            if (!Array.isArray(data))
                data = [data];

            data.forEach(item => {
                //identifico che è un item [removed] -> da rivedere se serve...
                //item.mutation.crud = 4;
                Array.isArray(parent[this.name]) ? $Array.removeById(parent[this.name], item) : parent[this.name] = null;

            });
        }

        this.disconnect(data, parent);

        return data;
    },

    disconnectOld(data, parent) {
        if (!data) return;

        if (!Array.isArray(data))
            data = [data];

        data.forEach(item => {
            let metadata = item.id > 0 ? new PendingData(this, item) : null;
            //TODO: sync deve gestire node in pending state, => ma sync non cicla node.Mutation!
            this.link.disconnect(item, this, parent, metadata);

            item.parent = null;
            //this.split(item);
        })
    },

    connect(data, parent) {
        if (!data) return;

        const pending = parent.isPending ? parent.mutation.pending[this.name] : false;
        //Attenzione 
        if (pending) {
            if (!Array.isArray(data))
                data = [data];

            const type = core.getType(this.etype);

            data.forEach(item => {
                if (pending.has(item.id)) {
                    pending.delete(item.id);
                    pending.size === 0 && delete parent.mutation.pending[this.name];
                    //NON REMOVE da type, lo deve fare solo salvataggio di item perchè potrebbe essere pendente in più parent
                    //type.pending.has(item.id) && type.pending.delete(item.id);
                }
            });
        }

        this.formatData(data, parent);
    },

    disconnect(data, parent) {
        if (!data) return;

        if (!Array.isArray(data))
            data = [data];

        data.forEach(item => {

            let pending = item.id > 0 ? new PendingData(this, item) : null;

            this.link.disconnect(item, this, parent, pending);

            if (pending?.isMutated) {
                const mutation = parent.mutation;
                if (!mutation.pending) {
                    mutation.pending = { [this.name]: new Map() };
                }
                else if (!mutation.pending.hasOwnProperty(this.name))
                    mutation.pending[this.name] = new Map();

                mutation.pending[this.name].set(pending.id, pending);

                pending.parent = mutation.pending[this.name];

                const type = core.getType(this.etype);

                if (!type.pending.has(pending.id))
                    type.pending.add(pending.id)
            }
        })
    },

    split: function (source) {
        if (!source) return;

        const graph = new Graph().parse(this.etype, this.isCollection, "root").setSource(source);

        this.traverse((node, data, _, twin) => {

            data.node = twin; //=== reset => assegno a data graph il proprio node lungo tutto il grafo

            if (!Array.isArray(data))
                data = [data];

            data.forEach(item => {
                if (item.hasMutation) {
                    $Array.removeItem(node.Mutation, item.mutation);
                    twin.Mutation.push(item, item.mutation);
                }
            });

        }, true, source, null, graph.root);

        return graph.root;
    },

    reset(source) {
        if (!source) return;

        const graph = new Graph().parse(this.etype, this.isCollection, "root").setSource(source);

        graph.root.traverse((node, data) => {
            data.node = node;
        }, true, source);
    },

    clean(source) {
        if (!source) return;

        this.traverse((node, data,) => {
            if (!Array.isArray(data))
                data = [data];

            data.forEach(item => {
                item.hasMutation &&
                    $Array.removeItem(node.Mutation, item.mutation);
            });

        }, true, source, null);
    },

    clear() { this.Mutation = []; }
});

core.inject(GraphNode, "IApi");

export const Link = {
    DOWN_WISE: 'd', UP_WISE: 'u', BIDIRECTIONAL: 'b',
    //DOWN_WISE: '->', UP_WISE: '<-', BIDIRECTIONAL: '<->',
    parse: function (direction, node, info) {
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
            return new DoubleLink(pschema.primarykey + pschema.etype, node.primarykey + node.etype, direction, info.association || (pschema.etype + "_" + node.etype));
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
}

BottomLink.prototype = {
    /**
     * @param {*} parent 
     * @param {*} child 
     * @param {GraphNode} node 
     */
    apply: function (child, node, parent) {
        //const parent = child.parent;
        if (!parent) return;

        const schema = node.parent; //node.parent.schema;
        
        if (parent.id < 1) {
            const metadata = child.mutation;
            metadata.tempkey = {};
            metadata.tempkey[this.fk] = parent.id;
        }
        if (schema.identity) {
            child['$' + this.fk] = parent[this.pk];
        }
        else {
            const keys = this.pk.split(',');
            let field;
            for (let k = 0; k < keys.length; k++) {
                field = keys[k];
                child['$' + field + schema.etype] = parent[field];
            }
        }
        //metadata.linked = true; //Attenzione se item ha più relazioni? ognuno ha il proprio metadata solo mutated al max condiviso;
    },

    disconnect: function (child, node, _, disconnected) {
        const metadata = child.mutation;
        if (metadata.tempkey?.hasOwnProperty(this.fk)) {
            delete metadata.tempkey[this.fk];
        }
        const schema = node.parent;
        if (schema.identity) {
            child['$' + this.fk] = null; //0
            disconnected && disconnected.setValue(this.fk, null)
        }
        //metadata.linked = false;
    },

    connected: function (obj) {
        return obj.parent && obj[this.fk] === obj.parent[this.pk];
    }
}

export function TopLink(pk, fk, direction, association) {
    GraphLink.call(this, pk, fk, direction, association);
}

TopLink.prototype = {
    apply: function (child, node, parent) {

        if (child.id < 1) {
            const metadata = child.mutation;
            metadata.tempkey = {};
            metadata.tempkey[this.fk] = parent.id;
        }

        if (node.identity) {
            parent['$' + this.fk] = child[this.pk];
        }
        else {
            const keys = this.pk.split(',');
            let field;
            for (let k = 0; k < keys.length; k++) {
                field = keys[k];
                parent['$' + field + node.etype] = child[field];
            }
        }

        //metadata.linked = true;
    },

    disconnect: function (child, node, parent, disconnected) {
        const metadata = child.mutation;

        if (metadata.tempkey?.hasOwnProperty(this.fk)) {
            delete metadata.tempkey[this.fk];
        }

        if (node.identity) {
            parent['$' + this.fk] = null;
        }

        //metadata.linked = false;
    },

    connected: function (obj) {
        return obj.parent && obj.parent[this.fk] === obj[this.pk];
    }
}

export function DoubleLink(pk, fk, direction, association) {
    GraphLink.call(this, pk, fk, direction, association);
    this.apply = function (child, node, parent) {
        //const parent = child.parent;
        const linked = { association: true};
        const mutation = {};
        linked.tempkey = {};

        if (parent.id < 1)
            linked.tempkey[this.pk] = parent.id;

        mutation[this.pk] = parent.id;

        if (child.id < 1)
            linked.tempkey[this.fk] = child.id;

        mutation[this.fk] = child.id;
        linked.mutated = mutation;
        //TODO: da trasformare in object un linked per ogni tipo di relazione => ok
        child.mutation.linked = linked;
    }
    //TODO: define disconnect, al momento un data cast con formatted === true non setta linked => se lo interroghiamo risulta NOT connected anche se lo è
    //in fase di cast si potrebbe impostare una logica che indica che è connected...
    this.connected = function (obj) {
        const linked = obj.__mutation?.linked;
        return linked && obj.parent && linked.mutated[this.pk] === obj.parent.id && linked.mutated[this.fk] === obj.id;
    }
}