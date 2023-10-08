import { Model, core } from "@essenza/core";

export function AppModel() { }

core.prototypeOf(Model, AppModel, {

    defaultOption: { apiUrl: core.context.config.serviceRoute },

    checkSession: () => {
        return this.ExecuteApi("session").then(r => {
            if (r === 'NACK')
                throw new Error(r);
            else
                this.context.emit("LOGIN", r);
        }).catch((e) => this.context.emit("AUTH", e));
    },

    devSession: (dev) => {
        const data = Object.assign({id: 0, itype: -1, email: "info@kosinformatica.it"}, dev);
        return this.ExecuteApi("dev_session", data).then(r => {
            this.context.emit("LOGIN", {token: r, profile: data});
        }).catch((e) => this.context.emit("AUTH", e));
    },
});