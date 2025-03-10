import { UI } from "@essenza/react";
import React from "react";

function skin({ ui, Layout, css, source }) {
    return <Layout.box css={css.box}>
        {source && source.map((data, i) => ui.renderItem(data, i))}
    </Layout.box>
}

/**
 * Item
 * Separator
 * State
 * Layout
 * Source
 * Theme => current, nome di..., oppure definizione inline
 * Variant => si crea un file variant che importo a bisogno per non appensantire il componente con tutte le varianti che non uso 
 */
export const Repeater = UI.create({
    "@uid": "Repeater",

    "@skin": skin,

    "@theme": {
        box: ({ children, css }) =>
            <div className={css}>
                {children}
            </div>,

        item: (data, css, ui) =>
            <div className={css} onClick={() => ui.select(data)} >
                {data.icon} {data[ui.labelField]}
            </div>,

        selected: (data, css, ui) =>
            <div className={css}>
                {data.icon} {data[ui.labelField]}
            </div>,
        css: {
            box: "flex gap-2 p-2",
            item: "flex gap-1 hover:bg-slate-200 bg-transparent px-3 cursor-pointer rounded-xl items-center",
            selected: "flex gap-1 bg-black text-white px-3 rounded-xl items-center"
        }
    },

    $$constructor(props) {
        //Selection TODO: si potrebbe creare una classe selection da riutilizzare per tutti i componenti che vogliono supportare selection
        this.index = -1;
        this.selection = new Set();
        this.multiSelection = false;
        this.labelField = props.labelField || "label";
    },

    select(item) {
        !this.multiSelection && this.selection.clear();
        this.selection.add(item);
        this.props.onSelect && this.props.onSelect(item);
        this.render();
    },

    unslect(item) {
        this.selection.delete(item);
    },

    renderItem(data, i) {
        return this.selection.has(data) ? this.theme.selected(data, this.css.selected, this) : this.theme.item(data, this.css.item, this);
    },
});