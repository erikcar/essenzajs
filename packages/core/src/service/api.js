// --- packages/core/src/services/ApiService.js ---

import { Apix } from "../Apix";
import { fetchChannel } from "../channels/FetchChannel";

export class ApiService {
    /**
     * @param {Object} apixInstance - L'istanza della tua classe Apix legacy
     */
    constructor(client, channel) {
        this.client = client || new Apix(); // Contiene già this.client.channel
        this.client.channel = channel || new fetchChannel;
    }

    /** * Delega la gestione degli header direttamente al Channel di Apix
     * (Fedele a session.start() e session.end())
     */
    setAuthorization(token, alive) {
        const channel = this.client.channel;
        channel.alive = alive;

        if (token && token !== "*") {
            channel.addHeader('Access-Control-Allow-Headers', '*');
            channel.addHeader('Access-Control-Allow-Origin', '*');
            channel.addHeader('Access-Control-Expose-Headers', 'Authorization');
            channel.addHeader('Authorization', 'Bearer ' + token);
        } else {
            channel.removeHeader(
                'Access-Control-Allow-Headers',
                'Access-Control-Allow-Origin',
                'Access-Control-Expose-Headers',
                'Authorization'
            );
        }
    }

    enableRefresh(onRefreshCallback, onExpiredCallback) {
        this.client.useRefreshToken = true;
        this.client.onRefreshToken = onRefreshCallback;
        this.client.onRefreshTokenExpired = onExpiredCallback;
    }

    disableRefresh() {
        this.client.useRefreshToken = false;
        this.client.onRefreshToken = null;
        this.client.onRefreshTokenExpired = null;
    }

    /** * Sostituisce AppModel.checkSession()
     * Usa il tuo Apix per gestire code, retry e la chiamata di rete effettiva.
     */
    async checkSession() {
        try {
            // Usa il metodo call nativo di Apix.js
            const result = await this.client.call("session");
            const value = result.data;

            if (value === 'NACK') return { status: "NACK", value: value };
            return { status: "ACK", value: value };
        } catch (e) {
            return { status: "NACK", value: e };
        }
    }

    /** Sostituisce AppModel.devSession() */
    async devSession(dev) {
        const data = Object.assign({ id: 0, itype: -1, email: "info@kosinformatica.it" }, dev);
        try {
            const result = await this.client.call("dev_session", data);
            return { status: "ACK", value: { token: result.data, profile: data } };
        } catch (e) {
            return { status: "NACK", value: e };
        }
    }

    /** Sostituisce AppModel.guestSession() */
    guestSession(data) {
        return Promise.resolve({ status: "ACK", value: data });
    }
}