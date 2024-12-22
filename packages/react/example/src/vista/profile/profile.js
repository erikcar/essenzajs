import { useVista, useModel, Vista, ViewModel, core, UserVM, UserModel } from "@essenza/react";
import { Button } from "antd";
import { useEffect } from "react";
import { Profile } from "../../widget/profile/profile";

export function ProfileVista() {
    const vm = useVista(ProfileVVM);
    const [user, data] = useModel(UserModel);

    useEffect(() => {
        user.profile();
    }, [user, vm]);

    return (
        <Vista>
            <Profile user={data} rules={vm.rules}  />
            <Button onClick={() => vm.emit("SAVE")}>Salva</Button>
        </Vista>
    )
}

export function ProfileVVM() {
    ViewModel.call(this);
    this.profile = this.bind(UserVM);
}

core.prototypeOf(ViewModel, ProfileVVM, {
    rules: null,
    intent: {
        SAVE: async function () {
            const form = this.profile.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                validation.data.save();
            }
        },
    }
}); 