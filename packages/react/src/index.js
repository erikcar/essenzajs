export { AppRoot } from "./approot"
export { UrlInfo } from "./urlinfo"
export { useApp, useVM, useWidget, useVista, useModel, useBreakPoint, useValue, useData, useSource } from "./hook/corehook"
export { useForm } from "./hook/uihook"
export { ViewModel } from "./viewmodel/viewmodel"
export { Vista } from "./ui/vista"
export { Widget, widget } from "./ui/widget"
export { InputFilter, SelectFilter } from "./ui/InputFilter"
export { Form, FormItem } from "./ui/form"
export { PopOverButton, PopupButtonVM } from "./ui/PopOverButton"
export { Selectable, KeyValueModel } from "./ui/select"
export { Authorize } from "./component/authorize"
export { UserVM } from "./viewmodel/uservm"
export { FormVM } from "./viewmodel/formvm"
export { UserModel } from "./model/usermodel"
export { ComuneModel } from "./model/comune"
export { PersonModel } from "./model/person"
export { Printer } from "./print/Print" 
export { core, DataModel, DataObserver, Link, bool, small, string, decimal, double, float, int, long, date, money, char, $String, $Array } from "@essenza/core"

export const RULES = {
    password: v => v.string().required("Password è una informazione richiesta.").matches(
        /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,24}$/,
        "Deve contenere Almeno 8 Caratteri, almeno una maiuscola, almeno una minuscola, almeno un umero ed almeno un carattere speciale"
    ),

    confirm: (v, field) => {
        field = field || "password";
        return v.string().required("Conferma " + field + " richiesta.").test('passwords-match', field + 'Passwords non corrispondenti', function (value) {
            return this.parent[field] === value;
        });
    },

    email: v => v.string().required("Email è una informazione richiesta.").email("Formato email non corretto")
}