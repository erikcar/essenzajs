import { DataModel, core } from "@essenza/core";

export function PlaceModel() {
  DataModel.call(this);
}

core.prototypeOf(DataModel, PlaceModel, {
  etype: "place",

  defaultOption: { apiUrl: "service/app/" },

  search(text, geojson = false) {
    this.ExecuteQuery("place_search", { query: text, geojson }, { cast: v => v });
  },
});
