import { core, MutableObject } from "@essenza/core";

export function ViewModel() {
    this.render;
}

core.prototypeOf(MutableObject, ViewModel, {

    subscribe: function(){
        this.context.subscribe(this);
        return this;
    },

    update: function () {
        this.render && this.render();
    },

    dispose: function () {
        //this.context.free(this);
        this.context.unscribe(this);
    },

    intent: {
        MUTATING: function () { this.update() },
    }
    
});
