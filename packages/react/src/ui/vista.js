import { context } from "@essenza/core";
import { useApp } from "../hook/corehook";
import { useRef } from "react";

//--> Probabilmente non serve React.context se lo setto in ogni VM, oppure uso react context per return di context VM

//export const VistaContext = React.createContext(null);

export function Vista({ children }){
    const app = useApp();
    console.log("DEBUG-VISTA", app, children);
    return (<>
        {children}
        {app.scope.blur() && app.resetScope()}
    </>)
}

/*
    return (
        <VistaContext.Provider value={context} >
            {children}
            {app.unsetCurrent()}
        </VistaContext.Provider>
    )
*/