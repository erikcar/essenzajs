/** @fileoverview packages/core/src\graph.js */
import { core } from "./core";
import { $Data, PendingData, Mutation } from "./data";
import { Observable } from "./observe";
import { $Array } from "./utils";

/**
 * Graph function.
 * @returns {void}
 */
export function Graph() {
    Object.defineProperty(this, 'source', { enumerable: false, writable: true });

    /** @type {GraphNode} */
    Object.defineProperty(this, 'root', { enumerable: false, writable: true });

    /** @type {boolean} Tell if graph remain available in memory after context dispose*/
    this.permanent;

    this.render = null;
}

Graph.prototype = {
    /**
 * setSource method.
 * @param {any} data
 * @returns {any}
 */
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

    /**
 * parse method.
 * @param {any} etype
 * @param {any} collection
 * @param {any} name
 * @returns {any}
 */
    parse: function (etype, collection, name, schema = core.typeDef) {
        this.root = new GraphNode(null, { ...schema[etype], etype, collection, name }, this, null, schema);
        return this;
    }
}

export function prepareGraphSchema(schema) {
    for (const etype in schema) {
        const definition = schema[etype];
        for (const relation of definition.children ?? []) {
            const target = schema[relation.etype];
            if (!target) throw new Error("GraphNode PARSER: Schema not defined for Entity " + relation.etype);
            if (relation.link === Link.BIDIRECTIONAL) {
                target.fields[(relation.primarykey || "id") + relation.etype] = 6;
                target.fields[(definition.primarykey || "id") + etype] = 6;
            }
        }
    }
}

export const FLOW_STOP = "S";

function GraphToken(source, depth) {
    this.depth = depth ?? 2;
    this.map = new Map();
    this.traverseData = source != null;
}

GraphToken.prototype = {
    break(node, data) {
        if (this.traverseData) return !data;
        else return (this.map.get(node?.etype) ?? 0) > this.depth;
    },

    track(node) {
        if (!node) return;
        //node.traversable = true;
        const key = node.etype;
        const map = this.map;
        map.set(key, (map.get(key) ?? 0) + 1);
    },

    untrack(node) {
        if (!node) return;
        //node.traversable = false;
        const key = node.etype;
        const map = this.map;
        const current = map.get(key) ?? 0;

        if (current <= 1) {
            map.delete(key); // Rimuove la chiave se scende a 0 o meno
        } else {
            map.set(key, current - 1);
        }
    }
}

// Match the legacy limit on occurrences of a type along a schema path.
function canExpand(parent, etype) {
    let occurrences = 0;
    for (let ancestor = parent; ancestor; ancestor = ancestor._schemaParent) {
        if (ancestor.etype === etype && ++occurrences > 2) return false;
    }
    return true;
}

const childrenProperty = {
    enumerable: true,
    configurable: true,
    get() {
        if (this._relations) {
            for (let index = 0; index < this._relations.length; index++) this.childAt(index);
            this._relations = undefined;
        }
        return this._children;
    },
    set(children) {
        this._relations = undefined;
        this._children = children;
    },
};

// Collect by schema path before allocating the GraphNodes used by the payload.
class SaveBranch {
    constructor(info, parent = null) {
        this.info = info;
        this.etype = info.etype;
        this._schemaParent = parent;
        this.mutations = [];
        this.children = new Map();
    }

    relations(schema) {
        return (canExpand(this._schemaParent, this.etype) && schema[this.etype].children) || [];
    }

    child(info) {
        if (!this.children.has(info)) this.children.set(info, new SaveBranch(info, this));
        return this.children.get(info);
    }

    prune(schema) {
        this.kept = [];
        for (const info of this.relations(schema)) {
            const child = this.children.get(info)?.prune(schema);
            if (child) this.kept.push(child);
        }
        return this.mutations.length || this.kept.length ? this : null;
    }

    toNode(parent, graph, schema, input) {
        const path = parent ? parent.path + "." + this.info.name : "root";
        const node = new GraphNode(parent, this.info, graph, path, schema);
        if (!parent) graph.root = node;
        if (input && Object.hasOwn(input, "returning")) node.returning = input.returning;
        node.Mutation = this.mutations;
        node.children = this.kept.map(child => child.toNode(node, graph, schema, input?.getChild(child.info.name)));
        return node;
    }
}

/**
 * GraphNode function.
 * @param {any} parent
 * @param {any} schemaInfo
 * @param {any} graph
 * @param {any} path
 * @returns {void}
 */
