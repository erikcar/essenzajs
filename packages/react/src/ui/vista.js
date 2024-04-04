import React from 'react';
import { useApp } from "../hook/corehook";

//--> Probabilmente non serve React.context se lo setto in ogni VM, oppure uso react context per return di context VM

//export const VistaContext = React.createContext(null);
function CloseVista({app}){
    app.resetScope();
    return null;
}

export function Vista({ children }){
    const app = useApp();
    app.scope.current.$$initialized();
    app.scope.current = null;
    console.log("DEBUG-VISTA", app, children);
    return (<>
        {children}
        <CloseVista app={app}/>
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