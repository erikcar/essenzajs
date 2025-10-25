import React from 'react';
import { useVista } from '../hook/corehook';
//import { Vista } from './vista';
import { ViewModel } from '../viewmodel/viewmodel';

function Vista({ vm, target, children }) {
    if (target) {
        vm.parent = target;
        target.$$scoped = vm.scope;
    }
    return children;
}

export const PopUp = ViewModel.create({
    "@vista": Vista,

    $$constructor() {

    },
});