// --- core/Scope.js ---
import { Bus } from './bus';
import { fetchChannel } from './channels/FetchChannel';
import { core } from './core';
import { $Data } from './data';
import { Scope } from './scope';
import { ApiService } from './service/api';
import { AuthService } from './service/auth';
import { RoleService } from './service/role';
import { RouterService } from './service/router';

export class EssenzaApp extends Scope {
    constructor(config = {}) {
        super('ROOT_APP', null);

        this.config = config;
        this.services = {};

        const channel = config.channel || new fetchChannel();

        if (config.baseUrl) channel.setBaseUrl(config.baseUrl);

        const custom = config.services || {};

        // 1. Inizializzazione flessibile tramite Helper
        // Se è una funzione (Factory), le passiamo l'App. Altrimenti prendiamo l'istanza.
        const resolveService = (srv) => typeof srv === 'function' ? srv(this) : srv;

        this.services.api = custom.api ? resolveService(custom.api) : new ApiService(config.client, channel);
        this.services.role = custom.role ? resolveService(custom.role) : new RoleService();
        this.services.router = custom.router ? resolveService(custom.router) : new RouterService();

        this.services.auth = custom.auth ? resolveService(custom.auth) : new AuthService(this.services.api, this.services.role, {
            development: config.dev,
            guest: config.guest,
            alive: config.alive
        }, this);

        // 2. RECUPERO DI TUTTI GLI ALTRI SERVIZI CUSTOM (es. logger, websocket, etc)
        for (const key in custom) {
            if (!['api', 'role', 'router', 'auth'].includes(key)) {
                this.services[key] = resolveService(custom[key]);
            }
        }

        // 3. INJECTION AUTOMATICA DI 'APP' IN TUTTI I SERVIZI
        // Ora ogni servizio, di default o custom, avrà accesso a this.app (e quindi al bus)
        for (const key in this.services) {
            const srv = this.services[key];
            if (srv && typeof srv === 'object' && !srv.app) {
                srv.app = this;
            }
        }

        // Retrocompatibilità Legacy
        if (config.typedef) {
            core.typeDef = config.typedef;
            $Data.buildSchema(config.typedef);
        }

        this.schemas = config.schemas || {};

        // Prepariamo la pipeline di avvio
        this.initFlow = this.bus.createFlow();
    }

    // --- SCORCIATOIE ---
    get auth() { return this.services.auth; }
    get role() { return this.services.role; }
    get router() { return this.services.router; }
    get api() { return this.services.api; }

    navigate(path, options) { return this.router.navigate(path, options); }

    onStart(handler) {
        this.bus.on('APP_START', handler);
        return this;
    }

    onReady(handler) {
        this.bus.on('APP_READY', handler);
        return this;
    }

    onLoaded(handler) {
        this.bus.on('APP_LOADED', handler);
        return this;
    }

    async boot() {
        this.bus.emit('APP_START', this);

        if (this.config.alive && typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.cacheAllStates());
        }

        // 1. VARIABILE LOCALE (nascosta al resto dell'applicazione)
        let pendingAuthEvent = null;

        // 2. CLOSURE SUL LISTENER
        this.bus.once('APP_LOADED',() => {
            if (pendingAuthEvent) {
                console.log(`[Essenza] UI Caricata. Rilascio l'evento differito: ${pendingAuthEvent.event}`);
                this.bus.emit(pendingAuthEvent.event, pendingAuthEvent.data);
                
                // Aiutiamo il Garbage Collector
                pendingAuthEvent = null; 
            }
        });

        // 3. CLOSURE SUL MIDDLEWARE
        this.bootFlow.pipe(async (ctx, next) => {
            const restored = this.services.auth.restoreFromStorage?.();
            
            if (restored) {
                pendingAuthEvent = { 
                    event: 'LOGGED', 
                    data: this.services.auth.currentUser 
                };
            } else {
                pendingAuthEvent = await this.services.auth.loadSession();
            }
            
            await next();
        });

        await this.bootFlow.run({ name: 'ESSENZA_BOOT' });
        this.bus.emit('APP_READY', this);
    }

    /**
     * Naviga l'albero del Grafo (Scope/Presenter) e salva gli stati locali.
     * Riproduce il vecchio meccanismo di caching.
     */
    cacheAllStates() {
        const traverseAndCache = (scopeNode) => {
            // Se lo scope/presenter ha un metodo "saveState", lo invoca
            if (typeof scopeNode.saveState === 'function') {
                scopeNode.saveState();
            }
            
            // Se ha uno state manager interno, lo interroga
            if (scopeNode.state && typeof scopeNode.state.cache === 'function') {
                scopeNode.state.cache();
            }

            // Ricorsione sui figli
            if (scopeNode.children) {
                scopeNode.children.forEach(child => traverseAndCache(child));
            }
        };

        console.log("[Essenza] Caching di tutti gli stati dell'albero...");
        traverseAndCache(this);
    }
}


/*
import { createRoot } from 'react-dom/client';
import { App } from '@essenza/core';
import { AppTree } from './AppTree';

// 1. Creo il motore logico
const app = new App({
    alive: true,
    baseUrl: "https://api.miosito.com",
    services: {
        notification: (app) => new CustomNotificationService() // La factory function!
    }
});

// 2. Aggiungo middleware personalizzati pre-boot se voglio
app.onStartup.pipe(async (ctx, next) => {
    console.log("Controllo permessi prima di disegnare l'interfaccia...");
    await next();
});

// 3. Eseguo il Boot e disegno React solo alla fine
const root = createRoot(document.getElementById('root'));

app.boot(() => {
    // Questa callback viene invocata solo quando il Bus ha finito il flow ESSENZA_BOOT
    // Sappiamo per certo che l'auth è risolta e i servizi sono pronti.
    root.render(<AppTree app={app} />);
});

*/
