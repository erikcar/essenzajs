import { Form } from "antd";
import { useMemo, useEffect } from "react";
import { FormUI } from "../ui/form";
import { core, $Type } from "@essenza/core";
export const useForm = (data, schema) => {
  const [target] = Form.useForm();
  const { name, formatter, rules } = schema;
  const form = useMemo(() => {
    const _form = new FormUI(target, data);
    if (target && rules && schema.validate !== false) {
      target.rule = $Type.isFunction(rules) ? rules(schema) : rules;
      target.vdata = {};
    }
    _form.name = name;
    _form.formatter = formatter;
    core.context.scope.forward(_form, _form.name || "form");
    return _form;
  }, [target]);

  useEffect(() => {
    console.log("DEBUG USE FORM RESET", data, form);
    //if (!data || (form.data?.id !== data.id))
    form.target.resetFields();
    form.data = data;
  }, [data]);

  form.data = data;

  return form;
}