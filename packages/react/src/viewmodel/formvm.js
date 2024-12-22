import { core } from "@essenza/core";
import { ViewModel } from "./viewmodel";

export function FormVM() {
    ViewModel.call(this);
    this.rules = null;
    this.formatter = null;
}

core.prototypeOf(ViewModel, FormVM, {
    formatSchema(config) {
        if (!this.initialized) {
            if (!this.$$schema) return config;
            if (!config) return this.$$schema();
            let s = this.$$schema(config);

            for (const key in config) {
                if (key[0] === '$') {
                    //const k = key.substring(1);
                    //s[k] = config[key](s[k]);
                    if (key !== "$rules")
                        Object.assign(s[key.substring(1)], config[key]);
                    else
                        s.$$rules = config[key];
                }
                else {
                    s[key] = config[key];
                }
            }
            return s;
        }
    },

    getSchema() {
        let schema = {};
        if (this.$rules) schema.rules = { default: this.rules };
        schema.formatter = this.formatter;
        return schema;
    },

    $intent: {
        RESET: function () {
            this.form.target.resetFields();
        },

        CANCEL: function ({ context }) {
            context.navigate(-1);
        },

        SUBMIT: async function ({ token }) {
            const validation = await this.form.validate(true);

            if (!validation.isValid) {
                token.stopFlow = true;
            }

            token.data = validation;
        },

        SAVE: async function ({ token }) {
            const validation = await this.form.validate(true);
            if (validation.isValid) {
                token.data = validation.data;
                return validation.data.save();
            }
            else
                token.stopFlow = true;
        },
    }
});
