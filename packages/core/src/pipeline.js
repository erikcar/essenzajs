export class Pipeline {
    constructor() {
        this.listeners = new Map();
        this.anyListeners = new Set();
        this.globalPipes = [];
    }

    on(eventName, handler, scopeId = null) {
        if (!this.listeners.has(eventName)) this.listeners.set(eventName, []);
        const sub = { handler, scopeId };
        this.listeners.get(eventName).push(sub);
        return () => {
            const arr = this.listeners.get(eventName);
            if (arr) this.listeners.set(eventName, arr.filter(s => s !== sub));
        };
    }

    /**
     * NUOVO METODO: Aggiunge un listener "One-Shot".
     * Si auto-distrugge istantaneamente alla prima esecuzione.
     */
    once(eventName, handler, scopeId = null) {
        // Creiamo il wrapper che intercetta l'evento
        const wrapper = (eventData) => {
            // 1. Auto-distruzione tramite la funzione di pulizia!
            unsubscribe();
            
            // 2. Esecuzione del codice originale
            handler(eventData);
        };

        // Registriamo il wrapper invece dell'handler originale.
        // Salviamo la funzione di unsubscribe per poterla chiamare da dentro il wrapper.
        const unsubscribe = this.on(eventName, wrapper, scopeId);

        // Restituiamo l'unsubscribe casomai lo sviluppatore volesse 
        // annullare l'evento PRIMA ancora che scatti la prima volta.
        return unsubscribe;
    }

    onAny(handler) {
        this.anyListeners.add(handler);
        return () => this.anyListeners.delete(handler);
    }

    emit(eventName, payload = {}, originScopeId = null) {
        const eventData = { eventName, payload, originScopeId };
        const subs = this.listeners.get(eventName) || [];
        subs.forEach(sub => { if (!sub.scopeId || sub.scopeId === originScopeId) sub.handler(eventData); });
        this.anyListeners.forEach(h => h(eventData));
    }

    async runPipeline(actionName, contextData = {}, ephemeralPipes = []) {
        const cascade = [...this.globalPipes, ...ephemeralPipes];
        
        const context = {
            name: actionName,
            isStopped: false,
            _deferredEvents: [],
            emit: (name, data) => this.emit(name, data),
            defer: (name, data) => context._deferredEvents.push({ name, data }),
            ...contextData
        };

        let index = -1;
        const next = async (i) => {
            if (i <= index) throw new Error('next() chiamato multiplamente');
            index = i;
            if (i === cascade.length || context.isStopped) return; 
            await cascade[i](context, () => next(i + 1));
        };

        try {
            await next(0);

            if (!context.isStopped) {
                context._deferredEvents.forEach(evt => this.emit(evt.name, evt.data));
            }
            return context;
        } catch (error) {
            this.emit(`${actionName}_ERROR`, { error: error.message, ...contextData });
            throw error;
        }
    }
}

export const SavePipe = () => async (context, executeCommitSlots) => {
    const backup = context.entity.clone ? context.entity.clone() : { ...context.entity };
    try {
        await context.domain.model.save(context.entity);
        
        if (executeCommitSlots) await executeCommitSlots();

        if (context.entity.commit) context.entity.commit(); // Pulisce le mutazioni
    } catch (error) {
        if (context.entity.restore) context.entity.restore(backup);
        else Object.assign(context.entity, backup);
        throw error;
    }
};

export const ServicePipe = (serviceName, methodName, preparedPayload) => async (context, next) => {
    const service = context.domain.services?.[serviceName];
    if (!service) throw new Error(`Servizio '${serviceName}' non trovato.`);
    
    context.serviceResult = await service[methodName](preparedPayload);
    await next();
};