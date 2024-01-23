import { core, Block } from "@essenza/core";
import { ViewModel } from "./viewmodel";

export function AppVM() {
    ViewModel.call(this);
    this.block = new Block();
    this.block.add(() => this.context.emit("READY"));

    this.context.session.listen("SESSION_LOADED", this);
    this.context.url.listen("URL_REQUEST", this);
}

core.prototypeOf(ViewModel, AppVM, {
    intent: { //swipe or override
        BUILD: function({ context }) {
            if (!context.built) {
                this.block.wait(context.build());
            }
        },

        SESSION: function ({ context }) {
            this.block.wait(context.session.load());
        },

        SESSION_LOADED: function({ data })  {
            const task = this.createTask().make(token => {
                if (token.info.status === "ACK")
                    this.context.emit("LOGIN", data.value);
                else
                    this.context.emit("AUTH", data.value);
            }).useInfo(data);

            this.block.add(task);
        },

        URL_REQUEST: function({ data }) {
            const task = this.createTask().make(token => {
                this.context.emit("LOADING_REQUEST", token.info);
            }).useInfo(data);

            this.block.add(task);
        },

        LOADED: function(){
            this.block.execute();
        }
    },
});