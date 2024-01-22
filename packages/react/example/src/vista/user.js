import { useVista, Vista } from "@essenza/react";

import { UserDetail } from "../widget/user";

export function UserVista() {
    const vm = useVista();
    return (
        <Vista>
            <UserDetail />
        </Vista>
    )
}