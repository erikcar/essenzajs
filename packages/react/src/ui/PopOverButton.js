import React, { useEffect, useState } from "react";
import { Popover } from "antd";
import { useVM } from "../hook/corehook";
import { ViewModel } from "../viewmodel/viewmodel";
import { core } from "@essenza/core";

export function PopOverButton(info) {
    const [visible, setVisible] = useState(false);

    const vm = useVM(PopupButtonVM)
    vm.visible = setVisible;

    const handleVisibleChange = (newVisible) => {
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

export function PopupButtonVM() {
    ViewModel.call(this);
}

core.prototypeOf(ViewModel, PopupButtonVM, {
    setVisible(visible){
        this.visible(visible);
    }
});

