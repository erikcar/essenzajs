import { core, base, $String } from "@essenza/core";

export function Role() {
    this.base();
    this.roles;
    this.$current = 0;
}

core.prototypeOf(base, Role, {

    parse: (config) => {
        this.roles = config.role;
        if (config.hasOwenProperty("group")) {

        }
    },

    /**
     * SUPPORTARE ENTRAMBE
     * role.authorize(role.ADMIN | role.USER);
     * role.authorize("ADMIN, USER");
     * @param {*} roles 
     * @returns bool
     */

    authorize: roles => {
        if ($String.is(roles)) {
            const split = roles.split(',');
            roles = 0;
            split.forEach(role => {
                role = role.trim();
                if (this.roles.hasOwenProperty(role))
                    roles |= this.roles[role];
            });
        }
        return roles & this.current > 0;
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
