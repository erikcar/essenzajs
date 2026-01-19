/** @fileoverview packages/react/src\viewmodel\welcomevm.js */
import { core } from "@essenza/core";
import { ViewModel } from "./viewmodel";
import { FirstAccess } from "../ui/firstaccess";
import { Loader } from "../ui/loader";
import { Login } from "../ui/login";

/**
 * WelcomeVM function.
 * @returns {void}
 */
export function WelcomeVM() {
    ViewModel.call(this);
    this.data;
    
    this.listenGlobal("AUTH");
    this.listenGlobal("LOADING_REQUEST");
}

core.prototypeOf(ViewModel, WelcomeVM, {
    faui: FirstAccess, //Da spostare in view...
    
    loginui: <Login />, //Da spostare in view...

    intent: {
                /**
         * AUTH method.
         * @returns {void}
         */
                AUTH: () => {
            this.Content = "AUTH";
        },

                /**
         * LOADING_REQUEST method.
         * @param {any} param1
         * @returns {void}
         */
                LOADING_REQUEST: ({ data }) => {
            this.data = data;
            let Element;
            if (data.type === "FIRST_ACCESS") Element = this.faui;
            this.Content = <Element data={data} />
        },
    },

    $obsevable: { content: <Loader /> },
});


