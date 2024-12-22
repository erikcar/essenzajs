import { core } from "./core";
import { FLOW_STOP, Graph } from "./graph";
import { DataModel } from "./model";
import { Observable } from "./observe";
import { $Array, $String } from "./utils";

export function MutableObject() { }

core.prototypeOf(Observable, MutableObject,
    {
        mutate: function (field, value) {
            this[field] !== value && this.mutation.setValue(field, value);
        },
        observable: function () {
            this.mutation.observable = true;
        }
    },
    {
        hasMutation: {
            get: function () {
                return this.__mutation !== undefined;
            },
        },

        isMutated: {
            get: function () {
                return this.__mutation !== undefined && this.__mutation.count > 0;
            },
        },

        $$mutated: {
            get: function () {
                return this.isMutated ? this.__mutation.mutated : {};
            },
        },

        isPending: {
            get: function () {
                return this.__mutation !== undefined && this.__mutation.hasOwnProperty("pending");
            },
        },

        mutation: {
            get: function () {
                if (!this.__mutation) Object.defineProperty(this, '__mutation', { enumerable: false, writable: true, value: new Mutation(this) });
                return this.__mutation;
            },
        }
    }
);

export const ES_DATA_OBJECT = Symbol.for('es.dataobject');
export const ISync = Symbol.for('es.isync');

export function DataObject(etype, data) {

    if (data) return $Data.cast(data, etype);

    MutableObject.call(this);

    if(etype){
        this.id = $Data.entities.nextIndex(etype);
    }
    // Per creare istanza type con new solo se data è null, altrimenti fare cast
    Object.defineProperty(this, '_parent', { enumerable: false, writable: true, value: etype ? $Data.createGraph(etype, false, "root").setSource(this) : null });
}

core.prototypeOf(MutableObject, DataObject,
    {
        //$$typeof: ES_DATA_OBJECT,

        save: function (option) {
            return this.node.save(this, option);
        },

        delete: function () {
            return this.node.delete(this);
        },

        remove: function () {
            this.node.remove(this);
        },

        sync: function (item) {
            return this.node.sync(this, item);
        },

        refresh: function (item) {
            const render = this.node.graph?.render;
            render && render.refresh();
        },

        /**
         * 
         * @param {*} source mutation instance
         * source?.mutation?.mutated
         */
        update: function (source) {
            Object.assign(this, source?.mutated);
        },

        toGraph: function () {
            return this.node.getDataGraph(this);
        },
    },
    {
        node: {
            enumerable: false,
            get: function () {
                return this._node ? this._node : this._parent.node;
            },
            set: function (value) {
                this._node = value;
            }
        },

        parent: {
            enumerable: false,
            get: function () {
                return Array.isArray(this._parent) ? this._parent.parent : this._parent;
            },
            set: function (value) {
                this._parent = value;
            }
        }
    }
);

Object.defineProperty(DataObject.prototype, '$$typeof', { enumerable: false, writable: false, value: ES_DATA_OBJECT });

export function DataCollection(etype, source) {
    if (!source) source = [];
    if (!Array.isArray(source)) throw new Error("DataCollection: source must by Array Type");
    return $Data.cast(source, etype);
}

