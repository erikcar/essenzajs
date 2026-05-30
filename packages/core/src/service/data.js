/** @fileoverview packages/core/src/services/DataStore.js */
import { Entity, ES_DATA_OBJECT } from '../data/entity';
import { Graph, FLOW_STOP } from '../graph';
import { $Array, $Type } from '../utils';

export class DataStore {
    constructor(app) {
        this.app = app;
        this.graphs = {};
        this._counters = {};
        
        // Emulazione speculare di $Data.entities
        this.entities = {
            nextIndex: (etype) => {
                if (!this._counters[etype]) this._counters[etype] = 0;
                return this._counters[etype]--;
            }
        };
    }

    /** Ex $Data.cast */
    cast(data, etype, formatted) {
        if (!data) return data;
        return this.build(data, this.getRootNode(etype), null, formatted);
    }

    /** Ex $Data.createGraph */
    createGraph(etype, collection, name) {
        return new Graph().parse(etype, collection, name);
    }

    /** Ex $Data.getRootNode */
    getRootNode(etype) {
        // Accede al core tramite l'istanza app
        const type = this.app.core.getType(etype);
        if (!Object.prototype.hasOwnProperty.call(type, "graph")) {
            type.graph = new Graph().parse(etype, false, "root");
        }
        return type.graph.root;
    }

    /** Ex $Data.build - Usa il traverse del nodo */
    build(data, node, parent, formatted) {
        node.traverse((n, d, p) => {
            if (!d) return;
            if (d.$$typeof !== ES_DATA_OBJECT) {
                const obj = Array.isArray(d)
                    ? this.CreateCollection(d, p, n, formatted)
                    : this.CreateObject(d, p, n, formatted);
                if (p) p[n.name] = obj;
            } else {
                p && n.formatData(d, p);
                return FLOW_STOP;
            }
        }, true, data, parent);
        return data;
    }

    /** Ex $Data.CreateObject */
    CreateObject(data, parent, node, formatted) {
        Object.setPrototypeOf(data, node.type.prototype);
        node.type.call(data, this.app, node.etype);
        !formatted && node.formatData(data, parent);
        return data;
    }

    /** Ex $Data.CreateCollection - LOGICA INTEGRALE */
    CreateCollection(data, parent, node, formatted, skipParse) {
        const self = this;
        
        const parse = function (args, start, formatted) {
            if (skipParse) return args;
            const n = data.node;
            start = start || 0;
            let item;
            for (let i = start; i < args.length; i++) {
                item = args[i];
                if (!item) continue;
                if (item.$$typeof !== ES_DATA_OBJECT) {
                    args[i] = Object.setPrototypeOf(item, n.type.prototype);
                    n.type.call(args[i], self.app, n.etype);
                }
                args[i].parent = data;
            }
            !formatted && n.formatData(args, parent);
            return args;
        };

        if (!Array.isArray(data)) {
            data = [];
            if (parent && node.name) parent[node.name] = data;
        }

        Object.defineProperty(data, 'node', { writable: true, enumerable: false, value: node });
        Object.defineProperty(data, 'parent', { writable: true, enumerable: false, value: parent });

        parse(data, 0, formatted);

        // Monkey-patching Array methods
        const nativePush = Array.prototype.push;
        data.push = function () {
            this.invalidated = true;
            nativePush.apply(this, parse([].slice.call(arguments)));
        };

        const nativeUnshift = Array.prototype.unshift;
        data.unshift = function () {
            this.invalidated = true;
            nativeUnshift.apply(this, parse([].slice.call(arguments)));
        };

        const nativeSplice = Array.prototype.splice;
        data.splice = function () {
            this.invalidated = true;
            let ar;
            if (arguments.length > 2) {
                ar = parse([].slice.call(arguments), 2);
                ar.unshift(arguments[0], arguments[1]); // correzione: arguments[1] per deleteCount
            } else {
                ar = [].slice.call(arguments);
            }
            nativeSplice.apply(this, ar);
        };

        ['filter', 'map', 'slice'].forEach(method => {
            const native = Array.prototype[method];
            data[method] = function () {
                const result = native.apply(this, arguments);
                return self.CreateCollection(result, this.parent, this.node, true, true);
            };
        });

        // Metodi aggiuntivi sull'istanza Array
        data.save = function (option) { return this.node.save(data, option); };
        data.remove = function (item) {
            this.invalidated = true;
            return this.node.remove(item, data.parent);
        };
        data.delete = function (item) {
            this.invalidated = true;
            $Array.removeById(this, item);
            return item.delete();
        };
        data.archivie = function (item, field) {
            this.invalidated = true;
            $Array.removeById(this, item);
            return item.archivie(field);
        };
        data.sync = function (item) { return this.node.sync(data, item); };

        data.$$typeof = ES_DATA_OBJECT;
        return data;
    }

