import { Bus, Flow } from "./bus";

export class IntentBus extends Bus {
    constructor(manager, parentBus) {
        super(manager.name, parentBus, true);
        this.manager = manager;
    }
    // Pattern Strategy: chiede al manager che tipo di Flow usare
    createFlow() { return this.manager.createFlow(this); }
}

export class IntentFlow extends Flow {
    constructor(bus, manager) {
        super(bus);
        this.manager = manager;
        this.slots = { onIntent: [] }; 
    }

    onIntent(handler) { this.slots.onIntent.push(handler); return this; }

    async dispatch(intentName, payload = {}, extraContext = {}) {
        const intentExecutionPipe = async (context, next) => {
            // Delega l'esecuzione logica al Manager
            await this.manager.executeIntent(context, this.slots);

            // È il Flow che si occupa di notificare il Successo generico!
            if (!context.isStopped) {
                context.defer(`${context.name}_SUCCESS`, context);
            }
            await next();
        };

        this.pipes.push(intentExecutionPipe);
        return super.run({ name: intentName, payload, manager: this.manager, ...extraContext });
    }
}

export class IntentEngine {
    constructor(config) {
        this.name = config.name;
        this.behaviors = config.behaviors || {};
        this.firewallRules = config.firewall; 
        
        this.bus = new IntentBus(this, config.parentBus);
    }

    createFlow(bus) { return new IntentFlow(bus, this); }

    getFirewallState(context) { return 'ANY'; }

    async executeIntent(context, slots) {
        // 1. Firewall (Opzionale)
        if (this.firewallRules) {
            const status = this.getFirewallState(context);
            const allowed = this.firewallRules[status];
            if (allowed && !allowed.includes(context.name)) {
                context.isStopped = true;
                throw new Error(`[${this.name}] Firewall bloccato per stato: ${status}`);
            }
        }

        // 2. Behavior (Passo tutto il context per la destrutturazione)
        const behaviorFn = this.behaviors[context.name];
        if (behaviorFn) {
            context.actionPipe = await behaviorFn(context);
        }

        // 3. Esecuzione Slot Base (onIntent)
        for (const intentPipe of (slots.onIntent || [])) {
            await intentPipe(context);
            if (context.isStopped) return;
        }
    }
}