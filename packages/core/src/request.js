import { Block } from "./code";
import { core } from "./core";

export function Request(){
    this.response; // lo trasformo sempre in un promise? o tratto entrambi i casi?
}

Request.prototype = {

    then: function(resolve, reject){
        return this.response.then(resolve,reject);
    },
    
    execute: function(token){
        return this.response.then(block => {
            return block instanceof Block ? block.execute(token) : block;
        });
    },

    attach: function(callback){
        return this.response.then(block => {
            return block instanceof Block ? block.attach(callback) : block;
        });
    }
}

//core.inject(Request, "IContext");