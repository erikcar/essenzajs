import { DataModel, core } from "@essenza/core";

export function PlaceModel() {
  DataModel.call(this);
}

core.prototypeOf(DataModel, PlaceModel, {
  etype: "place",

  search(text) {
    this.ServiceApi("search", {query: text});
  },

});