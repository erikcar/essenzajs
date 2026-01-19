/** @fileoverview packages/react/src\ui\widget.js */
import React from 'react';
import { useApp, useModel, useWidget } from "../hook/corehook";
import { core } from "@essenza/core";


/**
 * ResetScope function.
 * @param {any} param1
 * @returns {any}
 */
export function ResetScope ({vm}) {//vm build serve??? forse corrisponde a useEffect...
    //vm.$initialized(); vm.$build();
    vm.onrendered && vm.onrendered();
    core.context.resetScope(vm);
    return null;
}
/**
 * Blur solo se è open (focusin) ovvero è stato chiamato un useVM
 * @param {*} children 
 * @returns 
 */
/**
 * Widget function.
 * @param {any} param1
 * @returns {any}
 */
export function Widget({ children }) {
    const vm = core.context.scope.current;
    vm.$$initialized();
    return (<>
        {children}
        <ResetScope vm={vm} />
    </>)
}

export const /**
 * widget function.
 * @param {any} callback
 * @param {any} vmc
 * @returns {any}
 */
widget = (callback, vmc) => {
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

export const /**
 * useEssenza function.
 * @param {any} callback
 * @returns {any}
 */
useEssenza = (callback) => {
    return function (props) {
        core.context.esid = props.esid ? props.esid : null;
        return callback(props);
    }
}


