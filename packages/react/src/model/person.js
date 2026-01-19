/** @fileoverview packages/react/src\model\person.js */
import { DataModel, core } from "@essenza/core";

/**
 * PersonModel function.
 * @returns {void}
 */
export function PersonModel() {
    DataModel.call(this);
}

core.prototypeOf(DataModel, PersonModel, {
    etype: "person",

        /**
     * getFiscalCode method.
     * @param {any} data
     * @returns {any}
     */
        getFiscalCode(data) {
        return this.ExecuteApi("cf", data);
    },

})


