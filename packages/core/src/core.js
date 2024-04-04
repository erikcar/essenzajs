import { Apix } from "./Apix";
import { $String } from "./utils";

export const VERSION = "1.0.0";
export const __DEV__ = true;

export function DataSource() {
    this.map = new Map();
    this.observers = new Map();
}

DataSource.prototype = {
    sync: function (item) {
        this.map.forEach((source, key) => {
            if (!Array.isArray(source)) source = [source];
            for (let k = 0; k < source.length; k++) {
                source[k].sync && source[k].sync(item);//core.implementOf(Symbol.for('es.isync'), source[k])
            }
        });
    },

    add: function (key, source) {
        if (this.map.has(key)) {
            this.map.get(key).push(source);
        }
        else {
            this.map.set(key, [source])
        }
    },

    remove: function (key) {
        this.map.delete(key);
    },

    get: function (key, initValue) {
        if (initValue && !this.map.has(key)) this.add(key, initValue);
        return this.map.get(key);
    },

    set: function (key, value) {
        this.map.set(key, value);
        if (this.observers.size > 0) {
            this.observers.forEach((v, obs) => v === key && obs())
        }
    },

    subscribe: function (key, observer) {
        this.observers.set(observer, key);
    },

    unscribe: function (observer) {
        this.observers.delete(observer)
    }
}

export const core = {
    built: false,

    context: null,

    _metadata: new WeakMap(),

    source: new DataSource(),

    metadata: function (target) {
        !this._metadata.has(target) && this._metadata.set(target, new Metadata());
        return this._metadata.get(target);
    },

    services: { iapi: Apix },

    unscoped: [],

    _shared: new Map(),

    /** for now support only model sharing */
    share: function (data) {
        const scope = this.context.scope;
        this.source.add(scope, data);
    },

    unshare: function (scope) {
        this.source.remove(scope);
        if (this.unscoped.length > 0) {
            this.unscoped.forEach(s => this.source.remove(s));
            this.unscoped.length = 0;
        }
    },

    getCookie: (name) => (
        document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || null
    ),

    document: {
        oncontent: function (f) { document.addEventListener("DOMContentLoaded", f); },
        onload: function (f) { window.addEventListener('onload', f) },
        onunload: function (f) {
            document.addEventListener("visibilitychange", f);
            window.addEventListener("pagehide", f, false);
            document.addEventListener('beforeunload', f);
        },
    },

    observableProperty: function (proto, target) {
        for (const key in target) {
            Object.defineProperty(proto, $String.capitalize(key), {
                get: function () {
                    return this[key];
                },
                set: function (value) {
                    this.mutate(key, value);
                }
            });
            if (target[key] !== null)
                proto[key] = target[key];
        }
    },

    create: function (api) {
        if (__DEV__) {
            (!api || typeof api !== 'object') && console.error("Wrong class api definition");
        }

        const constructor = api.$constructor || function () { };

        const proto = constructor.prototype;

        if (api.hasOwnProperty("$observable")) {
            this.observableProperty(proto, api.$observable);
            delete api.$observable;
        }

        if (api.hasOwnProperty("$properties")) {
            Object.defineProperties(proto, api.$properties);
            delete api.$properties;
        }

        if (api.hasOwnProperty("$inject")) {
            core.inject(constructor, api.$inject)
            delete api.$inject;
        }

        Object.assign(proto, api);

        return constructor;
    },

    extend: function (base, api) {
        if (!api.hasOwnProperty("$constructor")) api.$constructor = function () {
            base.apply(this, arguments);
        }
        api.$constructor.prototype = Object.create(base.prototype);
        api.$constructor.prototype.constructor = api.$constructor;
        const constructor = this.create(api);

        return constructor;
    },

    implementOf: function (source, target) {
        return target.implement && target.implement.findIndex(v => v === source) > -1;
    },

    prototypeOf: function (source, target, api, properties) {
        //TODO: support array of source
        target.prototype = Object.create(source.prototype, {
            constructor: {
                value: target,
                enumerable: false,
                writable: true,
                configurable: true,
            },
            $$type: { value: target },
        });

        if (api) {
            if (api.hasOwnProperty("$observable")) {
                this.observableProperty(proto, api.$observable);
                delete api.$observable;
            }

            if(source.intent) target.prototype.$$base = source.intent;

            //Object.assign(target.prototype, api);
            // $ indica extend property
            let k, value;
            for (const key in api) {
                if(key[0] === "$" && key[1] !== "$"){
                    k = key.substring(1);
                    value = {...source[k], ...api[key]}
                }
                else{
                    k = key;
                    value = api[key];
                }
                Object.defineProperty(target.prototype, k, {
                    value: value,
                    writable: true,
                });
            }
        }

        if (properties) {
            for (const key in properties) {
                Object.defineProperty(target.prototype, key, properties[key]);
            }
        }

        //api && Object.assign(target.prototype, api);

        return target.prototype;
    },

    inject: function (type, services) {
        services = services.split(',');
        services.forEach(service => {
            service = service.trim().toLowerCase();
            Object.defineProperty(type.prototype, service.slice(1), {
                get: function () {
                    return this[service] || core.services[service];
                },
                set: function (value) {
                    this[service] = value;
                }
            });
        });
    },

    setIntent: function (type, intent) {
        const proto = type.prototype;
        if (proto.hasOwnProperty("intent"))
            Object.assign(proto.intent, intent);
        else
            proto.intent = intent;
    },

    build: function (ctx) {
        if (!this.built) {
            this.built = true;
            this.setContext(ctx);
        }
    },

    setContext: function (ctx) {
        this.context && this.context.dispose();

        this.context = ctx;
        this.services.icontext = ctx;

        /*ctx.observe("MUTATED").make(({ target, emitter }) => {
            emitter.node.Mutation.push(target.mutation);
        })

        ctx.observe("IMMUTATED").make(({ target, emitter }) => {
            $Array.remove(emitter.node.Mutation, m => m.id === target.id)
        })*/
    }
}




