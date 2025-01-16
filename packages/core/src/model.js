import { core } from "./core";
import { $Data } from "./data";
import { Observable } from "./observe";
import { $Array } from "./utils";

export function DataModel() {
    this.source = null;
    this.pending = false;
    //this.state = null;
}

core.prototypeOf(Observable, DataModel, {
    defaultOption: { apiUrl: "api/" },

    $implement: [Symbol.for('es.isync')],

    etype: null,

    ExecuteApi: function (url, params, option) {
        //this.state = {url, params, option};
        //this.pending = true;
        return this.api.call(url, params, { ...this.defaultOption, ...option });//.then(()=>this.pending=false, ()=>this.pending=false);
    },

    ExecuteScalar: function (url, params, option) {
        this.pending = true;
        return this.api.call(url, params, { ...this.defaultOption, ...option }).then((result) => {
            this.pending = false;
            return this.setSource(result.data, option?.cast, true);
        }, er => { this.pending = false; this.setSource(null); console.log("ERROR API SERVICE REQUEST", er); throw er; });
    },

    ExecuteQuery: function (url, params, option) {
        this.pending = true;
        return this.api.call(url, params, { ...this.defaultOption, ...option }).then((result) => {
            this.pending = false;
            return this.setSource(result.data, option?.cast, true); //: [result.data] Array.isArray(result.data) ?  : null
        }, er => { this.pending = false; this.setSource(null); console.log("ERROR API SERVICE REQUEST", er); throw er; });
    },

    ExecuteGraphQuery: function (url, graph, data, option) {
        return this.ExecuteQuery(url, { Root: graph, Value: data }, { excludeParams: true, ...option });
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

    setSource: function (source, cast, formatted) {
        this.source = cast ? cast(source) : $Data.cast(source, this.etype, formatted);
        if (this.source?.node)
            this.source.node.graph.render = this;
        this.emit("SOURCE_CHANGED", this.source);
        return this.source;
    },

    createSource: function (key, call, initialData, predicate) {
        const api = call ? call(this) : this.ExecuteApi("collection", { predicate, itype: this.etype })
        return api.then(result => {
            const data = call ? result : result.data;
            core.source.set(key, data || initialData);
        });
    },

    sync: function (item) {
        this.source?.sync && this.source.sync(item) && this.refresh();
    },

    refresh: function () {
        this.emit("SOURCE_CHANGED", Array.isArray(this.source) ? [...this.source] : $Data.clone(this.source));//$Data.cast(...this.source, this.etype));
    },

    remove: function (item) {
        let refresh = false;
        if (Array.isArray(this.source)) {
            refresh = $Array.removeItem(this.source, item) > -1;
        }
        else if (item === this.source) {
            this.source = null;
            refresh = true;
        }
        refresh && this.refresh();
    },

    request: function (callback, values) {
        if (!values || !Array.isArray(values) || !this.values) {
            this.values = values;
            callback(this);
        }
        else {
            values.every((value, i) => {
                if (value !== this.values[i]) {
                    this.values = values;
                    callback(this);
                    return false;
                }
                else return true;
            })
        }
    },

    //TODO: Creare in automatico in form se è null, oggetto vuoto or not casted
    newInstance: function (initialValues) {
        return $Data.cast(initialValues || {}, this.etype);
    },
});

core.inject(DataModel, "IApi,IContext");
