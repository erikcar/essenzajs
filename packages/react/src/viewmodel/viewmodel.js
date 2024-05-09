import { Attachment, core, MutableObject } from "@essenza/core";

export function ViewModel() {
    this.render;
    this.initialized = false;

    /*let sharing = this.sharing;
    while (sharing) {
        sharing = sharing.next;
    }*/
}

core.prototypeOf(MutableObject, ViewModel, {
    //sharing: null,

    assign: function (target, key) {
        /** Per ora assegna a proprietà di vm */
        this[key] = target;
        /*if(this.hasOwnProperties(key)) 
            this.key = target;
        else
            this.root.subscribe(this);*/
    },

    $$uid() {
        return this.props ? this.props["es-id"] : null;
    },

    $$init: function (oninit) {
        if (!this.initialized) {
            oninit && oninit(this);
        }
    },

    $$initialized: function () {
        if (!this.initialized) {
            this.initialized = true;
            this.scope.focus = this.parent;
            if (this.oninit) {
                this.oninit(this);
                delete this.oninit;
            }
        }
    },

    update: function () {
        this.render && this.render();
    },

    /**PER COMPATIBILITA => solo con observe, listen */
    bind: function (type, key) {
        return this.context.scope.binding.share(type, this, key);
        //throw new Error("ViewModel bind Method IS OBSOLETE");
        //return this.context.scope.bind(type, path);
    },

    use: function (type, key) {
        return this.context.scope.binding.share(type, this, key);
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

    emitSafe(event, data, timeout = 1000) {
        this.$$debouncing = this.$$debouncing || {};
        if (!this.$$debouncing[event]) {
            this.$$debouncing[event] = true;
            this.emit(event, data);
            setTimeout(() => this.$$debouncing[event] = false, timeout);
        }
    },

    emitOnce(event, data, target, name) {
        //emette solo una volta event nel ciclo di vita del vm
        this.$$debouncing = this.$$debouncing || {};
        if (!this.$$debouncing[event]) {
            this.$$debouncing[event] = true;
            this.emit(event, data, target, name);
        }
    },

    emitAndWait(event, data, target, name) {
        //emette solo una volta finche la chiamata emit non è conclusa se è async aspetta
    },

    /*dispose: function () {this.$$debouncing
        //this.context.free(this);
        this.context.unscribe(this);
    },*/

    mutable(obj) {
        const m = this.context.mutable(obj);
        m.listen("MUTATING", this);
        return m;
    },

    intent: {
        MUTATING: function () { this.update() },
    }
});

export function VistaModel() {
    this.scope = null;
}

core.prototypeOf(ViewModel, VistaModel);
