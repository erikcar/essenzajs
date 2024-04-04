import React from "react";
import { Form as AntForm } from "antd";
import { core, Observable, DataObserver } from "@essenza/core";

export function Form({ form, initialValues, children, ...rest }) {

  const props = {
    ...rest, form: form.target, initialValues: form.format(initialValues),  onValuesChange: (fields, values)=>form.changing = {fields, values},  onBlur: () => {
      if (form.watching && form.changing) {
        const fields = form.changing.fields;
        for (const key in fields) {
          const value = form.watching.hasOwnProperty(key) ? form.watching[key] : form.data[key]
          if (value !== fields[key]) {
            form.watching[key] = fields[key];
            form.emit("VALUE_CHANGED", { field: key, values: form.changing.values });
          }
        }
        form.changing = null;
      }
    }
  };

  return <AntForm {...props}>
    {children}
  </AntForm>;
}

export function FormItem({ children, ...props }) {
  const form = AntForm.useFormInstance();
  if (form.rule && form.rule.fields[props.name])
    props = { ...props, rules: [() => ({ validator(_, value) { form.vdata[props.name] = value; return form.rule.validateAt(props.name, form.vdata); }, }),] }

 
  return React.createElement(AntForm.Item, props, children);
}

export function FormUI(target, data) {
  this.target = target;
  this.data = data;
  this.formatter = null;
  this.watching = null;
  this.changing = null;
}

core.prototypeOf(Observable, FormUI,
  {
    format: function (value) {
      value = value || this.data;
      if (this.formatter && value) {
        value = { ...value };
        for (const key in this.formatter) {
          if (Object.hasOwnProperty.call(value, key)) {
            value[key] = this.formatter[key](value[key], value);
          }
        }
      }
      return value;
    },

    validate: async function (submit) {
      const result = { isValid: false, data: this.data, form: this.target }
      if (!this.target) return result;

      return await this.target.validateFields()
        .then(async values => {
          console.log("DEBUG FORM VALIDATOR OK", submit);
          if (submit) await this.submit();
          result.data = this.data;
          result.isValid = true;
          return result;
        })
        .catch(errorInfo => {
          console.log("DEBUG VALIDATOR ERROR", errorInfo); //Si può fare publish di error che da app viene ascoltatato e riportato a user in modo cetntralizzato
          result.reason = errorInfo;
          return result;
        });
    },

    submit: async function () {
      if (this.data) {
        const values = this.target.getFieldsValue(true);
        for (const key in values) {
          if (this.target.isFieldTouched(key) && ('$' + key) in this.data) {
            this.data['$' + key] = this.target.getFieldValue(key);
          }
        }
        await this.data.mutating;
      }
    },

    watch: function (fields, hasValue) {
      if (!this.watching) this.watching = {};
      return this.observe("VALUE_CHANGED").when(new DataObserver(fields, hasValue));
    }
  })