export function GraphNode(parent, schemaInfo, graph, path, schema = parent?._schema ?? core.typeDef) {
    Observable.call(this);
    Object.defineProperties(this, {
        _schema: { value: schema },
        _schemaParent: { value: parent },
        _schemaPath: { value: path || "root" },
        _relations: { writable: true },
        _children: { writable: true, value: [] },
    });
    Object.defineProperty(this, 'parent', { enumerable: false, writable: true, value: parent });
    Object.defineProperty(this, 'graph', { enumerable: false, writable: true, value: graph });
    Object.defineProperty(this, 'type', { enumerable: false, writable: true });

    this.path = path || "root";
    this.isCollection;
    Object.defineProperty(this, "children", childrenProperty);
    this.Mutation = [];
    this.primarykey;
    this.identity;
    this.link;
    this.name = "root";
    this.etype;
    this.TypeSchema = null;

    if (schemaInfo) this.parse(schemaInfo);
}

core.prototypeOf(Observable, GraphNode, {

    /**
 * parse method.
 * @param {any} info
 * @returns {any}
 */
    parse: function (info) {
        this.name = info.name;
        this.isCollection = info.collection;
        this.etype = info.etype;
        this.primarykey = info.primarykey || "id";
        this.identity = info.hasOwnProperty("identity") ? info.identity : true;
        this.bridge = info.usebridge;
        this.link = Link.parse(info.link || Link.DOWN_WISE, this, info);

        const definition = this._schema[this.etype];
        if (!definition) throw new Error("GraphNode PARSER: Schema not defined for Entity " + this.etype);
        this.type = definition.type;
        this.TypeSchema = definition.fields;
        if (canExpand(this._schemaParent, this.etype)) this._relations = definition.children;
        return this;
    },

    getChild: function (name) {
        if (!this._relations) return this._children ? this._children.find(child => child.name === name) : null;
        return this.childAt(this._relations.findIndex(info => info.name === name));
    },

    childAt: function (index) {
        const relation = this._relations?.[index];
        if (relation && !this._children[index]) {
            this._children[index] = new GraphNode(this, relation, this.graph, this._schemaPath + "." + relation.name);
        }
        return this._children?.[index];
    },

    clone() {
        return new Graph().parse(this.etype, this.isCollection, "root", this._schema).root;
    },

    /**
 * replace method.
 * @param {any} name
 * @param {any} source
 * @param {any} parent
 * @returns {void}
 */
    replace: function (name, source, parent) {
        const node = source.node;
        const oldnode = this.getChild(name);
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

            this._children[this._children.indexOf(oldnode)] = node;
        }
    },

    /**
 * discendant method.
 * @param {any} path
 * @returns {any}
 */
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
        this.__traverse(callback, deep, source, ancestor, twin, generate, new GraphToken(source))
    },

    traverseData: function (callback, source, ancestor, twin) {
        if (source) this.__traverse(callback, true, source, ancestor, twin, false, new GraphToken(source), true);
    },

    __traverse: function (callback, deep, source, ancestor, twin, generate, token, dataOnly) {
        const stop = callback(this, source, ancestor, twin);
        if (token.break(this, source) || FLOW_STOP === stop) return stop;
        token.track(this);

        const children = this._relations ?? this._children;
        for (let index = 0; index < (children?.length ?? 0); index++) {
            const name = (this._children?.[index] ?? children[index]).name;
            if (dataOnly && (Array.isArray(source)
                ? !source.some(item => item?.[name] != null)
                : source?.[name] == null)) continue;
            const child = this.childAt(index);
            const counterpart = twin?.childAt(index);
            if (generate) source[name] = {};
            if (!deep) {
                callback(child, source ? source[name] : null, source, counterpart);
            } else if (Array.isArray(source)) {
                for (let row = 0; row < source.length; row++) {
                    const parent = source[row];
                    if (!parent || (dataOnly && parent[name] == null)) continue;
                    if (child.__traverse(callback, deep, parent[name], parent, counterpart, generate, token, dataOnly) === FLOW_STOP) break;
                }
            } else {
                child.__traverse(callback, deep, source ? source[name] : null, source, counterpart, generate, token, dataOnly);
            }
        }

        token.untrack(this);
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
                    for (const key in this.TypeSchema) {
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

    /**
 * deepFormat method.
 * @param {any} data
 * @param {any} parent
 * @param {any} notrack
 * @returns {void}
 */
    deepFormat: function (data, parent, notrack) {
        this.traverseData((node, data, parent) => {
            node.formatData(data, parent, notrack);
        }, data, parent);
    },

    /** TODO: handle case of dataobject =>  */
    sync: function (source, item) {
        let syncronized = false;
        const mutation = item.mutation;
        this.traverseData((node, data, parent) => {
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
        }, source);
        return syncronized;
    },

    findMutation: function (source) {
        let mutated = false;
        this.traverseData((node, data) => {
            if (!data) return;
            if (!Array.isArray(data))
                data = [data];
            for (let k = 0; k < data.length; k++) {
                if (data[k] && data[k].isMutated) {
                    mutated = true;
                    return FLOW_STOP;
                }
            }
        }, source);
        return mutated;
    },
    /**
 * getDataGraph method.
 * @param {any} source
 * @returns {any}
 */
    getDataGraph: function (source) {
        if (!source) return null;

        const schema = this._schema;
        const processed = new Set();
        const root = new SaveBranch({ ...schema[this.etype], etype: this.etype, name: "root", collection: this.isCollection });

        function collect(branch, data) {
            if (Array.isArray(data) && data.parent?.isPending)
                collectPending(branch, data.parent.mutation, true);
            if (data.invalidated) data.invalidated = false;

            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
                if (!item || processed.has(item)) continue;
                processed.add(item);
                if (!item.hasMutation) continue;

                const mutation = item.mutation;
                if (mutation.pending) collectPending(branch, mutation, false);
                if (mutation.isMutated || mutation.tempkey) {
                    if (!mutation.isMutated) mutation.mutated = null;
                    branch.mutations.push(mutation);
                }
            }

            for (const info of branch.relations(schema)) {
                for (const item of items) {
                    const child = item?.[info.name];
                    if (child) collect(branch.child(info), child);
                }
            }
        }

        function collectPending(branch, mutation, isChild) {
            for (const name in mutation.pending) {
                const info = isChild ? branch.info : branch.relations(schema).find(relation => relation.name === name);
                if (!info) continue;
                const pending = mutation.pending[name];
                for (const item of pending.values()) {
                    if (schema[info.etype].pending?.has(item.id)) {
                        const target = isChild ? branch : branch.child(info);
                        target.mutations.push(item);
                    } else {
                        pending.delete(item.id);
                    }
                }
            }
        }

        collect(root, source);
        const changes = root.prune(schema);
        return changes ? changes.toNode(null, new Graph(), schema, this) : null;
    },

    pruneCleanBranches: function (node) {
        if (!node)
            return false;

        const hasOwnMutation =
            Array.isArray(node.Mutation) && node.Mutation.length > 0;

        if (!Array.isArray(node.children) || node.children.length === 0) {
            node.children = [];
            return hasOwnMutation;
        }

        const keptChildren = [];

        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];

            if (this.pruneCleanBranches(child)) {
                keptChildren.push(child);
            }
        }

        node.children = keptChildren;

        return hasOwnMutation || keptChildren.length > 0;
    },

    /**
 * save method.
 * @param {any} source
 * @param {any} option
 * @returns {any}
 */
    save: function (source, option) {

        if (!source) return;

        let root = this.getDataGraph(source);

        if (root === null) return Promise.resolve();

        const defaultOpt = { queryOp: this.api.queryOp, excludeParams: true };

        let params = root;

        if (option && option.data) {
            params = { Root: root, Value: option.data };
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
                        const type = node._schema[node.etype];
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
            }, true, source);
            return result;
        }, er => {
            //gestire eccezioni remote distinguendo se il salvataggio è stato fatto o no in base all'errore
            console.log("ERROR GraphNode Save", er);
            throw er;
        });
    },

    /**
 * saveold method.
 * @param {any} option
 * @returns {any}
 */
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

    /**
 * delete method.
 * @param {any} data
 * @param {any} option
 * @returns {any}
 */
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

    /**
 * remove method.
 * @param {any} data
 * @param {any} parent
 * @returns {any}
 */
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

    /**
 * disconnectOld method.
 * @param {any} data
 * @param {any} parent
 * @returns {void}
 */
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

    /**
 * connect method.
 * @param {any} data
 * @param {any} parent
 * @returns {void}
 */
    connect(data, parent) {
        if (!data) return;

        const pending = parent.isPending ? parent.mutation.pending[this.name] : false;
        //Attenzione 
        if (pending) {
            if (!Array.isArray(data))
                data = [data];

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

    /**
 * disconnect method.
 * @param {any} data
 * @param {any} parent
 * @returns {void}
 */
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

                const type = this._schema[this.etype];

                if (!type.pending.has(pending.id))
                    type.pending.add(pending.id)
            }
        })
    },

    /**
 * split method.
 * @param {any} source
 * @returns {any}
 */
    split: function (source) {
        if (!source) return;

        const graph = this.clone().graph.setSource(source);

        this.traverseData((node, data, _, twin) => {
            if (!twin) return;

            data.node = twin;
            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
                if (!item) continue;
                item.node = twin;
                if (item.hasMutation) {
                    $Array.removeItem(node.Mutation, item.mutation);
                    twin.Mutation.push(item, item.mutation);
                }
            }

        }, source, null, graph.root);

        return graph.root;
    },

    /**
 * reset method.
 * @param {any} source
 * @returns {void}
 */
    reset(source) {
        if (!source) return;

        const graph = this.clone().graph.setSource(source);

        graph.root.traverseData((node, data) => {
            data.node = node;
            if (Array.isArray(data)) {
                for (const item of data) {
                    if (item) item.node = node;
                }
            }
        }, source);
    },

    /**
 * clean method.
 * @param {any} source
 * @returns {void}
 */
    clean(source) {
        if (!source) return;

        this.traverseData((node, data) => {
            if (!Array.isArray(data))
                data = [data];

            data.forEach(item => {
                item?.hasMutation &&
                    $Array.removeItem(node.Mutation, item.mutation);
            });

        }, source);
    },

    /**
 * clear method.
 * @returns {void}
 */
    clear() { this.Mutation = []; }
});

