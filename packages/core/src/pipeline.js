// core/Pipeline.js

export class Pipeline {
    constructor() {
        this.listeners = new Map();
        this.pipes = new Map();
        this.globalPipes = [];
    }

    // --- PUB/SUB ---
    on(eventName, handler, scopeId = null) {
        if (!this.listeners.has(eventName)) this.listeners.set(eventName, []);
        const sub = { handler, scopeId };
        this.listeners.get(eventName).push(sub);
        
        return () => {
            const arr = this.listeners.get(eventName);
            if (arr) this.listeners.set(eventName, arr.filter(s => s !== sub));
        };
    }

    emit(eventName, payload = {}, originScopeId = null) {
        const subs = this.listeners.get(eventName) || [];
        subs.forEach(sub => {
            if (!sub.scopeId || sub.scopeId === originScopeId) {
                sub.handler({ eventName, payload, originScopeId });
            }
        });
    }

    // --- MIDDLEWARE / ONION ARCHITECTURE ---
    addPipe(intentName, handler) {
        if (intentName === '*') this.globalPipes.push(handler);
        else {
            if (!this.pipes.has(intentName)) this.pipes.set(intentName, []);
            this.pipes.get(intentName).push(handler);
        }
    }

    async runPipeline(intentName, intent, ephemeralPipes = []) {
        const specificPipes = this.pipes.get(intentName) || [];
        const cascade = [...this.globalPipes, ...specificPipes, ...ephemeralPipes];
        
        let index = -1;

        const next = async (i) => {
            if (i <= index) throw new Error('next() chiamato più volte nella stessa pipe');
            index = i;
            
            if (i === cascade.length || intent.isStopped) return; 
            
            const currentPipe = cascade[i];
            // Passo la funzione next() alla pipe corrente
            await currentPipe(intent, () => next(i + 1));
        };

        await next(0);
        return intent;
    }
}


// --- core/FlowBuilder.js ---

export class FlowBuilder {
    constructor(bus) {
        this.bus = bus;
        this.ephemeralPipes = [];
        this.locks = new Set();
    }

    pipe(middlewareHandler) {
        this.ephemeralPipes.push(middlewareHandler);
        return this;
    }

    guard() {
        this.ephemeralPipes.push(async (intent, next) => {
            const lockKey = `${intent.name}_${intent.entity?.id || 'new'}`;
            
            if (this.locks.has(lockKey)) {
                intent.isStopped = true;
                console.warn(`[Guard] Esecuzione ignorata, flusso già in corso: ${intent.name}`);
                return; // Ferma la catena, NON chiama next()
            }

            this.locks.add(lockKey);
            
            try {
                // Aspetta che tutta la pipeline (Dominio, DB, etc.) finisca
                await next(); 
            } finally {
                // Rilascia sempre il lucchetto, anche in caso di errori API!
                this.locks.delete(lockKey);
            }
        });
        
        return this;
    }

    dispatch(domain, intentName, dataObject, payload = {}) {
        return domain.dispatch(intentName, dataObject, payload, this.ephemeralPipes);
    }
}