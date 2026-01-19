/** @fileoverview packages/react/src\ui\menu.js */
import { UI } from "./ui";
import React from "react";

/**
 * view function.
 * @param {any} param1
 * @returns {any}
 */
function view({ ui, source, direction, item, ...rest }) {
    return (
        <div className="flex">
            {source && source.map((data, i) => <item onClick={ui.select(i)} source={data} />)}
        </div>
    )
}

export const Menu = UI.create({
    "@view": view,

        /**
     * $$constructor method.
     * @param {any} param1
     * @returns {void}
     */
        $$constructor({ selectedIndex }) {
        this.index = selectedIndex || -1;
    },
});


