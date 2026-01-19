/** @fileoverview packages/react/src\viewmodel\addressvm.js */
import { core } from "@essenza/core";
import { ViewModel } from "./viewmodel";
import { AddressModel } from "../model/addressmodel";

/**
 * AddressVM function.
 * @returns {void}
 */
function AddressVM() {
    ViewModel.call(this);
    this.createSource("source");
    this.createSource("localities");
}

core.prototypeOf(ViewModel, AddressVM, {
    intent: {
                /**
         * LOC_REQUEST method.
         * @param {any} token
         * @returns {void}
         */
                LOC_REQUEST: (token) => {
            this.request(AddressModel, m => m.loadLocality(token.data)).then(data => {
                this.localities = data;
                //this.update(); //Oppure localities diventa una proprietà mutable così update in automatico
            });
        },

                /**
         * LOC_SELECT method.
         * @param {any} token
         * @returns {void}
         */
                LOC_SELECT: (token) => {
            this.request(AddressModel, m => m.setLocality(token.data));
            this.update(); //Si aggiorna automaticamente da sync?
        },
    }
});



