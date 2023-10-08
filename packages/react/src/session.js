import { core } from "@essenza/core";
import { AppModel } from "./appmodel";

export function Session(){
    this.profile;
    this.token;
    this.development;
    this.guest;
}

Session.prototype = {

    // TODO: implementare a prescidere dal tipo di sessione antiforgerytoken --> vedere dettaglio x jwt/openApi antiforgerytoken csrf

    load: () => {
        const ctx = this.context;

        if (this.development) {
            return ctx.request(AppModel, m => m.devSession(dev));
        }
        else if (this.guest)
            ctx.emit("LOGIN", { token: "*", profile: { role: 0 } });
        else
            return ctx.request(AppModel, m => m.checkSession());
    },

    start: function(data){
        this.profile = data.profile;
        this.token = data.token;

        if(this.token && this.token !== "*"){
            const channel = this.api.channel;
            channel.addHeader('Access-Control-Allow-Headers','*');
            channel.addHeader('Access-Control-Allow-Origin','*');
            channel.addHeader('Access-Control-Expose-Headers','Authorization');
            channel.addHeader('Authorization','Bearer ' + data.token);
        }
    },

    end: () => {
        if(this.token && this.token !== "*"){
            this.api.channel.removeHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin', 'Access-Control-Expose-Headers', 'Authorization');
        }

        this.update();
    }
}

core.inject("IApi, IContext");