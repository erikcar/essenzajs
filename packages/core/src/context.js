//import { core } from "./core";
import { Observable } from "./observe";
import { $Array } from "./utils";
import { core } from "./core";

export function context() {
    Observable.call(this);

    this.observe("MUTATED").make(({ target, emitter }) => {
        emitter.mutation.push(target);
    })

    this.observe("IMMUTATED").make(({ target, emitter }) => {
        $Array.remove(emitter.mutation, m => m.id === target.id)
    })

    this.context = undefined;
    this.initialized = false;
    this.overridden = new Map();
}

core.prototypeOf(Observable, context, {
    core: core,

    model: function (model, f) {
        f(this.overridden.has(model) ? new this.overridden.get(model)(this) : new model(this));
        //if(!m.istanceOfModel) throw new Error("MODEL call is not an istance of Model");
    },

    getControl: function (control, target) {
        return this.overridden.has(control) ? new this.overridden.get(control)(this, target) : new control(this, target);
    },

    setControl: function (target, control) {
        return this.getControl(control, target);
    },

    configureService: function(services){
        services && Object.assign(core.services, services);
    },

    override: function(control){
        //assign to prototype control or set if not exist
    },

    request: (model, f) => f(new model()),
});

/*export const webcontext = function (parent) {
    Observable.call(this);

    this.objects = [];
    this.elements = {};

    this.register = function (wo) {//, injection) {
        this.objects.push(wo);
        //injection && core.inject(null, injection);
        //wo.context = this; // Siamo sicuri??
    };

    this.build = function (core) {

        Object.defineProperty(webcontext.prototype, "document", {
            get: function () {
                return core.document;
            },
        });

        Object.defineProperty(webcontext.prototype, "core", {
            get: function () {
                return core;
            },
        });

        core.inject(webcontext, "IApi");

        this.logged = core.getCookie('wgsession_'); //use cookie Api
        console.log("CTX LOGGED", this.logged);

        this.session = useSession(this);
        this.user = useUser(this);
        const instance = this;
        //session Active/Complete sia onReady che document.load )> 
        core.document.oncontent(function () {

            ui.init();

            if (!instance.initialized) {
                //instance.session.contentReady(); //Mi assicuro di eliminare task, così anche se lo richiama ctx non eseguo di nuovo!
                instance.init();
            }
        });
    }

    this.init = function () {
        if (!this.initialized) {

            this.initialized = true;
            const instance = this;
            const sync = [];

            const ready = function (warning) {

                if (!document.body) {
                    return setTimeout(ready, 13, warning);
                }

                for (let k = 0; k < instance.objects.length; k++) {
                    instance.objects[k].onready(instance, warning); //Session chiamerà prima onContent (se già eseguita non ci son più task)
                }
            }

            const onReady = function (warning) {
                console.log("CTX ON READY");
                warning = warning || false;
                document.onreadystatechange = () => {
                    if (document.readyState === 'complete') {
                        ready(warning);
                    }
                };

                if (document.readyState === 'complete') {
                    ready(warning);
                }
            }

            this.document.onunload((evt) => { //Event wg unload can be call more time on some os architecture, TODO: handle in webground
                instance.backup();
            });

            for (let k = 0; k < this.objects.length; k++) {
                const wo = this.objects[k];
                wo.init(this);
                if (!wo.local && wo.syncronize)
                    sync.push(wo.etype);
            }

            if (sync.length > 0) {
                this.api.call("wg_sync", sync.join(',')).then((v) => {
                    this.setData(v);
                    onReady();
                });
            }
            else {
                onReady();
            }
        }
    }

    this.backup = function () {
        for (let k = 0; k < this.objects.length; k++) {
            this.objects[k].backup();
        }
    };

    this.setData = function (data) {
        let wo;
        for (let k = 0; k < this.objects.length; k++) {
            wo = this.objects[k];
            if (data.hasOwnProperty(wo.etype))
                wo.absorb(data[wo.etype]);
        }
    }

    this.model = function (model, f) {
        const m = this.overridden.has(model) ? new this.overridden.get(model)(this) : new model(this);
        //if(!m.istanceOfModel) throw new Error("MODEL call is not an istance of Model");
        f(m);
    }

    this.getControl = function (control, target) {
        return this.overridden.has(control) ? new this.overridden.get(control)(this, target) : new control(this, target);
    }

    this.setControl = function (target, control) {
        target.control = this.getControl(control, target);
        return target.control;
    }

    this.setControl(this, webControl);
}*/

//Essendo già cntext non assegno però se poi dovessi aggiungere altre proprietà ad Observable...
//webcontext.prototype = Observable.prototype;

