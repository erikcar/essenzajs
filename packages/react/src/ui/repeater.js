/** @fileoverview packages/react/src\ui\repeater.js */

import React from "react";
import { UI } from "./ui";
import { VirtualizedList } from "./virtualized";

/**
 * skin function.
 * @param {any} param1
 * @returns {any}
 */
function skin({ ui, Layout, css, source }) {

    const     /**
     * renderGroup function.
     * @param {any} grouping
     * @param {any} source
     * @returns {any}
     */
renderGroup = (grouping, source) => {

        const defaulTheme = ui.theme;

        const content =  grouping.map(group => {
            if(!group || !Array.isArray(source[group.label])) return null;
            ui.theme = group.theme ? {...defaulTheme, ...group.theme} : defaulTheme;
            return <>
                {ui.theme.group(data, this.css.item, this)}
                {source[group.label].map((data, i) => ui.renderItem(data, i))}
            </>
        });

        ui.theme = defaulTheme;

        return content;
    }

    const grouping = ui.props.grouping;

    return ui.props.virtualized
        ? <VirtualizedList items={source} onLoadMore={ui.props.onLoadMore} hasMore={ui.props.hasMore} loader={ui.props.loader} className={css.box} ui={ui} />
        
        : <Layout.box css={css.box}>
            {source && (grouping ? renderGroup(grouping, source) : source.map((data, i) => ui.renderItem(data, i)))}
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
                /**
         * box method.
         * @param {any} param1
         * @returns {void}
         */
                box: ({ children, css }) =>
            <div className={css}>
                {children}
            </div>,

                /**
         * item method.
         * @param {any} data
         * @param {any} css
         * @param {any} ui
         * @returns {void}
         */
                item: (data, css, ui) =>
            <>
                {data.icon} {data[ui.labelField]}
            </>,

                /**
         * selected method.
         * @param {any} data
         * @param {any} css
         * @param {any} ui
         * @returns {void}
         */
                selected: (data, css, ui) =>
            <>
                {data.$icon || data.icon} {data[ui.labelField]}
            </>,

                /**
         * group method.
         * @param {any} data
         * @param {any} css
         * @param {any} ui
         * @returns {void}
         */
                group: (data, css, ui) =>
            <div className={css}>
                {data.icon} {data[ui.groupField]}
            </div>,

        css: {
            box: "flex gap-2 p-2",
            item: "flex gap-1 hover:bg-slate-200 bg-transparent px-4 cursor-pointer rounded-xl items-center",
            selected: "flex gap-1 bg-black text-white px-4 rounded-xl items-center",
            group: "flex gap-1 text-lg font-semibold",
        }
    },

        /**
     * $$constructor method.
     * @param {any} props
     * @returns {void}
     */
        $$constructor(props) {
        //Selection TODO: si potrebbe creare una classe selection da riutilizzare per tutti i componenti che vogliono supportare selection
        this.last = null;
        this.index = -1;
        this.labelField = props.labelField || "label";
        this.groupField = props.groupField || "label";
        this.keyField = props.keyField || "key";
        this.selectable = props.mode !== "button";
        this.defaulTheme = null;
        let s = props.defaultSelected;
        if (s && !Array.isArray(s)) {
            s = [s];
        }
        this.selection = new Set(s);
    },

        /**
     * onrender method.
     * @param {any} props
     * @returns {void}
     */
        onrender(props) {
        if (this.props.selected !== props.selected) {
            let s = props.selected;
            if (s && !Array.isArray(s)) {
                s = [s];
            }
            this.selection = new Set(s);
        }
    },

        /**
     * clear method.
     * @returns {void}
     */
        clear() {
        this.selection.clear();
        this.render();
    },

        /**
     * selectLabel method.
     * @param {any} value
     * @returns {void}
     */
        selectLabel(value) {
        if (this.props.source) {
            const item = this.props.source.find(i => i[this.labelField] === value)
            item ? this.select(item) : this.clear();
        }
    },

        /**
     * selectKey method.
     * @param {any} value
     * @returns {void}
     */
        selectKey(value) {
        if (this.props.source) {
            const item = this.props.source.find(i => i[this.keyField] === value)
            item ? this.select(item) : this.clear();
        }
    },

        /**
     * select method.
     * @param {any} item
     * @param {any} e
     * @returns {void}
     */
        select(item, e) {
        const info = this.selecting(item, e);
        if (this.selectable && !info.selecting) {
            !this.props.multiSelection && this.selection.clear();
            this.selection.add(item);
        }
        this.props.onSelect && e && this.props.onSelect(item, [...this.selection], info);
        this.render();
    },

        /**
     * unselect method.
     * @param {any} item
     * @param {any} e
     * @returns {void}
     */
        unselect(item, e) {
        const info = this.selecting(item, e);
        if (this.props.unselectable || this.props.multiSelection || info.selecting) {
            !info.selecting && this.selection.delete(item);
            this.props.onUnselect && e && this.props.onUnselect(item, [...this.selection], info);
            this.render();
        }
        else if (this.selection.size > 1) {
            this.select(item, e);
        }
    },

        /**
     * selecting method.
     * @param {any} item
     * @param {any} e
     * @returns {any}
     */
        selecting(item, e) {
        let result = { selecting: false }
        if (e && e.shiftKey) {
            this.selection.clear();
            const data = this.props.source;
            if (!this.last) {
                this.last = data[0];
            }
            let focus = false;
            for (let i = 0; i < data.length; i++) {
                const el = data[i];
                if (el === this.last || el === item) {
                    if (focus) {
                        this.selection.add(el);
                        break;
                    }
                    else focus = true;
                }

                if (focus) this.selection.add(el);
            }
            result.selecting = true;
        }
        else if (e && e.ctrlKey) {
            this.selection.has(item) ? this.selection.delete(item) : this.selection.add(item);
            result.selecting = true;
            this.last = item;
        }
        else this.last = item;

        return result;
    },

        /**
     * renderItem method.
     * @param {any} data
     * @param {any} i
     * @returns {any}
     */
        renderItem(data, i) {
        if (data && data.$static) return data.$static;
        return this.selection.has(data)
            ?
            <div className={this.css.selected} onClick={e => this.unselect(data, e)} >
                {this.theme.selected(data, this.css.selected, this)}
            </div>
            :
            <div className={this.css.item} onClick={e => this.select(data, e)} >
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


