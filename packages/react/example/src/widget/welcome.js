import { useWidget, Widget, core, ViewModel } from "@essenza/react";
import React from "react";

export function Welcome() {
    console.log("WELCOME RENDER");
    const vm = useWidget(WelcomeVM);
    
    return (
        <Widget>
            <div>WELCOME</div>
            <button onClick={e=>vm.emit("GO_HOME",{title:"home"})}>HOME</button>
            <button onClick={e=>vm.emit("DO_SOMETHING",{title:"home"})}>HOME</button>
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