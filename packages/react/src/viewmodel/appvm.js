/** @fileoverview packages/react/src\viewmodel\appvm.js */
import { core, Block } from "@essenza/core";
import { ViewModel } from "./viewmodel";

/**
 * AppVM function.
 * @param {any} alive
 * @returns {void}
 */
export function AppVM(restored) {
    ViewModel.call(this);
    this.restored = restored;
}

core.prototypeOf(ViewModel, AppVM, {
    async init() {

        this.loaded = false;
        this.block = this.context.block;
        this.block.add(() => this.context.emit("READY"));

        if (!this.restored) {
            this.context.session.listen("SESSION_LOADED", this);
            this.context.url.listen("URL_REQUEST", this);
        }
    },
    /**
 * build method.
 * @returns {void}
 */
    build: function () {
        if (this.restored) {
            this.context.build(this);
        }
        else {
            if (!this.context.built) {
                this.block.wait(this.context.build(this));
            }

            this.context.url.init(this.block);
        }
    },

    /**
 * loadSession method.
 * @returns {void}
 */
    loadSession() {
        if (this.context.url.hasRequest) return;
        this.restored
            ? this.context.emit("LOGGED", this.restored)//this.context.loggedIn(this.restored, true)
            : this.block.wait(this.context.session.load());
    },

    intent: { //swipe or override
        /* BUILD: function ({ context }) {
             if (this.loaded) {
                 context.build(this);
             }
             else {
                 if (!context.built) {
                     this.block.wait(context.build(this));
                 }
 
                 this.context.url.init(this.block);
             }
         },
 
         SESSION: function ({ context }) {
             this.loaded
                 ? context.loggedIn(JSON.parse(this.restored))
                 : this.block.wait(context.session.load());
         },*/

        /**
 * SESSION_LOADED method.
 * @param {any} param1
 * @returns {void}
 */
        SESSION_LOADED: function ({ data }) {
            const task = this.createTask().make(token => {
                if (token.info.status === "ACK")
                    this.context.emit("LOGGED", data.value);
                else
                    this.context.emit("AUTH", data.value);
            }).useInfo(data);

            this.block.add(task);
        },

        /**
         * URL_REQUEST method.
         * @param {any} param1
         * @returns {void}
         */
        URL_REQUEST: function ({ data }) {
            const task = this.createTask().make(token => {
                this.context.emit("LOADING_REQUEST", token.info);
            }).useInfo(data);

            this.block.add(task);
        },

        /**
 * LOADED method.
 * @returns {void}
 */
        LOADED: function () {
            if (!this.loaded) {
                this.loaded = true;
                this.block.execute(this.context);
            }
        }
    },
});


