import { core } from "./core";
import { $Data, Mutation } from "./data";
import { Observable } from "./observe";

export function Graph() {
    Object.defineProperty(this, 'source', { enumerable: false, writable: true });

    /** @type {GraphNode} */
    Object.defineProperty(this, 'root', { enumerable: false, writable: true });

    /** @type {boolean} Tell if graph remain available in memory after context dispose*/
    this.permanent;

    this.setSource = function (data) {
        if (data) {
            if (!data.hasOwnProperty("$isDataObject")) {
                data = $Data.build(data, this.root, this);
            }
            else {
                data.node = this.root;
            }
        }
        console.log("GRAPH SET SOUCE", data);
        this.source = data;
        return this;
    }

    this.parse = function (etype, collection, name) {
        this.root = new GraphNode(null, { ...core.EntitySchema[etype], etype, collection, name }, this);
        return this;
    }
}

export const FLOW_STOP = "S";

export function GraphNode(parent, schemaInfo, graph, path) {
    Observable.call(this);

    Object.defineProperty(this, 'parent', { enumerable: false, writable: true, value: parent });
    Object.defineProperty(this, 'graph', { enumerable: false, writable: true, value: graph });

    this.path = path || "root";
    this.isCollection;
    this.children = [];
    this.mutation = [];
    this.primarykey;
    this.identity;
    this.link;

    //Questo metterlo su global in context, vale per tutti i node => oppure in Graph
    this.observe("*").make(({event, target}) => {
        if(event === "MUTATED"){
            this.mutation.push(target);
        }
        else if(event === "IMMUTATED"){
            $Array.remove(this.mutation, m => m.id === target.id)
        }
    })

    this.parse = function (info) {
        this.name = info.name;
        this.isCollection = info.collection;
        this.etype = info.etype;
        this.primarykey = info.primarykey || "id";
        this.identity = info.hasOwnProperty("identity") ? info.identity : true;

        const schema = core.EntitySchema[this.etype];
        if (!schema) throw new Error("GraphNode PARSER: Schema not defined for Entity " + this.etype); //DEV CODE => WARNING SYSTEM
        this.link = Link.parse(schema.link || Link.DOWN_WISE, this);
        this.type = schema.type;
        schema.children && schema.children.forEach(info => this.children.push(new GraphNode(this, info, graph, this.path + '.' + info.name)));

        return this;
    }

    this.getChild = function (name) {
        return this.children ? this.children.find(child => child.name = name) : null;
    }

    this.discendant = function (path) {
        if (!path) return null;
        let n = this;
        path.split('.').forEach(name => n = n.getChild(name));
        return n;
    }

    /**
     * @param {traverseCallback} callback 
     * @param {boolean} deep 
     * @param {*} source 
     * @param {*} ancestor 
     * @param {boolean} generate 
     * @returns 
     */
    this.traverse = function (callback, deep, source, ancestor, generate) {
        const stop = callback(this, source, ancestor);
        if (!this.children || FLOW_STOP === "S") return stop;
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
    }

    /**
   * @param {*} data 
   * @param {*} parent 
   * @returns 
   */
    this.formatData = function (data, parent, notrack) {
        console.log("DEBUG-NODE-FORMAT", data, parent);

        if (!Array.isArray(data))
            data = [data];

        if (!data[0]) return;

        if (this.link.connected(data[0]) || (!parent && data[0].hasOwnProperty("id"))) return FLOW_STOP; // oppure id > 0

        for (let k = 0; k < data.length; k++) {
            const source = data[k];

            if (!source) continue;

            if (!source.hasOwnProperty("id") && Object.isExtensible(source)) {
                //notrack??
                if (!notrack) {
                    const metadata = new Mutation(source, false);
                    for (const key in core.EntitySchema[this.etype].fields) {
                        if (Object.hasOwnProperty.call(source, key)) {
                            metadata.setValue(key, source[key]);
                        }
                    }
                }

                source.id = $Data.entities.nextIndex(this.etype);
            }

            parent && this.link.apply(source, this, parent);

            console.log("DEBUG-NODE-FORMAT-SOURCE", parent, source, this.link, this);
        }
    }

    this.deepFormat = function (data, parent, notrack) {
        this.traverse((node, data, parent) => {
            node.formatData(data, parent, notrack);
        }, true, data, parent);
    }

    this.save = function () {
        return Apix.call(option.queryOp, data, option).then((result) => {
            console.log("Node Save RESULT:", result);
            this.traverse((node) => {
                if (result.data.mutation) {
                    const m = result.data.mutation[node.etype];
                    if (m) {
                        m.forEach(el => {
                            if (el.index < 0) {
                                const item = node.Mutation.get(el.index);
                                console.log("BIND-LOG-INDEX", el, item);
                                if (item) item.id = el.id;
                            }
                        });
                    }
                }

                node.Mutation.forEach(function (value, key) {
                    console.log("BIND-LOG", value, key);
                    if (value.__bind) {
                        console.log("BIND-LOG-IN", value, node);
                        const binding = value.__bind;
                        DataGraph.setItem(value, node, binding.parent, null, value.__unshift);
                        delete value.__bind;
                    }
                    delete value.__mutation;
                });
                delete node.binding;
                node.Mutation.clear();
            }, true);
            this.refresh();
            return result;
        }, er => {
            console.log("ERROR GraphNode Save", er);
            throw er;
        });
    }

    if (schemaInfo) this.parse(schemaInfo);
}

GraphNode.prototype = Observable.prototype;

export const Link = {
    DOWN_WISE: 'd', UP_WISE: 'u', BIDIRECTIONAL: 'b', parse: function (direction, node) {
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
        const metadata = child.metadata;
        if (parent.id <= 0) {
            metadata.tempkey = {};
            metadata.tempkey[this.fk] = parent.id;
        }
        if (schema.identity) {
            child.mutate(this.fk, parent[this.pk]);
        }
        else {
            const keys = this.pk.split(',');
            let field;
            for (let k = 0; k < keys.length; k++) {
                field = keys[k];
                child.mutate(field + schema.etype, parent[field]);
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
        const metadata = child.metadata;

        if (child.id < 1) {
            metadata.tempkey = {};
            metadata.tempkey[this.fk] = parent.id;
        }

        if (node.identity) {
            parent.mutate(this.fk, child[this.pk]);
        }
        else {
            const keys = this.pk.split(',');
            let field;
            for (let k = 0; k < keys.length; k++) {
                field = keys[k];
                parent.mutate(field + node.etype, child[field]);
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

        child.metadata.linked = linked;
    }

    this.connected = function (obj) {
        const linked = obj.metadata?.linked;
        return linked && obj.parent && linked.mutated[this.pk] === obj.parent.id && linked.mutated[this.fk] === obj.id;
    }
}