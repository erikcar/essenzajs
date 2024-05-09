import { core } from "./core";
import { $Data } from "./data";
import { Observable } from "./observe";

export function DataModel() {
    this.source = null;
    //this.state = null;
}

core.prototypeOf(Observable, DataModel, {
    defaultOption: { apiUrl: "api/" },

    $implement: [Symbol.for('es.isync')],

    etype: null,

    ExecuteApi: function (url, params, option) {
        //this.state = {url, params, option};
        return this.api.call(url, params, { ...this.defaultOption, ...option });
    },

    ExecuteScalar: function (url, params, option) {
        return this.api.call(url, params, { ...this.defaultOption, ...option }).then((result) => {
            console.log("API SERVICE REQUEST RESULT" + result.data, result);
            return this.setSource(result.data);
        }, er => { console.log("ERROR API SERVICE REQUEST", er); throw er; });
    },

    ExecuteQuery: function (url, params, option) {
        return this.api.call(url, params, { ...this.defaultOption, ...option }).then((result) => {
            console.log("API SERVICE REQUEST RESULT" + result.data, result);
            return this.setSource(result.data); //: [result.data] Array.isArray(result.data) ?  : null
        }, er => { console.log("ERROR API SERVICE REQUEST", er); throw er; });
    },

    collection: function (predicate) {
        return this.ExecuteQuery("collection", { predicate: predicate, itype: this.etype })
    },

    item: function (id) {
        return this.ExecuteQuery("item", { id: id, itype: this.etype })
    },

    ServiceApi: function (name, data, option) {
        return this.ExecuteApi(name, data, { apiUrl: "service/app/", ...option });
    },

    delete: function (data, option) {
        const defaultOpt = { delOp: "api/jdelete", excludeParams: true };
        Object.assign(defaultOpt, option);

        if (!Array.isArray(data))
            data = [data];

        const mutation = [];
        data.forEach(function (item) {
            //item.mutation.crud = 3;
            if (!item) return;
            mutation.push(isNaN(item) ? item.mutation : { id: item });
        });

        return this.api.call(defaultOpt.delOp, { etype: this.etype, Mutation: mutation }, defaultOpt);
    },

    setSource: function (source) {
        this.source = $Data.cast(source, this.etype);
        this.emit("SOURCE_CHANGED", this.source);
        return this.source;
    },

    createSource: function (key, call, initialData, predicate) {
        const api = call ? call(this) : this.ExecuteApi("collection", { predicate, itype: this.etype })
        return api.then(result => {
            core.source.set(key, result.data || initialData);
        });
    },

    sync: function (item) {
        this.source && this.source.sync(item) && this.refresh();
    },

    refresh: function () {
        this.emit("SOURCE_CHANGED", Array.isArray(this.source) ? [...this.source] : $Data.clone(this.source));//$Data.cast(...this.source, this.etype));
    },

    reload: function () {

    },

    //TODO: Creare in automatico in form se è null, oggetto vuoto or not casted
    newInstance: function (initialValues) {
        return $Data.cast(initialValues || {}, this.etype);
    },
});

core.inject(DataModel, "IApi,IContext");
