import React from 'react';
import { useWidget, UserVM, Widget, useForm, Form, FormItem } from "@essenza/react";

import { Button, Input } from 'antd';

export function Signin({ user, rules }) {
    const vm = useWidget(UserVM);
    const form = useForm(user, { rules });

    console.log("SIGNIN");

    return (
        <Widget>
            <Form form={form} style={{ marginTop: '24px' }} layout='vertical' className="layout-form">
                <FormItem label="Email" name="email">
                    <Input disabled={true} placeholder="Email"></Input>
                </FormItem>
                <FormItem label="Inserisci Password" name="password">
                    <Input.Password placeholder="password"></Input.Password>
                </FormItem>
                <FormItem label="Conferma Password" name="cpassword">
                    <Input.Password placeholder="conferma password"></Input.Password>
                </FormItem>
                <FormItem className="text-center">
                    <Button className='btn-dark' onClick={() => vm.emit("SIGNIN")}>
                        Registrati
                    </Button>
                </FormItem>
            </Form>
        </Widget>
    )
}