export const $Data = {

    cast: function (data, etype) {
        if (!data) return data;
        return this.build(data, this.getRootNode(etype));
    },

    createGraph: function (etype, collection, name) {
        return new Graph().parse(etype, collection, name);
    },

    getRootNode(etype) {
        const type = core.getType(etype);
        if (!type.hasOwnProperty("graph"))
            type.graph = new Graph().parse(etype, false, "root");
        return type.graph.root;
    },

    /*build: function (data, node, parent) {
        return node.isCollection
            ? this.CreateCollection(data, parent, node)
            : this.CreateObject(data, parent, node)
    },*/

    build: function (data, node, parent) {
        node.traverse(function (node, data, parent) {
            if (!data) return;
            if (data.$$typeof !== ES_DATA_OBJECT) {
                const obj = Array.isArray(data)//node.isCollection
                    ? $Data.CreateCollection(data, parent, node)
                    : $Data.CreateObject(data, parent, node);
                if (parent) parent[node.name] = obj;
            }
            else {
                parent && node.formatData(data, parent);//parent.node.replace(node.name, data, parent);
                return FLOW_STOP;
            }
        }, true, data, parent)
        return data;
    },

    CreateObject: function (data, parent, node, formatted) {
        Object.setPrototypeOf(data, node.type.prototype);
        !formatted && node.formatData(data, parent);
        return data;
    },

    CreateCollection: function (data, parent, node, formatted) {
        //data.$isDataObject = () => true;
        const parse = function (args, start, formatted) {
            const n = data.node;
            start = start || 0;
            let item;
            for (let i = start; i < args.length; i++) {
                item = args[i];
                if (!item) continue;
                if (item.$$typeof !== ES_DATA_OBJECT) //(!(item instanceof node.type)) 
                    args[i] = Object.setPrototypeOf(item, n.type.prototype);
                /*else {
                    n.traverse((n, source) => {
                        if (source) source.node = n;
                        if (!Array.isArray(source)) source = [source];
                        source.forEach(obj => obj && obj.hasMutation && n.Mutation.push(obj.mutation));
                    }, true, item);

                    delete item._node;
                }

                item.parent = data;*/
            }

            !formatted && n.formatData(args, parent);

            return args;
        }

        if (!Array.isArray(data)) {
            data = [];
            parent[node.name] = data;
        }

        Object.defineProperty(data, 'node', { writable: true, enumerable: false, value: node });
        Object.defineProperty(data, 'parent', { writable: true, enumerable: false, value: parent });

        parse(data, 0, formatted);

        const nativePush = Array.prototype.push;

        data.push = function () {
            //parse([].slice.call(arguments));
            nativePush.apply(this, parse([].slice.call(arguments)));
        }

        const nativeUnshift = Array.prototype.unshift;

        data.unshift = function () {
            //parse(arguments);
            nativeUnshift.apply(this, parse([].slice.call(arguments)));
        }

        const nativeSplice = Array.prototype.splice;

        data.splice = function () {
            // parse(arguments, 2);
            let ar;
            if (arguments.length > 2) {
                ar = parse([].slice.call(arguments), 2);
                ar.unshift(arguments[0], arguments[0]);
            }
            else
                ar = [].slice.call(arguments);

            nativeSplice.apply(this, ar);
        }

        data.save = function (option) {
            return this.node.save(data, option);
        }

        data.remove = function (item) {
            //Controllo prima se appartiene a source???
            return this.node.remove(item, data.parent);
        }

        data.sync = function (item) {
            return this.node.sync(data, item);
        }

        data.$$typeof = ES_DATA_OBJECT;

        return data;
    },

    clone: function (data) {
        if (!data) return data;
        return Array.isArray(data) ? this.CreateCollection([...data]) : Object.setPrototypeOf({ ...data }, data.node.type.prototype);
        //return  Object.setPrototypeOf({ ...data }, data.node.type.prototype);
    },

    share: function (data) {
        let obj = Object.setPrototypeOf({ ...data }, data.node.type.prototype);
        obj.parent = null;
        return obj;
    },

    createProperty: function (target, name) {
        Object.defineProperty(target, name, {
            get: function () {
                return this[name];
            },
            set: function (value) {
                this.mutate(name, value);
            }
        });
    },

    createProperties: function (etype, eschema) {
        const schema = eschema[etype]; //core.EntitySchema[etype];

        if (!schema || !schema.type) throw new Error(etype + ": Type or Schema definition missing.");

        schema.type.prototype.$$etype = etype;

        /*schema.type.prototype.__node = undefined;
        Object.defineProperty(schema.type.prototype, "node", {
            get: function(){
                if(!this.__node) 
                    this.__node = $Data.getRootNode(etype);
                return this.__node;
            }
        });*/

        for (let key in schema.fields) {
            Object.defineProperty(schema.type.prototype, '$' + key, {
                get: function () {
                    return this[key];
                },
                set: function (value) {
                    this.mutate(key, value);
                }
            });
        }

        schema.children && schema.children.forEach(info => {
            //const s = webground.EntitySchema[info.etype];
            const key = info.name;
            Object.defineProperty(schema.type.prototype, '$' + key, {
                get: function () {

                    let child = this[key];

                    if (info.collection && !child) {
                        child = [];
                        this[key] = child;
                    }

                    if (child && child.$$typeof !== Symbol.for('es.dataobject')) {
                        this[key] = $Data.build(child, this.node.getChild(key), this);
                        child = this[key];
                    }

                    return child;
                },
                set: function (value) {

                    const node = $Data.getRootNode(etype).getChild(key);

                    node.disconnect(this[key], this);

                    if (value) {
                        if (value.$$typeof !== Symbol.for('es.dataobject')) {
                            value = $Data.build(value, node, this);
                        }
                        else {
                            node.connect(value, this);
                        }
                    }

                    this[key] = value;
                    //Emit Children Changed ???
                }
            });
        });

        //qui posso cancellare volendo definizione di fields e children
    },

    buildSchema: function (eschema) {
        eschema = eschema || core.typeDef;
        for (const key in eschema) {
            const schema = eschema[key];
            if (!schema.hasOwnProperty("type")) { //Costructor name...
                //const type = { [key]: function () { DataObject.call(this); } }
                schema.type = { [key]: function () { DataObject.call(this); } }[key];//type[key];
                core.prototypeOf(DataObject, schema.type);
            }
            schema.pending = new Set();
            this.createProperties(key, eschema);
        }

        for (const key in eschema) {
            const schema = eschema[key];
            schema.graph = new Graph().parse(key, false, "root");
            schema.type.prototype.node = schema.graph.root;
        }
    },

    hasType: obj => obj.$$typeof === Symbol.for('es.dataobject'),

    entities: {
        nextIndex: function (etype) {
            if (!this[etype]) this[etype] = 0;
            return this[etype]--;
        }
    },
}

