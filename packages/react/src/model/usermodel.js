/** @fileoverview packages/react/src\model\usermodel.js */
import { DataModel, core } from "@essenza/core";

/**
 * UserModel function.
 * @returns {void}
 */
export function UserModel() {
    DataModel.call(this);
}

UserModel.config = { mode: "signin", url: null, router: null, uri: null, timeout: 0 }

core.prototypeOf(DataModel, UserModel, {
    etype: "users",
    /**
     * Mode
     * <li><ul>esignin => email as username</ul>
     * <ul>signin => username and email</ul>
     * <ul>csignin => email as username with email validation</ul>
     * </li>
     * url: { uri: "indirizzo completo dove fare il primo accesso", route: "path relativo, base url è estratto direttamente da dove proviene la richiesta"}
     */
    config: { mode: "signin", url: null, router: null, uri: null, role: null },

    /**
 * create method.
 * @param {any} user
 * @returns {any}
 */
    create: function (user) {
        if (UserModel.config.url) user = { ...user, ...UserModel.config.url }
        if (user.isMutated && user.mutation.mutated.hasOwnProperty("email")) {
            user.$username = user.email;
            user.$nemail = user.email.toUpperCase();
        }
        return this.ServiceApi("csignin", user);
    },

    /**
* signin method.
* @param {any} user
* @returns {any}
*/
    signin: function (user) {
        if (user.isMutated && user.mutation.mutated.hasOwnProperty("email")) {
            user.$username = user.email;
            user.$nemail = user.email.toUpperCase();
        }
        return this.ServiceApi("signin", user);
    },

    /**
* A differenza di signin non effettua il login automatico
* @param {any} user
* @returns {any}
*/
    signup: function (user, confirm = false) {
        user.$locked = true;

        if (user.isMutated && user.mutation.mutated.hasOwnProperty("email")) {
            user.$username = user.email;
            user.$nemail = user.email.toUpperCase();
        }

        if (confirm) {
            if (UserModel.config.url) user = { ...user, ...UserModel.config.url }
            return this.ServiceApi("signup_confirm", user);
        }
        else{
            return this.ServiceApi("signup", user);
        }
    },

    /**
 * invite method.
 * @param {any} user
 * @returns {any}
 */
    invite: function (user) {
        if (UserModel.config.url) user = { ...user, ...UserModel.config.url }
        return this.ServiceApi("invitein", user);
    },

    /**
 * update method.
 * @param {any} user
 * @returns {any}
 */
    update(user) {
        if (user.isMutated && user.mutation.mutated.hasOwnProperty("email")) {
            user.$username = user.email;
            user.$nemail = user.email.toUpperCase();
        }

        return this.ServiceApi("updateprofile", user.mutation.asObject());
    },

    /**
 * formatUri method.
 * @param {any} request
 * @param {any} user
 * @returns {void}
 */
    formatUri(request, user) {
        let role = UserModel.config.role;
        request.uri = role ? role.getRoute(user.itype) : window.location.origin;


        /*if (uri && uri.length > user.itype && uri[user.itype]) {
            uri = uri[user.itype]
            request.uri = uri.url || window.location.origin;
            request.route = uri.route;
        }
        else{
            request.uri = window.location.origin;
        }*/
    },

    /**
 * createInvite method.
 * @param {any} user
 * @returns {any}
 */
    createInvite(user) {
        let request = { email: user.email, userid: user.id };
        this.formatUri(request, user);
        return this.ServiceApi("invitelink", request);
    },

    /**
 * sendInvite method.
 * @param {any} user
 * @returns {any}
 */
    sendInvite(user) {
        let request = { email: user.email, userid: user.id };
        this.formatUri(request, user);
        return this.ServiceApi("invitesend", request);
    },

    /**
 * sendLink method.
 * @param {any} link
 * @param {any} email
 * @returns {any}
 */
    sendLink(link, email) {
        return this.ServiceApi("sendlink", { link, email });
    },

    /**
 * createProfile method.
 * @param {any} user
 * @returns {any}
 */
    createProfile(user) {
        if (user.isMutated && user.mutation.mutated.hasOwnProperty("email")) {
            user.$username = user.email;
            user.$nemail = user.email.toUpperCase();
        }

        return user.save();
    },

    /**
 * updateProfile method.
 * @param {any} user
 * @returns {any}
 */
    updateProfile(user) {
        if (user.isMutated && user.mutation.mutated.hasOwnProperty("email")) {
            user.$username = user.email;
            user.$nemail = user.email.toUpperCase();
        }

        return user.save();
    },

    /**
 * emailValidation method.
 * @param {any} id
 * @param {any} token
 * @returns {any}
 */
    emailValidation: (id, token) => {
        return this.ServiceApi("emailconfirm", { id, token });
    },

    /**
 * login method.
 * @param {any} user
 * @returns {any}
 */
    login: function (user, data) {
        const payload = { username: user.email, password: user.password };

        if(data){
            payload.persistent = data.persistent;
            payload.timeout = data.timeout ?? UserModel.config?.timeout;
        }

        return this.ServiceApi("login", payload).then(result => {
            const role = UserModel.config.role;
            //const router = UserModel.config.router;
            const data = result.data;
            const profile = JSON.parse(data.profile);
            const itype = profile.itype;
            const route = {};
            if (role && role.requireRouting(itype, route)) { //potrebbero essere più di uno itype, forse meglio iplatform...
                localStorage.setItem("_session", JSON.stringify(data));
                window.location = route.path + "?reload=" + Date.now() + "&login=*req*";
            }
            else {
                this.context.emit("LOGGED", data);
                return data;
            }
        }).catch(er => Promise.reject(er));
    },

    /**
 * passwordRequest method.
 * @param {any} user
 * @returns {any}
 */
    passwordRequest: function (user) {
        let request = { email: user.email, userid: user.id };
        this.formatUri(request, user);
        return this.ServiceApi("passrequest", request);
    },

    /**
 * passwordReset method.
 * @param {any} request
 * @returns {any}
 */
    passwordReset(request) {
        return this.ServiceApi("passreset", request).then(result => {
            const role = UserModel.config.role;
            //const router = UserModel.config.router;
            const data = result.data;
            const profile = JSON.parse(data.profile);
            const itype = profile.itype;
            const route = {};
            if (role && role.requireRouting(itype, route)) { //potrebbero essere più di uno itype, forse meglio iplatform...
                localStorage.setItem("_session", JSON.stringify(data));
                window.location = route.path + "?reload=" + Date.now() + "&login=*req*";
            }
            else {
                this.context.emit("LOGGED", data);
                return data;
            }
            /*this.context.emit("LOGGED", result.data);
            return result;*/
        });
    },

    /**
 * passwordChange method.
 * @param {any} user
 * @returns {any}
 */
    passwordChange(user) {
        return this.ServiceApi("passchange", { currentPassword: user.password, newPassword: user.npassword });
    },

    /**
 * profile method.
 * @returns {any}
 */
    profile: function () {
        return this.ExecuteQuery("profile");
    },

    /**
 * getGroup method.
 * @param {any} idgroup
 * @returns {any}
 */
    getGroup(idgroup) {
        return this.ServiceApi("user_group", { role: idgroup });
    }
});


