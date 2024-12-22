import { useWidget, Widget, core, ViewModel, RULES } from "@essenza/react";
import React from "react";
import * as yup from 'yup';

import { FirstAccess } from "../widget/profile/firstaccess";
import { Recover } from "../widget/profile/recover";

export function Welcome() {
    const vm = useWidget(WelcomeVM, arguments);
    const config = vm.context.navdata;
    let content = [<FirstAccess rules={vm.rules.fa()} />, <Recover rules={vm.rules.recover()}/>]
    return (
        <Widget>
            <div>WELCOME</div>
            <button onClick={e => vm.emit("GO_HOME", { title: "home" })}>HOME</button>
            <button onClick={e => vm.emit("DO_SOMETHING", { title: "home" })}>HOME</button>
            {/* {content} */}
        </Widget>
    )
}

export function WelcomeVM() {
    ViewModel.call(this);
}

core.prototypeOf(ViewModel, WelcomeVM, {
    rules: {
        fa: ()=>yup.object({
            password: RULES.password(yup),
            cpassword: RULES.confirm(yup),
        }),

        recover: ()=>yup.object({
            email: RULES.email(yup),
        }),

        signin: ()=>yup.object({
            email: RULES.email(yup),
            password: RULES.password(yup),
            cpassword: RULES.confirm(yup),
        }),
    },

    intent: { //swipe or override
        GO_LOGIN: ({ context }) => {
            context.navigate("home");
        },
        DO_SOMETHING: ({ data }) => {
        }
    }
});