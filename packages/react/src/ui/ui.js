import React, { useMemo } from "react";
import { core } from "@essenza/core";
/**
 * NEI VARI FRAMEWORK POSSO CAMBIARE UI DEFINITION PER COMPORTARSI SECONDO LE RULES DEL FRAMEWORK (ES. react, essenza, angular...ecc)
 * Creo classe base UI così posso sempre modificare dei comportamenti base che saranno comuni a tutti i componenti che estondono UI
 */
export function UI() {
    this.render = null;
    this.theme = null;
    this.css = null;
    this.props = null;
}

UI.prototype = {
    globalTheme: null,
    /*skin.theme[key] += "!" + props.theme[key].trim().split(/\s+/).join(' !');
    join(...args) {
        return args.filter(Boolean).join(' !')
    }*/
}

//UI.prototype.say.apply(this,arguments); x chiamare base method

UI.create = function (api) {
    const f = function (props) {
        UI.call(this);
        this.layout = new Layout(api["@uid"]);
        this.$$constructor(props); //PROBLEMA: quando faccio extend non eseguo $$constructor di base class....
    }

    f.prototype = Object.create(UI.prototype, {
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

    if (api.hasOwnProperty("@inject")) {
        core.inject(f, api["@inject"]);;
        delete api["@inject"];
    }

    for (const key in api) {
        Object.defineProperty(f.prototype, key, Object.getOwnPropertyDescriptor(api, key));
    }

    if (api.hasOwnProperty("@skin")) {
        const component = function (props) {
            const ui = useMemo(() => new f(props), []);
            ui.render = React.useReducer(bool => !bool, true)[1];
            ui.props = props;
            ui.layout.validate(ui);
            return <>
                {api["@skin"]({ ...props, ui, css: ui.css, Layout: ui.theme })}
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

function Layout(id) {
    this.id = id;
    this.initialized = false;
    this.variant = null
    this.globalTheme = null;
}

Layout.prototype = {
    validate(ui) {
        const props = ui.props || {};
        if (this.isInvalid(props)) {
            let theme = {}; //props.variant ? props.variant : parts;
            this.merge(theme, ui["@theme"]);//.defaultTheme);

            if (props.variant) {
                this.merge(theme, props.variant);
            }

            if (UI.globalTheme && Object.prototype.hasOwnProperty.call(UI.globalTheme, this.id) && (!props.variant || UI.globalTheme[this.id][props.variant.id])) {
                const t = UI.globalTheme[this.id];
                this.merge(theme, props.variant ? t[props.variant.id] : t);
            }

            props && this.merge(theme, this.parse(props));

            ui.theme = theme;
            ui.css = theme.css;

            this.initialized = true;
        }

        this.variant = props.variant;
        this.globalTheme = UI.theme;
    },

    isInvalid(props) {
        return !this.initialized || this.variant !== props.variant || this.globalTheme !== UI.theme;
    },

    merge(target, source) {
        if (!Object.prototype.hasOwnProperty.call(target, "css")) {
            target.css = {};
        }

        const traverse = (t, s) => {
            for (const k in s) {
                if(k.charAt(0) === "$"){
                    t[k.substring(1)] = typeof s[k] === "string" ? s[k] : {...s[k]};
                }
                else if(!t[k]){
                    t[k] = typeof s[k] === "string" ? s[k] : {...s[k]};
                    //break;
                }
                else if(typeof s[k] === "string"){// s[k] instanceof String || ){
                    t[k] += " " + s[k];//" !" + s[k].trim().split(/\s+/).join(' !');
                    //break;
                }
                else{
                    traverse(t[k], s[k])
                }
            }
        }

        for (const key in source) {
            if (key !== "css") {
                target[key] = source[key];
            }
            else {
                traverse(target.css, source[key])
            }
        }
    },

    parse(props) {
        let root = { ...props.layout, css: props.css };
        if (!root.css) {
            root.css = {};
            for (const key in props) {
                if (key.startsWith("css-")) {
                    const paths = key.split('-');
                    const len = paths.length - 1;
                    const value = props[key];
                    let css = root.css;
                    for (let k = 1; k < len; k++) {
                        const field = paths[k];
                        css[field] = {};
                        css = css[field];
                    }

                    css[paths[len]] = props[key];
                }
            }
        }
        return root;
    },

    build(theme) { //questo la prima volta si potrebbe fare a compile time e eseguita di nuovo solo se cambia thema o variant
        const css = theme.css;
        delete theme.css;

        for (const key in theme) {
            this.parts[key] = this.parse(theme[key], css);
        }

        const arrayChildren = Children.toArray(theme);
        Children.map(arrayChildren, (child, index) => {
            cloneElement(child, {});
        })
    },

    parseAll(children) {
        if (!children) {
            return null;
        }
        else if (!Array.isArray(children)) {
            children = [children];
        }

        for (let k = 0; k < children.length; k++) {
            const child = children[k];
            if (child.type === "layout") {
                this.merge(this.theme, child); //this.parse(child); ???
                break;
            }
        }
    },
}