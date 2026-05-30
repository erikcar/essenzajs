// --- core/DomainPlugin.js ---

// --- core/DomainPlugin.js ---

export class DomainPlugin {
    constructor(scope, domainName) {
        this.scope = scope;
        this.hub = scope.getHub(domainName);
        this.unsubscribers = [];

        this.initDefaultSideEffects();
    }

    initDefaultSideEffects() {
        // Mi metto in ascolto di TUTTI gli eventi emessi da questo Hub
        const unsub = this.hub.bus.onAny(({ eventName, payload }) => {
            
            // Gestione Errori
            if (eventName.endsWith('_ERROR')) {
                this.scope.notifyError(`Errore operazione: ${payload.error}`);
            } 
            // Gestione Successi (escludendo le letture per non spammare la UI)
            else if (eventName.endsWith('_SUCCESS') && !eventName.includes('READ')) {
                // Cerco un nome o un titolo nell'entità mutata
                const name = payload.entity?.topic || payload.entity?.nominative || 'Elemento';
                this.scope.notifySuccess(`${name} salvato con successo!`);
            }
            
        });

        this.unsubscribers.push(unsub);
    }

    // Metodo helper per aggiungere custom listeners specifici nei ViewModel
    on(eventName, handler) {
        const unsub = this.hub.bus.on(eventName, handler);
        this.unsubscribers.push(unsub);
        return unsub;
    }

    // Metodo chiamato dallo Scope quando la vista viene chiusa
    destroy() {
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
    }
}