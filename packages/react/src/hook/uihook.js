import { Form } from "antd";
import { useMemo } from "react";
import { FormUI } from "../ui/form";

export const useForm = (data, name, formatter, rule) => {
    const [target] = Form.useForm();

    const form = useMemo(() => {
        const _form = new FormUI(target, data);
        if (target && rule) {
          target.rule = rule;
          target.vdata = {};
        }
        _form.name = name;
        _form.formatter = formatter;
        core.context.scope.forward(_form, _form.name || "form");
        return _form;
      }, [target]);

      form.data = data;

      useEffect(() => {
        console.log("DEBUG USE FORM RESET", data, form);
        if (!data || (form.data && form.data.id !== data.id))
          form.target.resetFields();
        form.data = data;
      }, [data]);
}