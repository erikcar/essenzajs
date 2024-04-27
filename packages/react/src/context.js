import { core, context, $Type } from "@essenza/core";
import { UrlInfo } from "./urlinfo";
import { Role } from "./role";
import { Session } from "./session";
import { Modal } from "antd";

export const appcontext = function () {
    context.call(this);
    //const instance = this;
    this.logged = false;
    this._navigator = null;
    this.session = new Session();  //new session from webground???
    this.url = new UrlInfo();
    this.role = new Role();
    this.navdata = null;
}

core.prototypeOf(context, appcontext, {
    config: { serviceRoute: "api/", authRoute: "login" }, //potrei mettere authComponent, anche in doppio mode view/popup

    /** Build context before any load, init and render*/

    build: function (vm) {
        if (!this.built) {
            this.built = true;
            //this.core.build(this);
            this.configureService({ imodal: Modal });
        }
    },

    /** Initialize context after AppRoot and childen are rendered*/

    openModal(info){
        Modal[info.kind || "info"](info);
    },

    openError(info){
        Modal.error(info);
    },

    openSuccess(info){
        Modal.success(info);
    },

    navigate: function (path, data) {
        this.navdata = data;
        this._navigator(path, data);
    },

    loaded: function () {

    },

    intent: {
        LOGGED: function ({ data }) {
            this.logged = true;

            if ($Type.isString(data.profile))
                data.profile = JSON.parse(data.profile);

            this.role.current = data.profile.irole;
            this.session.start(data);
        },

        LOGOUT: function ({ data }) {
            this.session.end();
            this.navigate("/");
        },
    }
});

Object.defineProperty(appcontext.prototype, "navigator", {
    set: function (value) {
        if (value !== this._navigator) {
            this._navigator = value;
            this.configureService({ INavigator: value })
        }
    }
});

