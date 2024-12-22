import React from 'react';
import { useWidget, UserVM, Widget, useForm, Form, FormItem } from "@essenza/react";

import { Button, Input } from 'antd';

export function Password({ user, rules }) {
    const vm = useWidget(UserVM);
    const form = useForm(user, { rules });

    return (
        <Widget>
            <Form form={form} style={{ marginTop: '24px' }} layout='vertical' className="layout-form">
                <FormItem label="Email" name="email">
                    <Input placeholder="Email"></Input>
                </FormItem>
                <FormItem label="Password Attuale" name="tpassword">
                    <Input.Password autoComplete="new-password" >
                    </Input.Password>
                </FormItem>
                <FormItem label="Nuova Password" name="password">
                    <Input.Password placeholder="password"></Input.Password>
                </FormItem>
                <FormItem label="Conferma Nuova Password" name="cpassword">
                    <Input.Password placeholder="conferma password"></Input.Password>
                </FormItem>
                <FormItem className="text-center">
                    <Button className='btn-dark' onClick={() => vm.emit("PASSWORD_CHANGE")}>
                        Aggiorna
                    </Button>
                </FormItem>
            </Form>
        </Widget>
    )
}