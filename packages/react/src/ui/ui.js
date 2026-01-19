/** @fileoverview packages/react/src\ui\ui.js */
import React, { useMemo } from "react";
import { core } from "@essenza/core";
/**
 * NEI VARI FRAMEWORK POSSO CAMBIARE UI DEFINITION PER COMPORTARSI SECONDO LE RULES DEL FRAMEWORK (ES. react, essenza, angular...ecc)
 * Creo classe base UI così posso sempre modificare dei comportamenti base che saranno comuni a tutti i componenti che estondono UI
 */
/**
 * UI function.
 * @returns {void}
 */
export function UI() {
    this.render = null;
    this.theme = null;
    this.css = null;
    this.props = null;
    //this.onrender = () => null;
}

UI.prototype = {
    globalTheme: null,
        /**
     * onrender method.
     * @returns {void}
     */
        onrender: function () { },
    parts: {},

        /**
     * createPart method.
     * @param {any} partName
     * @param {any} isComponent
     * @returns {any}
     */
        createPart(partName, isComponent) {
        if(this.parts.hasOwnProperty(partName)) return;

                /**
         * Part function.
         * @returns {any}
         */
                function Part() {
            return null; // marker only
        }
        Part.kind = isComponent ? "component-part" : "part";
        Part.part = partName;
        Part.displayName = `Part(${partName})`;
        this.parts[partName] = Part;
        return Part;
    },

    /*skin.theme[key] += "!" + props.theme[key].trim().split(/\s+/).join(' !');
    join(...args) {
        return args.filter(Boolean).join(' !')
    }*/
}

//UI.prototype.say.apply(this,arguments); x chiamare base method

/**
 * create function.
 * @param {any} api
 * @returns {any}
 */
UI.create = function (api) {
    const     /**
     * f function.
     * @param {any} props
     * @returns {void}
     */
f = function (props) {
        UI.call(this);
        this.props = {};
        if (props.ui) { props.ui.value = this; props.ui.ui = this; }
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
                /**
         * $$constructor function.
         * @returns {void}
         */
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
        const         /**
         * component function.
         * @param {any} props
         * @returns {any}
         */
component = function (props) {
            const ui = useMemo(() => new f(props), []);
            ui.render = React.useReducer(bool => !bool, true)[1];
            ui.onrender(props);
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

/**
 * Layout function.
 * @param {any} id
 * @returns {void}
 */
function Layout(id) {
    this.id = id;
    this.initialized = false;
    this.variant = null
    this.globalTheme = null;
}

Layout.prototype = {
        /**
     * validate method.
     * @param {any} ui
     * @returns {void}
     */
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
            // ✅ nuovo layer: parts-as-children (ultimo vince)
            props && this.merge(theme, this.parsePartsFromChildren(props.children));

            ui.theme = theme;
            ui.css = theme.css;

            this.initialized = true;
        }

        this.variant = props.variant;
        this.globalTheme = UI.theme;
    },

        /**
     * isInvalid method.
     * @param {any} props
     * @returns {any}
     */
        isInvalid(props) {
        return !this.initialized || this.variant !== props.variant || this.globalTheme !== UI.theme;
    },

        /**
     * merge method.
     * @param {any} target
     * @param {any} source
     * @returns {void}
     */
        merge(target, source) {
        if (!Object.prototype.hasOwnProperty.call(target, "css")) {
            target.css = {};
        }

        const         /**
         * traverse function.
         * @param {any} t
         * @param {any} s
         * @returns {void}
         */
traverse = (t, s) => {
            for (const k in s) {
                if (k.charAt(0) === "$") {
                    t[k.substring(1)] = typeof s[k] === "string" ? s[k] : { ...s[k] };
                }
                else if (!t[k]) {
                    t[k] = typeof s[k] === "string" ? s[k] : { ...s[k] };
                    //break;
                }
                else if (typeof s[k] === "string") {// s[k] instanceof String || ){
                    t[k] += " " + s[k];//" !" + s[k].trim().split(/\s+/).join(' !');
                    //break;
                }
                else {
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

        /**
     * parse method.
     * @param {any} props
     * @returns {any}
     */
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

        /**
     * parsePartsFromChildren method.
     * @param {any} children
     * @returns {any}
     */
        parsePartsFromChildren(children) {
        if (!children) return null;

        const out = { css: {} };

        React.Children.forEach(children, (child) => {
            if (!React.isValidElement(child)) return;

            const kind = child.type?.kind;
            const partName = child.type?.part;
            if (!partName) return;

            // props del marker
            const { css, children: override, ...rest } = child.props || {};

            // 1) css merge per part
            if (typeof css === "string" && css.trim()) {
                // merge normale: out.css[partName] = (out.css[partName] ? out.css[partName] + " " : "") + css
                // lasciamo che sia la tua merge() a concatenare correttamente:
                out.css[partName] = css;
            }

            if (kind === "component-part") {
                // css...
                //out.css[partName] = child.props.css;

                // salva subParts per la part
                out.slots[partName] = child.props.children;

                // salva anche props di config del componente rappresentato (opzionale)
                out.componentProps[partName] = rest;

                return;
            }

            // 2) override renderer part
            if (typeof override === "function") {
                const renderFn = override;
                                /**
                 * computed function.
                 * @param {any} data
                 * @param {any} cssStr
                 * @param {any} ui
                 * @returns {void}
                 */
                                out[partName] = (data, cssStr, ui) =>
                    renderFn({ data, ui, css: cssStr, props: rest, part: partName });
            } else if (override != null) {
                // override statico (se lo vuoi supportare): <Item>...</Item>
                const node = override;
                                /**
                 * computed function.
                 * @returns {void}
                 */
                                out[partName] = () => node;
            }

            // (opzionale) se vuoi supportare props extra nel theme, puoi metterle sotto una chiave:
            // out.props = out.props || {};
            // out.props[partName] = rest;
        });

        // se non c'è nulla, ritorna null così merge non fa nulla
        const hasAny =
            Object.keys(out.css).length > 0 ||
            Object.keys(out).some((k) => k !== "css");

        return hasAny ? out : null;
    },

        /**
     * build method.
     * @param {any} theme
     * @returns {void}
     */
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

        /**
     * parseAll method.
     * @param {any} children
     * @returns {any}
     */
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

/**
 * createPart function.
 * @param {any} partName
 * @returns {any}
 */
export function createPart(partName) {
        /**
     * Part function.
     * @returns {any}
     */
        function Part() {
        return null; // marker only
    }
    Part.part = partName;
    Part.displayName = `Part(${partName})`;
    return Part;
}

/**
 * createComponentPart function.
 * @param {any} ownerId
 * @param {any} partName
 * @param {any} Component
 * @returns {any}
 */
export function createComponentPart(ownerId, partName, Component) {
        /**
     * Part function.
     * @returns {any}
     */
        function Part() { return null; }
    Part.owner = ownerId;
    Part.part = partName;
    Part.kind = "component-part";
    Part.Component = Component; // il componente “vero” rappresentato
    return Part;
}


