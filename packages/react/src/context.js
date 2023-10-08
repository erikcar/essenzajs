import { core, context, TaskAwait } from "@essenza/core";
import { UrlInfo } from "./urlinfo";
import { Role } from "./role";
import { Session } from "./session";

export const appcontext = function () {
    context.call(this);
    const instance = this;
    this.session = new Session(); //{ role: -1 }; //GUEST //new session from webground???
    this.logged = false;
    this.initialized = false;
    this.built = false;
    this.url = new UrlInfo();
    this.role = new Role();
    this.loading = new TaskAwait(() => instance.emit("READY"));
    this.navigate;
}

core.prototypeOf(context, appcontext, {
    config: { serviceRoute: "api/", authRoute: "login" }, //potrei mettere authComponent, anche in doppio mode view/popup

    /** Build context before any load, init and render*/

    build: function (schema, service) {
        if (!this.built) {
            this.built = true;
            this.core.build(this);
            this.configureService(service);
            //this.emit("APP_BUILD");
        }
    },

    /** Initialize context after AppRoot and childen are rendered*/

    initialize: function (qparams) {
        if (!this.initialized) {
            this.initialized = true;
            this.url.init(qparams);
            this.loading.wait(this.session.load());
            //this.emit("APP_INIT");
        }
    },

    control: {
        LOGIN: function ({ data }) {
            this.role.current = data.profile.role;
            this.session.start(data);
        },

        LOGOUT: function ({ data }) {
            this.session.end();
            this.navigate("/");
        },

        AUTH: function () {
            this.navigate(this.config.authRoute);
        }
    }
});

