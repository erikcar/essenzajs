import { core, base } from "@essenza/core"

//Potrebbe diventare Load info e gestisco anche message of localstorage
export function UrlInfo() {
    this.params = null;
    //return this.base(UrlInfo); //Comunque può essere da considerare 
}

core.prototypeOf(base, UrlInfo, {
    //TODO: aggiungere altre info oltre a search params
    init: function (params) {
        this.params = params;
        if (params) {
            for (const [key, value] of mySearchParams) {
                this.emit(key.toUpperCase(), value);
            }
        }
    },

    control: { //Così lo istanzia anche se non uso classe, se metto una classe in file singolo, se non la importo non crea controller => OK
        FAREQ: () => {

        },

        EMREQ: () => {

        },

        LOGINREQ: () => {

        },

        NAVREQ: () => {

        },
    }
})