import { core } from "./core";
import { Observable } from "./observe";

export function DataModel() { this.source = null; }

core.prototypeOf(Observable, DataModel, {
    defaultOption: { apiUrl: "api/" },

    itype: null,

    ExecuteApi: function (url, params, option) {
        return this.api.call(url, params, Object.assign(this.defaultOption || {}, option)).then((result) => {
            console.log("API SERVICE REQUEST RESULT" + result.data, result);
            this.source = result.data;
            //Registrare source
            //Cast Data
            //Listen for data Mutation
            //Emit result
            this.emit("SOURCE_CHANGED", result.data);
            return result.data;
        }, er => { console.log("ERROR API SERVICE REQUEST", er); throw er; });
    },

    collection: function (predicate) {
        return this.ExecuteApi("collection", { predicate: predicate, itype: this.itype })
    },

    item: function (id) {
        return this.ExecuteApi("item", { id: id, itype: this.itype })
    },
});

core.inject(DataModel, "IApi");






/** OLD IMPLEMENTATION */
export function Model() { }

Model.prototype = {
    ExecuteApi: function (url, params, option) {
        return this.api.call(url, params, Object.assign(this.defaultOption || {}, option)).then((result) => {
            console.log("API SERVICE REQUEST RESULT" + result.data, result);
            return result.data;
        }, er => { console.log("ERROR API SERVICE", er); throw er; });
    },

    task: function (intent, data, key) {
        return this.control?.hasOwnProperty(intent)
            ? new Block(this.control[intent].bind(this), key || intent, data)
            : null;
    },

    control: {
        EMIT: function ({ data }) {
            this.context.emit(data.intent, data.value);
        }
    }
}

core.inject(Model, "IApi, IContext");
