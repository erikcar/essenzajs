import { core } from "@essenza/core";
import { ViewModel } from "./viewmodel";

export function FormVM() {
    ViewModel.call(this);
}

core.prototypeOf(ViewModel, FormVM, {
    formatSchema(config){
        if(!this.initialized){
            if(!this.$$schema) return config;
            if(!config) return this.$$schema();
            let s = this.$$schema(config);
    
            for (const key in config) {
                if(key[0] === '$'){
                    //const k = key.substring(1);
                    //s[k] = config[key](s[k]);
                    if(key !== "$rules")
                        Object.assign(s[key.substring(1)], config[key]);
                    else
                        s.$$rules = config[key];
                }
                else{
                    s[key] = config[key];
                }
            }
            return s;
        }
    },

    $intent: {
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
