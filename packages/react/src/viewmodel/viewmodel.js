import { Attachment, core, MutableObject } from "@essenza/core";

export function ViewModel() {
    this.render;
}

core.prototypeOf(MutableObject, ViewModel, {
    assign: function (target, key) {
        /** Per ora assegna a proprietà di vm */
        this[key] = target;
        /*if(this.hasOwnProperties(key)) 
            this.key = target;
        else
            this.root.subscribe(this);*/
    },

    $$uid(){
        return this.props ? this.props["es-id"] : null;
    },

    $$init: function (oninit) {
        if (!this.initialized) {
            this.initialized = true;
            oninit && oninit(this);
        }
    },

    $$initialized: function () {
        if (this.oninit) {
            this.oninit(this);
            delete this.oninit;
        }
    },

    update: function () {
        this.render && this.render();
    },

    bind: function (type, path) {
        return this.context.scope.bind(type, path);
    },

    share() {
        this.context.updateScope(this);
    },

    async validateAll() {
        const validation = { isValid: true, result: [] };
        let result;

        for (let k = 0; k < arguments.length; k++) {
            if (arguments[k].validate) {
                result = await arguments[k].validate(true);
                validation.isValid &= result.isValid;
                validation.result.push(result);
            }
        }
        return validation;
    },

    /*dispose: function () {
        //this.context.free(this);
        this.context.unscribe(this);
    },*/

    intent: {
        MUTATING: function () { this.update() },
    }
});

export function VistaModel() {
    this.scope = null;
}

core.prototypeOf(ViewModel, VistaModel);
