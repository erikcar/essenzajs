import { DataModel, core } from "@essenza/core";

export function AppModel() { 
    this.defaultOption = { apiUrl: "service/app/" };
}

core.prototypeOf(DataModel, AppModel, {

    //defaultOption: { apiUrl: core.context.config.serviceRoute },

    checkSession: function () {
        return this.ExecuteApi("session").then(result => {
            const value = result.data; 
            if (value === 'NACK')
                return { status: "NACK", value: value };
            else
                return { status: "ACK", value: value };

        }).catch(e => ({ status: "NACK", value: e }));
    },

    devSession: function (dev) {
        const data = Object.assign({ id: 0, irole: -1, email: "info@kosinformatica.it" }, dev);
        return this.ExecuteApi("dev_session", data).then(
            result => ({ status: "ACK", value: { token: result.data, profile: data } })
        ).
            catch(e => ({ status: "NACK", value: e }));
    },

    guestSession: function (data) {
        return Promise.resolve(() => ({ status: "ACK", value: data }));
    },

    emailConfirm: function (request) { this.ExecuteApi("emailconfirm", request).then(r => this.context.emit("LOGGED", r.data)) },
});