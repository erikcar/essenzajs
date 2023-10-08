import { core, donothing, DataObject, assignIfNull} from "@essenza/core";

/**
 * @param {string} etype string key of object, used to store object.
 * @param {Decorator} decorator 
 * @param {object} option 
 */
export function webObject(etype, store, info) {
    DataObject.call(this, etype);
    this.etype = etype;
    Object.defineProperty(this, 'store', { enumerable: false, value: store || { save: donothing, getData: donothing } });
    //this.store = store || { save: donothing, getData: donothing };
    this.initialized = false;
    this.local = false;
    this.syncronize = false;
    this.skip;

    this.init = function (ctx) {
        if (!this.initialized) {
            console.log("INIT " + this.etype);

            if (this.beforeInit) this.beforeInit(ctx);

            this.restore(true);

            console.log("RESTORED DATA", this.state);
            if (!this.restored) { this.data = {}; this.syncronize = true; }

            console.log("CHECK FOR SYNC")
            //Richiesta precedente al Load Attuale (Es. link a nuova pagina che forza sync)
            if (sessionStorage.getItem("sync_" + this.etype)) {
                this.syncronize = true;
                sessionStorage.removeItem("sync_" + this.etype);
            }

            this.initialized = true;

            if (this.oninit) this.oninit(ctx);
        }
    };

    /*this.toJSON = function () {
        return JSON.stringify(this);
    };*/

    this.absorb = function (info, preserve) {
        preserve ? assignIfNull(this, info) : Object.assign(this, info);
    };

    this.defaultValues = function (info) {
        this.absorb(info, true);
    }

    this.backup = function (syncronize) {
        !this.skip && this.store.save(this);
        syncronize && !this.local && this.save();
    };

    this.restore = function (preserve) {
        const backup = this.store.getData(this);
        this.absorb(backup, preserve);
        this.restored = backup !== null;
    };

    this.clear = function(){
        this.store.clear(this);
    }

    /**
     * Syncronize object data with remote source
     * @param {*} data 
     * @returns 
     */
    this.sync = function () {
        //TODO: aggiungere caso local??
        return this.api.call("api/wo_sync", { etype: this.etype }).then((v) => {
            this.absorb(v);
        });
    };

    this.syncOnNextLoad = function () {
        sessionStorage.setItem("sync_" + this.etype, "Y")
    };

    this.onready = donothing;

    this.absorb(info);
}

webObject.prototype = DataObject.prototype;

core.inject(webObject, "IApi");