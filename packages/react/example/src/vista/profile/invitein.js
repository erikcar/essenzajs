import { useVista, useModel, Vista, ViewModel, core, UserVM, UserModel, RULES } from "@essenza/react";
import * as yup from 'yup';
import { useEffect } from "react";
import { Button } from "antd";
import { Invitein } from "../../widget/profile/invitein";

export function InviteVista() {
    const vm = useVista(InviteVVM);
    const [user, data] = useModel(UserModel);

    useEffect(() => {
        const item = vm.context.navdata;
        user.setSource(item);
    }, [user, vm]);

    return (
        <Vista>
            <Invitein user={data} rules={vm.rules} enableInvite={true} />
            <Button onClick={() => vm.emit("CONFIRM")}>Conferma</Button>
        </Vista>
    )
}

export function InviteVVM() {
    ViewModel.call(this);
    this.user = this.bind(UserVM);
}

core.prototypeOf(ViewModel, InviteVVM, {
    get rules(){  return yup.object({
        email: RULES.email(yup),
        password: RULES.password(yup),
        cpassword: RULES.confirm(yup),
    })},

    intent: {
        CONFIRM: async function ({ context }) {
            const form = this.user.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                const model = this.$user;
                console.log("FORM IS VALID", this.user.invite);
                this.user.invite ? model.invite(validation.data) : model.create(validation.data);
            }
        },
    }
}); 