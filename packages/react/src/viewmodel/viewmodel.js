import { Request, core, MutableObject, DataModel } from "@essenza/core";
import { FormUI } from "../ui/form";
import React, { useMemo } from "react";
import { ResetScope } from "../ui/widget";

export function ViewModel() {
    this.render;
    this.initialized = false;
    this.parent;
    this.next;
    /*let sharing = this.sharing;
    while (sharing) {
        sharing = sharing.next;
    }*/
}

core.prototypeOf(MutableObject, ViewModel, {

    //$$sharing: () => null,
    get global() {
        return core;
    },

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

    $$discendant: function (type, path) {
        const parents = new Set();
        const parent = this.parent;
        while (parent) {
            parents.add(parent);
            parent = parent.parent;
        }

        const discendant = this.next;
        while (discendant) {
            parents.add(parent);
            discendant = discendant.next;
        }
    },

    $$render: function () {
        if (!this.scope.root) {
            this.scope.root = this;
            this.context.setScope(this.scope)
        }

        this.scope.storeCurrent(this);
    },

    $$rendered: function () {
        if (!this.scope.root) {
            this.scope.root = this;
            this.context.setScope(this.scope)
        }

        this.scope.storeCurrent(this);

        //this.shared.has(this.constructor) && 
        //    this.shared.set(this.constructor, this);
    },

    isAncestorOf: function (el) {
        let parent = el.parent;
        while (parent) {
            if (parent === this) { return true; }
            parent = parent.parent;
        }

        return false;
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

    unbind: function (type, key) {
        return this.context.scope.binding.unshare(type, this, key);
    },

    share() {
        this.context.updateScope(this);
    },

    commit(source) {
        if (source && source.invalidated) {
            source.invalidated = false;
            return [...source]
        }
        else
            return source;
    },

    inject(type) {
        //TODO: creare BL injection che può cambiare il type da utilizzare 
        const obj = new type();
        if (obj instanceof DataModel) {
            obj.listen("*", token => {
                this.update();
                //setData(token.data);
            });
        }
        return obj;
    },

    async validate(forms) {
        const shared = this.scope.shared;
        let elements, result;
        const validation = { isValid: true, result: [] };

        if (!forms) {
            forms = [];
            shared.forEach((v, k) => {
                if (Array.isArray(v)) {
                    for (let z = 0; z < v.length; z++) {
                        const el = v[z];
                        if (el instanceof FormUI && this.isAncestorOf(el)) {
                            forms.push(el);
                        }
                    }
                }
            });

            for (let j = 0; j < forms.length; j++) {
                result = await forms[j].validate(true);
                validation.isValid &= result.isValid;
                validation.result.push(result);
            }

            return validation;
        }

        if (!Array.isArray(forms)) {
            forms = [forms];
        }

        for (let k = 0; k < forms.length; k++) {
            //TODO: gestione validation option in the form of {"key@path": componentType, schema: {}, formatter: {}} => oppure key: "", path: "" => OR #key @path
            elements = shared.get(forms[k]);
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                if (element instanceof FormUI) {
                    result = await element.validate(true);
                    validation.isValid &= result.isValid;
                    validation.result.push(result);
                }
            }
        }

        return forms?.length === 1 ? validation.result[0] : validation;
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

    request(name, callback, data) {
        this.emit(name, new Request(name, callback, data));
    },

    sharedElement(type) {

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

ViewModel.create = function (api) {
    const f = function (props) {
        ViewModel.call(this);
        this.$$constructor(props);
    }

    f.prototype = Object.create(ViewModel.prototype, {
        constructor: {
            value: f,
            enumerable: false,
            writable: true,
            configurable: true,
        }
    });

    if (!api.hasOwnProperty("$$constructor")) {
        api.$$constructor = () => null;
    }

    if (api.hasOwnProperty("@observe")) {
        api.intent = api["@observe"];
        delete api["@observe"];
    }

    if (api.hasOwnProperty("@shared")) {
        const m = new Map();

        for (const key in api["@shared"]) {
            m.set(api["@shared"][key], key);
        }

        Object.defineProperty(f.prototype, "$$shared", { value: m });

        Object.defineProperty(f.prototype, "$$share", {
            value: function (type, obj) {
                if (this.$$shared.has(type)) {
                    this[this.$$shared.get(type)] = obj;
                }
            }
        });

        delete api["@shared"];
    }

    for (const key in api) {
        Object.defineProperty(f.prototype, key, Object.getOwnPropertyDescriptor(api, key));
    }

    if (api.hasOwnProperty("@view")) {
        const component = function (props) {
            //const vm = useWidget(f, props);
            const vm = useMemo(() => {
                return core.context.attachScope(new f(props), null, true); //--> Check from context for override other then subscibe  
            }, []);

            vm.props = props;
            vm.context.updateScope(vm);
            vm.render = React.useReducer(bool => !bool, true)[1];

            return <>
                {api["@view"]({ ...props, vm })}
                <ResetScope vm={vm} />
            </>
        }
        component.$$api = api;
        return component;
    }
    else if (api.hasOwnProperty("@vista")) {
        const component = function (props) {
            //const vm = useWidget(f, props);

            const vm = useMemo(() => {
                core.context.setScope(new context());
                return core.context.attachScope(new f(props), null, true); //--> Check from context for override other then subscibe  
            }, []);

            useEffect(() => {
                return () => {
                    core.unshare(vm.scope);
                }
            }, [vm]);

            vm.props = props;
            vm.context.updateScope(vm);
            vm.render = React.useReducer(bool => !bool, true)[1];

            return <>
                {api["@view"]({ ...props, vm })}
                <ResetScope />
            </>
        }
        component.$$api = api;
        return component;
    }
    else {
        f.$$api = api;
        return f;
    }
}

export function VistaModel() {
    this.scope = null;
}

core.prototypeOf(ViewModel, VistaModel);
