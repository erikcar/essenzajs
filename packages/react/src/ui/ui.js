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

    //currentTheme: this.defaultTheme,

    /*Layout(type, props){
        let skin = this.defaultTheme[type];
        if(!skin) skin = {theme: "", layout: null};
        if(props.variant && skin.hasOwnProperty(props.variant)) skin = skin[props.variant];
        if(props.theme){
            for (const key in props.theme) {
                if (key.charAt(0) === '$') {
                    skin.theme[key.substring(1)] = props.theme[key];
                }
                else{
                    skin.theme[key] += "!" + props.theme[key].trim().split(/\s+/).join(' !'); //[&&]:
                }
            }
        }
        return skin
    },

    join(...args) {
        return args.filter(Boolean).join(' !')
    }*/
}
//UI.prototype.say.apply(this,arguments); x chiamare base method
UI.create = function (api) {
    const f = function (props) {
        UI.call(this);
        this.$$constructor(props);
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
            return <>
                {api["@skin"]({ ...props, ui })}
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