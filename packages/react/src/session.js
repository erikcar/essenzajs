import { core, Observable } from "@essenza/core";
import { AppModel } from "./appmodel";

export function Session() {
    this.profile;
    this.token;
    this.development;
    this.guest;
}

core.prototypeOf(Observable, Session, {
    // TODO: implementare a prescidere dal tipo di sessione antiforgerytoken --> vedere dettaglio x jwt/openApi antiforgerytoken csrf
    load: function(){
        const ctx = this.context;
        let request;
        const model = new AppModel();

        if (this.development)
            request = model.devSession(this.development);
        else if (this.guest)
            request = model.guestSession({ token: "*", profile: { irole: 0 } });
        else
            request = model.checkSession();

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

    end: function() {
        if (this.token && this.token !== "*") {
            this.api.channel.removeHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin', 'Access-Control-Expose-Headers', 'Authorization');
        }

        this.load(); //???
    }
});

core.inject(Session, "IApi");