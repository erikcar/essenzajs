import { core, ViewModel } from "@essenza/react";

export function HomeVM(){
    ViewModel.call(this);
}

core.prototypeOf(ViewModel, HomeVM, {
    intent: { //swipe or override
        GOTO_ADMIN: ({ context }) => {
            context.navigate("uadmin");
        },
    }
});