import { core } from "./core";

export function Model() { }

Model.prototype = {
    ExecuteApi: function (url, params, option) {
        return this.api.call(url, params, Object.assign(this.defaultOption || {}, option)).then((result) => {
            console.log("API SERVICE REQUEST RESULT" + result.data, result);
            return result.data;
        }, er => { console.log("ERROR API SERVICE", er); throw er; });
    },

    task: function(intent, data, key){
        return this.control?.hasOwnProperty(intent)
            ? new Block(this.control[intent].bind(this), key || intent, data)
            : null;
    },

    control: {
        EMIT: function ({data}) {
            this.context.emit(data.intent, data.value);
        }
    }
}

core.inject(Model, "IApi, IContext");