export function Mutation(target) {
    Object.defineProperty(this, 'target', { enumerable: false, writable: true, value: target });
    Object.defineProperty(this, 'session', { enumerable: false, writable: true, value: {} });
    Object.defineProperty(this, 'original', { enumerable: false, writable: true, value: {} });

    this.id = target.id;
    this.mutated = {};
    this.count = 0;
    this.tempkey = null;
    this.linked = null;
    target.__mutation = this;
}

Mutation.prototype = {
    setValue: function (field, value) {
        const target = this.target;
        if (this.original[field] === value) { //caso undefined non compreso
            delete this.mutated[field];
            delete this.original[field];
            delete this.session[field];
            if (--this.count === 0) {
                //delete target.__mutation;
                //target.node && $Array.remove(emitter.node.Mutation, m => m.id === target.id)
                target.mutating = target.emit("IMMUTATED", target, target);
            }
        }
        else {
            if (!this.original.hasOwnProperty(field)) {
                this.original[field] = target[field];
                this.count++;
                if (this.count === 1) {
                    //target.node && target.node.Mutation.push(this);
                    target.mutating = target.emit("MUTATED", target, target);//.then(()=>target.mutating=null);
                }
            }

            this.session[field] = { value, old: this.mutated[field], original: this.original[field] };
            this.mutated[field] = value;
        }
        this.target[field] = value;
        this.observable && target.emit("MUTATING", { target, value, field, old: this.mutated[field], original: this.original[field] });
    },

    notify: function () {
        for (const key in this.session) {
            this.target.emit("MUTATING", this.session, this.target);
            this.session = {};
            break;
        }
    },

    restore: function () {
        for (const key in this.mutated) {
            this.target[key] = this.original[key];
        }
    },

    clear: function () {
        delete this.target.__mutation;
    },

    loadPendingData: function (node, isChild) {
        let count = 0;
        for (const key in this.pending) {
            const child = isChild ? node : node.getChild(key);
            const type = core.getType(child.etype);
            const pending = this.pending[key];

            for (let item of pending.values()) {
                if (type.pending?.has(item.id)) {
                    child.Mutation.push(item);
                    count++;
                }
                else
                    pending.delete(item.id);//In teoria rimuovo da pendin
            }
        }
        return count;
    },

    asObject() {
        return { ...this.mutated, id: this.id }
    },

    get isMutated() {
        return this.count > 0;
    },
}

