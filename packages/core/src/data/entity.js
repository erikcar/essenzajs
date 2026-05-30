/** @fileoverview packages/core/src/data/Entity.js */
import { Mutable } from './mutable';

export const ES_DATA_OBJECT = Symbol.for('es.dataobject');

export class Entity extends Mutable {
    /**
     * @param {App} app - Istanza dell'applicazione
     * @param {string} etype - Tipo entità
     * @param {Object} data - Dati iniziali
     */
    constructor(app, etype, data) {
        super();

        // Se passiamo dati nudi, usiamo il DataStore per il casting (comportamento legacy)
        if (data && app && app.services.dataStore) {
            return app.services.dataStore.cast(data, etype);
        }

        // Se creiamo una nuova istanza vuota, generiamo l'ID tramite DataStore
        if (etype && app && app.services.dataStore) {
            this.id = app.services.dataStore.nextIndex(etype);
        }

        // Definizione del parent node/grafo (logica _parent del legacy)
        Object.defineProperty(this, '_parent', {
            enumerable: false,
            writable: true,
            value: (etype && app) ? app.services.dataStore.createGraph(etype, false, "root").setSource(this) : null
        });
    }

    // --- Logica dei Nodi e Grafo ---

    get node() {
        return this._node ? this._node : (this._parent ? this._parent.node : null);
    }

    set node(value) {
        this._node = value;
    }

    get parent() {
        return Array.isArray(this._parent) ? this._parent.parent : this._parent;
    }

    set parent(value) {
        this._parent = value;
    }

    // --- Metodi CRUD e Sync ---

    save(option) {
        return this.node.save(this, option);
    }

    delete() {
        return this.node.delete(this);
    }

    remove() {
        return this.node.remove(this);
    }

    archivie(field = "archivied") {
        this['$' + field] = true;
        return this.save();
    }

    sync(item) {
        return this.node.sync(this, item);
    }

    refresh() {
        const render = this.node?.graph?.render;
        if (render && typeof render.refresh === 'function') {
            render.refresh();
        }
    }

    update(source) {
        Object.assign(this, source?.mutated);
    }

    toGraph() {
        return this.node.getDataGraph(this);
    }
}

// Proprietà Prototype
Entity.prototype.$$typeof = ES_DATA_OBJECT;