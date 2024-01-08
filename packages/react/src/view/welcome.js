import React from "react";
import { useVM } from "../hook/corehook";
import { AppVM } from "../viewmodel/welcomevm";
import { Vista } from "../ui/vista";

export function Welcome() {
    const vm = useVM(AppVM);

    return (
        <Vista viewmodel={vm}>
            <div>{vm.content}</div>
        </Vista>
    )
}