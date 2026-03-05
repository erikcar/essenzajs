// --- core/Bus.js ---
import { Pipeline } from './pipeline';
import { FlowBuilder } from './FlowBuilder';

export class Bus extends Pipeline {
    constructor(id, parentBus = null, prefixEvents = false) {
        super();
        this.id = id;
        this.parentBus = parentBus;
        this.prefixEvents = prefixEvents; // Es. true per i DomainBus (aggiunge 'THREAD:')
    }

    // --- BUBBLE UP ---
    emit(eventName, payload = {}, scopeId = null) {
        const currentScope = scopeId || this.id;
        
        // Emetto localmente
        super.emit(eventName, payload, currentScope);

        // Inoltro al genitore (es. da Domain a Scope, o da Scope a App)
        if (this.parentBus) {
            const forwardedName = this.prefixEvents ? `${this.id}:${eventName}` : eventName;
            this.parentBus.emit(forwardedName, payload, currentScope);
        }
    }

    // --- TRICKLE DOWN ---
    async runPipeline(intentName, intent, ephemeralPipes = []) {
        if (this.parentBus) {
            const forwardedName = this.prefixEvents ? `${this.id}:${intentName}` : intentName;
            await this.parentBus.runPipeline(forwardedName, intent);
        }
        
        if (intent.isStopped) return intent;

        return await super.runPipeline(intentName, intent, ephemeralPipes);
    }

    // --- ENTRY POINTS FLUENTI ---
    pipe(handler) { return new FlowBuilder(this).pipe(handler); }
    guard() { return new FlowBuilder(this).guard(); }
    dispatch(domain, intentName, dataObject, payload = {}) {
        return new FlowBuilder(this).dispatch(domain, intentName, dataObject, payload);
    }
}

// L'istanza Singleton radice di tutta l'app
export const AppBus = new Bus('APP');

