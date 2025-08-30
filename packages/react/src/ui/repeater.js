
import React from "react";
import { UI } from "./ui";
import { VirtualizedList } from "./virtualized";

function skin({ ui, Layout, css, source }) {
    return ui.props.virtualized
        ? <VirtualizedList items={source} className={css.box} ui={ui} />
        : <Layout.box css={css.box}>
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
            <>
                {data.icon} {data[ui.labelField]}
            </>,

        selected: (data, css, ui) =>
            <>
                {data.$icon || data.icon} {data[ui.labelField]}
            </>,
        css: {
            box: "flex gap-2 p-2",
            item: "flex gap-1 hover:bg-slate-200 bg-transparent px-4 cursor-pointer rounded-xl items-center",
            selected: "flex gap-1 bg-black text-white px-4 rounded-xl items-center"
        }
    },

    $$constructor(props) {
        //Selection TODO: si potrebbe creare una classe selection da riutilizzare per tutti i componenti che vogliono supportare selection
        this.index = -1;
        this.labelField = props.labelField || "label";
        this.keyField = props.keyField || "key";
        this.selectable = props.mode !== "button";
        let s = props.defaultSelected;
        if (s && !Array.isArray(s)) {
            s = [s];
        }
        this.selection = new Set(s);
    },

    onrender(props) {
        if (this.props.selected !== props.selected) {
            let s = props.selected;
            if (s && !Array.isArray(s)) {
                s = [s];
            }
            this.selection = new Set(s);
        }
    },

    clear() {
        this.selection.clear();
        this.render();
    },

    selectLabel(value) {
        if (this.props.source) {
            const item = this.props.source.find(i => i[this.labelField] === value)
            item ? this.select(item) : this.clear();
        }
    },

    selectKey(value) {
        if (this.props.source) {
            const item = this.props.source.find(i => i[this.keyField] === value)
            item ? this.select(item) : this.clear();
        }
    },

    select(item) {
        if (this.selectable) {
            !this.props.multiSelection && this.selection.clear();
            this.selection.add(item);
        }
        this.props.onSelect && this.props.onSelect(item, [...this.selection]);
        this.render();
    },

    unselect(item) {
        if (this.props.unselectable || this.props.multiSelection) {
            this.selection.delete(item);
            this.props.onUnselect && this.props.onUnselect(item, [...this.selection]);
            this.render();
        }
    },

    renderItem(data, i) {
        if (data && data.$static) return data.$static;
        return this.selection.has(data)
            ?
            <div className={this.css.selected} onClick={() => this.unselect(data)} >
                {this.theme.selected(data, this.css.selected, this)}
            </div>
            :
            <div className={this.css.item} onClick={() => this.select(data)} >
                {this.theme.item(data, this.css.item, this)}
            </div>;
    },
});

/**
 * item: (data, css, ui) =>
            <div className={css} onClick={() => ui.select(data)} >
                {data.icon} {data[ui.labelField]}
            </div>,

        selected: (data, css, ui) =>
            <div className={css} onClick={() => ui.unselect(data)} >
                {data.icon} {data[ui.labelField]}
            </div>,
 */