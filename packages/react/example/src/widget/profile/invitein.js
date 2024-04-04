import { useWidget, UserVM, Widget, useForm, Form, FormItem } from "@essenza/react";
import { Input, Radio, Select } from 'antd';
import { useState } from "react";
const { Option } = Select;

export function Invitein({ user, rules, enableInvite, roles }) {
    const vm = useWidget(UserVM);
    const form = useForm(user, { rules });
    const [enabled, setEnabled] = useState(true);

    const modeChanged = value => {
        vm.invited = value;
        setEnabled(!value);
    };

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
                {
                    enableInvite &&
                    <>
                        <h2>Metodo inserimento</h2>
                        <Radio.Group onChange={e => modeChanged(e.target.value)} defaultValue={false}>
                            <Radio value={false}>Password</Radio>
                            <Radio value={true}>Invito</Radio>
                        </Radio.Group>
                    </>
                }
                {
                    enabled &&
                    <>
                        <FormItem label="Password" name="password">
                            <Input.Password />
                        </FormItem>
                        <FormItem label="Conferma Password" name="cpassword">
                            <Input.Password />
                        </FormItem>
                    </>
                }
            </Form>
        </Widget>
    )
}



