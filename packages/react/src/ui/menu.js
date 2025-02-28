import { UI } from "./ui";
import React from "react";

function view({ ui, source, direction, item, ...rest }) {
    return (
        <div className="flex">
            {source && source.map((data, i) => <item onClick={ui.select(i)} source={data} />)}
        </div>
    )
}

export const Menu = UI.create({
    "@view": view,

    $$constructor({ selectedIndex }) {
        this.index = selectedIndex || -1;
    },
});