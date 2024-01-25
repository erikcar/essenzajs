import { useWidget, Widget } from "@essenza/react";
import React from "react";

export function Mobile() {
    console.log("MOBILE RENDER");
    useWidget();
    return (
        <Widget>
            <div className="w-full text-center">MOBILE VISTA NOT SUPPORTED</div>
        </Widget>
    )
}