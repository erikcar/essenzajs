import { Model, core } from "@essenza/core";

export function AppModel() { }

core.prototypeOf(Model, AppModel, {

    defaultOption: { apiUrl: core.context.config.serviceRoute },

    checkSession: () => {
        return this.ExecuteApi("session").then(result => {
            if (result === 'NACK')
                return { status: "NACK", value: result };
            else
                return { status: "ACK", value: result };

        }).catch(e => ({ status: "NACK", value: e }));
    },

    devSession: (dev) => {
        const data = Object.assign({ id: 0, itype: -1, email: "info@kosinformatica.it" }, dev);
        return this.ExecuteApi("dev_session", data).then(
            result => ({ status: "ACK", value: { token: result, profile: data } })
        ).
            catch(e => ({ status: "NACK", value: e }));
    },

    guestSession: (data) => {
        return Promise.resolve(() => ({ status: "ACK", value: data }));
    },

    emailConfirm: request => this.ExecuteApi("emailconfirm", request).then(r => this.context.emit("LOGIN", r)),
});