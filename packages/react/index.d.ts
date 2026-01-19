/** @fileoverview Type declarations for @essenza/react (JS package). */

export function AppRoot(param1: any): any;

export class UrlInfo {
 constructor();
 init(block: any): void;
 isRestricted(): any;
 intent: any;
}

export function useApp(init: any): any;

export function useVM(viewmodel: any): any;

export function useWidget(viewmodel: any, props: any): any;

export function useFragment(part: any, init: any): any;

export function useVista(vistamodel: any): any;

export function useModel(modeltype: any, initialData: any): any;

export function useBreakPoint(size: any): any;

export function useValue(key: any, initValue: any): any;

export function useData(model: any, initialData: any): any;

export function useSource(key: any, initValue: any): any;

export function useFilter(source: any, condition: any): any;

export function useUI(viewmodel: any, initialData: any): any;

export function useForm(data: any, schema: any): any;

export function useFormUI(owner: any, data: any, schema: any): any;

export class ViewModel {
 constructor();
 global(): any;
 assign(target: any, key: any): void;
 $$uid(): any;
 $$init(oninit: any): void;
 $$initialized(): void;
 $$discendant(type: any, path: any): void;
 $$render(): void;
 $$rendered(): void;
 isAncestorOf(el: any): any;
 update(): void;
 bind(type: any, key: any): any;
 use(type: any, key: any): any;
 unbind(type: any, key: any): any;
 share(): void;
 commit(source: any): any;
 inject(type: any): any;
 store(forms: any): any;
 validate(forms: any, submit: any, store: any): Promise<any>;
 validateAll(): Promise<any>;
 unshare(): void;
 request(name: any, callback: any, data: any): void;
 emitSafe(event: any, data: any, timeout: any): void;
 emitOnce(event: any, data: any, target: any, name: any): void;
 authorized(menu: any, role: any): any;
 mutable(obj: any): any;
 queryMany(models: any, url: any, params: any, option: any): any;
 useCache(name: any, temp: any): any;
 intent: any;
}

export function Vista(param1: any): any;

export function UI(): void;

export const Repeater: any;

export function Widget(param1: any): any;

export function widget(callback: any, vmc: any): any;

export function InputFilter(param1: any): any;

export function SelectFilter(param1: any): any;

export function Form(param1: any): any;

export function FormItem(param1: any): any;

export const Attachment: any;

export function PopOverButton(info: any): any;

export class PopupButtonVM {
 constructor();
 setVisible(visible: any): void;
}

export function Selectable(param1: any): any;

export class KeyValueModel {
 constructor();
 getOptions(group: any): any;
 createOption(label: any, group: any): any;
 removeOption(id: any): any;
 etype: any;
}

export function Authorize(param1: any): any;

export class UserVM {
 constructor();
 doaction(key: any, item: any): void;
 link(item: any): void;
 archivie(item: any): void;
 delete(item: any): void;
 intent: any;
}

export class FormVM {
 constructor();
 formatSchema(config: any): any;
 getSchema(): any;
 $intent: any;
}

export class UserModel {
 constructor();
 create(user: any): any;
 invite(user: any): any;
 update(user: any): any;
 formatUri(request: any, user: any): void;
 createInvite(user: any): any;
 sendInvite(user: any): any;
 sendLink(link: any, email: any): any;
 createProfile(user: any): any;
 updateProfile(user: any): any;
 signin(user: any): any;
 emailValidation(id: any, token: any): any;
 login(user: any): any;
 passwordRequest(user: any): any;
 passwordReset(request: any): any;
 passwordChange(user: any): any;
 profile(): any;
 getGroup(idgroup: any): any;
 etype: any;
 config: any;
}

export class ComuneModel {
 constructor();
 search(v: any): void;
 etype: any;
}

export class PersonModel {
 constructor();
 getFiscalCode(data: any): any;
 etype: any;
}

export function Printer(param1: any): any;

export const core: any;

export const DataObject: any;

export const DataModel: any;

export const DataObserver: any;

export const Link: any;

export const bool: any;

export const small: any;

export const string: any;

export const decimal: any;

export const double: any;

export const float: any;

export const int: any;

export const long: any;

export const date: any;

export const money: any;

export const char: any;

export const $String: any;

export const $Array: any;

export const $Data: any;

export const $Type: any;

export const debounce: any;

export const State: any;

export const RULES: any;
