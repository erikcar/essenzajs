import { DataModel, core } from "@essenza/core";

export function PlaceModel() {
  DataModel.call(this);
}

core.prototypeOf(DataModel, PlaceModel, {
  etype: "place",

  defaultOption: { apiUrl: "service/place/" },

  search(text) {
    this.ExecuteQuery("search", {query: text});
  },
});