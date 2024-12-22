import { useVista, useModel, Vista, ViewModel, core, UserVM, UserModel } from "@essenza/react";
import { Button } from "antd";
import { useEffect } from "react";
import { Profile } from "../../widget/profile/profile";

export function UserVista() {
    const vm = useVista(UserVVM);
    const [user, data] = useModel(UserModel);

    useEffect(() => {
        const item = vm.context.navdata;
        user.item(item.id);
    }, [user, vm]);

    return (
        <Vista>
            <Profile user={data} rules={vm.rules}  />
            <Button onClick={() => vm.emit("SAVE")}>Salva</Button>
        </Vista>
    )
}

export function UserVVM() {
    ViewModel.call(this);
    this.user = this.bind(UserVM);
}

core.prototypeOf(ViewModel, UserVVM, {
    rules: null,
    intent: {
        SAVE: async function () {
            const form = this.user.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                validation.data.save();
            }
        },
    }
}); 