import { core, context } from "@essenza/core";
import { UrlInfo } from "./urlinfo";
import { Role } from "./role";
import { Session } from "./session";

export const appcontext = function () {
    context.call(this);
    //const instance = this;
    this.logged = false;
    this._navigator;
    this.session = new Session();  //new session from webground???
    this.url = new UrlInfo();
    this.role = new Role();
    this.navdata = null;
}

core.prototypeOf(context, appcontext, {
    config: { serviceRoute: "api/", authRoute: "login" }, //potrei mettere authComponent, anche in doppio mode view/popup

    /** Build context before any load, init and render*/

    build: function (schema) {
        if (!this.built) {
            this.built = true;
            this.core.build(this);
            //this.configureService(service);
        }
        return this;
    },

    /** Initialize context after AppRoot and childen are rendered*/

    initialize: function () {
        if (!this.initialized) {
            this.initialized = true;
            return this.url.init();
        }
    },

    set navigator(value){
        if(value !== this._navigator){
            this._navigator = value;
            this.configureService({ INavigator: value })
        }
    },

    navigate: function(path, data){
        this.navdata = data;
        this._navigator(path, data);
    },

    loaded: function () {
        
    },

    intent: {
        LOGIN: function ( { data }) {
            this.role.current = data.profile.role;
            this.session.start(data);
        },

        LOGOUT: function ({ data }) {
            this.session.end();
            this.navigate("/");
        },
    }
});

