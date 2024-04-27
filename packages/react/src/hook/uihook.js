import { Form } from "antd";
import React, { useMemo, useEffect } from "react";
import { FormUI } from "../ui/form";
import { core } from "@essenza/core";
export const useForm = (data, schema) => {
  const [target] = Form.useForm();
  const form = useMemo(() => {
    const _form = new FormUI(target, data);
    _form.init(schema);
    target.rules = _form.rules;
    target.vdata = {};
    core.context.scope.forward(_form, _form.name || "form");
    return _form;
  }, [target]);

  useEffect(() => {
    console.log("DEBUG USE FORM RESET", data, form);
    form.target.resetFields();
    form.data = data;
  }, [data]);

  form.data = data;

  return form;
}

export function useUI(viewmodel, initialData) {
  const vm = useMemo(() => {
      viewmodel = viewmodel || ViewModel;
      return new viewmodel(initialData); //--> Check from context for override other then subscibe  
  }, [viewmodel]);

  vm.render = React.useReducer(bool => !bool, true)[1];

  return vm; //[vm, core.context, core.context.qp];
}