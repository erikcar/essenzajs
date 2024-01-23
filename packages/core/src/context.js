//import { core } from "./core";
import { Observable } from "./observe";
import { core } from "./core";
import { Flow } from "./code";
import { Space } from "./space";
import { $Data } from "./data";
import { BreakPointer } from "./breakpoint";

export function context() {
    Observable.call(this);

    this.initialized = false;
    this.built = false;
    this.parent = null;
    this.current = this;
    this.scope = this;
    this.overridden = new Map();
    this.breakpoint = new BreakPointer();

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

    focus: function(target){
        target.parent = this.current;
        this.current = target.parent;
    },

    blur: function(target){
        this.current = target ? target.parent : this.current?.parent;
    },

    setScope: function(scope){
        if(scope){
            scope.parent = this.scope; //-->ASSURANCE FOR OBSERVABLE CHAIN TOO
            this.scope = scope;
        }
    },

    resetScope: function(){
        if(this.scope.parent){
            this.scope = this.scope.parent;
        }
    },

    forward: function(target, key){
        if(this.current.hasOwnProperty("attach"))
            this.current.attach(target, key);
    },

    /*setCurrent: function(ctx){
        if(ctx){
            ctx.parent = this.current; //-->ASSURANCE FOR OBSERVABLE CHAIN TOO
            this.current = ctx;
        }
        else{
            this.current = this.current.parent;
        }
    },*/

    subscribe: function(target){
        if(this !== this.current){
            target.context = this.current;
        }

        this.space.share(target);

        return target;
    },

    unscribe: function(target){
        this.space.unshare(target);
    },

    model: function (model, f) {
        f(this.overridden.has(model) ? new this.overridden.get(model)(this) : new model(this));
        //if(!m.istanceOfModel) throw new Error("MODEL call is not an istance of Model");
    },

    getControl: function (control, target) {
        return this.overridden.has(control) ? new this.overridden.get(control)(this, target) : new control(this, target);
    },

    configureType: function(definition){
        this.core.typeDef = definition;
        $Data.buildSchema(definition);
    },

    setBaseUrl: function(url){
        this.core.services.iapi.channel.setBaseUrl(url);
    },

    configureService: function(services){
        services && Object.assign(core.services, services);
    },

    override: function(control){
        //assign to prototype control or set if not exist
    },

    request: (model, f) => f(new model()),
});