core.inject(GraphNode, "IApi");

export const Link = {
    DOWN_WISE: 'd', UP_WISE: 'u', BIDIRECTIONAL: 'b',
    //DOWN_WISE: '->', UP_WISE: '<-', BIDIRECTIONAL: '<->',
    /**
 * parse method.
 * @param {any} direction
 * @param {any} node
 * @param {any} info
 * @returns {any}
 */
    parse: function (direction, node, info) {
        if (direction === Link.DOWN_WISE) {
            const schema = node.parent;
            if (!schema) return null;
            //per ora non gestisco multi key
            return new BottomLink(schema.primarykey, info.fk || schema.primarykey + schema.etype, direction, info.usebridge);
        }
        else if (direction === Link.UP_WISE) {
            //per ora non gestisco multi key
            return new TopLink(node.primarykey, info.fk || (node.primarykey + node.etype), direction, info.usebridge);
        }
        else if (direction === Link.BIDIRECTIONAL) {
            const pschema = node.parent;
            if (!pschema) return null;
            return new DoubleLink(pschema.primarykey + pschema.etype, node.primarykey + node.etype, direction, info.association || (pschema.etype + "_" + node.etype));
        }
    }
};

/**
 * GraphLink function.
 * @param {any} pk
 * @param {any} fk
 * @param {any} direction
 * @param {any} association
 * @returns {void}
 */
