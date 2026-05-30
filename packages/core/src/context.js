/** @fileoverview packages/core/src\context.js */
//import { core } from "./core";
import { Observable } from "./observe";
import { core } from "./core";
import { Block, Flow } from "./code";
import { Space } from "./space";
import { $Data, ES_DATA_OBJECT, MutableObject } from "./data";
import { BreakPointer } from "./breakpoint";
import { Binder } from "./binding";
import { createRandomString } from "./utils";
import { Messenger } from "./messenger";

/**
 * context function.
 * @returns {void}
 */
export function context() {
    Observable.call(this);

    this.initialized = false;
    this.built = false;
    this.parent = null;
    this.last = null;
    this.current = null;
    this.scope = this;
    this.scopes = new Set();
    this.overridden = new Map();
    this.shared = new Map();
    this.breakpoint = new BreakPointer();
    this.block = new Block();
    this.binding = new Binder();
    this.index = 0;
    this.uuid = new Date().getTime() + createRandomString(8);
    this.space = new Space(); //DA VALUTARE
    this.messenger = null;
    this.states = null;
}

core.prototypeOf(Observable, context, {
    core: core,

    /**
 * initialize method.
 * @param {any} init
 * @returns {any}
 */
    initialize: function (init) {
        if (!this.initialized) {
            this.initialized = true;
            core.build(this);
            init && init(this);
        }
        return this;
    },

    /**
 * focus method.
 * @param {any} target
 * @returns {void}
 */
    focus: function (target) {
        target.parent = this.current;
        this.current = target;
    },

    /**
 * blur method.
 * @param {any} target
 * @returns {any}
 */
    blur: function (target) {

        this.current = target ? target.parent : this.current?.parent;
        return true;
    },

    /**
 * registerScope method.
 * @param {any} scope
 * @returns {any}
 */
    registerScope(scope) {
        this.scopes.add(scope);
        return this.setScope(scope);
    },

    /**
 * attachScope method.
 * @param {any} type
 * @param {any} key
 * @param {any} nobind
 * @returns {any}
 */
    attachScope: function (type, key, nobind) {
        if (this.scope === this) {
            //this element is out of any scope => create one and push it on unscoped
            const ctx = new context();
            ctx.__name = "UNSCOPED";
            core.unscoped.push(this.setScope(ctx));
        }

        const scoped = nobind ? type : this.scope.binding.bind(type, key);
        scoped.scope = this.scope;
        scoped.parent = this.scope.current;
        scoped.$index = this.index++;
        return scoped;
    },

    /**
 * storeCurrent method.
 * @param {any} current
 * @returns {void}
 */
    storeCurrent: function (current) {
        /*if(current !== this.current){
            current.parent = this.current;
        }*/
        if (this.current) {
            //current.parent = this.current;
            this.current.next = current;
            this.last = { value: this.current, next: this.last };
        }

        this.current = current;
        //console.log("STORE", current?.$index);
    },

    /**
 * restoreCurrent method.
 * @returns {void}
 */
    restoreCurrent: function () {
        if (this.last) {
            this.current = this.last.value;
            this.last = this.last.next;
        }

        //console.log("RESTORE", this.current?.$index, this.last?.value?.$index);
    },

    /**
 * updateScope method.
 * @param {any} scoped
 * @returns {void}
 */
    updateScope: function (scoped) {
        if (!this.scope.root) {
            this.scope.root = scoped;
            this.setScope(scoped.scope)
            //this.scoped.built && scoped.start();
        }

        this.scope.storeCurrent(scoped);
        //this.scope.current = scoped;
    },

    /**
 * setScope method.
 * @param {any} scope
 * @returns {any}
 */
    setScope: function (scope) {
        if (scope !== this.scope) {
            scope.parent = this.scope; //-->ASSURANCE FOR OBSERVABLE CHAIN TOO
            this.scope = scope;
        }
        return scope;
    },

    /**
 * resetScope method.
 * @param {any} root
 * @returns {void}
 */
    resetScope: function (root) {
        this.scope.restoreCurrent();

        //this.scope.actual = root.parent;

        if (this.scope.root === root) {
            this.scope.root = null;
            if (this.scope.parent) {
                this.scope = this.scope.parent;
            }
        }
    },

    /**
 * forward method.
 * @param {any} target
 * @param {any} key
 * @returns {void}
 */
    forward: function (target, key) {
        if (this.current.assign)
            this.current.assign(target, key);
    },

    /**
 * bind method.
 * @param {any} type
 * @param {any} path
 * @returns {any}
 */
    bind: function (type, path) {
        return this.binding.firstOrCreate(type, path);
    },

    /**
 * sync method.
 * @param {any} mutation
 * @returns {void}
 */
    sync: function (mutation) {
        if (mutation.$$typeof === ES_DATA_OBJECT) mutation = mutation.mutation;
        core.source.sync(mutation);
    },

    /**
 * setSource method.
 * @param {any} key
 * @param {any} source
 * @returns {Promise<any>}
 */
    setSource: async function (key, source) {
        await source;
        this.core.source.set(key, source);
    },

    /**
 * getSource method.
 * @param {any} key
 * @param {any} initialValue
 * @returns {any}
 */
    getSource: function (key, initialValue) {
        return this.core.source.get(key, initialValue);
    },

    /**
 * subscribe method.
 * @param {any} target
 * @returns {any}
 */
    subscribe: function (target) {
        if (this !== this.current) {
            target.context = this.current;
        }

        this.space.share(target);

        return target;
    },

    /**
 * unscribe method.
 * @param {any} target
 * @returns {void}
 */
    unscribe: function (target) {
        this.space.unshare(target);
    },

    /**
 * model method.
 * @param {any} model
 * @param {any} f
 * @returns {void}
 */
    model: function (model, f) {
        f(this.overridden.has(model) ? new this.overridden.get(model)(this) : new model(this));
        //if(!m.istanceOfModel) throw new Error("MODEL call is not an istance of Model");
    },

    /**
 * newInstance method.
 * @param {any} etype
 * @param {any} initialValues
 * @returns {any}
 */
    newInstance: function (etype, initialValues) {
        return $Data.cast(initialValues || {}, etype);
    },

    /**
 * mutable method.
 * @param {any} api
 * @returns {any}
 */
    mutable: function (api) {
        const mutable = new MutableObject();
        mutable.observable();
        let props = {};
        for (const key in api) {
            if (key[0] === '$') {
                props[key.substring(1)] = api[key];
                delete api[key];
            }
            else
                mutable[key] = api[key];
        }
        core.observableProperty(mutable, props);
        return mutable;
    },

    /**
 * getControl method.
 * @param {any} control
 * @param {any} target
 * @returns {any}
 */
    getControl: function (control, target) {
        return this.overridden.has(control) ? new this.overridden.get(control)(this, target) : new control(this, target);
    },

    /**
 * configureType method.
 * @param {any} definition
 * @returns {void}
 */
    configureType: function (definition) {
        this.core.typeDef = definition;
        $Data.buildSchema(definition);
    },

    /**
 * setBaseUrl method.
 * @param {any} url
 * @returns {void}
 */
    setBaseUrl: function (url) {
        this.core.services.iapi.channel.setBaseUrl(url);
    },

    /**
 * configureService method.
 * @param {any} services
 * @returns {void}
 */
    configureService: function (services) {
        services && Object.assign(core.services, services);
    },

    /**
 * configure method.
 * @param {any} target
 * @param {any} config
 * @returns {void}
 */
    configure: function (target, config) {
        const proto = target.prototype;
        proto.config = { ...proto.config, ...config };
    },

    /**
 * override method.
 * @param {any} control
 * @returns {void}
 */
    override: function (control) {
        //assign to prototype control or set if not exist
    },

    /**
 * share method.
 * @param {any} key
 * @param {any} el
 * @returns {void}
 */
    share: function (key, el) {
        const shared = this.shared.get(key);
        shared ? shared.push(el) : this.shared.set(key, [el]);
    },

    /**
 * unshare method.
 * @param {any} key
 * @param {any} el
 * @returns {void}
 */
    unshare: function (key, el) {
        let ar = this.shared.get(key);
        if (ar) {
            ar = ar.filter(item => item !== el);
            ar.length > 0 ? this.shared.set(key, ar) : this.shared.delete(key);
        }
    },

    /**
 * useMessenger method.
 * @param {any} uid
 * @returns {any}
 */
    useMessenger: function (uid) {
        if (this.messenger) {
            console.warn("Messenger already set, replacing with new instance.");
        }
        this.messenger = new Messenger(uid, this);
        return this.messenger;
    },

    /**
 * cache method.
 * @param {any} state
 * @returns {any}
 */
    cache(state) {
        if (!this.states) {
            this.states = [state];
        }
        else this.states.push(state);
        return state;
    }
});




