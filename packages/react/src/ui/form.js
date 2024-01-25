import React from "react";
import { Form as AntForm } from "antd";

export function Form({ form, initialValues, children, ...rest }) {

  const props = { ...rest, form: form.target, initialValues: form.format(initialValues), onLoad: (e) => console.log("onload", e)} ;

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
}

FormUI.prototype = {
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

  validate: async function (name) {
    const result = { isValid: false, data: this.data, form: this.target }
    if (!this.target) return result;

    return await form.validateFields()
      .then(values => {
        console.log("DEBUG FORM VALIDATOR OK", name);
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
    const validation = await this.validate();
    if (validation.isValid) {

    }
  },
}