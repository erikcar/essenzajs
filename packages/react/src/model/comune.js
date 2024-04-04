import { DataModel, core } from "@essenza/core";

export function ComuneModel() {
    DataModel.call(this);
}

core.prototypeOf(DataModel, ComuneModel, {
    etype: "comune",

    search(v) {
        //this.api(this.op.search + ": comune {*}", {denominazione: v});
        this.ExecuteQuery("jsearch_comuni", { denominazione: v });
    }

})