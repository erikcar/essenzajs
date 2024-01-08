import { $Type } from "./utils";

export function Space(){
    this.store = new Map();
}

//const shared = this.shared.get($Type.of(target)); 

Space.prototype = {
    share: function(obj){
        const type = $Type.of(obj);
        this.store.has(type) ? this.store.get(type).add(obj) : this.store.set(type, new Set().add(obj));
        //TODO: -->RISE SEARCH TO ROOT
    },

    unshare: function (obj){
        const type = $Type.of(obj);
        this.store.has(type) && this.store.get(type).delete(obj);
    },
}