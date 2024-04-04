import { core } from "./core";

/** Da aggiungere poi condition */
export function Shared(type, path){
    this.instance = new type();
    this.path = path;
    this.next = null;
    this.nodes = [];
}

export function Binder(){
    this.map = new Map();
}

Binder.prototype = { 
    /**Per ora getsisco caso come se esiste un solo type attivo contemporaneamente */
    share: function(type, path){
        const shared = new Shared(type, path)
        if(this.map.has(type))
            shared.next = this.map.get(type);

        this.map.set(type, shared);

        return shared;
    },

    first: function(type, path, remove){
        let shared, parent;
        if(this.map.has(type)){
            shared = this.map.get(type);
            while(shared){
                if(shared.path === path) {
                    if(remove){
                        parent === undefined 
                        ? this.map.delete(type) 
                        : parent.next = shared.next;
                    }
                    break;
                }
                parent = shared;
                shared = shared.next;
            }
        }
        return shared;
    },

    firstOrDefault: function(type, path){
        const shared = this.first(type, path, false);
        return shared ? shared.instance : new type();
    },

    firstOrCreate: function(type, path){
        const shared = this.first(type, path);
        return shared ? shared.instance : this.share(type, path).instance;
    },

    bind: function(type, path){
        
    }





}