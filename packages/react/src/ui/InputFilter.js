import { Input, Select } from "antd";
import React, { useEffect, useRef } from "react";
const { Option } = Select;
const data = [
    {
      title: "Title 10",
    },
    {
      title: "Title 20",
    },
  ];

function SourceFilter(field, waiting , digits, async, onDigits){
    this.field = field;
    this.waiting = waiting;
    this.digits = digits;
    this.async = async;
    this.onDigits = onDigits;

    this.value = null;
    this.lastValue = null;
    this.wait = false;
    this.up = false;
    this.source = null;
    this.isource = null;
    this.timeout = null;
    this.setter = null;
    
    this.setSource = function(source){
        if(!Array.isArray(source))
            source = [];
        this.source = source;
        this.isource = source;
        this.lastValue = null;
        this.up = false;
        if(this.timeout) clearTimeout(this.timeout);
        this._apply();
    }

    this.setValue = function(v){
        if(!v) this.up = false;
        else this.up = !this.value || this.value.length < v.length;
        this.value = v.toLowerCase();
        if(this.digits && this.value.length === this.digits && this.up){
            console.log("DIGITS")
            if(this.onDigits) this.onDigits(v); //Dispatch Evento
        }
    }

    this.apply = function(value){
        if(!this.async) this.setValue(value);
        if(!this.source || !this.field) return [];
        if(!this.wait){
            this._apply();
            if(this.waiting > 0){
                this.wait = true;
                this.timeout = setTimeout(this._apply.bind(this), this.waiting);
            }
        }
        return this.isource;
    }

    this._apply = function(){
        console.log("_APPLY", this.lastValue, this.value, this.source)
        this.wait = false;
        this.timeout = null;
        if(this.lastValue === this.value) return;
        console.log(this);
        if(!this.value || this.value === '')
            this.isource = this.source;
        else if(this.up){
            this.isource = this.isource.filter(item => item[this.field].toLowerCase().indexOf(this.value) !== -1);
        }
        else if(Array.isArray(this.source)){
            this.isource = this.source.filter(item => item[this.field].toLowerCase().indexOf(this.value) !== -1);
        }
        else 
            this.isource = [];
        this.lastValue = this.value;
        if(this.setter) this.setter(this.isource);
    }
}

export function InputFilter({ setter, source, field, waiting , digits, async, onDigits, ...prop}){

    const filter = useRef();
    
    useEffect(()=>{ 
        if(filter.current){
            filter.current.field = field;
            filter.current.waiting = waiting;
            filter.current.digits = digits;
            filter.current.async = async;
            filter.current.onDigits = onDigits;
        }
        else filter.current = new SourceFilter(field, waiting , digits, async, onDigits);
    }, [field, waiting , digits, async, onDigits]);

    useEffect(()=>{ filter.current.setSource(source); setter(filter.current.isource || []); filter.current.setter = setter;}, [source, setter]);

    //This is safe only in single thread
    let onChange = (e) => {
        filter.current.apply(e.target.value);
    }

    return(
        <Input onChange={onChange} {...prop}></Input>
    );
}


export function SelectFilter({digits, options, onDigits, onSelect, ...rest}){
    const ref = useRef(null);
    digits = digits || 3;
    options = options || [{label: '', value: null}];
    const len = useRef(0);

    const onchange = (e) =>{
        console.log("Select CHANGED", e);
        const l = e.length;
        if(l > len.current && l === digits && onDigits)
            onDigits(e);
        len.current = l;
    }

    const onselect = (value, option) => {

        console.log("PASSA", value, option, ref.current);//e.target.id, form.target.getFieldsValue(e.target.id), e.target);
        onSelect && onSelect(option);
        //const evt = new Event("onSelect", {item: option});
        /*const evt = new CustomEvent('oselect', {
            bubbles: true,
            detail: {item: option, field: ref.current.id}
          });

        ref.current.dispatchEvent(evt);*/
        //const values = form.target.getFieldsValue(true);
        //model.Publish("OBSERVABLE", "onblur", { field: e.target.id, value: values[e.target.id], values: values });
    };
//{(input, option) => option.children.includes(input)}
    return(
        <Select  labelInValue={true} onFocus={(e)=> ref.current = e.target}  onSelect={onselect} {...rest } showSearch onSearch={onchange} options={options} optionFilterProp="label" filterOption="true">
        </Select>
    )
}

