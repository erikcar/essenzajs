/** @fileoverview packages/core/src\model.js */

import { core } from "./core";
import { $Data } from "./data";
import { Observable } from "./observe";
import { $Array } from "./utils";

/**
 * DataModel function.
 * @returns {void}
 */
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

        /**
     * ExecuteApi method.
     * @param {any} url
     * @param {any} params
     * @param {any} option
     * @returns {any}
     */
        ExecuteApi: function (url, params, option) {
        //this.state = {url, params, option};
        //this.pending = true;
        return this.api.call(url, params, { ...this.defaultOption, ...option });
    },

        /**
     * ExecuteScalar method.
     * @param {any} url
     * @param {any} params
     * @param {any} option
     * @returns {any}
     */
        ExecuteScalar: function (url, params, option) {
        this.pending = true;
        return this.api.call(url, params, { ...this.defaultOption, ...option }).then((result) => {
            this.pending = false;
            return this.setSource(result.data, option?.cast, true);
        }, er => { this.pending = false; this.setSource(null); console.log("ERROR API SERVICE REQUEST", er); throw er; });
    },

        /**
     * ExecuteQuery method.
     * @param {any} url
     * @param {any} params
     * @param {any} option
     * @returns {any}
     */
        ExecuteQuery: function (url, params, option) {
        this.pending = true;
        option = option || {};
        return this.api.call(url, params, { ...this.defaultOption, ...option }).then((result) => {
            this.pending = false;
            return this.setSource(result.data, option.cast, true);
        }, er => { this.pending = false; this.setSource(null); console.log("ERROR API SERVICE REQUEST", er); throw er; });
    },

        /**
     * ExecuteMany method.
     * @param {any} models
     * @param {any} url
     * @param {any} params
     * @param {any} option
     * @returns {any}
     */
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

        /**
     * ExecuteGraphQuery method.
     * @param {any} url
     * @param {any} graph
     * @param {any} data
     * @param {any} option
     * @returns {any}
     */
        ExecuteGraphQuery: function (url, graph, data, option) {
        return this.ExecuteQuery(url, { Root: graph, Value: data }, { excludeParams: true, ...option });
    },

        /**
     * collection method.
     * @param {any} predicate
     * @returns {any}
     */
        collection: function (predicate) {
        if (!predicate) {
            predicate = "";
        }
        return this.ExecuteQuery("collection", { predicate: predicate, itype: this.etype })
    },

        /**
     * item method.
     * @param {any} id
     * @returns {any}
     */
        item: function (id) {
        return this.ExecuteQuery("item", { id: id, itype: this.etype })
    },

        /**
     * ServiceApi method.
     * @param {any} name
     * @param {any} data
     * @param {any} option
     * @returns {any}
     */
        ServiceApi: function (name, data, option) {
        return this.ExecuteApi(name, data, { apiUrl: "service/app/", ...option });
    },

        /**
     * delete method.
     * @param {any} data
     * @param {any} option
     * @returns {any}
     */
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

        /**
     * setSource method.
     * @param {any} source
     * @param {any} cast
     * @param {any} formatted
     * @returns {any}
     */
        setSource: function (source, cast, formatted) {
        if (cast === false)         /**
         * cast function.
         * @param {any} s
         * @returns {void}
         */
cast = s => s;
        this.source = cast ? cast(source, this.data) : $Data.cast(source, this.etype, formatted);
        this.data = this.source;
        this.predicate
            ?
            this.filter(this.predicate, this.field)
            :
            this.emit("SOURCE_CHANGED", this.source);

        return this.source;
    },

        /**
     * filter method.
     * @param {any} predicate
     * @param {any} field
     * @returns {any}
     */
        filter(predicate, field) {
        if (!this.data || !predicate) return;
        this.predicate = predicate;
        this.field = field;
        if (field && Array.isArray(this.data[field])) {
            this.source = { ...this.data };
            this.source[field] = this.data[field].filter(predicate);
            this.emit("SOURCE_CHANGED", this.source);

        }
        else if (Array.isArray(this.data)) {
            this.source = this.data.filter(predicate);
            this.emit("SOURCE_CHANGED", this.source);
        }
        return this.source;
    },

        /**
     * filterAll method.
     * @param {any} key
     * @param {any} predicate
     * @returns {void}
     */
        filterAll(key, predicate) {
        if (!this.predicates) this.predicates = new Map();
        key && this.predicates.set(key, predicate);
        const fns = [...this.predicates.values()];
        this.filter(i => fns.every(fn => fn(i)));
    },

        /**
     * clean method.
     * @returns {void}
     */
        clean() {
        this.source = this.data;
        this.predicate = null;
        this.predicates =
        this.field = null;
    },

        /**
     * reset method.
     * @param {any} key
     * @param {any} raw
     * @returns {void}
     */
        reset(key, raw) {
        if (key && this.predicates) {
            this.predicates.delete(key);
            if (this.predicates.size > 0) {
                this.filterAll();
                return;
            }
        }
        this.source = this.data;
        this.predicate = null;
        this.field = null;
        !raw && this.emit("SOURCE_CHANGED", this.source);
    },

        /**
     * createSource method.
     * @param {any} key
     * @param {any} call
     * @param {any} initialData
     * @param {any} predicate
     * @returns {any}
     */
        createSource: function (key, call, initialData, predicate = '') {
        const api = call ? call(this) : this.ExecuteApi("collection", { predicate, itype: this.etype })
        return api.then(result => {
            const data = call ? result : $Data.cast(result.data, this.etype);
            core.source.set(key, data || initialData);
        });
    },

        /**
     * sync method.
     * @param {any} item
     * @returns {void}
     */
        sync: function (item) {
        this.source?.sync && this.source.sync(item) && this.refresh();
    },

        /**
     * refresh method.
     * @returns {void}
     */
        refresh: function () {
        this.emit("SOURCE_CHANGED", Array.isArray(this.source) ? [...this.source] : $Data.clone(this.source));//$Data.cast(...this.source, this.etype));
    },

        /**
     * remove method.
     * @param {any} item
     * @returns {void}
     */
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

        /**
     * request method.
     * @param {any} callback
     * @param {any} values
     * @returns {void}
     */
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
        /**
     * newInstance method.
     * @param {any} initialValues
     * @returns {any}
     */
        newInstance: function (initialValues) {
        return $Data.cast(initialValues || {}, this.etype);
    },
});

core.inject(DataModel, "IApi,IContext");



