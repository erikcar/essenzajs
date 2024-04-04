import { core } from "@essenza/core";
import { UserModel } from "../model/usermodel";
import { ViewModel } from "./viewmodel";

export function UserVM() {
    ViewModel.call(this);
}

core.prototypeOf(ViewModel, UserVM, {
    intent: {
        DELETE: function () {

        },

        SIGNIN: async function ({ emitter }) {
            const form = emitter.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                new UserModel().signin(validation.data);
            }
        },

        FIRST_ACCESS: async function ({ emitter }) {
            const form = emitter.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                new UserModel().passwordReset(validation.data);
            }
        },

        LOGIN: async function ({ emitter }) {
            const form = emitter.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                const model = new UserModel();
                if (!validation.data.email) {
                    let instance = form.target.getFieldInstance("email");
                    instance.focus();
                    instance.blur();

                    setTimeout(() => {
                        form.submit();
                        model.login(form.data)
                    }, 1000)
                }
                else {
                    model.login(validation.data);
                }
            }
        },

        RECOVER: async function ({ emitter }) {
            const form = emitter.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                return new UserModel().passwordRequest(validation.data);
            }
        },

        PASSWORD_CHANGE: async function ({ emitter }) {
            const form = emitter.form;
            const validation = await form.validate(true);
            if (validation.isValid) {
                new UserModel().passwordChange(validation.data);
            }
        },
    }
});