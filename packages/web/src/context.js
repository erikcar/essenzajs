//import { core } from "./core";
import { core, context } from "@essenza/core";
import { useSession } from "./session";
import { useUser } from "./user";

export function webControl() {}

export const webcontext = function () {
    context.call(this);

    this.objects = [];
    this.elements = {};
    this.setControl(this, webControl);
}

core.prototypeOf(context, webcontext, {
    register: function (wo) {//, injection) {
        this.objects.push(wo);
        //injection && core.inject(null, injection);
        //wo.context = this; // Siamo sicuri??
    },

    build: function (core) {

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

            //ui.init();

            if (!instance.initialized) {
                //instance.session.contentReady(); //Mi assicuro di eliminare task, così anche se lo richiama ctx non eseguo di nuovo!
                instance.init();
            }
        });
    },

    init: function () {
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
    },

    backup: function () {
        for (let k = 0; k < this.objects.length; k++) {
            this.objects[k].backup();
        }
    },

    setData: function (data) {
        let wo;
        for (let k = 0; k < this.objects.length; k++) {
            wo = this.objects[k];
            if (data.hasOwnProperty(wo.etype))
                wo.absorb(data[wo.etype]);
        }
    }
});

