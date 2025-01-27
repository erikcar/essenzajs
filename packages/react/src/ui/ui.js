import React, { useMemo } from "react";
import { core } from "@essenza/core";
/**
 * NEI VARI FRAMEWORK POSSO CAMBIARE UI DEFINITION PER COMPORTARSI SECONDO LE RULES DEL FRAMEWORK (ES. react, essenza, angular...ecc)
 * Creo classe base UI così posso sempre modificare dei comportamenti base che saranno comuni a tutti i componenti che estondono UI
 */
export function UI() {
    this.render;
}

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
        core.inject(f, api["@inject"]); ;
        delete api["@inject"];
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
            const ui = useMemo(() => new f(props), []);
            ui.render = React.useReducer(bool => !bool, true)[1];
            return <>
                {api["@view"]({ ...props, ui })}
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