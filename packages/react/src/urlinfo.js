/** @fileoverview packages/react/src\urlinfo.js */
import { core, Observable } from "@essenza/core"
import { AppModel } from "./appmodel";

//Potrebbe diventare Load info e gestisco anche message of localstorage
/**
 * UrlInfo function.
 * @returns {void}
 */
export function UrlInfo() {
    this.params = null;
    this.hasRequest = false;
    //return this.base(UrlInfo); //Comunque può essere da considerare 
}

core.prototypeOf(Observable, UrlInfo, {

    //TODO: aggiungere altre info oltre a search params

        /**
     * init method.
     * @param {any} block
     * @returns {void}
     */
        init: function (block) {
        if (this.params) {
            const qp = { params: {} };
            for (const [key, value] of this.params[0]) {
                qp.params[key] = value;
                if (value === '*req*') {
                    qp.request = key.toUpperCase();
                    if(qp.request === "LOGIN"){
                        block.add(ctx => ctx.emit("LOGGED", JSON.parse(localStorage.getItem("_session"))));
                    }
                    else{
                        this.hasRequest = true;
                    }
                }
            }
            if (this.hasRequest)
                block.add((ctx) => ctx.emit("URL_REQUEST", qp));
        }
    },

        /**
     * isRestricted method.
     * @returns {any}
     */
        isRestricted: function () {
        return window.location.origin !== window.location.href.replace(/\/+$/g, '') && (window.location.origin + "/login") !== window.location.href.replace(/\/+$/g, '');
    },

    /**
     * HANDLE url query request
     */

    intent: { //Così lo istanzia anche se non uso classe, se metto una classe in file singolo, se non la importo non crea controller => OK
                /**
         * FAREQ method.
         * @returns {void}
         */
    FAREQ: () => {

            const p = this.params;
            //this.emit("URL_REQUEST", { type: "FIRST_ACCESS", token: p.get("fatoken"), id: p.get("faid"), email: p.get("fam") });
            this.emit("URL_REQUEST", { type: "FIRST_ACCESS", token: p.get("token"), id: p.get("id"), email: p.get("email") })
        },

                /**
         * EMREQ method.
         * @returns {any}
         */
                EMREQ: () => {
            const data = { type: "EMAIL_CHECK", token: p.get("emtoken"), id: p.get("emid") };
            return this.request(AppModel, m => m.emailConfirm(data)).then(result => this.emit("URL_REQUEST", result));
            //emreq => emtoken
        },

                /**
         * LOGINREQ method.
         * @returns {void}
         */
                LOGINREQ: () => {

        },

                /**
         * NAVREQ method.
         * @returns {void}
         */
                NAVREQ: () => {

        },

                /**
         * REQUEST method.
         * @param {any} data
         * @returns {void}
         */
                REQUEST: (data) => {
            this.emit("URL_REQUEST", data);
        }
    }
})


