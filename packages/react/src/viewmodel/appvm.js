//import { core, Block } from "@essenza/core";
import { core, Block } from "@essenza/core";
import { ViewModel } from "./viewmodel";

export function AppVM() {
    ViewModel.call(this);
    this.block = new Block();
    this.block.add(() => this.context.emit("READY"));

    this.context.session.listen("SESSION_LOADED", this);
    this.context.urlinfo.listen("URL_REQUEST", this);
}

core.prototypeOf(ViewModel, AppVM, {
    intent: { //swipe or override
        BUILD: ({ context }) => {
            if (!context.built) {
                context.build();
                this.block.wait(context.initialize());
            }
        },

        SESSION: ({ context }) => {
            this.block.wait(context.session.load());
        },

        SESSION_LOADED: ({ data }) => {
            const task = this.createTask().make(token => {
                if (token.info.status === "ACK")
                    this.context.emit("LOGIN", data.value);
                else
                    this.context.emit("AUTH", data.value);
            }).useInfo(data);

            this.block.add(task);
        },

        URL_REQUEST: ({ data }) => {
            const task = this.createTask().make(token => {
                this.context.emit("LOADING_REQUEST", token.info);
            }).useInfo(data);

            this.block.add(task);
        },

        LOADED: () => {
            this.block.execute();
        }
    },
});


/*this.observe("LOADED", this.context.session).make(({ data }) => {
    const task = this.getIntent("SESSION_LOADED", { data: data });
    this.block.add(task);
});

this.observe("URL_REQUEST", this.context.urlinfo).make(({ data }) => {
    const task = this.getIntent("REQUEST_LOADED", { data: data });
    this.block.add(task);
});*/