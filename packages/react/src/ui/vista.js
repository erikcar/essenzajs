import React from 'react';
import { useApp } from "../hook/corehook";

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