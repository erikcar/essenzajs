import { core } from "@essenza/core";
import { UserModel } from "../model/usermodel";
import { ViewModel } from "./viewmodel";
import React from 'react';

export function UserVM() {
    ViewModel.call(this);
    this.model = this.inject(UserModel);
}

core.prototypeOf(ViewModel, UserVM, {
    doaction(key, item){
        console.log("ACTION: ", key, item, this.hasOwnProperty(key));
        if(this[key])
            this[key](item);
    },

    link(item){
        this.model.createInvite(item).then(link=>{
            console.log(link.data);
            const Widget = this.LinkWidget;
            this.context.openModal({content: <Widget link={link.data} user={item} vm={this} />});
            //atob()
        })
    },

    archivie(item){
        const data = this.model.source;
        if(Array.isArray(data)){
            this.context.openModal({
                content: "Sei sicuro di voler eliminare " + item.email + " ?",
                onOk: () => {
                    item.$password = null;
                    data.archivie(item).then(()=>this.update())
                },
            })
        } 
    },

    delete(item) {
        const data = this.model.source;
        if(Array.isArray(data)){
            this.context.openModal({
                content: "Sei sicuro di voler eliminare " + item.email + " ?",
                onOk: () => {
                    item.$password = null;
                    data.delete(item).then(()=>this.update())
                },
            })
        } 
    },

    intent: {
        DELETE: function () {

        },

        SIGNIN: async function ({ emitter }) {
            const form = emitter.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                return new UserModel().signin(validation.data);
            }
        },

        FIRST_ACCESS: async function ({ data, emitter }) {
            const form = data?.form || emitter.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                return new UserModel().passwordReset(validation.data);
            }
        },

        INVITEIN: async function () {
            const validation = await this.validate("INVITE_FORM");
            if (validation.isValid) {
                return new UserModel().createProfile(validation.data);
            }
            else{
                return Promise.reject(validation);
            }
        },

        PROFILE_UPDATES: async function () {
            const validation = await this.validate("PROFILE_FORM");
            if (validation.isValid) {
                return new UserModel().updateProfile(validation.data);
            }
        },

        LOGIN: async function ({ emitter }) {
            const validation = await this.validate("LOGIN_FORM");
            if (validation.isValid) {
                const model = new UserModel();
                if (!validation.data.email) {
                    let instance = validation.target.getFieldInstance("email");
                    instance.focus();
                    instance.blur();

                    setTimeout(() => {
                        validation.form.submit();
                        model.login(validation.data)
                    }, 1000)
                }
                else {
                    model.login(validation.data);
                }
            }
        },

        RECOVER: async function ({ emitter }) {
            const validation = await this.validate("RECOVER_FORM");
            if (validation.isValid) {
                return new UserModel().passwordRequest(validation.data);
            }
        },

        PASSWORD_CHANGE: async function ({ data, emitter }) {
            const form = data || emitter.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                return new UserModel().passwordChange(validation.data);
            }
        },

        PROFILE_UPDATE: async function ({ emitter }) {
            const form = emitter.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                return new UserModel().update(validation.data);
            }
        },
    }
});