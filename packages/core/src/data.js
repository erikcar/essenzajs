/** @fileoverview packages/core/src\data.js */
import { core } from "./core";
import { FLOW_STOP, Graph } from "./graph";
import { DataModel } from "./model";
import { Observable } from "./observe";
import { $Array, $Type} from "./utils";

/**
 * MutableObject function.
 * @returns {void}
 */
export function MutableObject() { }

core.prototypeOf(Observable, MutableObject,
    {
                /**
         * mutate method.
         * @param {any} field
         * @param {any} value
         * @returns {void}
         */
                mutate: function (field, value) {
            this[field] !== value && this.mutation.setValue(field, value);
        },
                /**
         * observable method.
         * @returns {void}
         */
                observable: function () {
            this.mutation.observable = true;
        }
    },
    {
        hasMutation: {
                        /**
             * get method.
             * @returns {any}
             */
                        get: function () {
                return this.__mutation !== undefined;
            },
        },

        isMutated: {
                        /**
             * get method.
             * @returns {any}
             */
                        get: function () {
                return this.__mutation !== undefined && this.__mutation.count > 0;
            },
        },

        $$mutated: {
                        /**
             * get method.
             * @returns {any}
             */
                        get: function () {
                return this.isMutated ? this.__mutation.mutated : {};
            },
        },

        isPending: {
                        /**
             * get method.
             * @returns {any}
             */
                        get: function () {
                return this.__mutation !== undefined && this.__mutation.hasOwnProperty("pending");
            },
        },

        mutation: {
                        /**
             * get method.
             * @returns {any}
             */
                        get: function () {
                if (!this.__mutation) Object.defineProperty(this, '__mutation', { enumerable: false, writable: true, value: new Mutation(this) });
                return this.__mutation;
            },
        }
    }
);

export const ES_DATA_OBJECT = Symbol.for('es.dataobject');
export const ISync = Symbol.for('es.isync');

/**
 * DataObject function.
 * @param {any} etype
 * @param {any} data
 * @returns {any}
 */
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

                /**
         * save method.
         * @param {any} option
         * @returns {any}
         */
                save: function (option) {
            return this.node.save(this, option);
        },

                /**
         * delete method.
         * @returns {any}
         */
                delete: function () {
            return this.node.delete(this);
        },

                /**
         * remove method.
         * @returns {any}
         */
                remove: function () {
            return this.node.remove(this);
        },

                /**
         * archivie method.
         * @param {any} field
         * @returns {any}
         */
                archivie: function (field) {
            field = field || "archivied";
            this['$' + field] = true;
            return this.save();
        },

                /**
         * sync method.
         * @param {any} item
         * @returns {any}
         */
                sync: function (item) {
            return this.node.sync(this, item);
        },

                /**
         * refresh method.
         * @param {any} item
         * @returns {void}
         */
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

                /**
         * toGraph method.
         * @returns {any}
         */
        toGraph: function () {
            return this.node.getDataGraph(this);
        },
    },
    {
        node: {
            enumerable: false,
                        /**
             * get method.
             * @returns {any}
             */
                        get: function () {
                return this._node ? this._node : this._parent.node;
            },
                        /**
             * set method.
             * @param {any} value
             * @returns {void}
             */
                        set: function (value) {
                this._node = value;
            }
        },

        parent: {
            enumerable: false,
                        /**
             * get method.
             * @returns {any}
             */
                        get: function () {
                return Array.isArray(this._parent) ? this._parent.parent : this._parent;
            },
                        /**
             * set method.
             * @param {any} value
             * @returns {void}
             */
                        set: function (value) {
                this._parent = value;
            }
        }
    }
);

Object.defineProperty(DataObject.prototype, '$$typeof', { enumerable: false, writable: false, value: ES_DATA_OBJECT });

/**
 * DataCollection function.
 * @param {any} etype
 * @param {any} source
 * @returns {any}
 */
export function DataCollection(etype, source) {
    if (!source) source = [];
    if (!Array.isArray(source)) throw new Error("DataCollection: source must by Array Type");
    return $Data.cast(source, etype);
}

