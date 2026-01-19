/** @fileoverview packages/react/src\ui\InputFilter.js */
import { Input, Select } from "antd";
import React, { useEffect, useRef } from "react";
const { Option } = Select;

/**
 * SourceFilter function.
 * @param {any} field
 * @param {any} waiting
 * @param {any} digits
 * @param {any} async
 * @param {any} onDigits
 * @returns {void}
 */
function SourceFilter(field, waiting, digits, async, onDigits) {
    this.field = field;
    this.waiting = waiting;
    this.digits = digits;
    this.async = async;
    this.onDigits = onDigits;
    this.orField = false;
    this.remote = false;

    this.value = null;
    this.lastValue = null;
    this.wait = false;
    this.up = false;
    this.source = null;
    this.isource = null;
    this.timeout = null;
    this.onFilter = null;
    this.target = { current: null };

        /**
     * setSource function.
     * @param {any} source
     * @returns {void}
     */
        this.setSource = function (source) {
        //if (!Array.isArray(source))
        //source = [];
        this.source = source;
        this.isource = source;
        this.lastValue = null;
        this.up = false;
        if (this.timeout) clearTimeout(this.timeout);
        this._apply();
    }

        /**
     * setValue function.
     * @param {any} v
     * @returns {void}
     */
        this.setValue = function (v) {
        if (!v) this.up = false;
        else this.up = !this.value || this.value.length < v.length;
        this.value = v.toLowerCase();
        if (!this.remote && this.digits && this.value.length === this.digits && this.up) {
            if (this.onDigits) this.onDigits(v); //Dispatch Evento
        }
    }

        /**
     * apply function.
     * @param {any} value
     * @returns {any}
     */
        this.apply = function (value) {
        if (!this.async) this.setValue(value);
        if (!this.remote && (!this.source || !this.field)) return [];

        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        if (!this.wait) {
            this._apply();
        }

        if (this.waiting > 0) {
            this.wait = true;
            this.timeout = setTimeout(this._apply.bind(this), this.waiting);
        }

        return this.isource;
    }

        /**
     * filter function.
     * @param {any} item
     * @returns {void}
     */
        this.filter = function (item) {
        this.fields
    },

                /**
         * _apply function.
         * @returns {void}
         */
                this._apply = function () {
            this.wait = false;
            this.timeout = null;
            if (this.lastValue === this.value) return;
            if (this.remote && this.up && this.onDigits) {
                this.value.length >= this.digits && this.onDigits(this.value);
                this.lastValue = this.value;
                return;
            }
            const f = this.field;
            const ff = this.orField
            const v = this.value;
            const predicate = ff ?
                item => item[f] && (item[f].toLowerCase().indexOf(v) !== -1 || item[ff]?.toLowerCase().indexOf(v) !== -1) :
                item => item[f] && item[f].toLowerCase().indexOf(v) !== -1;

            if (!this.value || this.value === '')
                this.isource = this.source;
            else if (this.up) {
                this.isource = this.isource.filter(predicate);
            }
            else if (Array.isArray(this.source)) {
                this.isource = this.source.filter(predicate);
            }
            else
                this.isource = [];
            this.lastValue = this.value;
            if (this.onFilter) this.onFilter(this.isource);
        }

        /**
     * reset function.
     * @returns {void}
     */
        this.reset = function () {
        this.value = null;
        this.target.current.value = "";
        this.setSource(this.source);
    }
}

/**
 * InputFilter function.
 * @param {any} param1
 * @returns {any}
 */
export function InputFilter({ onFilter, source, model, field, orField, waiting, digits, async, onDigits, remote, ref, root, rootField, prefix, clear, onClear, boxClass, ...prop }) {
    const filter = useRef(new SourceFilter()).current;
    filter.isource !== source && filter.source !== source && filter.setSource(source);
    if (ref && ref.current !== filter) {
        ref.current = filter;
    }
    useEffect(() => {
        filter.field = field;
        filter.orField = orField;
        filter.waiting = waiting;
        filter.digits = digits;
        filter.async = async;
        filter.onDigits = onDigits;
        filter.remote = remote;
    }, [field, orField, waiting, digits, async, onDigits, remote]);

    useEffect(() => {
        filter.onFilter = onFilter;
        if (onFilter) {
            onFilter(filter.isource);
        }
        if (model)         /**
         * onFilter function.
         * @param {any} v
         * @returns {void}
         */
filter.onFilter = v => {
            if (root) {
                root[rootField] = v;
                v = root;
            }
            model.setSource(v, s => s);
        }
    }, [onFilter, model]);

    //This is safe only in single thread
    let     /**
     * onChange function.
     * @param {any} e
     * @returns {void}
     */
onChange = (e) => {
        filter.apply(e.target.value);
    }

    const     /**
     * onclear function.
     * @returns {void}
     */
onclear = () => {
        filter.reset();
        onClear && onClear();
    }

    return (
        <div className={boxClass || "flex gap-2"}>
            {prefix}
            <input ref={filter.target} onChange={onChange} {...prop}></input>
            {filter.value && filter.value !== '' && <div onClick={() => onclear()}>{clear}</div>}
        </div>
    );
}

/**
 * SelectFilter function.
 * @param {any} param1
 * @returns {any}
 */
export function SelectFilter({ digits, options, onDigits, onSelect, onChange, ...rest }) {
    const ref = useRef(null);
    digits = digits || 3;
    options = options || [{ label: '', value: null }];
    const len = useRef(0);

    const     /**
     * onchange function.
     * @param {any} e
     * @returns {void}
     */
onchange = (e) => {
        const l = e.length;
        if (l > len.current && l === digits && onDigits)
            onDigits(e);
        len.current = l;
    }

    const     /**
     * onselect function.
     * @param {any} value
     * @param {any} option
     * @returns {void}
     */
onselect = (value, option) => {
        onSelect && onSelect(value?.value ? value.value : value, option);
    };

    const     /**
     * change function.
     * @param {any} v
     * @param {any} o
     * @returns {void}
     */
change = (v, o) => {
        onChange && onChange(v?.value ? v.value : value, o);
    }

    return (
        <Select labelInValue={true} onFocus={(e) => ref.current = e.target} onChange={change} onSelect={onselect} {...rest} showSearch onSearch={onchange} options={options} optionFilterProp="label" filterOption="true">
        </Select>
    )
}




