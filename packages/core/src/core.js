import { Apix } from "./Apix";
import { $String } from "./utils";

export const VERSION = "1.0.0";
export const __DEV__ = true;

export const core = {
    built: false,

    context: null,

    _metadata: new WeakMap(),

    metadata: function (target) {
        !this._metadata.has(target) && this._metadata.set(target, new Metadata());
        return this._metadata.get(target);
    },

    services: { iapi: Apix },

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

    prototypeOf: function (source, target, api, observables) {
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

        if (api.hasOwnProperty("$observable")) {
            this.observableProperty(proto, api.$observable);
            delete api.$observable;
        }

        api && Object.assign(target.prototype, api);

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

        ctx.listen("MUTATED").make(({ target, emitter }) => {
            emitter.mutation.push(target);
        })
    
        ctx.listen("IMMUTATED").make(({ target, emitter }) => {
            $Array.remove(emitter.mutation, m => m.id === target.id)
        })
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
