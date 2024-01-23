import { useWidget, Widget, core, ViewModel } from "@essenza/react";
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

export function WelcomeVM(){
    ViewModel.call(this);
}

core.prototypeOf(ViewModel, WelcomeVM, {
    intent: { //swipe or override
        GO_HOME: ({ context }) => {
            context.navigate("home");
        },
        DO_SOMETHING: ({data}) =>{
            console.log(data);
        }
    }
});