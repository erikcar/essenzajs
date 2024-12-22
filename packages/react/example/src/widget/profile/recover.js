import React from 'react';
import { useWidget, UserVM, Widget, useForm, Form, FormItem } from "@essenza/react";

import { Button, Input, notification } from 'antd';

export function Recover({ user, rules }) {
    const vm = useWidget(UserVM);
    const form = useForm(user, { rules });

    return (
        <Widget>
            <Form form={form} layout='vertical' className="layout-form">
                <FormItem label="E-mail" name="email">
                    <Input />
                </FormItem>
                <div className='text-right'>
                    <Button className='btn-dark' onClick={() => {
                        vm.emit("RECOVERY");
                        notification.info("Controlla la tua mail per recuperare la password! Se entro pochi minuti non ricevi la mail di recupero, verifica se è finita nello spam oppure invia una nuova richiesta");
                    }}>
                        Invia Richiesta
                    </Button>
                </div>
            </Form>
        </Widget>
    )
}