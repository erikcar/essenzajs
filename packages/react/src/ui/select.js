import React, { useEffect, useRef, useState } from "react";
import { core, DataModel, $Array } from "@essenza/core";
import { ViewModel } from "../viewmodel/viewmodel";
import { useUI } from "../hook/uihook"

import { Select } from "antd";

export function Selectable({ managed, group, onRemove, onOption, onChange, options, defaultValue, ...rest }) {
    const ui = useUI(SelectableUI, { options, defaultValue });

    ui.observeOption(options);

    const onsearch = value => {
        if (rest.onSearch) rest.onSearch(value);
        ui.input = value;
    }

    const onchange = value => {
        ui.value = value;
        if (onChange) onChange(value);
    }

    const onoption = () => {
        if (onOption) onOption({ value: ui.input, label: ui.input }, new KeyValueModel(ui));
        managed && new KeyValueModel(ui).createOption(ui.input, group).then(opt=>{
            if (onChange) onChange(opt.value);
            if(rest.onSelect) rest.onSelect(opt.value, opt)
        });
    }

    const onremove = (option, e) => {
        e.stopPropagation();
        if (onRemove) onRemove(option, new KeyValueModel(ui));
        managed && new KeyValueModel(ui).removeOption(option.value);
        ui.removeOption(option);
    }

    const onKey = e => {
        if (rest.onInputKeyDown) rest.onInputKeyDown(e);
        if (e.keyCode === 13) {
            if (!ui.options || ui.options.findIndex(opt => opt.label === ui.input) === -1) {
                e.stopPropagation();
                onoption();
            }
        }
    }

    useEffect(() => {
        if (ui.blur) {
            ui.blur = false;
            ui.ref.current.blur();
        }
    }, [ui.ref, ui.blur])

    const props = {
        ...rest, onChange: onchange, onSearch: onsearch, onInputKeyDown: onKey, value: ui.value, options: ui.ostore, showSearch: true, loading: ui.loading, ref: ui.ref,
        notFoundContent: <button onClick={() => onoption()} className="h-10">Inserisci valore</button>,
        optionRender: (option) => (
            <div className="flex">
                <span className="flex-auto" aria-label={option.data.label}>
                    {option.data.label}
                </span>
                <span onClick={e => onremove(option.data, e)} className="text-2xl">&times;</span>
            </div>
        ),
    };

    return <Select {...props} />
}

function SelectableUI(data) {
    ViewModel.call(this);
    this.ostore = data.options ? [...data.options] : null;
    this.options = data.options;
    this.value = data.defaultValue || "";
    this.input = null;
    this.loading = false;
    this.ref = { current: null };
    this.blur = false;
}

core.prototypeOf(ViewModel, SelectableUI, {
    addOption(option) {
        if (!this.options) this.options = [];
        this.options.push(option);
        this.ostore = [...this.options];
        this.value = option.value;
        this.blur = true;
        this.update();
    },

    removeOption(option) {
        if (this.ostore) {
            $Array.removeItem(this.options, option);
            this.ostore = [...this.options];
            if (this.value === option.value) this.value = '';
            this.update();
        }
    },

    observeOption(options) {
        if (this.options !== options) {
            this.ostore = options ? [...options] : null;
            this.options = options;
        }
    },

    setLoading(value) {
        this.loading = value;
        value && this.update();
    }
});

export function KeyValueModel(ui) {
    DataModel.call(this);
    this.ui = ui;
}

core.prototypeOf(DataModel, KeyValueModel, {
    etype: "keyvalue",

    getOptions(group) {
        return this.ServiceApi("kv_group", { group }).then(r=>r.data);
    },

    createOption(label, group) {
        this.ui && this.ui.setLoading(true);
        return this.ServiceApi("kv_add", { label, group }).then(result => {
            const option = { label, value: result.data };
            if (this.ui) {
                this.ui.setLoading(false);
                this.ui.addOption(option);
            }
            return option;
        });
    },

    removeOption(id) {
        return this.ServiceApi("kv_remove", { id });
    },

})