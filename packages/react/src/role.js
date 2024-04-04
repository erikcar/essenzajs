import { core, Observable, $String } from "@essenza/core";
import { UserModel } from "./model/usermodel";

export function Role() {
    this.base();
    this.roles = null;
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
            UserModel.prototype.roles = roles;
            this.roles = {};
            roles.forEach((role, i) => {
                this.roles[role] = 1 << i;
            })
        }
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
        return (roles & ( 1 << this.current)) > 0;
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

//core.context.observe("LOGIN").with(Role.prototype); qualche dubbbio!!!
