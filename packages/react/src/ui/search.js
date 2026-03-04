// components/SearchInput.js
import React, { useCallback, useEffect, useRef } from "react";
import { debounce, $Array } from "@essenza/core";
import { Tag } from "antd";
import { EditableText } from "./editable";
import { UI } from "./ui";
import { Repeater } from "./repeater";
import { InputFilter } from "./InputFilter";

function skin({ ui, css, className = "w-96", field, labelField, prefix, multiselection, source, digits, onDigits, onChange, item, remote, placeHolder, resultMaxHeight = 360, ...rest }) {
  const onfilter = useCallback(s => ui.onfilter(s), []);
  // ✅ ref del wrapper che contiene sia input “placeholder” che dropdown
  const rootRef = useRef(null);

  useEffect(() => {
    // Il focus viene attivato appena il componente viene montato
    if (ui.isopen && ui.inputRef.current) {
      ui.inputRef.current.target.current.focus();
    }
  }, [ui.isopen]);

  // ✅ chiudi SOLO quando il click/tap è fuori dal contenitore
  useEffect(() => {
    if (!ui.isopen) return;

    const onPointerDown = (e) => {
      if (rootRef.current?.contains(e.target)) return; // click dentro → non chiudere
      ui.open(false); // click fuori → chiudi
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [ui.isopen]);

  return (
    <div className={"relative " + className}>
      {/* <div className={`relative block w-full ${className}`}>
        <Input {...rest} onFocus={() => ui.open(true)} className="" />
      </div> */}

      <div tabIndex={-1} onFocus={() => ui.open(true)} className={"flex flex-wrap items-center gap-1 p-1 " + css.input}>
        {prefix ? prefix : null}
        {ui.selected && ui.selected.map(item => <Tag key={item[labelField || ui.field]} onClose={() => ui.onremove(item)} closable onMouseDown={(e) => {
          e.preventDefault(); // Impedisce al browser di dare il focus al genitore
          e.stopPropagation(); // Impedisce all'evento di risalire
        }}>
          <EditableText field={labelField || ui.field} data={item} />
        </Tag>)}
        {ui.selected.length === 0 && placeHolder && <span>{placeHolder}</span>}
      </div>

      {
        ui.isopen ?
          <div className="absolute top-0 left-0 z-50 bg-white rounded-md shadow-xl min-h-36 w-full max-w-4xl flex flex-col max-h-[80vh]" ref={rootRef}>
            <div className={"flex flex-wrap items-center gap-1 p-1 " + css.input}>
              {prefix ? prefix : null}
              {ui.selected && ui.selected.map(item => <Tag key={item[labelField || ui.field]} onClose={() => ui.onremove(item)} closable>
                <EditableText field={labelField || ui.field} data={item} />
              </Tag>)}
              <div className="flex-1 min-w-0">
                <InputFilter ref={ui.inputRef} placeHolder={placeHolder} name="no-autofill" remote={remote} digits={digits} onDigits={onDigits} autoComplete="off" field={field || "label"} {...rest}
                  onFilter={onfilter} source={source} className="pl-1 bg-transparent! w-full min-w-0 focus-visible:outline-0" />
              </div>
            </div>
            <div className='overflow-y-auto overflow-x-hidden mt-2 p-2' style={{ maxHeight: (typeof resultMaxHeight === 'number' ? resultMaxHeight + 'px' : resultMaxHeight) }}>
              {source ? <Repeater
                layout={ui.dataLayout}
                labelField={labelField || field}
                source={source}
                selected={ui.selected}
                onSelect={(v, a) => ui.onselect(v, a)}
                multiSelection={multiselection}
                css-$box="space-y-2"
                css-$item="p-2 hover:bg-gray-100 rounded cursor-pointer"
                css-$selected="p-2 bg-blue-100 rounded cursor-pointer"
              >

              </Repeater> : <span>Nessun risultato</span>}
            </div>
          </div>
          : null
      }
    </div>
  );
}

export const SearchInput = UI.create({
  "@uid": "SearchInput",
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

    group: (data, css, ui) =>
      <div className={css}>
        {data.icon} {data[ui.groupField]}
      </div>,

    css: {
      box: "flex gap-2 p-2",
      input: "w-full bg-slate-100 rounded-md min-h-8"
    }
  },

  $$constructor(props) {
    this.isopen = false;
    this.source = props.source || {};
    this.selected = props.defaultSelected || [];
    this.defaultSelected = props.defaultSelected;
    this.inputRef = React.createRef();
    this.field = props.field || "label";
    this.debounce = new debounce();
    this.createPart("Item");
    this.dataLayout = props.item ? { item: props.item } : null;
  },

  open(v) {
    this.isopen = v;
    this.render();
  },

  onremove(item) {
    $Array.removeItem(this.selected, item);
    if (this.selected.lenght === 0) this.selected = null;
    if (this.props.onremove) {
      this.props.onremove(item);
    }
    if (this.props.onChange) {
      this.props.onChange(0);
    }
    this.render();
  },

  onselect(item, all) {
    this.isopen = false;
    this.selected = all;
    if (this.props.onselect) {
      this.props.onselect(item, all);
    }

    if (this.props.onChange) {
      this.props.onChange(item ? item[this.props.valueField || "id"] : 0);
    }
    this.reset();
    this.render();
  },

  onfilter(source) {
    if (this.source !== source) { //source.length > 0 &&
      this.source = source;
      this.isopen = true;
      this.render();
    };
  },

  reset(check) {
    if (check && this.props.onParse) {
      const v = this.inputRef.current.target.current.value;
      if (v && v !== "") {
        const item = this.props.onParse(v);
        if (item) this.selected.push(item);
      }
    }
    this.inputRef.current.reset();
    this.source = this.props.source; //null; //this.input.current.source; //
    console.log("RESET");
  },

  clear() {
    this.selected = [];
    this.isopen = false;
    this.inputRef.current.reset();
    this.render();
  },



});

