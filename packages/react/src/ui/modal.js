import React from 'react';
import { useVista } from '../hook/corehook';
import { Vista } from './vista';

export function PopUp({ target, children }) {
    const vm = useVista();
    if (target) {
        vm.parent = target;
    }

    return (
        <Vista>
            {children}
        </Vista>
    )
}