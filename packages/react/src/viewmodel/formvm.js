import { core } from "@essenza/core";
import { ViewModel } from "./viewmodel";

export function FormVM() {
    ViewModel.call(this);
}

core.prototypeOf(ViewModel, FormVM, {
    formatSchema(schema){
        if(!this.$$schema) return schema;
        if(!schema) return this.$$schema();
        let s = this.$$schema()
        for (const key in schema) {
            if(key[0] === '$'){
                Object.assign(s[key.substring(1)], schema[key])
            }
            else{
                s[key] = schema[key];
            }
        }
        return s;
    },

    intent: {
        RESET: function () {
            this.form.target.resetFields();
        },

        CANCEL: function ({context}) {
            context.navigate(-1);
        },

        SUBMIT: async function ({ token }) {
            const validation = await this.form.validate(true);

            if (!validation.isValid) {
                console.log("FORM NOT VALID: STOP FLOW", validation.data);
                token.stopFlow = true;
            }
        },

        SAVE: async function ({token}) {
            const validation = await this.form.validate(true);
            if (validation.isValid) {
                console.log("AGENDA BLOCK IS VALID", validation.data);
                token.data = validation.data;
                return validation.data.save();
            }
            else 
                token.stopFlow = true;
        },
    }
});
