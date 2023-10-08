import React from 'react';
import * as yup from 'yup';

import { Button, Input } from 'antd';

import { DataSource, AppModel } from '@essenza/core';
import { useControl, useForm, Formix, FormixItem } from '@essenza/react';

function FirstAccessController(c) {
    c.skin = FirstAccess;
    c.command = {
        FIRST_ACCESS: async (request, { model, app }) => {
            let form = c.form("fa-form");
            let result = await form.validate();
            console.log("FA FORM VALIDATION", form, result);
            if (result.isValid) {
                request.password = result.data.tpassword;
                model.read(AppModel, m => m.passwordReset(request).then(r => app.login(r)));
            }
        }
    }
}

export function FirstAccess({ request }) {
    const [control] = useControl(FirstAccessController);
    
    const form = useForm("fa-form", new DataSource({email: request?.data.get("fam")}), control, null, yup.object({
        tpassword: yup.string().required("Password è una informazione richiesta.").matches(
            /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,24}$/,
            "Deve contenere Almeno 8 Caratteri, almeno una maiuscola, almeno una minuscola, almeno un umero ed almeno un carattere speciale"
        ),
        cpassword: yup.string().required("Conferma password richiesta.").test('passwords-match', 'Passwords non corrispondenti', function (value) {
            console.log("YUP", this, this.parent, value);
            return this.parent.tpassword === value;
        }),
    }));

    const token = request?.data.get("fareq");
    const id = request?.data.get("faid");
    console.log("FA TOKEN", token);

    const content = request
        ? <Formix control={control} form={form} style={{marginTop: '24px'}} layout='vertical' className="layout-form">
            <FormixItem label="Email" name="email">
                <Input disabled={true} placeholder="Email"></Input>
            </FormixItem>
            <FormixItem label="Inserisci Password" name="tpassword">
                <Input.Password placeholder="password"></Input.Password>
            </FormixItem>
            <FormixItem label="Conferma Password" name="cpassword">
                <Input.Password placeholder="conferma password"></Input.Password>
            </FormixItem>
            <FormixItem className="text-center">
                <Button className='btn-dark' onClick={() => control.execute("FIRST_ACCESS", { token: token, id: id })}>
                    Conferma
                </Button>
            </FormixItem>
        </Formix>
        : <h6>Richiesta scaduta o non valida.</h6>;

    return content;
}