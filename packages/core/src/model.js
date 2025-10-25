import { core } from "./core";
import { $Data } from "./data";
import { Observable } from "./observe";
import { $Array } from "./utils";

export function DataModel() {
    this.source = null;
    this.data = null;
    this.pending = false;
    this.predicate = null;
    //this.state = null;
}

core.prototypeOf(Observable, DataModel, {
    defaultOption: { apiUrl: "api/" },

    $implement: [Symbol.for('es.isync')],

    etype: null,

    ExecuteApi: function (url, params, option) {
        //this.state = {url, params, option};
        //this.pending = true;
        return this.api.call(url, params, { ...this.defaultOption, ...option });
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

    ExecuteMany: function (models, url, params, option) {
        let data = null;
        if (Array.isArray(models)) {
            this.pending = true;
            return this.api.call(url, params, { ...this.defaultOption, ...option }).then((result) => {
                this.pending = false;
                data = result.data;
                for (let k = 0; k < models.length; k++) {
                    const m = models[k];
                    //data.hasOwnProperty(m.etype) &&
                    m.source = option?.cast ? cast(data[m.etype]) : $Data.cast(data[m.etype], m.etype, true);
                    //m.setSource(data[m.etype], option?.cast, true);
                }
                //models[0].emit("SOURCE_CHANGED", models[0].source);
            }, er => { this.pending = false; console.log("ERROR API SERVICE REQUEST: QUERY MANY", er); throw er; }); //this.setSource(null);
        }
        else
            return Promise.resolve(data);
    },

    ExecuteGraphQuery: function (url, graph, data, option) {
        return this.ExecuteQuery(url, { Root: graph, Value: data }, { excludeParams: true, ...option });
    },

    collection: function (predicate) {
        if (!predicate) {
            predicate = "";
        }
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
        this.data = this.source;
        this.predicate 
        ?
            this.filter(this.predicate, this.field)
        :
            this.emit("SOURCE_CHANGED", this.source);
            
        return this.source;
    },

    filter(predicate, field){
        if(!this.data || !predicate) return;
        this.predicate = predicate;
        this.field = field;
        if(field && Array.isArray(this.data[field])){
            this.source = {...this.data };
            this.source[field] = this.data[field].filter(predicate);
            this.emit("SOURCE_CHANGED", this.source);
            
        }
        else if(Array.isArray(this.data)){
            this.source = this.data.filter(predicate);
            this.emit("SOURCE_CHANGED", this.source);
        }
        return this.source;
    },

    filterAll(key, predicate){
        if(!this.predicates) this.predicates = new Map();
        key && this.predicates.set(key, predicate);
        const fns = [...this.predicates.values()];
        this.filter(i=>fns.every(fn => fn(i)));
    },

    reset(key){
        if(key && this.predicates){
            this.predicates.delete(key);
            if(this.predicates.size > 0){
                this.filterAll();
                return;
            }
        }
        this.source = this.data;
        this.predicate = null;
        this.field = null;
        this.emit("SOURCE_CHANGED", this.source);
    },

    createSource: function (key, call, initialData, predicate = '') {
        const api = call ? call(this) : this.ExecuteApi("collection", { predicate, itype: this.etype })
        return api.then(result => {
            const data = call ? result : $Data.cast(result.data, this.etype);
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
