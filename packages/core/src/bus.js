// --- core/Bus.js ---
import { Pipeline } from './pipeline';

export class Bus extends Pipeline {
    constructor(id, parentBus = null, prefixEvents = false, target = null) {
        super();
        this.id = id
        this.parentBus = parentBus;
        this.prefixEvents = prefixEvents;
        this.target = target;
        this._locks = new Set();
    }

    emit(eventName, payload = {}, scopeId = null) {
        const currentScope = scopeId || this.id;
        super.emit(eventName, payload, currentScope);
        if (this.parentBus) {
            const fwdName = this.prefixEvents ? `${this.id}:${eventName}` : eventName;
            this.parentBus.emit(fwdName, payload, currentScope);
        }
    }

    async runPipeline(actionName, contextData = {}, ephemeralPipes = []) {
        // Trickle-down: Eseguo prima i middleware globali del genitore
        if (this.parentBus) {
            const fwdName = this.prefixEvents ? `${this.id}:${actionName}` : actionName;
            await this.parentBus.runPipeline(fwdName, contextData);
        }
        if (contextData.isStopped) return contextData;

        return await super.runPipeline(actionName, contextData, ephemeralPipes);
    }

    createFlow() { return new Flow(this); }

    // Scorciatoie
    pipe(handler) { return this.createFlow().pipe(handler); }
    guard() { return this.createFlow().guard(); }
    run(contextData = {}) { return this.createFlow().run(contextData); }
    dispatch(actionName, payload = {}) { return this.createFlow().dispatch(actionName, payload); }
}

export class Flow {
    constructor(bus) {
        this.bus = bus;
        this.pipes = [];
        // IL REGISTRO LOCALE DEGLI EVENTI DEL FLOW
        this.localListeners = {};
    }

    pipe(handler) {
        this.pipes.push(handler);
        return this;
    }

    guard() {
        this.pipes.push(async (context, next) => {
            const lockKey = context.name;
            if (this.bus._locks?.has(lockKey)) {
                context.isStopped = true;
                return; // Blocco silenzioso (evita doppi click)
            }
            if (!this.bus._locks) this.bus._locks = new Set();
            this.bus._locks.add(lockKey);

            try { await next(); }
            finally { this.bus._locks.delete(lockKey); }
        });
        return this;
    }

