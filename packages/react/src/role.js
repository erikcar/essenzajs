import { core, Observable, $String } from "@essenza/core";
import { UserModel } from "./model/usermodel";

export function Role() {
    this.base();
    this.raw = null;
    this.roles = null;
    this.routes = null;
    this.$current = 0;
}

core.prototypeOf(Observable, Role, {

    parse: (config) => {
        this.roles = config.role;
        if (config.hasOwenProperty("group")) {

        }
    },

    configure(roles) {
        if (Array.isArray(roles)) {
            UserModel.config.role = this;
            this.raw = roles;
            this.roles = {};
            roles.forEach((role, i) => {
                this.roles[role] = 1 << i;
            })
        }
    },

    addRoute(uri, roles) {
        if (!this.routes) this.routes = new Map();
        const split = roles.split(',');
        uri = uri.trim().replace(/^\/+|\/+$/g, '');
        split.forEach(role => {
            role = role.trim();
            this.routes.set(role, uri);
        });
    },

    getRoute(role) {
        if (this.routes && this.raw && role > -1 && role < this.raw.length) {
            role = this.raw[role];
            if (this.routes.has(role)) {
                let route = this.routes.get(role);
                return route.startsWith("http") ? route : (window.location.origin + "/" + route + "/");
            }
            else return window.location.origin + '/';
        }
        else {
            return window.location.origin + '/';
        }
    },

    requireRouting(role, route){
        route = route || {};
        route.path = this.getRoute(role);
        return (route.path.replace(/\/+$/g, '') + "/login") !== (window.location.origin + window.location.pathname.replace(/\/+$/g, ''));
    },

    /**
     * SUPPORTARE ENTRAMBE
     * role.authorize(role.ADMIN | role.USER);
     * role.authorize("ADMIN, USER");
     * @param {*} roles 
     * @returns bool
     */

    authorize(roles) {
        if (!this.roles || !roles || this.current === -1) return true;

        if ($String.is(roles)) {
            const split = roles.split(',');
            roles = 0;
            split.forEach(role => {
                role = role.trim();
                if (this.roles.hasOwnProperty(role))
                    roles |= this.roles[role];
            });
        }
        return (roles & (1 << this.current)) > 0;
    },

    exclude: roles => {
        return roles & this.current === 0;
    },

    load: () => {

    },

    control: {}
});

Object.defineProperty(Role.prototype, "current", {
    get: function () {
        return this.$current;
    },
    set: function (value) {
        this.$current = value;
        this.emit("ROLE_CHANGED", value);
    }
});

export function RoleNetwork() {
    this.nets = {};
    this.routes = {};
}

RoleNetwork.prototype = {
    addRoute(uri, roles) {
        if (!uri.startsWith("http")) {
            uri = window.location.origin + "/" + uri + "/";
        }
    },

    getRoute(role) {

    }
}
//core.context.observe("LOGIN").with(Role.prototype); qualche dubbbio!!!
