import { useWidget, UserVM, Widget, useForm, Form, FormItem } from "@essenza/react";
import { Input, Select } from 'antd';
const { Option } = Select;

export function Profile({ user, rules, roles }) {
    useWidget(UserVM);
    const form = useForm(user, { rules });

    return (
        <Widget>
            <Form form={form} >
                <FormItem label="Nome" name="name">
                    <Input placeholder="Mario"></Input>
                </FormItem>
                <FormItem label="Cognome" name="surname">
                    <Input placeholder="Rossi"></Input>
                </FormItem>
                <FormItem label="Email" name="email">
                    <Input placeholder="email@email.it"></Input>
                </FormItem>
                <FormItem label="Telefono" name="phone">
                    <Input placeholder="contatto telefonico"></Input>
                </FormItem>
                <FormItem label="Azienda" name="businessname">
                    <Input placeholder="Nome Azienda"></Input>
                </FormItem>
                {
                    roles &&
                    <>
                        <FormItem label="Tipo" name="itype">
                            <Select placeholder="Tipo Utente" className="w100">
                                {roles.map((v, i) => <Option value={i}>{v}</Option>)}
                            </Select>
                        </FormItem>
                    </>
                }
            </Form>
        </Widget>
    )
}