/** @fileoverview packages/core/src/data/Mutable.js */
import { EventNode } from '../bubble';

export class Mutable extends EventNode {
    constructor() {
        super();
    }

    /**
     * Metodo mutate: delega al gestore Mutation
     */
    mutate(field, value) {
        this[field] !== value && this.mutation.setValue(field, value);
    }

    /**
     * Rende l'oggetto osservabile
     */
    observable() {
        this.mutation.observable = true;
    }

    // --- Getter per lo stato della mutazione ---

    get hasMutation() {
        return this.__mutation !== undefined;
    }

    get isMutated() {
        return this.__mutation !== undefined && this.__mutation.count > 0;
    }

    get $$mutated() {
        return this.isMutated ? this.__mutation.mutated : {};
    }

    get isPending() {
        return this.__mutation !== undefined && this.__mutation.hasOwnProperty("pending");
    }

    /**
     * Inizializzazione Lazy del gestore Mutation
     */
    get mutation() {
        if (this.__mutation === undefined) {
            Object.defineProperty(this, '__mutation', {
                enumerable: false,
                writable: true,
                value: new Mutation(this)
            });
        }
        return this.__mutation;
    }
}


/** @fileoverview packages/core/src/data/Mutation.js */

class Mutation {
    constructor(target) {
        this.target = target;
        this.mutated = {};
        this.original = {};
        this.count = 0;
        this.observable = false;
        
        // Determina se l'oggetto è gestito (managed)
        this.managed = target.node ? target.node.managed : true;
    }

    emit(evt, data) {
        // Usa il nodo dell'entità per emettere l'evento
        this.target.node.emit(evt, data, this.target);
    }

    /**
     * Metodo setValue differenziato in base a managed (come nel legacy)
     */
    setValue(field, value) {
        if (this.managed) {
            if (this.original[field] === value) {
                delete this.mutated[field];
                if (--this.count === 0) {
                    delete this.target.__mutation;
                    this.target.emit("IMMUTATED", this.target);
                }
            } else {
                if (!this.original.hasOwnProperty(field)) {
                    this.original[field] = this.target[field];
                    this.count++;
                    if (this.count === 1) {
                        this.target.emit("MUTATED", this.target);
                    }
                }
                this.mutated[field] = value;
                this.target[field] = value;
                this.target.emit("MUTATING", { 
                    field, 
                    value, 
                    oldValue: this.original[field], 
                    object: this.target 
                });
            }
        } else {
            // Logica Not Managed
            this.mutated[field] = value;
            const oldValue = this.target[field];
            this.target[field] = value;
            this.target.emit("MUTATING", { field, value, oldValue });
        }
    }

    restore() {
        if (this.managed) {
            for (const key in this.original) {
                if (this.original.hasOwnProperty(key)) {
                    this.target[key] = this.original[key];
                }
            }
        }
        this.mutated = {};
        this.original = {};
        this.count = 0;
        delete this.target.__mutation;
        this.target.emit("IMMUTATED", this.target);
    }

    commit() {
        this.mutated = {};
        this.original = {};
        this.count = 0;
        delete this.target.__mutation;
        this.target.emit("IMMUTATED", this.target);
    }
}