export function GraphLink(pk, fk, direction, association) {
    this.pk = pk;
    this.fk = fk;
    this.direction = direction;
    this.association = association;
}

/**
 * BottomLink function.
 * @param {any} pk
 * @param {any} fk
 * @param {any} direction
 * @param {any} association
 * @returns {void}
 */
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

    /**
 * disconnect method.
 * @param {any} child
 * @param {any} node
 * @param {any} _
 * @param {any} disconnected
 * @returns {void}
 */
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

    /**
 * connected method.
 * @param {any} obj
 * @returns {any}
 */
    connected: function (obj) {
        return obj.parent && obj[this.fk] === obj.parent[this.pk];
    }
}

/**
 * TopLink function.
 * @param {any} pk
 * @param {any} fk
 * @param {any} direction
 * @param {any} association
 * @returns {void}
 */
export function TopLink(pk, fk, direction, association) {
    GraphLink.call(this, pk, fk, direction, association);
}

TopLink.prototype = {
    /**
 * apply method.
 * @param {any} child
 * @param {any} node
 * @param {any} parent
 * @returns {void}
 */
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

    /**
 * disconnect method.
 * @param {any} child
 * @param {any} node
 * @param {any} parent
 * @param {any} disconnected
 * @returns {void}
 */
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

    /**
 * connected method.
 * @param {any} obj
 * @returns {any}
 */
    connected: function (obj) {
        return obj.parent && obj.parent[this.fk] === obj[this.pk];
    }
}

/**
 * DoubleLink function.
 * @param {any} pk
 * @param {any} fk
 * @param {any} direction
 * @param {any} association
 * @returns {void}
 */
export function DoubleLink(pk, fk, direction, association) {
    GraphLink.call(this, pk, fk, direction, association);
}

DoubleLink.prototype = {
    /**
 * apply method.
 * @param {any} child
 * @param {any} node
 * @param {any} parent
 * @returns {void}
 */
    apply: function (child, node, parent) {
        //const parent = child.parent;
        const linked = { association: true };
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
    },

    //TODO: define disconnect, al momento un data cast con formatted === true non setta linked => se lo interroghiamo risulta NOT connected anche se lo è
    //in fase di cast si potrebbe impostare una logica che indica che è connected...
    /**
 * disconnect method.
 * @param {any} child
 * @param {any} node
 * @param {any} parent
 * @param {any} pending
 * @returns {void}
 */
    disconnect: function (child, node, parent, pending) {
        if (child.mutation.isLinked) {
            delete child.mutation.linked;
        }
        else {
            this.apply(pending, node, parent);
            pending.linked.crud = 3;
        }
    },

    /**
 * connected method.
 * @param {any} obj
 * @returns {any}
 */
    connected: function (obj) {
        const linked = obj.__mutation?.linked;
        return linked && obj.parent && linked.mutated[this.pk] === obj.parent.id && linked.mutated[this.fk] === obj.id;
    }
};