export const $Data = {

        /**
     * cast method.
     * @param {any} data
     * @param {any} etype
     * @param {any} formatted
     * @returns {any}
     */
        cast: function (data, etype, formatted) {
        if (!data) return data;
        return this.build(data, this.getRootNode(etype), null, formatted);
    },

        /**
     * createGraph method.
     * @param {any} etype
     * @param {any} collection
     * @param {any} name
     * @returns {any}
     */
        createGraph: function (etype, collection, name) {
        return new Graph().parse(etype, collection, name);
    },

        /**
     * getRootNode method.
     * @param {any} etype
     * @returns {any}
     */
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

        /**
     * build method.
     * @param {any} data
     * @param {any} node
     * @param {any} parent
     * @param {any} formatted
     * @returns {any}
     */
        build: function (data, node, parent, formatted) {
        node.traverse(function (node, data, parent) {
            if (!data) return;
            if (data.$$typeof !== ES_DATA_OBJECT) {
                const obj = Array.isArray(data)//node.isCollection
                    ? $Data.CreateCollection(data, parent, node, formatted)
                    : $Data.CreateObject(data, parent, node, formatted);
                if (parent) parent[node.name] = obj;
            }
            else {
                parent && node.formatData(data, parent);//parent.node.replace(node.name, data, parent);
                return FLOW_STOP;
            }
        }, true, data, parent)
        return data;
    },

        /**
     * CreateObject method.
     * @param {any} data
     * @param {any} parent
     * @param {any} node
     * @param {any} formatted
     * @returns {any}
     */
        CreateObject: function (data, parent, node, formatted) {
        Object.setPrototypeOf(data, node.type.prototype);
        node.type.call(data);
        !formatted && node.formatData(data, parent);
        return data;
    },

        /**
     * CreateCollection method.
     * @param {any} data
     * @param {any} parent
     * @param {any} node
     * @param {any} formatted
     * @returns {any}
     */
        CreateCollection: function (data, parent, node, formatted) {
        //data.$isDataObject = () => true;
        const         /**
         * parse function.
         * @param {any} args
         * @param {any} start
         * @param {any} formatted
         * @returns {any}
         */
parse = function (args, start, formatted) {
            const n = data.node;
            start = start || 0;
            let item;
            for (let i = start; i < args.length; i++) {
                item = args[i];
                if (!item) continue;
                if (item.$$typeof !== ES_DATA_OBJECT) //(!(item instanceof node.type)) 
            {
                args[i] = Object.setPrototypeOf(item, n.type.prototype);
                n.type.call(args[i])
            }
                    
                args[i].parent = data;
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

                /**
         * push function.
         * @returns {void}
         */
                data.push = function () {
            this.invalidated = true;
            nativePush.apply(this, parse([].slice.call(arguments)));
        }

        const nativeUnshift = Array.prototype.unshift;

                /**
         * unshift function.
         * @returns {void}
         */
                data.unshift = function () {
            this.invalidated = true;
            nativeUnshift.apply(this, parse([].slice.call(arguments)));
        }

        const nativeSplice = Array.prototype.splice;

                /**
         * splice function.
         * @returns {void}
         */
                data.splice = function () {
            this.invalidated = true;
            let ar;
            if (arguments.length > 2) {
                ar = parse([].slice.call(arguments), 2);
                ar.unshift(arguments[0], arguments[0]);
            }
            else
                ar = [].slice.call(arguments);

            nativeSplice.apply(this, ar);
        }

                /**
         * save function.
         * @param {any} option
         * @returns {any}
         */
                data.save = function (option) {
            return this.node.save(data, option);
        }

                /**
         * remove function.
         * @param {any} item
         * @returns {any}
         */
                data.remove = function (item) {
            //Controllo prima se appartiene a source???
            this.invalidated = true;
            return this.node.remove(item, data.parent);
        }

                /**
         * delete function.
         * @param {any} item
         * @returns {any}
         */
                data.delete = function (item) {
            //Controllo prima se appartiene a source???
            this.invalidated = true;
            $Array.removeById(this, item)
            return item.delete();
        }

                /**
         * archivie function.
         * @param {any} item
         * @param {any} field
         * @returns {any}
         */
                data.archivie = function (item, field) {
            //Controllo prima se appartiene a source???
            this.invalidated = true;
            $Array.removeById(this, item)
            return item.archivie(field);
        }

                /**
         * sync function.
         * @param {any} item
         * @returns {any}
         */
                data.sync = function (item) {
            return this.node.sync(data, item);
        }

        /*Object.defineProperty(data, "collection", {
            get: function(){
                if(this.invalidated){
                    delete this.invalidated;
                    return [...this];
                }
                else return this;
            }
        });*/

        data.$$typeof = ES_DATA_OBJECT;

        return data;
    },

        /**
     * clone method.
     * @param {any} data
     * @returns {any}
     */
        clone: function (data) {
        if (!data) return data;
        return Array.isArray(data) ? this.CreateCollection([...data]) : Object.setPrototypeOf({ ...data }, data.node.type.prototype);
        //return  Object.setPrototypeOf({ ...data }, data.node.type.prototype);
    },

        /**
     * share method.
     * @param {any} data
     * @returns {any}
     */
        share: function (data) {
        let obj = Object.setPrototypeOf({ ...data }, data.node.type.prototype);
        obj.parent = null;
        return obj;
    },

        /**
     * createProperty method.
     * @param {any} target
     * @param {any} name
     * @returns {void}
     */
        createProperty: function (target, name) {
        Object.defineProperty(target, name, {
                        /**
             * get method.
             * @returns {any}
             */
                        get: function () {
                return this[name];
            },
                        /**
             * set method.
             * @param {any} value
             * @returns {void}
             */
                        set: function (value) {
                this.mutate(name, value);
            }
        });
    },

        /**
     * createProperties method.
     * @param {any} etype
     * @param {any} eschema
     * @returns {void}
     */
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
                                /**
                 * get method.
                 * @returns {any}
                 */
                                get: function () {
                    return this[key];
                },
                                /**
                 * set method.
                 * @param {any} value
                 * @returns {void}
                 */
                                set: function (value) {
                    this.mutate(key, value);
                }
            });
        }

        schema.children && schema.children.forEach(info => {
            //const s = webground.EntitySchema[info.etype];
            const key = info.name;
            Object.defineProperty(schema.type.prototype, '$' + key, {
                                /**
                 * get method.
                 * @returns {any}
                 */
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
                                /**
                 * set method.
                 * @param {any} value
                 * @returns {void}
                 */
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

            if(info.hasOwnProperty("join")){
                //const fields = info.join.split(",")
                let label;
                for (let k in info.join) {
                    label  = $Type.isString(info.join[k]) ? info.join[k] : k
                    Object.defineProperty(schema.type.prototype, label, {
                                                /**
                         * get method.
                         * @returns {any}
                         */
                                                get: function () {
                            return this[key]?.[k];
                        },
                                                /**
                         * set method.
                         * @param {any} value
                         * @returns {void}
                         */
                                                set: function (value) {
                            if(this[key]){
                                this[key]['$' + k] = value;
                            }
                        }
                    });
                }
            }
        });

        //qui posso cancellare volendo definizione di fields e children
    },

        /**
     * buildSchema method.
     * @param {any} eschema
     * @returns {void}
     */
        buildSchema: function (eschema) {
        eschema = eschema || core.typeDef;
        for (const key in eschema) {
            const schema = eschema[key];
            if (!schema.hasOwnProperty("type")) { //Costructor name...
                //const type = { [key]: function () { DataObject.call(this); } }
                schema.type = {                 /**
                 * computed method.
                 * @returns {void}
                 */
[key]: function () { DataObject.call(this); } }[key];//type[key];
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

        /**
     * hasType method.
     * @param {any} obj
     * @returns {void}
     */
        hasType: obj => obj.$$typeof === Symbol.for('es.dataobject'),

    entities: {
                /**
         * nextIndex method.
         * @param {any} etype
         * @returns {any}
         */
                nextIndex: function (etype) {
            if (!this[etype]) this[etype] = 0;
            return this[etype]--;
        }
    },
}

/**
 * Mutation function.
 * @param {any} target
 * @returns {void}
 */
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
        /**
     * setValue method.
     * @param {any} field
     * @param {any} value
     * @returns {void}
     */
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

        /**
     * notify method.
     * @returns {void}
     */
        notify: function () {
        for (const key in this.session) {
            this.target.emit("MUTATING", this.session, this.target);
            this.session = {};
            break;
        }
    },

        /**
     * restore method.
     * @returns {void}
     */
        restore: function () {
        for (const key in this.mutated) {
            this.target[key] = this.original[key];
        }
    },

        /**
     * clear method.
     * @returns {void}
     */
        clear: function () {
        delete this.target.__mutation;
    },

        /**
     * loadPendingData method.
     * @param {any} node
     * @param {any} isChild
     * @returns {any}
     */
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
                    pending.delete(item.id);//In teoria rimuovo da pending
            }
        }
        return count;
    },

        /**
     * asObject method.
     * @returns {any}
     */
        asObject() {
        return { ...this.mutated, id: this.id }
    },

        /**
     * isMutated method.
     * @returns {any}
     */
        get isMutated() {
        return this.count > 0;
    },

        /**
     * isLinked method.
     * @returns {any}
     */
        get isLinked() {
        return this.linked instanceof Object;
    },
}

