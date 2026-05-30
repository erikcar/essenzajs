/** @fileoverview packages/core/src\state.js */
/**
 * State function.
 * @param {any} name
 * @param {any} temp
 * @returns {void}
 */
export function State(name, temp) {
    this.name = name;
    this.key = null;
    this.storage = temp ? sessionStorage : localStorage;

    let state = JSON.parse(this.storage.getItem(name));
    this.data = state?.data;
    this.dict = new Map(state ? Object.entries(state.map) : null);
}

State.prototype = {
        /**
     * cache method.
     * @returns {void}
     */
        cache() {
        this.name && this.storage.setItem(this.name, JSON.stringify({ data: this.data, map: Object.fromEntries(this.dict) }));
    },

        /**
     * empty method.
     * @param {any} key
     * @returns {void}
     */
        empty(key) {
        this.clean(key);
        this.name && this.storage.removeItem(this.name);
    },

        /**
     * store method.
     * @param {any} value
     * @param {any} key
     * @returns {void}
     */
        store(value, key) {
        key = key || this.key;
        if (key) {
            this.dict.set(key, value);
        }
        else this.data = value;
        this.current = value;
    },

        /**
     * restore method.
     * @param {any} key
     * @returns {any}
     */
        restore(key) {
        this.key = key;
        return key ? this.dict.get(key) : this.data;
    },

        /**
     * clean method.
     * @param {any} key
     * @returns {void}
     */
        clean(key) {
        key = key || this.key;
        if (key) {
            this.dict.delete(key);
        }
        else this.data = null;
        this.current = null;
    }
}

// --- packages/core/src/state/State.js ---

export class StateCache {
    constructor(name, temp = false) {
        this.name = name;
        this.key = null;
        this.storage = temp ? sessionStorage : localStorage;
        
        // 1. REATTIVITÀ: Set per tenere traccia di chi sta ascoltando (es. i componenti React)
        this.listeners = new Set();
        
        this.data = null;
        this.dict = new Map();

        // 2. SAFE CACHING: Proteggo l'avvio da JSON corrotti o modifiche manuali dell'utente
        if (this.name) {
            try {
                const rawState = this.storage.getItem(this.name);
                if (rawState) {
                    const state = JSON.parse(rawState);

                    // 3. TTL (Scadenza): Controllo se il dato è troppo vecchio
                    if (state.expiresAt && Date.now() > state.expiresAt) {
                        console.warn(`[State] Stato '${this.name}' scaduto. Lo rimuovo.`);
                        this.storage.removeItem(this.name);
                    } else {
                        this.data = state.data;
                        this.dict = new Map(Object.entries(state.map || {}));
                    }
                }
            } catch (e) {
                console.error(`[State] Errore di lettura per '${this.name}'. Dati corrotti?`, e);
                this.storage.removeItem(this.name); // Faccio pulizia se si spacca
            }
        }
    }

    // --- MOTORE DI REATTIVITÀ ---
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener); // Ritorna la funzione per scollegarsi
    }

    notify() {
        this.listeners.forEach(listener => listener());
    }

    // --- MOTORE DI CACHING ---
    cache(ttlMilliseconds = null) {
        if (!this.name) return;
        
        try {
            // Se mi passano i millisecondi, calcolo la data di morte del dato
            const expiresAt = ttlMilliseconds ? Date.now() + ttlMilliseconds : null;
            
            const payload = JSON.stringify({ 
                data: this.data, 
                map: Object.fromEntries(this.dict),
                expiresAt: expiresAt
            });
            
            this.storage.setItem(this.name, payload);
        } catch (e) {
            // Intercetta l'errore `QuotaExceededError` se la memoria del browser è piena (es. JSON da 10MB)
            console.error(`[State] Impossibile salvare '${this.name}'. Quota superata?`, e);
        }
    }

    // --- MOTORE DATI (con avvisi automatici) ---
    store(value, key) {
        key = key || this.key;
        if (key) {
            this.dict.set(key, value);
        } else {
            this.data = value;
        }
        this.current = value;
        
        // Avviso React che il dato è cambiato!
        this.notify(); 
    }

    restore(key) {
        key = key || this.key;
        return key ? this.dict.get(key) : this.data;
    }

    clean(key) {
        key = key || this.key;
        if (key) {
            this.dict.delete(key);
        } else {
            this.data = null;
        }
        this.notify(); // Avviso che il dato è stato ripulito in memoria
    }

    empty(key) {
        this.clean(key);
        if (this.name && !key) {
            this.storage.removeItem(this.name);
        }
    }
}


