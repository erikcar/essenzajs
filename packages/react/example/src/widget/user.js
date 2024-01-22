import { useWidget, useModel, Widget, useForm, Form, FormItem } from "@essenza/react";
import { UserDetailVM } from "./uservm";
import { UserData } from "../data/user";
import { useEffect } from "react";
import { Input } from 'antd';

export function UserDetail() {
    const vm = useWidget(UserDetailVM);
    const [data, user] = useModel(UserData);
    const form = useForm(data);

    useEffect(() => {
        const item = vm.context.navdata;
        user.item(item.id);
    }, [user, vm])

    return (
        <Widget>
            <Form form={form} >
                <FormItem label="Nome" name="tname">
                    <Input placeholder="Mario"></Input>
                </FormItem>
                <FormItem label="Cognome" name="tsurname">
                    <Input placeholder="Rossi"></Input>
                </FormItem>
                <FormItem label="Azienda" name="tbusinessname">
                    <Input placeholder="Nome Azienda"></Input>
                </FormItem>
                <FormItem label="Email" name="temail">
                    <Input placeholder="email@email.it"></Input>
                </FormItem>
            </Form>
        </Widget>
    )
}