/**
 * PendingData function.
 * @param {any} node
 * @param {any} source
 * @returns {void}
 */
export function PendingData(node, source) {
    Object.defineProperty(this, 'source', { enumerable: false, writable: true, value: null });
    Object.defineProperty(this, 'node', { enumerable: false, writable: true, value: node });
    this.mutated = null;
    this.count = 0;
    this.id = 0;
    this.disconnected = true;
    this.parent = null;
    this.etype = null;
    this.linked = null;
    this.tempkey = null;
    this.setSource(source);
}

PendingData.prototype = {
        /**
     * setValue method.
     * @param {any} name
     * @param {any} value
     * @returns {void}
     */
        setValue(name, value) {
        if (this.source && this.source[name] !== value) {
            if(this.mutated === null) this.mutated = {};
            this.mutated[name] = value;
            this.count++;
        }
    },

        /**
     * setSource method.
     * @param {any} source
     * @returns {void}
     */
        setSource(source) {
        if (!source) return;
        this.id = source.id;
        this.etype = source.$$etype;
        this.source = { ...source };
        source.hasMutation && Object.assign(this.source, source.mutation.original);
    },

        /**
     * clear method.
     * @returns {void}
     */
        clear() {
        this.parent && this.parent.delete(this.id);
    },

        /**
     * isMutated method.
     * @returns {any}
     */
        get isMutated() {
        return this.count > 0 || this.linked instanceof Object;
    },

        /**
     * mutation method.
     * @returns {any}
     */
        get mutation() {
        return this;
    },

        /**
     * target method.
     * @returns {any}
     */
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
/**
 * DataFilter function.
 * @param {any} source
 * @param {any} condition
 * @param {any} callback
 * @returns {void}
 */
export function DataFilter(source, condition, callback) {
    this.source = source || [];
    this.condition = condition;
    this.values = {};
    this.data = null;
    this.callback = callback;
}

DataFilter.prototype = {
        /**
     * apply method.
     * @param {any} values
     * @returns {void}
     */
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

        /**
     * set method.
     * @param {any} values
     * @returns {void}
     */
        set(values) {
        Object.assign(this.values, values);
    },

        /**
     * unset method.
     * @param {any} values
     * @param {any} update
     * @returns {void}
     */
        unset(values, update) {
        values.split(',').forEach(v => delete this.values[v.trim()]);
        update && this.apply();
    },

        /**
     * reset method.
     * @returns {void}
     */
        reset() {
        this.values = {};
        this.data = this.source;
        this.callback && this.callback(this.data);
    }
}

/**
 * formatc function.
 * @param {any} source
 * @returns {any}
 */
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


