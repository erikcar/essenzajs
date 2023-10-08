import { core } from "./core";

export function Model() { }

Model.prototype.ExecuteApi = function (url, params, option) {
    return this.api.call(url, params, Object.assign(this.defaultOption || {}, option)).then((result) => {
        console.log("API SERVICE REQUEST RESULT" + result.data, result);
        return result.data;
    }, er => { console.log("ERROR API SERVICE", er); throw er; });
}

core.inject(Model, "IApi, IContext");