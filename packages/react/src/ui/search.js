// components/SearchInput.js
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { debounce, $Array } from "@essenza/core";
import { Tag } from "antd";
import { EditableText } from "./editable";
import { UI } from "./ui";
import { Repeater } from "./repeater";
import { InputFilter } from "./InputFilter";

function SelectedItem({ item, field, labelField, editable, canRemove = true, onRemove, onItemClick }) {
  const clickable = typeof onItemClick === "function";
  const content = editable === false
    ? <span>{item[labelField || field]}</span>
    : <EditableText field={labelField || field} data={item} />;

  return (
    <Tag
      key={item[labelField || field]}
      closable={canRemove}
      className={clickable ? "cursor-pointer" : ""}
      onClick={clickable ? (e) => {
        e.preventDefault();
        e.stopPropagation();
        onItemClick(item);
      } : undefined}
      onClose={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (canRemove) onRemove(item);
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {content}
    </Tag>
  );
}

function skin({ ui, css, className = "w-96", field, labelField, prefix, suffix, suffixWhenOpen = false, multiselection, source, digits, onDigits, onChange, item, remote, placeHolder, resultMaxHeight = 360, editable = true, canRemove = true, hidePrefixWhenSelected = false, onItemClick, resultsHeader, resultsFooter, noResultsLabel = "nessun risultato trovato", ...rest }) {
  const onfilter = useCallback(s => ui.onfilter(s), []);
  const rootRef = useRef(null);
  const selected = ui.selected || [];
  const showOpenSelected = multiselection;
  const showPrefix = prefix && !(hidePrefixWhenSelected && selected.length > 0);
  const hasResults = Array.isArray(source) ? source.length > 0 : Boolean(source);
  const showNoResults = ui.hasFiltered && !hasResults;
  const inputContainerClass = useMemo(() => {
    if (multiselection && selected.length > 0) return "basis-full";
    return "flex-1 min-w-0";
  }, [multiselection, selected.length]);

  useEffect(() => {
    if (ui.isopen && ui.inputRef.current) {
      const target = ui.inputRef.current?.target?.current;
      if (!target) return;
      requestAnimationFrame(() => target.focus());
    }
  }, [ui.isopen]);

  useEffect(() => {
    if (!ui.isopen) return;

    const onPointerDown = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      ui.open(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [ui.isopen]);

  return (
    <div className={"relative " + className}>
      {/* <div className={`relative block w-full ${className}`}>
        <Input {...rest} onFocus={() => ui.open(true)} className="" />
      </div> */}

      <div
        tabIndex={0}
        onClick={() => ui.open(true)}
        onFocus={() => ui.open(true)}
        className={"flex flex-wrap items-center gap-1 p-1 " + css.input}
      >
        {showPrefix ? prefix : null}
        {selected.map(item => (
          <SelectedItem
            key={item[labelField || ui.field]}
            item={item}
            field={ui.field}
            labelField={labelField}
            editable={editable}
            canRemove={canRemove}
            onRemove={(value) => ui.onremove(value)}
            onItemClick={onItemClick}
          />
        ))}
        {placeHolder && <span className="text-slate-400">{placeHolder}</span>}
        {suffix ? <div className="ml-auto flex items-center">{suffix}</div> : null}
      </div>

      {
        ui.isopen ?
          <div className="absolute top-0 left-0 z-[1200] bg-white rounded-md shadow-xl min-h-36 w-full max-w-4xl flex flex-col max-h-[80vh]" ref={rootRef}>
            <div className={"flex flex-wrap items-center gap-1 p-1 " + css.input}>
              {showPrefix ? prefix : null}
              {showOpenSelected ? selected.map(item => (
                <SelectedItem
                  key={item[labelField || ui.field]}
                  item={item}
                  field={ui.field}
                  labelField={labelField}
                  editable={editable}
                  canRemove={canRemove}
                  onRemove={(value) => ui.onremove(value)}
                  onItemClick={onItemClick}
                />
              )) : null}
              <div className={inputContainerClass}>
                <InputFilter ref={ui.inputRef} autoFocus={ui.isopen} placeHolder={placeHolder} name="no-autofill" remote={remote} digits={digits} onDigits={onDigits} autoComplete="off" field={field || "label"} {...rest}
                  onFilter={onfilter} source={source} className="pl-1 bg-transparent! w-full min-w-0 focus-visible:outline-0" />
              </div>
              {suffixWhenOpen && suffix ? <div className="ml-auto flex items-center">{suffix}</div> : null}
            </div>
            <div className='overflow-y-auto overflow-x-hidden mt-2 p-2' style={{ maxHeight: (typeof resultMaxHeight === 'number' ? resultMaxHeight + 'px' : resultMaxHeight) }}>
              {resultsHeader ? <div>{resultsHeader}</div> : null}
              {hasResults ? <Repeater
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

              </Repeater> : null}
              {showNoResults ? <div className="px-2 py-3 text-sm text-slate-500">{noResultsLabel}</div> : null}
              {resultsFooter ? <div>{resultsFooter}</div> : null}
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
    this.hasFiltered = false;
    this.createPart("Item");
    this.dataLayout = props.item ? { item: props.item } : null;
  },

  open(v) {
    this.isopen = v;
    this.render();
  },

  onremove(item) {
    $Array.removeItem(this.selected, item);
    if (this.selected.length === 0) this.selected = null;
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
      this.hasFiltered = true;
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
    this.source = this.props.remote ? [] : this.props.source; //null; //this.input.current.source; //
    this.hasFiltered = false;
    console.log("RESET");
  },

  clear() {
    this.selected = [];
    this.isopen = false;
    this.inputRef.current.reset();
    this.hasFiltered = false;
    this.render();
  },



});

