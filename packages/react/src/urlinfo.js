import { core, Observable } from "@essenza/core"
import { AppModel } from "./appmodel";

//Potrebbe diventare Load info e gestisco anche message of localstorage
export function UrlInfo() {
    this.params = null;
    this.hasRequest = false;
    //return this.base(UrlInfo); //Comunque può essere da considerare 
}

core.prototypeOf(Observable, UrlInfo, {

    //TODO: aggiungere altre info oltre a search params

    init: function () {
        if (this.params) {
            for (const [key, value] of this.params) {
               if(value === '*REQ*') return this.execute(key.toUpperCase());
            }
        }
    },

    /**
     * HANDLE url query request
     */

    intent: { //Così lo istanzia anche se non uso classe, se metto una classe in file singolo, se non la importo non crea controller => OK
        FAREQ: () => {
            this.hasRequest = true;
            const p = this.params;
            //this.emit("URL_REQUEST", { type: "FIRST_ACCESS", token: p.get("fatoken"), id: p.get("faid"), email: p.get("fam") });
            this.emit("URL_REQUEST", { type: "FIRST_ACCESS", token: p.get("fatoken"), id: p.get("faid"), email: p.get("fam") })
        },

        EMREQ: () => {
            const data = { type: "EMAIL_CHECK", token: p.get("emtoken"), id: p.get("emid") };
            return this.request(AppModel, m => m.emailConfirm(data)).then(result => this.emit("URL_REQUEST", result)); 
            //emreq => emtoken
        },

        LOGINREQ: () => {

        },

        NAVREQ: () => {

        },

        REQUEST: (data) => {
            this.emit("URL_REQUEST", data);
        }
    }
})