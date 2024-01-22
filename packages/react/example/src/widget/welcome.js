import { useWidget, Widget, core, ViewModel } from "@essenza/react";

export function Welcome() {
    const vm = useWidget(WelcomeVM);
    return (
        <Widget>
            <div>WELCOME</div>
            <button onClick={e=>vm.emit("GO_HOME")}>HOME</button>
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
    }
});