//import { core } from "./core";
import { Observable } from "./observe";
import { core } from "./core";
import { Block, Flow } from "./code";
import { Space } from "./space";
import { $Data, ES_DATA_OBJECT, MutableObject } from "./data";
import { BreakPointer } from "./breakpoint";
import { Binder } from "./binding";

export function context() {
    Observable.call(this);

    this.initialized = false;
    this.built = false;
    this.parent = null;
    this.last = null;
    this.current = this;
    this.scope = this;
    this.overridden = new Map();
    this.breakpoint = new BreakPointer();
    this.block = new Block();
    this.binding = new Binder();

    this.space = new Space(); //DA VALUTARE
}

core.prototypeOf(Observable, context, {
    core: core,

    initialize: function (init) {
        if (!this.initialized) {
            this.initialized = true;
            core.build(this);
            init && init(this);
        }
        return this;
    },

    focus: function (target) {
        console.log("SCOPE-FOCUS", target, this.current)
        target.parent = this.current;
        this.current = target;
    },

    blur: function (target) {
        console.log("SCOPE-BLUR", target, this.current)
        this.current = target ? target.parent : this.current?.parent;
        return true;
    },

    attachScope: function (type, key) {
        if (this.scope === this) {
            //this element is out of any scope => create one and push it on unscoped
            core.unscoped.push(this.setScope(new context()));
        }
        const scoped = this.scope.binding.bind(type, key);
        scoped.scope = this.scope;
        return scoped;
    },

    storeCurrent: function (current) {
        this.last = { value: this.current, next: this.last };
        this.current = current;
    },

    restoreCurrent: function () {
        this.current = this.last.value;
        this.last = this.last.next;
    },

    updateScope: function (scoped) {
        if (!this.scope.root) {
            this.scope.root = scoped;
            this.setScope(scoped.scope)
        }
        this.scope.storeCurrent(scoped);
        
        scoped.parent = this.scope.actual;
        this.scope.actual = scoped;
        
        //this.scope.current = scoped;
    },

    setScope: function (scope) {
        if (scope !== this.scope) {
            console.log("SCOPE-SET", this.scope, scope);
            scope.parent = this.scope; //-->ASSURANCE FOR OBSERVABLE CHAIN TOO
            this.scope = scope;
        }
        return scope;
    },

    resetScope: function (root) {
        this.scope.restoreCurrent();
        
        this.scope.actual = root.parent;
        
        if (this.scope.root === root) {
            console.log("SCOPE-RESET", this.scope);
            this.scope.root = null;
            if (this.scope.parent) {
                this.scope = this.scope.parent;
            }
        }
    },

    forward: function (target, key) {
        if (this.current.assign)
            this.current.assign(target, key);
    },

    bind: function (type, path) {
        return this.binding.firstOrCreate(type, path);
    },

    sync: function (mutation) {
        if (mutation.$$typeof === ES_DATA_OBJECT) mutation = mutation.mutation;
        core.source.sync(mutation);
    },

    setSource: async function (key, source) {
        await source;
        this.core.source.set(key, source);
    },

    getSource: function (key, initialValue) {
        this.core.source.get(key, initialValue);
    },

    subscribe: function (target) {
        if (this !== this.current) {
            target.context = this.current;
        }

        this.space.share(target);

        return target;
    },

    unscribe: function (target) {
        this.space.unshare(target);
    },

    model: function (model, f) {
        f(this.overridden.has(model) ? new this.overridden.get(model)(this) : new model(this));
        //if(!m.istanceOfModel) throw new Error("MODEL call is not an istance of Model");
    },

    newInstance: function (etype, initialValues) {
        return $Data.cast(initialValues || {}, etype);
    },

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

    getControl: function (control, target) {
        return this.overridden.has(control) ? new this.overridden.get(control)(this, target) : new control(this, target);
    },

    configureType: function (definition) {
        this.core.typeDef = definition;
        $Data.buildSchema(definition);
    },

    setBaseUrl: function (url) {
        this.core.services.iapi.channel.setBaseUrl(url);
    },

    configureService: function (services) {
        services && Object.assign(core.services, services);
    },

    configure: function (target, config) {
        const proto = target.prototype;
        proto.config = { ...proto.config, ...config };
    },

    override: function (control) {
        //assign to prototype control or set if not exist
    },
});

