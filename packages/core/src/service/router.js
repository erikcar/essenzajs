// --- packages/core/src/services/RouterService.js ---
export class RouterService {
    constructor() {
        // Stato iniziale
        this.currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
        this.currentData = typeof window !== 'undefined' ? window.history.state || {} : {};

        this.listeners = new Set();

        // Ascoltiamo i tasti "Back" e "Forward" del browser
        if (typeof window !== 'undefined') {
            window.addEventListener('popstate', (e) => {
                this.currentPath = window.location.pathname;
                this.currentData = e.state || {};
                this.notify();
            });
        }
    }

    /**
     * Sostituisce la navigazione legacy. 
     * Accetta un path e un oggetto dati invisibile da trasportare.
     */
    navigate(path, data = {}) {
        if (typeof window === 'undefined') return;

        // Se è lo stesso path, non facciamo nulla
        if (this.currentPath === path) return;

        // Pushiamo lo stato nella History nativa del browser
        window.history.pushState(data, '', path);
        this.currentPath = path;
        this.currentData = data;

        // Avvisiamo React (e il resto dell'app) che l'URL è cambiato
        this.notify();
    }

    // --- Sistema di Notifica Reattivo ---
    subscribe(callback) {
        this.listeners.add(callback);
        // Ritorna la funzione di unsubscribe per gli useEffect
        return () => this.listeners.delete(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.currentPath, this.currentData));
    }

    /** Fedele a urlinfo.init() e alla ricerca del parametro *req* */
    parseStartupIntent() {
        if (typeof window === 'undefined') return null;
        const urlParams = new URLSearchParams(window.location.search);

        let qp = { params: {} };
        let hasRequest = false;
        let isLoginRequest = false;

        for (const [key, value] of urlParams.entries()) {
            qp.params[key] = value;
            if (value === '*req*') {
                qp.request = key.toUpperCase();
                if (qp.request === "LOGIN") {
                    isLoginRequest = true;
                } else {
                    hasRequest = true;
                }
            }
        }

        // Recupero gli intenti esatti di FAREQ / EMREQ dal tuo urlinfo.intent
        if (!qp.request) {
            if (urlParams.has('emtoken')) {
                qp.request = 'EMREQ';
                qp.token = urlParams.get('emtoken');
                qp.id = urlParams.get('emid');
                hasRequest = true;
            }
            else if (urlParams.has('token') || urlParams.has('fatoken')) {
                qp.request = 'FAREQ';
                qp.token = urlParams.has('token') ? urlParams.get('token') : urlParams.get('fatoken');
                qp.email = urlParams.has('email') ? urlParams.get('email') : urlParams.get('fam');
                hasRequest = true;
            }
        }

        if (!qp.request && !isLoginRequest) return null;

        return {
            intent: qp.request,
            payload: qp,
            hasRequest: hasRequest, // Importante: determina se bypassare loadSession()
            isLoginRequest: isLoginRequest
        };
    }
}

/**
    onInit() {
        // Mi iscrivo ai futuri cambi di rotta
        this.unsubRouter = this.app.router.subscribe((path, data) => {
            if (data.idFattura !== this.idCorrente) {
                this.loadFattura(data.idFattura);
            }
        });
    }

    onDestroy() {
        // Pulizia quando si esce dalla pagina
        if (this.unsubRouter) this.unsubRouter();
    }
 */