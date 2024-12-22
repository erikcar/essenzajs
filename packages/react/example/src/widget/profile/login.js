import React, { useEffect } from 'react';
import { useWidget, UserVM, Widget, useForm, Form, FormItem } from "@essenza/react";

import { Button, Input } from 'antd';

export function Login({ user, rules }) {
    const vm = useWidget(UserVM);
    const form = useForm(user, { rules });

    useEffect(() => {
        let instance = form.target.getFieldInstance("email");
        instance.focus();
    }, []);

    return (
        <Widget>
            <Form form={form} style={{ marginTop: '24px' }} layout='vertical' className="layout-form">
                <FormItem label="Email" name="email">
                    <Input placeholder="Email"></Input>
                </FormItem>
                <FormItem label="Inserisci Password" name="password">
                    <Input.Password placeholder="password"></Input.Password>
                </FormItem>
                <FormItem className="text-center">
                    <Button className='btn-dark' onClick={() => vm.emit("LOGIN")}>
                        Login
                    </Button>
                </FormItem>
            </Form>
        </Widget>
    )
}