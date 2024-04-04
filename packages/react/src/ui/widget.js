import React from 'react';
import { useApp, useModel, useWidget } from "../hook/corehook";
import { core } from "@essenza/core";


/**
 * Blur solo se è open (focusin) ovvero è stato chiamato un useVM
 * @param {*} children 
 * @returns 
 */
export function Widget({ children }) {
    const vm = core.context.scope.current;
    vm.$$initialized();
    return (<>
        {children}
        {() => {//vm build serve??? forse corrisponde a useEffect...
            //vm.$initialized(); vm.$build();
            core.context.resetScope(vm);
            return null;
        }} 
    </>)
}

export const widget = (callback, vmc) => {
    console.log("WIDGET FUNCT");
    return function (props) {
        const vm = useWidget(vmc, props);
        console.log("WIDGET FUNCT IN");
        return <>
            {callback({ ...props, vm })}
        </>
    }
}