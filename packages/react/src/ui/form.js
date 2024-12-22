import React from "react";
import { Form as AntForm } from "antd";
import { core, Observable, DataObserver } from "@essenza/core";
import { $Type } from "@essenza/core/src/utils";

export function Form({ form, initialValues, autosave, children, ...rest }) {

  const props = {
    ...rest, form: form.target, initialValues: form.format(initialValues), onValuesChange: (fields, values) => form.changing = { fields, values }, onBlur: async () => {
      
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
      if(autosave){
        const result = await form.validate(true);
        if(result.isValid && form.data.isMutated){
          form.data.save();
        }
      }
    }
  };

  return <AntForm {...props}>
    {children}
  </AntForm>;
}

export function FormItem({ children, ...props }) {
  const form = AntForm.useFormInstance();
  //if (form.rules.hasValidationAt(props.name) ) //&& form.rule.fields[props.name]
  props = { ...props, rules: [() => ({ validator(_, value) { form.vdata[props.name] = value; return form.rules.validateAt(props.name, form.getFieldsValue(true)); }, }),] }


  return React.createElement(AntForm.Item, props, children);
}

export function FormUI(target, data, rules) {
  this.target = target;
  this.data = data;
  this.formatter = null;
  this.watching = null;
  this.changing = null;
  this.rules = new Rules(rules);
  this.parent = null;
}

core.prototypeOf(Observable, FormUI,
  {
    init(schema) {
      if (schema) {
        this.name = schema.name;
        this.formatter = schema.formatter;
        this.rules.init(schema.rules, schema.$$rules);
      }
    },

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
      this.rules.clear();
      return await this.target.validateFields()
        .then(async values => {
          if (submit) await this.submit();
          result.data = this.data;
          result.isValid = true;
          return result;
        })
        .catch(errorInfo => {
          console.log("DEBUG VALIDATOR ERROR", errorInfo); //Si può fare publish di error che da app viene ascoltatato e riportato a user in modo cetntralizzato
          result.reason = errorInfo;
          //throw errorInfo
          return result;
        }).finally(() => this.rules.fullFilled());
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
    },

    setRule(rule) {
      this.target.rule = rule;
    }
  })

function Rules() {
  this.data = {};
  this.enabled = null;
  this.schema = null;
  this.rule = { default: null };
}

Rules.prototype = {
  useDefault() {
    this.schema = null;
  },

  init(rule, config) {
    this.rule = rule?.hasOwnProperty("default") ? rule : { default: rule };
    if (config) {
      if (config.validate === false)
        this.rule.validate = false;
      config.format ? config.format(this.rule, this) : Object.assign(this.rule, config);
    }
  },

  include(fields) {

  },

  exclude(fields) {
    this._exclude = "," + fields.replace(" ", "") + ",";
  },

  validateAt(field, value) {
    const schema = this.schema || this.rule.default;
    const validate = this.enabled !== null ? this.enabled : this.rule.validate;
    if (!schema || validate === false || this._exclude?.indexOf(',' + field + ',') > -1 || !schema.fields[field]) return Promise.resolve(true);
    return schema.validateAt(field, value);
  },

  hasValidationAt(field) {
    return (this.schema || this.rule.default)?.fields[field];
  },

  use(schema, once) {
    this.schema = $Type.isString(schema) ? this.rule[schema] : schema;
    this.once = once;
  },

  enable(value) {
    this.enabled = value;
  },

  enableOnce(value) {
    this.enabled = value;
    this.eonce = true;
  },

  fullFilled() {
    if (this.once) this.once = "#";
    if (this.eonce) this.eonce = "#";
  },

  clear() {
    if (this.once === "#") {
      this.schema = null;
      this.once = false;
    }
    if (this.eonce === "#") {
      this.enabled = null;
      this.eonce = false;
    }
  }
}

