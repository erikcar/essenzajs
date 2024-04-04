import { DataModel, core } from "@essenza/core";

export function PersonModel() {
    DataModel.call(this);
}

core.prototypeOf(DataModel, PersonModel, {
    etype: "person",

    getFiscalCode(data) {
        return this.ExecuteApi("cf", data);
    },

})