    /** Ex $Data.clone */
    clone(data) {
        if (!data) return data;
        return Array.isArray(data) 
            ? this.CreateCollection([...data]) 
            : Object.setPrototypeOf({ ...data }, data.node.type.prototype);
    }

    /** Ex $Data.share */
    share(data) {
        let obj = Object.setPrototypeOf({ ...data }, data.node.type.prototype);
        obj.parent = null;
        return obj;
    }

    /** Ex $Data.createProperty */
    createProperty(target, name) {
        Object.defineProperty(target, name, {
            get: function () { return this[name]; },
            set: function (value) { this.mutate(name, value); }
        });
    }

    /** Ex $Data.createProperties - DEFINIZIONE SCHEMA DINAMICO */
    createProperties(etype, eschema) {
        const schema = eschema[etype];
        if (!schema || !schema.type) throw new Error(etype + ": Type or Schema definition missing.");

        schema.type.prototype.$$etype = etype;

        // Generazione campi con prefisso $
        for (let key in schema.fields) {
            Object.defineProperty(schema.type.prototype, '$' + key, {
                get: function () { return this[key]; },
                set: function (value) { this.mutate(key, value); }
            });
        }

        // Gestione figli e virtual bridges
        schema.children && schema.children.forEach(info => {
            if (info.virtual) {
                let name = info.bridge ?? (info.collection ? (info.etype + 's') : info.etype);
                const bridge = "$" + name;

                Object.defineProperty(schema.type.prototype, info.name, {
                    get: function () {
                        const shell = this[bridge];
                        if (!shell) return info.collection ? [] : null;
                        return info.collection 
                            ? shell.map(m => m[info.source]).filter(d => d != null) 
                            : shell[info.source];
                    },
                });

                // Metodi Add/Remove/GetBridge dinamici
                schema.type.prototype['add' + info.name[0].toUpperCase() + info.name.slice(1)] = function (item) {
                    if (!item) return;
                    if (!this[bridge]) this[bridge] = [];
                    const target = this.app.services.dataStore.cast({}, info.etype);
                    target[info.source] = item;
                    this[bridge].push(target);
                };

                schema.type.prototype['remove' + info.name[0].toUpperCase() + info.name.slice(1)] = function (item) {
                    if (!item || !Array.isArray(this[bridge])) return;
                    const index = this[bridge].findIndex(d => d[info.source] === item);
                    if (index > -1) {
                        const el = this[bridge][index];
                        this[bridge].delete(el); // Presume estensione .delete su array
                    }
                };

                info.name = name;
            }

            const key = info.name;
            Object.defineProperty(schema.type.prototype, '$' + key, {
                get: function () {
                    let child = this[key];
                    if (info.collection && !child) {
                        child = [];
                        this[key] = child;
                    }
                    if (child && child.$$typeof !== ES_DATA_OBJECT) {
                        this[key] = this.app.services.dataStore.build(child, this.node.getChild(key), this);
                        child = this[key];
                    }
                    return child;
                },
                set: function (value) {
                    const node = this.app.services.dataStore.getRootNode(etype).getChild(key);
                    node.disconnect(this[key], this);
                    if (value) {
                        if (value.$$typeof !== ES_DATA_OBJECT) {
                            value = this.app.services.dataStore.build(value, node, this);
                        } else {
                            node.connect(value, this);
                        }
                    }
                    this[key] = value;
                }
            });

            // Gestione JOINS
            if (info.hasOwnProperty("join")) {
                for (let k in info.join) {
                    let label = $Type.isString(info.join[k]) ? info.join[k] : k;
                    Object.defineProperty(schema.type.prototype, label, {
                        get: function () { return this[key]?.[k]; },
                        set: function (value) {
                            if (this[key]) this[key]['$' + k] = value;
                        }
                    });
                }
            }
        });
    }

    /** Ex $Data.buildSchema */
    buildSchema(eschema) {
        eschema = eschema || this.app.core.typeDef;
        for (const key in eschema) {
            const schema = eschema[key];
            if (schema.created) continue;
            if (!schema.hasOwnProperty("type")) {
                schema.type = { [key]: function () { Entity.call(this); } }[key];
                this.app.core.prototypeOf(Entity, schema.type);
            }
            schema.created = true;
            schema.pending = new Set();
            this.createProperties(key, eschema);
        }

        for (const key in eschema) {
            const schema = eschema[key];
            schema.graph = new Graph().parse(key, false, "root");
            schema.type.prototype.node = schema.graph.root;
        }
    }

    /** Ex $Data.hasType */
    hasType(obj) {
        return obj && obj.$$typeof === ES_DATA_OBJECT;
    }
}