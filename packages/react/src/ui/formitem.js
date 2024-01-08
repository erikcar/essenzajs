import { Form } from "antd";

export function FormItem({children, ...props}){
    const form = Form.useFormInstance();
    if(form.schema && form.schema.fields[props.name])
        props = {...props, rules: [() => ({validator(_, value) { form.vdata[props.name] = value; return form.schema.validateAt(props.name, form.vdata);},}),]}
    return React.createElement(Form.Item, props, children);
}