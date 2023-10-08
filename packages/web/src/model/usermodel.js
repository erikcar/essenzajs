import { Model } from "../core";

export function userModel(){
    Model.call(this, userModel);

    this.cartAdd = function(item, user){
        this.api.call("", item);
    }

    this.cartUpdate = function(item){
        this.api.call("", item);
    }

    this.cartRemove = function(item){
        this.api.call("", item.id);
    }
}