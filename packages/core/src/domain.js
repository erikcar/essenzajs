// --- core/Domain.js ---
import { Bus } from './bus';
import { IntentFlow, IntentEngine } from './intent';

export class DomainFlow extends IntentFlow {
    constructor(bus, domain) {
        super(bus, domain);
        this.slots.onCommit = []; 
    }

    onCommit(handler) { this.slots.onCommit.push(handler); return this; }

    async dispatch(intentName, entity, payload = {}) {
        return super.dispatch(intentName, payload, { entity });
    }
}

export class Domain extends IntentEngine {
    constructor(config) {
        super(config); 
        this.model = new config.ModelClass();
    }

    createFlow(bus) { return new DomainFlow(bus, this); }

    getFirewallState(context) { return context.entity?.status || 'ANY'; }

    async executeIntent(context, slots) {
        // 1. Eseguo lo scheletro della classe madre
        await super.executeIntent(context, slots);
        if (context.isStopped) return;

        // 2. Override: Eseguo la persistenza e ciclo gli onCommit
        if (typeof context.actionPipe === 'function') {
            await context.actionPipe(context, async () => {
                for (const commitPipe of (slots.onCommit || [])) {
                    await commitPipe(context);
                }
            });
        }
    }
}