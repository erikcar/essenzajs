import { context, core, MutableObject } from "@essenza/core";

export function ViewModel() {
    this.render;
}

core.prototypeOf(MutableObject, ViewModel, {
    attach: function(target, key){
        /** Per ora assegna a proprietà di vm */
        this[key] = target;
        /*if(this.hasOwnProperties(key)) 
            this.key = target;
        else
            this.root.subscribe(this);*/
    },

    update: function () {
        this.render && this.render();
    },

    /*dispose: function () {
        //this.context.free(this);
        this.context.unscribe(this);
    },*/

    intent: {
        MUTATING: function () { this.update() },
    }
    
});

export function VistaModel(){
    this.scope = new context();
}

core.prototypeOf(ViewModel, VistaModel);
