/** @fileoverview packages/react/src\ui\vista.js */
import React from 'react';
import { useApp } from "../hook/corehook";

//--> Probabilmente non serve React.context se lo setto in ogni VM, oppure uso react context per return di context VM

//export const VistaContext = React.createContext(null);
/**
 * CloseVista function.
 * @param {any} param1
 * @returns {any}
 */
export function CloseVista({app, vm}){
    app.resetScope();
    return null;
}

/**
 * Vista function.
 * @param {any} param1
 * @returns {any}
 */
export function Vista({ children }){
    const app = useApp();
    app.scope.current.$$initialized();
    //app.scope.current = null;
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


