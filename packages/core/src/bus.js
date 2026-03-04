// --- core/Bus.js ---

export class Bus {
    constructor() {
        this.listeners = new Map();     // { 'EVENT_NAME': [ { handler, scopeId } ] }
        this.interceptors = new Map();  // { 'ACTION_NAME': [ handler ] }
    }

    // 1. Registra un ascoltatore (con firma opzionale dello Scope)
    on(eventName, handler, scopeId = null) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        
        const subscription = { handler, scopeId };
        this.listeners.get(eventName).push(subscription);

        // Ritorna la funzione per deregistrarsi (fondamentale per lo smontaggio della UI)
        return () => {
            const arr = this.listeners.get(eventName);
            this.listeners.set(eventName, arr.filter(sub => sub !== subscription));
        };
    }

    // 2. Emette un evento, rispettando il recinto dello Scope
    emit(eventName, payload, originScopeId = null) {
        const subs = this.listeners.get(eventName) || [];
        subs.forEach(sub => {
            // Se il listener non ha scope (globale) o se lo scope combacia, esegui!
            if (!sub.scopeId || sub.scopeId === originScopeId) {
                sub.handler({ eventName, payload, originScopeId });
            }
        });
    }

    // 3. Aggiunge un intercettore (Fase Pre-Flight)
    addInterceptor(actionName, handler) {
        if (!this.interceptors.has(actionName)) {
            this.interceptors.set(actionName, []);
        }
        this.interceptors.get(actionName).push(handler);
    }

    async runInterceptors(actionName, intent) {
        const actionInterceptors = this.interceptors.get(actionName) || [];
        for (const interceptor of actionInterceptors) {
            await interceptor(intent);
            if (intent.isStopped) break;
        }
    }
}

// Istanza Singleton Globale
export const AppBus = new Bus();