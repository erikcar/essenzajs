/** @fileoverview packages/react/src\model\comune.js */
import { DataModel, core } from "@essenza/core";

/**
 * ComuneModel function.
 * @returns {void}
 */
export function ComuneModel() {
    DataModel.call(this);
}

core.prototypeOf(DataModel, ComuneModel, {
    etype: "comune",

        /**
     * search method.
     * @param {any} v
     * @returns {void}
     */
        search(v) {
        //this.api(this.op.search + ": comune {*}", {denominazione: v});
        this.ExecuteQuery("jsearch_comuni", { denominazione: v });
    }

})


