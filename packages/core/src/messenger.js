/** @fileoverview packages/core/src\messenger.js */
/**
 * Messenger function.
 * @param {any} uid
 * @param {any} context
 * @returns {void}
 */
export function Messenger(uid, context) {
    this.socket = null;
    this.supportsWebSockets = 'WebSocket' in window || 'MozWebSocket' in window;
    this.attempts = 0;
    this.listening = false;
    this.relativeUrl = null;
    this.recovering = false;
    this.timeout = null;
    this.context = context || null; // Contexto in cui il Messenger opera
    this.uid = uid || null; // Unique identifier for the Messenger instance
}

Messenger.prototype = {

        /**
     * start method.
     * @param {any} relativeUrl
     * @returns {void}
     */
        start(relativeUrl) {
        this.relativeUrl = relativeUrl;
        if (!this.supportsWebSockets) {
            //In futuro usare polling invece di WebSocket se non supportato
            console.warn("WebSocket not supported in this browser.");
        }
        else if (!this.listening) {
            // Se il socket non è già in ascolto, connettiti
            this.listening = true;
            this.connect(relativeUrl);
        }
    },

        /**
     * stop method.
     * @returns {void}
     */
        stop: function () {
        this.resetRecovery(); // Reset recovery state
        this.listening = false;
        // Se il socket è in ascolto, chiudilo
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            this.socket.onmessage = null; // Rimuovi l'handler onmessage per evitare loop infiniti
            this.socket.onopen = null; // Rimuovi l'handler onopen per evitare loop infiniti
            this.socket.close();
            console.log("WebSocket connection stopped.");
        }
    },

        /**
     * connect method.
     * @param {any} relativeUrl
     * @returns {void}
     */
        connect(relativeUrl) {
        relativeUrl = relativeUrl || this.relativeUrl;
        const uid = this.uid || this.context?.uid || null;

        if (uid) {
            relativeUrl += "?cuid=" + uid;
        }

        if (!relativeUrl) {
            console.error("No valid URL provided for WebSocket connection.");
            return;
        }

        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            console.warn("WebSocket is already connected or connecting.");
            return;
        }

        this.socket = new WebSocket(relativeUrl); // Cambia l'URL in base al tuo server WebSocket

                /**
         * onopen function.
         * @returns {void}
         */
                this.socket.onopen = () => {
            this.resetRecovery(); // Reset recovery state on successful connection
            console.log("WebSocket connection established.");
        };

                /**
         * onmessage function.
         * @param {any} event
         * @returns {void}
         */
                this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("Message received:", message);
            if (this.context) {
                //this.context.emit("MESSAGE_RECEIVED", message); // Emit an event in the context
                this.context.core.source.forEach((source) => {
                    if (source && source.etype === message.etype) {
                        source.emit("MESSAGE_RECEIVED", message); // Call a method on the source if it exists
                    }
                });
            }
            // Gestisci il messaggio ricevuto
        };

                /**
         * onclose function.
         * @returns {void}
         */
                this.socket.onclose = () => {
            //Procedura reconnect se necessario, ovvero se non è stato chiuso manualmente
            if (this.listening) {
                console.warn("WebSocket connection closed unexpectedly. Attempting to reconnect...");
                this.reconnect(); // Riprova a connettersi
            } else {
                this.socket = null;
                console.log("WebSocket connection closed.");
            }
        };

                /**
         * onerror function.
         * @param {any} error
         * @returns {void}
         */
                this.socket.onerror = (error) => {
            // Gestisci gli errori della connessione WebSocket
            console.error("WebSocket error:", error);
            // Se la connessione è ancora attiva, non fare nulla
            if (this.listening) {
                this.reconnect(); // Riprova a connettersi
            }
            else if(this.socket &&  this.socket.readyState !== WebSocket.CLOSED) {
                this.socket.close(); // Chiudi il socket se non è in ascolto
            }
        };

    },

        /**
     * reconnect method.
     * @returns {void}
     */
        reconnect() {
        if (this.listening && !this.recovering && (!this.socket || (this.socket.readyState !== WebSocket.OPEN && this.socket.readyState !== WebSocket.CONNECTING))) {
            this.recovering = true; // Imposta lo stato di recovering per evitare loop infiniti
            this.attempts++;
            console.warn("WebSocket connection closed unexpectedly. Attempting to reconnect...");
            this.timeout = setTimeout(() => {
                this.connect(); // Riprova a connettersi
            }, 5000); // Riprova dopo 5 secondi
        }
    },

        /**
     * resetRecovery method.
     * @returns {void}
     */
        resetRecovery() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.attempts = 0; // Reset degli attempts
        this.recovering = false; // Reset recovering state
    },
};