    // 1. DEBOUNCE (Limita le esecuzioni ravvicinate)
    debounce(delay = 300) {
        this.pipes.push(async (context, next) => {
            const key = context.name;

            // Se c'è già un timer in corso per questo intento, lo annullo
            if (this.bus._debounces.has(key)) {
                const prev = this.bus._debounces.get(key);
                clearTimeout(prev.timeout);
                prev.resolveStopped(); // Chiudo la Promise precedente bloccandola
            }

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(async () => {
                    this.bus._debounces.delete(key);
                    try {
                        await next(); // Eseguo il resto della cipolla
                        resolve();
                    } catch (err) { reject(err); }
                }, delay);

                // Salvo il timer e una funzione per stopparlo silenziosamente
                this.bus._debounces.set(key, {
                    timeout,
                    resolveStopped: () => {
                        context.isStopped = true;
                        resolve();
                    }
                });
            });
        });
        return this;
    }

    // 2. CONFIRM (Disaccoppiato dalla UI)
    confirm(message, options = {}) {
        this.pipes.push(async (context, next) => {
            const ui = this.bus.services.ui;

            if (!ui || typeof ui.confirm !== 'function') {
                throw new Error("UI Service con metodo 'confirm' non configurato nel Bus.");
            }

            // Invoco il servizio esterno (che potrebbe aprire un modale React o chiamare window.confirm)
            const isConfirmed = await ui.confirm(message, options);

            if (!isConfirmed) {
                context.isStopped = true; // L'utente ha annullato
                return; // Non chiamo next(), il flusso muore qui.
            }

            await next();
        });
        return this;
    }

    /**
 * Utility per validare basandosi sulla gerarchia dell'emitter.
 * @param {String|Array|Object} path - Nome del form, path, o array di nomi. Se è un Object, è considerato lo schema.
 * @param {Object} schemas - Mappa degli schemi live.
 */
    validateOwn(path, schemas = {}) {
        // Se il primo parametro è un oggetto e non abbiamo un secondo parametro,
        // l'utente sta passando solo lo schema per tutti i form dell'emitter.
        let actualPath = path;
        let actualSchemas = schemas;

        if (path && typeof path === 'object' && !Array.isArray(path) && Object.keys(schemas).length === 0) {
            actualPath = null; // Cerca tutti i form
            actualSchemas = path;
        }

        // Aggiungiamo un pipe che risolve i validator prima di chiamare la validazione
        this.pipes.push(async (context, next) => {
            const emitter = context.emitter;
            if (!emitter || typeof emitter.findForm !== 'function') {
                throw new Error("validateOn richiede un emitter che implementi findForm()");
            }

            // Risoluzione dei validator tramite il Presenter
            const validators = emitter.findForm(actualPath).all();

            // Chiamiamo internamente la logica di validazione
            // (Possiamo astrarre la logica di validazione in una funzione privata per non duplicare codice)
            return this.validate(validators, actualSchemas).pipes.pop()(context, next);
        });
        return this;
    }

    /**
     * Validazione Pura.
     * @param {Array|Object} validators - Istanza singola o Array di istanze (che espongono .validate())
     * @param {Object} schemas - Mappa { nomeForm: schema } per schemi live
     */
    validate(validators, schemas = {}) {
        this.pipes.push(async (context, next) => {
            const instances = Array.isArray(validators) ? validators : [validators];
            const validation = { isValid: true, result: [], data: {} };

            for (const inst of instances) {
                if (inst && typeof inst.validate === 'function') {
                    // Se abbiamo uno schema live per questo specifico validator (usando il suo .name)
                    const liveSchema = schemas[inst.name];
                    if (liveSchema && inst.rules?.use) {
                        inst.rules.use(liveSchema);
                    }

                    const res = await inst.validate(true);

                    validation.isValid = validation.isValid && res.isValid;
                    validation.result.push(res);
                    if (res.isValid) validation.data = { ...validation.data, ...res.data };
                }
            }

            // Formattazione retrocompatibile con ViewModel.js
            const legacyOut = instances.length === 1 ? validation.result[0] : validation;
            context.validation = legacyOut;

            if (!validation.isValid) {
                context.isStopped = true;
                const errors = validation.result.filter(r => !r.isValid).map(r => r.reason);
                this.bus.services.ui?.notifyError?.(errors);
                this.bus.emit('VALIDATION_ERROR', { errors, validation: legacyOut });
                return;
            }

            context.payload = { ...context.payload, ...validation.data };
            await next();
        });
        return this;
    }

    async run(contextData = {}) {
        const name = contextData.name || 'ANONYMOUS_FLOW';
        contextData.flow = this; // Riferimento al flow corrente per i middleware
        return this.bus.runPipeline(name, contextData, this.pipes);
    }

    async dispatch(actionName, payload = {}) {
        return this.run({ name: actionName, payload });
    }

    /**
     * Ascolta un evento limitato ESCLUSIVAMENTE a questa esecuzione del Flow.
     */
    on(eventName, handler) {
        if (!this.localListeners[eventName]) {
            this.localListeners[eventName] = new Set();
        }
        this.localListeners[eventName].add(handler);
        return this; // Permette la concatenazione (fluent API)
    }

    /**
     * NUOVO METODO: Ascolta un evento del Flow una sola volta e poi si auto-distrugge.
     */
    once(eventName, handler) {
        // Creiamo il wrapper
        const wrapper = (payload, context) => {
            // 1. Auto-distruzione: rimuovo il wrapper dal Set locale
            if (this.localListeners[eventName]) {
                this.localListeners[eventName].delete(wrapper);
            }
            
            // 2. Eseguo l'handler originale
            handler(payload, context);
        };

        // Uso il metodo 'on' del Flow stesso per registrare il wrapper
        // Questo garantisce che venga aggiunto correttamente e mi restituisca 'this'
        return this.on(eventName, wrapper);
    }

    /**
     * Emette un evento che viene prima gestito localmente dal Flow,
     * e poi propagato (bubble) al Bus globale.
     */
    emit(eventName, payload = {}) {
        // 1. Esecuzione locale (solo i listener attaccati a questo flow con .on)
        if (this.localListeners[eventName]) {
            this.localListeners[eventName].forEach(cb => cb(payload, this));
        }

        // 2. Propagazione sul Bus globale
        this.bus.emit(eventName, payload, this.bus.target?.id);
        
        return this; // Permette il chaining
    }
}



// L'istanza Singleton radice di tutta l'app
export const AppBus = new Bus('APP');

