// --- packages/core/src/services/AuthService.js ---
export class AuthService {
    constructor(apiService, roleService, config, app = null) {
        this.api = apiService;
        this.roleManager = roleService;
        this.config = config; // { development, guest }
        this.currentUser = null;
        this.app = app;
    }

    /**
     * Utility per uniformare le risposte eterogenee del backend.
     * Garantisce che data e data.profile siano sempre oggetti JS.
     */
    _parseData(rawInput) {
        if (!rawInput) return {};
        
        // 1. Se il backend ha restituito una stringa JSON, la parsi
        let data = typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput;
        
        // 2. Se il profile dentro i dati è a sua volta una stringa (molto comune), lo parsi
        if (data.profile && typeof data.profile === 'string') {
            data.profile = JSON.parse(data.profile);
        }
        
        return data;
    }

    /** * Ricalca ESATTAMENTE session.load() e appvm.SESSION_LOADED 
     * Ritorna l'oggetto { event, data } per pilotare il bus
     */
    async loadSession() {
        let request;

        // Fedele a session.load()
        if (this.config.development) {
            request = this.api.devSession(this.config.development);
        } else if (this.config.guest) {
            request = this.api.guestSession({ token: "*", profile: { itype: 0 } });
        } else {
            request = this.api.checkSession();
        }

        const result = await request;

        // Fedele a appvm.SESSION_LOADED
        if (result.status === "ACK") {
            this.start(result.value, this.config.alive);
            return { event: 'LOGGED', data: result.value };
        } else {
            return { event: 'AUTH', data: result.value };
        }
    }

    start(rawData, alive) {
        // Usa la sanificazione!
        const safeData = this._parseData(rawData);
        
        this.currentUser = safeData;
        this.roleManager.setRole(safeData.profile?.itype);
        
        this.api.setAuthorization(safeData.token, alive);

        if (alive) {
            localStorage.setItem('_session', JSON.stringify(safeData));
            this.api.enableRefresh(
                (newData) => this.handleTokenRefresh(newData),
                () => this.logout() 
            );
        }
    }

    handleTokenRefresh(rawData) {
        // Sanifica anche i dati in arrivo dal refresh!
        const safeData = this._parseData(rawData);
        
        this.currentUser = { ...this.currentUser, ...safeData };
        localStorage.setItem('_session', JSON.stringify(this.currentUser));
        
        this.api.setAuthorization(this.currentUser.token, true);

        if (this.app) {
            this.app.bus.emit('SESSION_REFRESHED', this.currentUser);
        }
    }

    /** * Fedele a context.LOGOUT 
     */
    logout() {
        this.currentUser = null;
        this.roleManager.setRole(null);
        
        // Rimuove gli header
        this.api.setAuthorization(null, false);

        if (this.config.alive) {
            localStorage.removeItem('_session');
            this.api.disableRefresh();
        }

        // Notifica globale e Redirect
        if (this.app) {
            this.app.bus.emit('LOGOUT');
            // Usiamo il nuovo RouterService!
            this.app.router.navigate('/'); 
        } else {
            window.location.replace(window.location.origin);
        }
    }
    
    /**
     * Utilità per il boot iniziale per ricaricare dal local storage
     */
    restoreFromStorage() {
        if (!this.config.alive) return false;
        
        const stored = localStorage.getItem('_session');
        if (stored) {
            const data = JSON.parse(stored);
            this.start(data, true);
            return true;
        }
        return false;
    }
}