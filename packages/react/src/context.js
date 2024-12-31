import { core, context, $Type } from "@essenza/core";
import { UrlInfo } from "./urlinfo";
import { Role } from "./role";
import { Session } from "./session";
import { Modal, Spin } from "antd";
import React from "react";
import { PopUp } from "./ui/modal";

export const appcontext = function () {
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
}

core.prototypeOf(context, appcontext, {
    config: { serviceRoute: "api/", authRoute: "login" }, //potrei mettere authComponent, anche in doppio mode view/popup

    /** Build context before any load, init and render*/

    build: function (vm) {
        if (!this.built) {
            this.built = true;
            //this.core.build(this);
            this.configureService({ imodal: Modal });
        }
    },

    render: function(vm){
        this.updateScope(vm);
        //Da Gestire caso path
        this.shared.has(vm.$Type) && this.shared.set(vm.$Type, vm);
    },

    rendered: function(vm){

    },

    /** Initialize context after AppRoot and childen are rendered*/

    openModal(info, target){
        info.content = <PopUp target={target}>{info.content}</PopUp>
        this.popup = Modal[info.kind || "info"](info);
        return this.popup;
    },

    closeModal(){
        if(this.popup){
            this.popup.destroy();
            this.popup = null;
        } 
    },

    openError(info){
        Modal.error(info);
    },

    openSuccess(info){
        Modal.success(info);
    },

    openLoader(content, title){
        this.loader = this.openModal( {
            content: content || <Spin />,
            title: title || "Loading...",
            centered: true,
            width: 680,
            icon: null,
            footer: null,
            //loading: content ? false : true,
        })
    },

    closeLoader(){
        this.loader && this.loader.destroy();
        this.loader = null;
    },

    navigate: function (path, data) {
        this.navdata = data === undefined ? this.navstore.get(path) : data;
        this.navstore.set(path, data);
        this._navigator(path);
    },

    loaded: function () {

    },

    intent: {
        LOGGED: function ({ data }) {
            this.logged = true;
            
            if ($Type.isString(data.profile))
                data.profile = JSON.parse(data.profile);

            this.role.current = data.profile.itype;
            this.session.start(data);

            //this.vm && this.vm.update();
        },

        LOGOUT: function ({ data }) {
            this.session.end();
            this.navigate("/");
        },
    }
});

Object.defineProperty(appcontext.prototype, "navigator", {
    set: function (value) {
        if (value !== this._navigator) {
            this._navigator = value;
            this.configureService({ INavigator: value })
        }
    }
});

