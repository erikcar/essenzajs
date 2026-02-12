/** @fileoverview packages/react/src\context.js */
import { core, context, $Type } from "@essenza/core";
import { UrlInfo } from "./urlinfo";
import { Role } from "./role";
import { Session } from "./session";
import { Modal, Spin } from "antd";
import React from "react";
import { PopUp } from "./ui/modal";

export const /**
 * appcontext function.
 * @returns {void}
 */
    appcontext = function () {
        context.call(this);
        //const instance = this;
        this.logged = false;
        this._navigator = null;
        this.session = new Session();  //new session from webground???
        this.url = new UrlInfo();
        this.role = new Role();
        this.navdata = null;
        this.navstore = new Map();
        this.loader = null;
        this.popup = null;
        this.popup_content = null;
        this.__name = "APP-CONTEXT";
        this.alive = false;
    }

core.prototypeOf(context, appcontext, {
    config: { serviceRoute: "api/", authRoute: "login" }, //potrei mettere authComponent, anche in doppio mode view/popup

    /** Build context before any load, init and render*/

    build: function (vm) {
        if (!this.built) {
            this.built = true;
            //this.core.build(this);
            this.configureService({ imodal: Modal });

            const iapi = core.services.iapi;

            iapi.onError = token => {
                console.log("ON-ERROR: ", token);
                let message = token.data.hasOwnProperty("uidt") ? token.data.message : token.data;
                if (message === this.popup_content) return;
                this.popup_content = message;
                this.openModal({
                    content: message || "Si è verificato un errore imprevisto.",
                    title: "Errore",
                    centered: true,
                    width: 680,
                    kind: "error",
                    //footer: null,
                })
            };
        }
    },

    /**
 * render method.
 * @param {any} vm
 * @returns {void}
 */
    render: function (vm) {
        this.updateScope(vm);
        //Da Gestire caso path
        this.shared.has(vm.$Type) && this.shared.set(vm.$Type, vm);
    },

    /**
 * rendered method.
 * @param {any} vm
 * @returns {void}
 */
    rendered: function (vm) {

    },

    /** Initialize context after AppRoot and childen are rendered*/

    openModal(info, target) {
        info.content = <PopUp target={target}>{info.content}</PopUp>
        this.popup = Modal[info.kind || "info"](info);
        return this.popup;
    },

    /**
 * closeModal method.
 * @returns {void}
 */
    closeModal() {
        if (this.popup) {
            this.popup.destroy();
            this.popup = null;
            this.popup_content = null;
        }
    },

    /**
 * openError method.
 * @param {any} info
 * @returns {void}
 */
    openError(info) {
        Modal.error(info);
    },

    /**
 * openSuccess method.
 * @param {any} info
 * @returns {void}
 */
    openSuccess(info) {
        Modal.success(info);
    },

    /**
 * openLoader method.
 * @param {any} content
 * @param {any} title
 * @returns {void}
 */
    openLoader(content, title) {
        this.loader = this.openModal({
            content: content || <Spin />,
            title: title || "Loading...",
            centered: true,
            width: 680,
            icon: null,
            footer: null,
            //loading: content ? false : true,
        })
    },

    /**
 * closeLoader method.
 * @returns {void}
 */
    closeLoader() {
        this.loader && this.loader.destroy();
        this.loader = null;
    },

    /**
 * navigate method.
 * @param {any} path
 * @param {any} data
 * @param {any} emit
 * @returns {void}
 */
    navigate: function (path, data, emit) {
        if (data === -1) {
            this.navdata = this.navstore.get(path);
        }
        else {
            this.navdata = data;
            this.navstore.set(path, data);
        }

        if (this.popup) {
            this.popup.destroy();
            this.popup = null;
        }
        if (emit) this.emit("NAVIGATE", { data, path });
        this._navigator(path);
    },

    /**
 * loaded method.
 * @returns {void}
 */
    loaded: function () {

    },

    /**
 * loggedIn method.
 * @param {any} data
 * @param {any} restored
 * @returns {void}
 */
    loggedIn: function (data, restored) {
        this.logged = true;
        if ($Type.isString(data.profile))
            data.profile = JSON.parse(data.profile);
        
        this.role.current = data.profile.itype;
        
        this.session.refresh(data);
        
        /*if (restored) {
            this.session.start(data);
            this.emit("SESSION_RESTORED", data);
        }*/

    },

    intent: {
        /**
 * LOGGED method.
 * @param {any} param1
 * @returns {void}
 */
        LOGGED: function ({ data }) {
            this.loggedIn(data);
            this.session.start(data);
            if (this.alive) {
                localStorage.setItem('_session', JSON.stringify(data));
                const iapi = core.services.iapi;
                iapi.useRefreshToken = true;
                iapi.onRefreshToken = data => this.loggedIn(data);
                iapi.onRefreshTokenExpired = () => this.emit("LOGOUT");
            }
        },

        /**
 * LOGOUT method.
 * @param {any} param1
 * @returns {void}
 */
        LOGOUT: function ({ data }) {
            this.session.end();
            this.logged = false;
            if (this.alive) {
                localStorage.removeItem('_session');
                const iapi = core.services.iapi;
                iapi.useRefreshToken = false;
                iapi.onRefreshToken = null;
                iapi.onRefreshTokenExpired = null;
            }

            window.location.replace(window.location.origin);
        },
    }
});

Object.defineProperty(appcontext.prototype, "navigator", {
    /**
 * set method.
 * @param {any} value
 * @returns {void}
 */
    set: function (value) {
        if (value !== this._navigator) {
            this._navigator = value;
            this.configureService({ INavigator: value })
        }
    }
});




