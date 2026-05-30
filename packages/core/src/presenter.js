// --- packages/core/src/core/Presenter.js ---

import { EventNode } from './bubble';
import { QueryCollection } from './query';

export class Presenter extends EventNode {
    
    constructor(name) {
        super(); // Inizializza this.parent = null e this.observe = {}
        
        // Identità del nodo
        this.name = name || this.constructor.name;
        
        // Contesto di Sistema (Iniettato dal Root o ereditato dal Parent)
        this.app = null;
        this.scope = null;
        this.props = {};
        
        // Strutture dati del Grafo Logico
        this.childPresenters = new Set();
        this.localShared = new Map();
        
        // Hook per forzare il re-render della vista React associata
        this.render = () => {}; 
    }

    /**
     * Collega questo Presenter al suo genitore nel Grafo.
     * @param {Presenter} parentVp 
     */
    setParent(parentVp) {
        this.parent = parentVp;
        if (parentVp) {
            parentVp.childPresenters.add(this);
            // Eredita l'accesso ai servizi core
            this.app = parentVp.app;
            this.scope = parentVp.scope;
        }
    }

    /**
     * Registra un'istanza esterna (es. un Form Widget) nel Grafo Locale.
     */
    share(key, instance) {
        if (!this.localShared.has(key)) {
            this.localShared.set(key, new Set());
        }
        this.localShared.get(key).add(instance);
    }

    /**
     * Rimuove un'istanza dal Grafo Locale.
     */
    unshare(key, instance) {
        this.localShared.get(key)?.delete(instance);
    }

    /**
     * Motore di ricerca polimorfico all'interno del sotto-albero.
     * Accetta: String ('form'), Classe (CartPresenter), o Array misto.
     */
    find(targetOrPath) {
        let parts;// = [];
        
        // Normalizzazione dell'input
        if (Array.isArray(targetOrPath)) {
            parts = targetOrPath.map(p => typeof p === 'function' ? p.name : p);
        } else if (typeof targetOrPath === 'function') {
            parts = [targetOrPath.name];
        } else if (typeof targetOrPath === 'string') {
            parts = targetOrPath.split('/');
        } else {
            return new QueryCollection();
        }

        const target = parts.shift();
        let results = [];

        // Condizione di uscita: siamo all'ultimo step del path
        if (parts.length === 0) {
            const local = Array.from(this.localShared.get(target) || []);
            const children = Array.from(this.childPresenters).filter(c => c.name === target);
            results = [...local, ...children];
        } 
        // Ricerca ricorsiva scendendo nell'albero
        else {
            for (const child of this.childPresenters) {
                if (child.name === target) {
                    results = results.concat(child.query(parts).all());
                }
            }
        }

        // Restituisce la collezione potenziata (first, last, all)
        return new QueryCollection(...results);
    }

    /**
     * Cerca i form (o i Validator) all'interno del sotto-albero.
     * @param {string|string[]} formNames - (Opzionale) Nomi specifici da filtrare.
     * @returns {QueryCollection} Collezione di istanze Validator.
     */
    findForm(formNames = []) {
        // Normalizziamo in array
        const targets = Array.isArray(formNames) ? formNames : [formNames];
        
        // Funzione ricorsiva per estrarre tutti i Validator
        const extractValidators = (node) => {
            let localForms = [];
            
            // 1. Cerchiamo tra le istanze condivise localmente
            node.localShared.forEach((instances, key) => {
                instances.forEach(inst => {
                    // Duck Typing: È un validator?
                    if (inst && typeof inst.validate === 'function') {
                        // Se non ho specificato nomi, o se il nome corrisponde, lo prendo
                        if (targets.length === 0 || targets.includes(key)) {
                            localForms.push(inst);
                        }
                    }
                });
            });

            // 2. Scendiamo nei figli per cercare altri form
            let childForms = [];
            for (const child of node.childPresenters) {
                childForms = childForms.concat(extractValidators(child));
            }

            return [...localForms, ...childForms];
        };

        return new QueryCollection(...extractValidators(this));
    }

    // --- Cicli di Vita --- //

    /**
     * Chiamato subito dopo l'istanziazione e l'aggancio al Parent/App.
     */
    onInit() {}
    
    /**
     * Chiamato quando il componente UI viene smontato.
     */
    onDestroy() {
        if (this.parent) {
            this.parent.childPresenters.delete(this);
        }
        // Eventuale pulizia custom delle classi derivate
    }
}