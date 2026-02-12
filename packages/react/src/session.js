/** @fileoverview packages/react/src\session.js */
import { core, Observable } from "@essenza/core";
import { AppModel } from "./appmodel";

/**
 * Session function.
 * @returns {void}
 */
export function Session() {
    this.profile;
    this.token;
    this.development;
    this.guest;
}

core.prototypeOf(Observable, Session, {
    // TODO: implementare a prescidere dal tipo di sessione antiforgerytoken --> vedere dettaglio x jwt/openApi antiforgerytoken csrf
    /**
 * load method.
 * @returns {any}
 */
    load: function () {
        const ctx = this.context;
        let request;
        const model = new AppModel();

        if (this.development)
            request = model.devSession(this.development);
        else if (this.guest)
            request = model.guestSession({ token: "*", profile: { itype: 0 } });
        else
            request = model.checkSession();

        return request.then(result => this.emit("SESSION_LOADED", result));
    },

    /**
 * start method.
 * @param {any} data
 * @returns {void}
 */
    start: function (data, alive) {
        if (this.token && this.token !== "*") {
            const channel = this.api.channel;
            channel.addHeader('Access-Control-Allow-Headers', '*');
            channel.addHeader('Access-Control-Allow-Origin', '*');
            channel.addHeader('Access-Control-Expose-Headers', 'Authorization');
            channel.addHeader('Authorization', 'Bearer ' + data.token);
            channel.alive = alive;
        }
    },

    refresh: function (data) {
        this.profile = data.profile;
        this.token = data.token;
    },

    /**
 * end method.
 * @returns {void}
 */
    end: function () {
        if (this.token && this.token !== "*") {
            const channel = this.api.channel;
            channel.removeHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin', 'Access-Control-Expose-Headers', 'Authorization');
            channel.alive = false;
        }

        //localStorage.removeItem("_session");

        //this.load(); //???
    },

    /**
 * logout method.
 * @returns {void}
 */
    logout() {
        //this.end();

        window.location.replace(window.location.origin);
    }

});

core.inject(Session, "IApi");


