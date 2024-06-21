import { DataModel, core } from "@essenza/core";

export function UserModel() {
    DataModel.call(this);
}

UserModel.config = { mode: "signin", url: null, router: null }

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
    config: { mode: "signin", url: null, router: null },

    create: function (user) {
        return this.ServiceApi("createin", user);
    },

    invite: function (user) {
        if (UserModel.config.url) user = { ...user, ...UserModel.config.url }
        return this.ServiceApi("invitein", user);
    },

    update(user){
        if(user.isMutated && user.mutation.mutated.hasOwnProperty("email")){
            user.$username = user.email;
            user.$nemail = user.email.toUpperCase();
        }

        return this.ServiceApi("updateprofile", user.mutation.asObject());
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
            const router = this.config.router;
            const data = result.data;
            const itype = data.profile.itype;
            if (router && router.default !== itype) { //potrebbero essere più di uno itype, forse meglio iplatform...
                localStorage.setItem("_session", JSON.stringify(data));
                window.location = window.location.origin + router[itype] + "?login=*req*";
            }
            else {
                this.context.emit("LOGGED", data);
                return data;
            }
        });
    },

    passwordRequest: function(user){
        if (UserModel.config.url) user = { ...user, ...UserModel.config.url }
        return this.ServiceApi("passrequest", user);
    },

    passwordReset(request){
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