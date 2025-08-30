import { Input, Select } from "antd";
import React, { useEffect, useRef } from "react";
const { Option } = Select;

function SourceFilter(field, waiting, digits, async, onDigits) {
    this.field = field;
    this.waiting = waiting;
    this.digits = digits;
    this.async = async;
    this.onDigits = onDigits;
    this.orField = false;

    this.value = null;
    this.lastValue = null;
    this.wait = false;
    this.up = false;
    this.source = null;
    this.isource = null;
    this.timeout = null;
    this.onFilter = null;
    this.target = {current: null};

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

    this.setValue = function (v) {
        if (!v) this.up = false;
        else this.up = !this.value || this.value.length < v.length;
        this.value = v.toLowerCase();
        if (this.digits && this.value.length === this.digits && this.up) {
            if (this.onDigits) this.onDigits(v); //Dispatch Evento
        }
    }

    this.apply = function (value) {
        if (!this.async) this.setValue(value);
        if (!this.source || !this.field) return [];
        if (!this.wait) {
            this._apply();
            if (this.waiting > 0) {
                this.wait = true;
                this.timeout = setTimeout(this._apply.bind(this), this.waiting);
            }
        }
        return this.isource;
    }

    this.filter = function(item){
        this.fields
    },

    this._apply = function () {
        this.wait = false;
        this.timeout = null;
        if (this.lastValue === this.value) return;
        const f = this.field;
        const ff = this.orField
        const v = this.value;
        const predicate = ff ?
            item => item[f].toLowerCase().indexOf(v) !== -1 || item[ff]?.toLowerCase().indexOf(v) !== -1 :
            item => item[f].toLowerCase().indexOf(v) !== -1;
        
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

    this.reset = function(){
        this.value = null;
        this.target.current.value = "";
        this.setSource(this.source);
    }
}

export function InputFilter({ onFilter, source, model, field, orField, waiting, digits, async, onDigits, ref, root, rootField, ...prop }) {
    const filter = useRef(new SourceFilter()).current;
    filter.isource !== source &&  filter.source !== source && filter.setSource(source);
    if(ref && ref.current !== filter){
        ref.current = filter;
    }
    useEffect(() => {
        filter.field = field;
        filter.orField = orField;
        filter.waiting = waiting;
        filter.digits = digits;
        filter.async = async;
        filter.onDigits = onDigits;
    }, [field, orField, waiting, digits, async, onDigits]);

    useEffect(() => {
        filter.onFilter = onFilter;
        if (onFilter) {
            onFilter(filter.isource);
        }
        if (model) filter.onFilter = v => {
            if(root){
                root[rootField] = v;
                v = root;
            }
            model.setSource(v, s=>s);
        }
    }, [onFilter, model]);

    //This is safe only in single thread
    let onChange = (e) => {
        filter.apply(e.target.value);
    }

    return (
        <input ref={filter.target} onChange={onChange} {...prop}></input>
    );
}

export function SelectFilter({ digits, options, onDigits, onSelect, onChange, ...rest }) {
    const ref = useRef(null);
    digits = digits || 3;
    options = options || [{ label: '', value: null }];
    const len = useRef(0);

    const onchange = (e) => {
        const l = e.length;
        if (l > len.current && l === digits && onDigits)
            onDigits(e);
        len.current = l;
    }

    const onselect = (value, option) => {
        onSelect && onSelect(value?.value ? value.value : value, option);
    };

    const change = (v, o) => {
        onChange && onChange(v?.value ? v.value : value, o);
    }

    return (
        <Select labelInValue={true} onFocus={(e) => ref.current = e.target} onChange={change} onSelect={onselect} {...rest} showSearch onSearch={onchange} options={options} optionFilterProp="label" filterOption="true">
        </Select>
    )
}

