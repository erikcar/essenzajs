/** @fileoverview Type declarations for @essenza/core (JS package). */

export const core: any;

export const sessionStore: any;

export const localStore: any;

export function waitAction(action: any, wait: any): void;

export function deferredAction(action: any, offset: any): void;

export function donothing(): void;

export class DataModel {
 constructor();
 ExecuteApi(url: any, params: any, option: any): any;
 ExecuteScalar(url: any, params: any, option: any): any;
 ExecuteQuery(url: any, params: any, option: any): any;
 ExecuteMany(models: any, url: any, params: any, option: any): any;
 ExecuteGraphQuery(url: any, graph: any, data: any, option: any): any;
 collection(predicate: any): any;
 item(id: any): any;
 ServiceApi(name: any, data: any, option: any): any;
 delete(data: any, option: any): any;
 setSource(source: any, cast: any, formatted: any): any;
 filter(predicate: any, field: any): any;
 filterAll(key: any, predicate: any): void;
 clean(): void;
 reset(key: any, raw: any): void;
 createSource(key: any, call: any, initialData: any, predicate: any): any;
 sync(item: any): void;
 refresh(): void;
 remove(item: any): void;
 request(callback: any, values: any): void;
 newInstance(initialValues: any): any;
 defaultOption: any;
 $implement: any;
 etype: any;
}

export class context {
 constructor();
 initialize(init: any): any;
 focus(target: any): void;
 blur(target: any): any;
 registerScope(scope: any): any;
 attachScope(type: any, key: any, nobind: any): any;
 storeCurrent(current: any): void;
 restoreCurrent(): void;
 updateScope(scoped: any): void;
 setScope(scope: any): any;
 resetScope(root: any): void;
 forward(target: any, key: any): void;
 bind(type: any, path: any): any;
 sync(mutation: any): void;
 setSource(key: any, source: any): Promise<any>;
 getSource(key: any, initialValue: any): any;
 subscribe(target: any): any;
 unscribe(target: any): void;
 model(model: any, f: any): void;
 newInstance(etype: any, initialValues: any): any;
 mutable(api: any): any;
 getControl(control: any, target: any): any;
 configureType(definition: any): void;
 setBaseUrl(url: any): void;
 configureService(services: any): void;
 configure(target: any, config: any): void;
 override(control: any): void;
 share(key: any, el: any): void;
 unshare(key: any, el: any): void;
 useMessenger(uid: any): any;
 cache(state: any): any;
 core: any;
}

export const $Data: any;

export class DataObject {
 constructor();
 save(option: any): any;
 delete(): any;
 remove(): any;
 archivie(field: any): any;
 sync(item: any): any;
 refresh(item: any): void;
 update(source: any): void;
 toGraph(): any;
}

export class MutableObject {
 constructor();
 mutate(field: any, value: any): void;
 observable(): void;
}

export function DataFilter(source: any, condition: any, callback: any): void;

export function axiosChannel(baseUrl: any): void;

export function fetchChannel(): void;

export const Link: any;

export const TypeSchema: any;

export function Observable(): void;

export function DataObserver(fields: any, required: any): void;

export class Block {
 constructor();
 wait(task: any): void;
 add(): any;
 execute(token: any): void;
 reset(): void;
}

export function Shared(target: any, key: any): void;

export function Request(name: any, callback: any, data: any): void;

export function State(name: any, temp: any): void;

export function isString(s: any): any;

export const $Array: any;

export function assignIfNull(target: any, source: any): void;

export const $String: any;

export const $Type: any;

export function debounce(): void;

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
