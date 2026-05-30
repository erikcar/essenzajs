// --- packages/core/src/core/EventNode.js ---

export class EventNode {
    constructor() {
        this.parent = null; 
        this.observe = {}; 
    }

    /**
     * Emette un evento che risale il Grafo Logico.
     * Se arriva alla radice senza essere fermato, viene "promosso" sul Bus Globale.
     */
    async emit(eventName, payload) {
        let current = this;
        let root = null; // Ci servirà per rintracciare il capostipite
        
        // Il contesto che viaggia insieme all'evento
        const eventContext = {
            name: eventName,
            emitter: this,         // Chi ha originato l'evento (es. ButtonPresenter)
            currentTarget: null,   // Chi lo sta ascoltando in questo momento
            stopped: false,
            stopPropagation: () => { eventContext.stopped = true; }
        };

        // 1. FASE DI BUBBLING (Risalita Locale)
        while (current) {
            root = current; // Aggiorniamo la radice ad ogni salto
            eventContext.currentTarget = current;

            // Ascolto specifico
            if (current.observe && typeof current.observe[eventName] === 'function') {
                await current.observe[eventName].call(current, payload, eventContext);
            }
            
            // Ascolto Jolly (Wildcard)
            if (current.observe && typeof current.observe['*'] === 'function') {
                await current.observe['*'].call(current, payload, eventContext);
            }

            // Se qualcuno ha bloccato la propagazione, usciamo dal ciclo
            if (eventContext.stopped) break;

            // Saliamo di un livello nel Grafo
            current = current.parent;
        }

        // 2. FASE DI PROMOZIONE GLOBALE (Il Ponte sul Bus)
        // Se non è stato fermato e abbiamo raggiunto un nodo con accesso all'App
        if (!eventContext.stopped && root && root.app && root.app.bus) {
            
            // Creiamo un pacchetto arricchito per il Bus globale
            const globalPayload = {
                source: this.name,        // Il nome del Widget originale
                rootSource: root.name,    // Il nome della Vista che lo ha inoltrato
                data: payload             // I dati originali
            };

            // Prefissiamo l'evento (opzionale ma consigliato per evitare collisioni)
            // Es: da 'submit' diventa 'ui:submit'
            const globalEventName = `ui:${eventName}`;
            
            await root.app.bus.dispatch(globalEventName, globalPayload);
        }
    }
}