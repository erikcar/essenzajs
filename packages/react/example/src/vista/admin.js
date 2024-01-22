
import { useVista, Vista } from "@essenza/react";

import { AdminWidget } from "../widget/admin";

export function AdminVista() {
    const vm = useVista();

    return (
        <Vista>
            <AdminWidget />
        </Vista>
    )
}