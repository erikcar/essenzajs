import { core } from "./core";
import { Graph } from "./graph";
import { $String } from "./utils";

export function MutableObject() {

}

Object.defineProperty(MutableObject.prototype, "hasMutation", {
    get: function () {
        return this.__mutation !== undefined;
    },
});

Object.defineProperty(MutableObject.prototype, "mutation", {
    get: function () {
        if (!this.__mutation) Object.defineProperty(this, '__mutation', { enumerable: false, writable: true, value: new Mutation(this) });
        return this.__mutation;
    },
});

MutableObject.prototype.mutate = function (field, value) {
    this[field] !== value && this.mutation.setValue(field, value);
}

MutableObject.prototype.emit = function (event, data) {
    this.context.emit(event, data, this);
}

core.inject(MutableObject, "IContext");

const $DataObject = true;

export function DataObject(etype, data) {
    this.$isDataObject = $DataObject;

    if (data) return $Data.cast(data, etype);

    MutableObject.call(this);
    // Per creare istanza type con new solo se data è null, altrimenti fare cast
    Object.defineProperty(this, '_parent', { enumerable: false, writable: true, value: etype ? $Data.createGraph(etype, false, "root").setSource(this) : null });

    Object.defineProperty(this, "parent", {
        get: function () {
            return Array.isArray(this._parent) ? this._parent.parent : this._parent;
        },
        set: function (value) {
            this._parent = value;
        }
    });

    Object.defineProperty(this, "managed", {
        get: function () {
            return !this.node.graph.unmanaged;
        },
    });

    this.observe = function (evt) {
        return this.node.observe(evt).target(this);
    }

    this.emit = function (evt, data) {
        this.node.emit(evt, data, this);
    }

    this.save = function () {
        this.node.save();
    }
}

DataObject.prototype = Object.create(MutableObject.prototype);

Object.defineProperty(DataObject.prototype, "node", {
    get: function () {
        return this._node ? this._node : this._parent.node;
    },
    set: function (value) {
        if (!this._node) Object.defineProperty(this, '_node', { enumerable: false, writable: true, });
        this._node = value;
    }
});

export function DataCollection(etype, source) {
    if (!source) source = [];
    if (!Array.isArray(source)) throw new Error("DataCollection: source must by Array Type");
    return $Data.cast(source, etype);
}

export const $Data = {

    cast: function (data, etype) {
        if (!data) return data;
        //Check if object => Warning or cast error // Check type by key
        return this.createGraph(etype, Array.isArray(data), "root").setSource(data).source;
    },

    createGraph: function (etype, collection, name) {
        return new Graph().parse(etype, collection, name);
    },

    build: function (data, node, parent) {
        return node.isCollection
            ? this.CreateCollection(data, parent, node)
            : this.CreateObject(data, parent, node)
    },

    CreateObject: function (data, parent, node) {
        Object.setPrototypeOf(data, node.type.prototype);
        data.parent = parent;
        data.node = node;
        node.deepFormat(data, parent);
        return data;
    },

    CreateCollection: function (data, parent, node) {
        data.$isDataObject = () => true;

        if (Array.isArray(data)) {
            for (let k = 0; k < data.length; k++) {
                data[k] = Object.setPrototypeOf(data[k], node.type.prototype);
                data[k].parent = this;
            }
        }
        else {
            data = [];
            parent[node.name] = data;
        }

        const parseArgs = function (args, start) {
            start = start || 0;
            let item;
            for (let i = start; i < args.length; i++) {
                item = args[i];
                if (!item) continue;
                if (!(item instanceof node.type)) args[i] = Object.setPrototypeOf(item, node.type.prototype);
                item.parent = this;
            }
        }

        const nativePush = Array.prototype.push;

        data.push = function () {
            parseArgs(arguments);
            nativePush.apply(this, arguments);
            //Node deepFormat and emit Add
        }

        const nativeUnshift = Array.prototype.unshift;

        data.unshift = function () {
            parseArgs(arguments);
            nativeUnshift.apply(this, arguments);
        }

        const nativeSplice = Array.prototype.splice;

        data.splice = function () {
            parseArgs(arguments, 2);
            nativeSplice.apply(this, arguments);
        }

        Object.defineProperty(data, 'node', { enumerable: false, value: node });
        Object.defineProperty(data, 'parent', { enumerable: false, value: parent });

        node.deepFormat(data, parent);

        return data;
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

        for (let key in schema.fields) {
            //key = key.trim();
            Object.defineProperty(schema.type.prototype, $String.capitalize(key), {
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
            Object.defineProperty(schema.type.prototype, $String.capitalize(key), {
                get: function () {

                    let child = this[key];
                    if (info.collection && !child) {
                        child = [];
                        this[key] = child;
                    }
                    if (child && !child.hasOwnProperty("$isDataObject")) {
                        this[key] = $Data.build(child, this.node.getChild(key), this);
                        child = this[key];
                    }
                    return child;
                },
                set: function (value) {
                    if (value && !value.hasOwnProperty("$isDataObject"))
                        value = $Data.build(value, this.node.children[key], this);
                    this[key] = value;
                    //Emit Children Changed ???
                }
            });
        });
    },

    buildSchema: function (eschema) {
        for (const key in eschema) {
            const schema = eschema[key];
            if (!schema.hasOwnProperty("type")) {
                schema.type = function () {
                    DataObject.call(this);
                }
            }
            this.createProperties(key, eschema);
        }
    },

    hasType: obj => obj.hasOwnProperty("$isDataObject"),

    entities: {
        nextIndex: function (etype) {
            if (!this.entities[etype]) this.entities[etype] = 0;
            return this.entities[etype]--;
        }
    },
}

export function Mutation(target, managed) {
    this.target = target;
    this.id = target.id;
    this.mutated = {};

    //this.managed = managed === undefined ? !target.graph?.unmanaged : managed;

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
                    ithis.count === 1 && target.emit("MUTATED", target, target);
                }

                this.mutated[field] = value;
                this.target[field] = value;
                target.emit("MUTATING", { field, value, oldValue: this.original[field] }, target);
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

    target.__mutation = this;
    //target.mutable();

    if (target.managed) {
        this.count = 0;
        this.original = {}; //Object.assign({}, target)
        //target.emit("MUTABLE", target);
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
 */