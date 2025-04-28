import { DataModel, core } from "@essenza/core";

export function UserModel() {
    DataModel.call(this);
}

UserModel.config = { mode: "signin", url: null, router: null, uri: null }

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

    create: function (user) {
        return this.ServiceApi("createin", user);
    },

    invite: function (user) {
        if (UserModel.config.url) user = { ...user, ...UserModel.config.url }
        return this.ServiceApi("invitein", user);
    },

    update(user) {
        if (user.isMutated && user.mutation.mutated.hasOwnProperty("email")) {
            user.$username = user.email;
            user.$nemail = user.email.toUpperCase();
        }

        return this.ServiceApi("updateprofile", user.mutation.asObject());
    },

    formatUri(request, user){
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

    createInvite(user) {
        let request = { email: user.email, userid: user.id };
        this.formatUri(request, user);
        return this.ServiceApi("invitelink", request);
    },

    sendInvite(user) {
        let request = { email: user.email, userid: user.id };
        this.formatUri(request, user);
        return this.ServiceApi("invitesend", request);
    },

    sendLink(link, email) {
        return this.ServiceApi("sendlink", {link, email});
    },

    createProfile(user) {
        if (user.isMutated && user.mutation.mutated.hasOwnProperty("email")) {
            user.$username = user.email;
            user.$nemail = user.email.toUpperCase();
        }

        return user.save();
    },

    updateProfile(user) {
        if (user.isMutated && user.mutation.mutated.hasOwnProperty("email")) {
            user.$username = user.email;
            user.$nemail = user.email.toUpperCase();
        }

        return user.save();
    },

    signin: function (user) {
        if (UserModel.config.url) user = { ...user, ...UserModel.config.url }
        return this.ServiceApi(this.config.mode, user).then(result => {
            this.context.emit("LOGGED", result);
            return result;
        });
    },

    emailValidation: (id, token) => {
        return this.ServiceApi("emailconfirm", { id, token });
    },

    login: function (user) {
        return this.ServiceApi("login", { username: user.email, password: user.password }).then(result => {
            const role = UserModel.config.role;
            //const router = UserModel.config.router;
            const data = result.data;
            const profile = JSON.parse(data.profile);
            const itype = profile.itype;
            const route = {};
            if (role && role.requireRouting(itype, route)) { //potrebbero essere più di uno itype, forse meglio iplatform...
                localStorage.setItem("_session", JSON.stringify(data));
                window.location = route.path + "?login=*req*";
            }
            else {
                this.context.emit("LOGGED", data);
                return data;
            }
        }).catch(er => Promise.reject(er));
    },

    passwordRequest: function (user) {
        let request = { email: user.email, userid: user.id };
        this.formatUri(request, user);
        return this.ServiceApi("passrequest", request);
    },

    passwordReset(request) {
        return this.ServiceApi("passreset", request).then(result => {
            this.context.emit("LOGGED", result.data);
            return result;
        });
    },

    passwordChange(user) {
        return this.ServiceApi("passchange", { currentPassword: user.password, newPassword: user.npassword });
    },

    profile: function () {
        return this.ExecuteQuery("profile");
    }
});