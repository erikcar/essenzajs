import { core, Block } from "@essenza/core";
import { ViewModel } from "./viewmodel";

export function AppVM() {
    ViewModel.call(this);
    this.loaded = false;
    this.block = this.context.block;
    this.block.add(() => this.context.emit("READY"));

    this.context.session.listen("SESSION_LOADED", this);
    this.context.url.listen("URL_REQUEST", this);
}

core.prototypeOf(ViewModel, AppVM, {
    intent: { //swipe or override
        BUILD: function({ context }) {
            if (!context.built) {
                this.block.wait(context.build(this));
            }

            this.context.url.init(this.block);
        },

        SESSION: function ({ context }) {
            this.block.wait(context.session.load());
        },

        SESSION_LOADED: function({ data })  {
            const task = this.createTask().make(token => {
                if (token.info.status === "ACK")
                    this.context.emit("LOGGED", data.value);
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
            if(!this.loaded){
                this.loaded = true;
                this.block.execute(this.context);
            }
        }
    },
});