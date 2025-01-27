import React from 'react';
import { useApp, useModel, useWidget } from "../hook/corehook";
import { core } from "@essenza/core";


function ResetScope ({vm}) {//vm build serve??? forse corrisponde a useEffect...
    //vm.$initialized(); vm.$build();
    core.context.resetScope(vm);
    return null;
}
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
        <ResetScope vm={vm} />
    </>)
}

export const widget = (callback, vmc) => {
    return function (props) {
        const vm = useWidget(vmc, props);
        return <>
            {callback({ ...props, vm })}
            {() => {
                vm.context.resetScope(vm);
                return null;
            }}
        </>
    }
}

export const useEssenza = (callback) => {
    return function (props) {
        core.context.esid = props.esid ? props.esid : null;
        return callback(props);
    }
}