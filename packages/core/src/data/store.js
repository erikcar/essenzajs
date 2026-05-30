/** @fileoverview packages/core/src/data/Store.js */

import { EventNode } from '../bubble';
import { $Array } from '../utils'; 

export const ISync = Symbol.for('es.isync');

export class Store extends EventNode {
    
    constructor(app, etype) {
        super();
        this.app = app;
        // Inizializzazione proprietà di istanza (da DataModel function body)
        this.source = null;
        this.data = null;
        this.pending = false;
        this.predicate = null;
        this.token = 0;
        this.current = null;
        
        // Se passato nel costruttore sovrascrive quello sul prototipo
        if (etype) this.etype = etype;
    }

    // --- METODI DI ESECUZIONE API ---

    ExecuteApi(url, params, option) {
        return this.api.call(url, params, { ...this.defaultOption, ...option });
    }

    ExecuteScalar(url, params, option) {
        this.pending = true;
        return this.api.call(url, params, { ...this.defaultOption, ...option })
            .then((result) => {
                this.pending = false;
                return this.setSource(result.data, option?.cast, true);
            }, er => {
                this.pending = false;
                this.setSource(null);
                throw er;
            });
    }

    ExecuteQuery(url, params, option) {
        this.pending = true;
        const opt = option || {};
        return this.api.call(url, params, { ...this.defaultOption, ...opt })
            .then((result) => {
                this.pending = false;
                return this.setSource(result.data, opt.cast !== false);
            }, er => {
                this.pending = false;
                this.setSource(null);
                throw er;
            });
    }

    ExecuteMany(queries, option) {
        this.pending = true;
        return this.api.all(queries, { ...this.defaultOption, ...option })
            .then((results) => {
                this.pending = false;
                return results;
            }, er => {
                this.pending = false;
                throw er;
            });
    }

    // --- METODI DI RICERCA / SYNC (Legacy completi) ---

    filter(predicate, params, option) {
        this.predicate = predicate;
        const qp = { predicate: predicate || "", itype: this.etype, ...params };
        return this.ExecuteQuery("collection", qp, option);
    }

    filterAll(predicate, params, option) {
        this.predicate = predicate;
        const qp = { predicate: predicate || "", itype: this.etype, all: true, ...params };
        return this.ExecuteQuery("collection", qp, option);
    }

    collection(predicate, params, option) {
        const qp = { predicate: predicate || "", itype: this.etype, ...params };
        return this.ExecuteApi("collection", qp, option);
    }

    item(predicate, params, option) {
        const qp = { predicate: predicate || "", itype: this.etype, ...params };
        return this.ExecuteApi("item", qp, option);
    }

    async sync(url, params, option) {
        const result = await this.ExecuteApi(url || "sync", params, option);
        return this.setSource(result.data, option?.cast !== false);
    }

    // --- GESTIONE DATI ---

    setSource(data, cast) {
        this.data = data;
        if (cast && this.app.services.dataStore) {
            this.source = this.app.services.dataStore.cast(data, this.etype);
        } else {
            this.source = data;
        }
        return this.source;
    }

    createSource(data, cast) {
        return this.setSource(data, cast !== false);
    }

    refresh() {
        if (this.source && typeof this.source.refresh === 'function') {
            this.source.refresh();
        } else if (this.render && typeof this.render.refresh === 'function') {
            this.render.refresh();
        }
    }

    remove(item) {
        let refresh = false;
        if (Array.isArray(this.source)) {
            refresh = $Array.removeItem(this.source, item) > -1;
        } else if (item === this.source) {
            this.source = null;
            refresh = true;
        }
        if (refresh) this.refresh();
    }

    request(callback, values) {
        if (!values || !Array.isArray(values) || !this.values) {
            this.values = values;
            callback(this);
        } else {
            const changed = values.some((v, i) => v !== this.values[i]);
            if (changed) {
                this.values = values;
                callback(this);
            }
        }
    }

    newInstance(data, cast) {
        const entity = this.app.services.dataStore.createEntity(this.etype, data, cast !== false);
        if (!this.source) this.setSource(entity, false);
        return entity;
    }

    clear() {
        this.source = null;
        this.data = null;
        this.values = null;
        this.refresh();
    }

    /** Shortcut per l'API service */
    get api() {
        return this.app.services.api;
    }
}

// --- DEFINIZIONE PROPRIETÀ SUL PROTOTIPO (Legacy Parity) ---
// In questo modo etype e defaultOption non vengono duplicati in ogni istanza
Store.prototype.etype = null;
Store.prototype.defaultOption = { apiUrl: "api/" };
Store.prototype.$implement = [ISync];