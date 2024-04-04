
import { useVista, useModel, ViewModel, Vista, core, UserVM, UserModel } from "@essenza/react";
import { useEffect } from "react";
import { Button } from "antd";
import { UserAdmin } from "../../widget/profile/admin";

export function UserAdminVista() {
    const vm = useVista(UserAdminVVM);

    const [user, data] = useModel(UserModel);

    useEffect(() => {
        user.collection();
    }, [user])

    return (
        <Vista>
            <Button onClick={()=>vm.emit("USER_INVITE", user.newInstance())}>Nuovo Utente</Button>
            <UserAdmin data={data} />
        </Vista>
    )
}

export function UserAdminVVM(){
    ViewModel.call(this);
    this.admin = this.bind(UserVM); 
    this.admin.listen("USER_DETAIL", this);
    this.admin.listen("USER_DELETE", this);
}

core.prototypeOf(ViewModel, UserAdminVVM, {
    intent: { //swipe or override
        USER_INVITE: function({context, data}){
            context.navigate("invite", data);
        },

        USER_DETAIL: function({context, data}){
            context.navigate("user-detail", data);
        },

        USER_DELETE: function({data}){
            data.delete();
        }
    }
});

