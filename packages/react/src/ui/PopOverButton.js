/** @fileoverview packages/react/src\ui\PopOverButton.js */
import React, { useEffect, useState } from "react";
import { Popover } from "antd";
import { useVM } from "../hook/corehook";
import { ViewModel } from "../viewmodel/viewmodel";
import { core } from "@essenza/core";

/**
 * PopOverButton function.
 * @param {any} info
 * @returns {any}
 */
export function PopOverButton(info) {
    const [visible, setVisible] = useState(false);

    const vm = useVM(PopupButtonVM)
    vm.visible = setVisible;

    const     /**
     * handleVisibleChange function.
     * @param {any} newVisible
     * @returns {void}
     */
handleVisibleChange = (newVisible) => {
        setVisible(newVisible);
    };

    return (
        <Popover
            content={info.content}
            title={info.title}
            trigger="click"
            visible={visible}
            onVisibleChange={handleVisibleChange}
        >
            <button className={info.className}>{info.title}</button>
        </Popover>
    )
}

/**
 * PopupButtonVM function.
 * @returns {void}
 */
export function PopupButtonVM() {
    ViewModel.call(this);
}

core.prototypeOf(ViewModel, PopupButtonVM, {
        /**
     * setVisible method.
     * @param {any} visible
     * @returns {void}
     */
        setVisible(visible){
        this.visible(visible);
    }
});




