/** @fileoverview packages/react/src\viewmodel\uservm.js */
import { core } from "@essenza/core";
import { UserModel } from "../model/usermodel";
import { ViewModel } from "./viewmodel";
import React from 'react';

/**
 * UserVM function.
 * @returns {void}
 */
export function UserVM() {
    ViewModel.call(this);
    this.model = this.inject(UserModel);
}

core.prototypeOf(ViewModel, UserVM, {
    /**
 * doaction method.
 * @param {any} key
 * @param {any} item
 * @returns {void}
 */
    doaction(key, item) {
        console.log("ACTION: ", key, item, this.hasOwnProperty(key));
        if (this[key])
            this[key](item);
    },

    /**
 * link method.
 * @param {any} item
 * @returns {void}
 */
    link(item) {
        this.model.createInvite(item).then(link => {
            console.log(link.data);
            const Widget = this.LinkWidget;
            this.context.openModal({ content: <Widget link={link.data} user={item} vm={this} /> });
            //atob()
        })
    },

    /**
 * archivie method.
 * @param {any} item
 * @returns {void}
 */
    archivie(item) {
        const data = this.model.source;
        if (Array.isArray(data)) {
            this.context.openModal({
                content: "Sei sicuro di voler eliminare " + item.email + " ?",
                /**
 * onOk method.
 * @returns {void}
 */
                onOk: () => {
                    item.$password = null;
                    data.archivie(item).then(() => this.update())
                },
            })
        }
    },

    /**
 * delete method.
 * @param {any} item
 * @returns {void}
 */
    delete(item) {
        const data = this.model.source;
        if (Array.isArray(data)) {
            this.context.openModal({
                content: "Sei sicuro di voler eliminare " + item.email + " ?",
                /**
 * onOk method.
 * @returns {void}
 */
                onOk: () => {
                    item.$password = null;
                    data.delete(item).then(() => this.update())
                },
            })
        }
    },

    intent: {
        /**
 * DELETE method.
 * @returns {void}
 */
        DELETE: function () {

        },

        /**
 * SIGNIN method.
 * @param {any} param1
 * @returns {Promise<any>}
 */
        SIGNIN: async function ({ emitter }) {
            const form = emitter.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                return new UserModel().signin(validation.data);
            }
        },

        /**
* SIGNUP method.
* @returns {Promise<any>}
*/
        SIGN_IN: async function () {
            const validation = await this.validate("SIGN_FORM");
            if (validation.isValid) {
                return this.model.signin(validation.data);
            }
            else {
                return Promise.reject(validation);
            }
        },

        /**
* SIGNUP method.
* @returns {Promise<any>}
*/
        SIGN_UP: async function ({data}) {
            const validation = await this.validate("SIGN_FORM");
            if (validation.isValid) {
                const result = await this.model.signup(validation.data, data?.confirm);
                validation.data.mutation.clear();
                validation.data.id = result.data.id;
                return result;
            }
            else {
                return Promise.reject(validation);
            }
        },

        /**
 * FIRST_ACCESS method.
 * @param {any} param1
 * @returns {Promise<any>}
 */
        FIRST_ACCESS: async function ({ data, emitter }) {
            const form = data?.form || emitter.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                return new UserModel().passwordReset(validation.data);
            }
        },

        /**
 * INVITEIN method.
 * @returns {Promise<any>}
 */
        INVITEIN: async function () {
            const validation = await this.validate("INVITE_FORM");
            if (validation.isValid) {
                return new UserModel().createProfile(validation.data);
            }
            else {
                return Promise.reject(validation);
            }
        },

        /**
 * PROFILE_UPDATES method.
 * @returns {Promise<any>}
 */
        PROFILE_UPDATES: async function () {
            const validation = await this.validate("PROFILE_FORM");
            if (validation.isValid) {
                return new UserModel().updateProfile(validation.data);
            }
        },

        /**
 * LOGIN method.
 * @param {any} param1
 * @returns {Promise<any>}
 */
        LOGIN: async function ({ data }) {
            const validation = await this.validate("LOGIN_FORM");
            if (validation.isValid) {
                const model = new UserModel();
                if (!validation.data.email) {
                    let instance = validation.target.getFieldInstance("email");
                    instance.focus();
                    instance.blur();

                    setTimeout(() => {
                        validation.form.submit();
                        model.login(validation.data, data)
                    }, 1000)
                }
                else {
                    model.login(validation.data, data);
                }
            }
        },

        /**
 * RECOVER method.
 * @param {any} param1
 * @returns {Promise<any>}
 */
        RECOVER: async function ({ emitter }) {
            const validation = await this.validate("RECOVER_FORM");
            if (validation.isValid) {
                return new UserModel().passwordRequest(validation.data);
            }
        },

        /**
 * PASSWORD_CHANGE method.
 * @param {any} param1
 * @returns {Promise<any>}
 */
        PASSWORD_CHANGE: async function ({ data, emitter }) {
            const form = data || emitter.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                return new UserModel().passwordChange(validation.data);
            }
        },

        /**
 * PROFILE_UPDATE method.
 * @param {any} param1
 * @returns {Promise<any>}
 */
        PROFILE_UPDATE: async function ({ emitter }) {
            const form = emitter.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                return new UserModel().update(validation.data);
            }
        },
    }
});


