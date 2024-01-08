//import { core } from "./core";
import { Observable } from "./observe";
import { core } from "./core";
import { Flow } from "./code";
import { Space } from "./space";

export function context() {
    Observable.call(this);

    this.initialized = false;
    this.built = false;
    this.current = this;
    this.overridden = new Map();

    this.space = new Space(); //DA VALUTARE
}

core.prototypeOf(Observable, context, {
    core: core,

    setCurrent: function(ctx){
        if(ctx){
            ctx.parent = this.current; //-->ASSURANCE FOR OBSERVABLE CHAIN TOO
            this.current = ctx;
        }
        else{
            this.current = this.current.parent;
        }
    },

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

    configureService: function(services){
        services && Object.assign(core.services, services);
    },

    override: function(control){
        //assign to prototype control or set if not exist
    },

    request: (model, f) => f(new model()),

    execute: function(info){
        this.flow.execute(info);
    }
});

