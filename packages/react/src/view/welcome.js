import React from "react";
import { useVM } from "../hook/corehook";
import { AppVM } from "../viewmodel/welcomevm";
import { Vista } from "../ui/vista";
import { Login } from "../ui/login";
import { FirstAccess } from "../ui/firstaccess";
import { Loader } from "../ui/loader";

export function Welcome() {
    const vm = useVM(AppVM);
    
    let content = <Loader />;

    if(vm.state === "AUTH") 
        content = <Login />;
    else if(vm.state === "FIRST_ACCESS")
        content = <FirstAccess />;


    return (
        <Vista viewmodel={vm}>
            <div>{vm.content}</div>
        </Vista>
    )
}