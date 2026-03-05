// --- core/Domain.js ---
import { AppBus } from './bus';
import { Machine } from './machine';


// core/Domain.js
export class Domain {
    constructor({ name, behaviors, firewall, model, bus }) {
        this.name = name;
        this.behaviors = behaviors || {};
        this.firewall = firewall || {};
        this.model = model;
        this.bus = bus; // Istanza di Bus dedicata al dominio
    }

    async dispatch(intentName, entity, payload = {}, ephemeralPipes = []) {
        const intent = { 
            name: intentName, entity, payload, domain: this,
            autoSave: true, isStopped: false, committed: false 
        };

        const standardPipes = [
            this._firewallPipe.bind(this),
            this._behaviorPipe.bind(this),
            this._persistencePipe.bind(this)
        ];

        try {
            await this.bus.runPipeline(intentName, intent, [...standardPipes, ...ephemeralPipes]);
            if (!intent.isStopped) this.bus.emit(`${intentName}_SUCCESS`, { entity });
            return intent;
        } catch (error) {
            this.bus.emit(`${intentName}_ERROR`, { error: error.message });
            throw error;
        }
    }

    async _firewallPipe(intent) {
        const status = intent.entity.status || 'ANY';
        const allowed = this.firewall[status];
        if (allowed && !allowed.includes(intent.name)) {
            intent.isStopped = true;
            throw new Error(`Firewall: ${intent.name} non ammesso in stato ${status}`);
        }
    }

    async _behaviorPipe(intent) {
        const fn = this.behaviors[intent.name];
        if (fn) fn(intent.entity, intent.payload);
    }

    async _persistencePipe(intent) {
        if (!intent.autoSave || intent.isStopped) return;
        const backup = intent.entity.clone ? intent.entity.clone() : { ...intent.entity };
        try {
            await this.model.save(intent.entity);
            intent.committed = true;
        } catch (e) {
            if (intent.entity.restore) intent.entity.restore(backup);
            throw e;
        }
    }
}