function Metadata() {
    this.source = new Map();
}

Metadata.prototype = {
    get: function (key, type) {
        !this.source.has(key) && this.source.set(key, type ? new type() : {});
        return this.source.get(key);
    },

    set: function (key, value) {
        this.source.set(key, value);
    }
}

export const donothing = () => undefined;

//should be Promise?
export const localStore = {
    save: function (wobj) {
        localStorage.setItem(wobj.etype + '__', JSON.stringify(wobj));
    },

    getData: function (wobj) {
        return JSON.parse(localStorage.getItem(wobj.etype + '__'));
    },

    clear: function (wobj) {
        return localStorage.removeItem(wobj.etype + '__');
    }
};

export const sessionStore = {
    save: function (wobj) {
        sessionStorage.setItem(wobj.etype + '__', JSON.stringify(wobj));
    },

    getData: function (wobj) {
        return JSON.parse(sessionStorage.getItem(wobj.etype + '__'));
    },

    clear: function (wobj) {
        return sessionStorage.removeItem(wobj.etype + '__');
    }
};


export function TimeEvent() {
    this.datetime = null; //Convert...
    this.task = null;
    this.data = null;
    this.timer = null;
}

/**
 * TODO: check if timer exist when go in background timer can be canceled o late, when riactive restart?
 */
export function SimpleScheduler() {
    this.events = null;
    this.current = null;
}

SimpleScheduler.prototype = {
    add: function (event) {

    },

    remove: function (event) {

    },

    update: function () {
        if (this.events) {
            this.events.sort((a, b) => a.datetime - b.datetime);
            if (this.events[0] !== this.current) {
                this.restart();
            }
        }
    },

    start: function () {
        if (this.events) {
            const event = this.events[0];
            const time = event.datatime - new Date();
            this.timer = setTimeout(data => {
                event.task(data);
                this.next();
            }, time, event.data);
        }
    },

    next: function () {
        if (this.tasks) {
            //const task = 
        }
    },

    stop: function () {
        clearTimeout(this.timer);
    },

    restart: function () {
        this.stop();
        this.start();
    }
}

export function deferredAction(action, offset) {
    if (!action) throw new Error("deferredAction must define action on constructor.")
    this.waiting = false;
    this.offset = offset || 500;
    this.timer = null;
    this.execute = function () {
        if (!this.waiting) {
            this.waiting = setTimeout((() => {
                this.waiting = false;
                action();
            }).bind(this), this.offset);
        }
    }

    this.setOffset = function (value) {
        this.offset = value;
        this.execute();
        /*if(this.waiting){
            clearTimeout(this.waiting);
            this.waiting = false;  
        }*/
    }
}

export function waitAction(action, wait) {

    this.time = null;
    this.action = action;
    const instance = this;

    this.deferred = new deferredAction(() => {
        const noaction = new Date().getTime() - instance.time.getTime();

        const w = (wait || 500);
        console.log("NO ACTION", noaction, w, w - (w * 2 / 10));
        noaction > w - (w * 2 / 10)
            ? instance.action()
            : instance.deferred.setOffset(w - noaction);
    }, wait || 500);

    this.execute = function () {
        this.time = new Date();
        this.deferred.execute();
    }

    this.executeNow = function () {
        this.action();
    }
}
