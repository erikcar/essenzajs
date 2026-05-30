// --- core/Scope.js ---
import { Bus } from './bus';

export class Scope {
    constructor(id, parentScope = null) {
        this.id = id;
        this.parent = parentScope;

        // 1. Passiamo 'this' come 4° parametro (il target/owner) al Bus.
        // Assicurati di aggiornare il costruttore in bus.js per accogliere 'target':
        // constructor(id, parentBus = null, prefixEvents = false, target = null) { ... this.target = target; }
        this.bus = new Bus(id, parentScope?.bus, false, this);
        
        this.children = new Set();

        if (this.parent) {
            this.parent.children.add(this);
        }
    }

    // 4. L'accesso magico all'App (Risalita del Grafo)
    get app() {
        let current = this;
        while (current.parent) {
            current = current.parent;
        }
        return current; 
    }

    /**
     * Motore di Iniezione delle Dipendenze (IoC).
     * Accetta una Classe (da istanziare) o un Oggetto (da iniettare).
     * * @param {Function|Object} target - La Classe o l'Oggetto istanziato.
     * @param  {...any} args - Eventuali argomenti per il costruttore (solo per le Classi).
     * @returns {Object} L'istanza pronta all'uso con 'app' iniettata.
     */
    use(target, ...args) {
        if (!target) {
            throw new Error("[Essenza DI] Impossibile iniettare: target non valido.");
        }

        // CASO 1: È una Classe (o funzione costruttrice)
        if (typeof target === 'function') {
            return new target(this.app, ...args);
        }

        // CASO 2: È un Oggetto già istanziato
        if (typeof target === 'object') {
            // Se non ha già un riferimento all'app, glielo iniettiamo
            if (!target.app) {
                target.app = this.app;
            }
            return target;
        }

        throw new Error("[Essenza DI] Il target passato a use() deve essere una Classe o un Oggetto.");
    }

    createChildScope(childId) {
        return new Scope(childId, this);
    }

    destroy() {
        if (this.parent) {
            this.parent.children.delete(this);
        }
        // ... eventuale logica per distruggere this.bus e scollega eventi ...
    }
}