import { core } from "@essenza/core";
import { AppModel } from "./appmodel";

export function Session() {
    this.profile;
    this.token;
    this.development;
    this.guest;
}

Session.prototype = {
    // TODO: implementare a prescidere dal tipo di sessione antiforgerytoken --> vedere dettaglio x jwt/openApi antiforgerytoken csrf
    load: () => {
        const ctx = this.context;
        let request;

        if (this.development)
            request = ctx.request(AppModel, m => m.devSession(dev));
        else if (this.guest)
            request = ctx.request(AppModel, m => m.guestSession({ token: "*", profile: { role: 0 } }));
        else
            request = ctx.request(AppModel, m => m.checkSession());

        return request.then(result => this.emit("SESSION_LOADED", result));
    },

    start: function (data) {
        this.profile = data.profile;
        this.token = data.token;

        if (this.token && this.token !== "*") {
            const channel = this.api.channel;
            channel.addHeader('Access-Control-Allow-Headers', '*');
            channel.addHeader('Access-Control-Allow-Origin', '*');
            channel.addHeader('Access-Control-Expose-Headers', 'Authorization');
            channel.addHeader('Authorization', 'Bearer ' + data.token);
        }
    },

    end: () => {
        if (this.token && this.token !== "*") {
            this.api.channel.removeHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin', 'Access-Control-Expose-Headers', 'Authorization');
        }

        this.load(); //???
    }
}

core.inject("IApi, IContext");