export function PendingData(node, source) {
    Object.defineProperty(this, 'source', { enumerable: false, writable: true, value: null });
    Object.defineProperty(this, 'node', { enumerable: false, writable: true, value: node });
    this.mutated = {};
    this.count = 0;
    this.id = 0;
    this.disconnected = true;
    this.parent = null;
    this.etype = null;
    this.setSource(source);
}

PendingData.prototype = {
    setValue(name, value) {
        if (this.source && this.source[name] !== value) {
            this.mutated[name] = value;
            this.count++;
        }
    },

    setSource(source) {
        if (!source) return;
        this.id = source.id;
        this.etype = source.$$etype;
        this.source = { ...source };
        source.hasMutation && Object.assign(this.source, source.mutation.original);
    },

    clear() {
        this.parent && this.parent.delete(this.id);
    },

    get isMutated() {
        return this.count > 0;
    },

    get target() {
        return { id: this.id, mutation: { mutated: this.mutated }, $$etype: this.etype };
    }
}

/**
 * TODO: debounce, auto switch
 * @param {*} source 
 * @param {*} condition 
 * @param {*} callback 
 */
export function DataFilter(source, condition, callback) {
    this.source = source || [];
    this.condition = condition;
    this.values = {};
    this.data = null;
    this.callback = callback;
}

DataFilter.prototype = {
    apply(values) {
        values && this.set(values);
        let condition = [];
        for (const key in this.values) {
            if (Object.hasOwnProperty.call(this.condition, key)) {
                condition.push(this.condition[key]);
            }
        }
        const check = formatc(condition);
        this.data = condition.length ? this.source.filter(item => check(item, this.values)) : this.source;
        this.callback && this.callback(this.data);
    },

    set(values) {
        Object.assign(this.values, values);
    },

    unset(values, update) {
        values.split(',').forEach(v => delete this.values[v.trim()]);
        update && this.apply();
    },

    reset() {
        this.values = {};
        this.data = this.source;
        this.callback && this.callback(this.data);
    }
}

function formatc(source) {
    const n = source.length;
    if (n === 0) return;
    else if (n === 1) {
        let a = source[0];
        return (v, i) => a(v, i);
    }
    else if (n === 2) {
        const a = source[0];
        const b = source[1];
        return (v, i) => a(v, i) && b(v, i);
    }
    else if (n === 3) {
        const a = source[0];
        const b = source[1];
        const c = source[2];
        return (v, i) => a(v, i) && b(v, i) && c(v, i);
    }
    else if (n === 4) {
        const a = source[0];
        const b = source[1];
        const c = source[2];
        const d = source[3];
        return (v, i) => a(v, i) && b(v, i) && c(v, i) && d(v, i);
    }
    else if (n === 5) {
        const a = source[0];
        const b = source[1];
        const c = source[2];
        const d = source[3];
        const e = source[4];
        return (v, i) => a(v, i) && b(v, i) && c(v, i) && d(v, i) && e(v, i);
    }
}
/**
 * SELECT
    column_name,
    data_type
FROM
    information_schema.columns
WHERE
    table_name = 'table_name';


        this.observe = function (evt) {
        return this.node.observe(evt).target(this);
    }

    this.emit = function (evt, data) {
        this.node.emit(evt, data, this);
    }

    this.setValue = target.managed
        ? function (field, value) {
            if (this.original[field] === value) {
                delete this.mutated[field];
                if (--this.count === 0) {
                    delete target.__mutation;
                    ///target.immutable();
                    target.emit("IMMUTATED", target, target);
                }
            }
            else {

                if (!this.original.hasOwnProperty(field)) {
                    this.original[field] = target[field];//value;
                    this.count++;
                    this.count === 1 && target.emit("MUTATED", target, target);
                }

                this.mutated[field] = value;
                this.target[field] = value;
                target.emit("MUTATING", { field, value, oldValue: this.original[field], object: target }, target);
            }
        }

        : function (field, value) {
            this.mutated[field] = value;
            const oldValue = this.target[field];
            this.target[field] = value;
            target.emit("MUTATING", { field, value, oldValue: oldValue }, target);
        }

    this.restore = function () {
        if (this.managed) {
            for (const key in this.mutated) {
                this.target[key] = this.original[key];
            }
        }
    }
 */