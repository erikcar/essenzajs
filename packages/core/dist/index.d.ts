/**
 * Apix Definition
 */
interface apixOption {

}

interface apixCall {
  id: string;
  option: apixOption;
  resolve: (result: object) => void;
  reject: (reason: object) => void;
}

interface apix {
  apiUrl: string;
  call_queue: Array<apixCall>;
  channel: object;
  dataOp: string;
  method: string;
  option: apixOption;
  parser: null;
  queryOp: string;
  retry: IRetry;
  call: (op: string, data: object, opt: apixOption) => Promise<object>;
  callMany: () => Promise<object>;
  CanExecute: (id: string, mode: string) => boolean;
  checkQueue: (config: apixOption) => void;
  findCall: (id: string) => apixCall;
  formatOption: (opt: apixOption) => void;
  rawCall: (opt: apixOption, resolve: (result: object) => void, reject: (reason: object) => void) => void;
  syncCall: () => void;
}

interface apixConstructor {
  new(pid: string, option?: apixOption): webObject;
}

export const Apix: apix;

export interface IRetry {
  count: number;
  apply: (er: string) => null;
  canApply: (er: string) => boolean;// && er.type !== "RESPONSE";
  reset: () => null;
}

export interface callRetry extends IRetry {
  attempts: number;
  onApply: Function;
  wait: number;
}

interface callRetryConstructor {
  new(num?: number, wait?: number): callRetry;
}

export var callRetry: callRetryConstructor;

export interface IApixChannel {
  send: (opt: apixOption) => Promise<any>;
}

export interface axiosChannel extends IApixChannel {
  baseUrl: string;
}

interface axiosChannelConstructor {
  new(baseUrl?: string): axiosChannel;
}

export var axiosChannel: axiosChannelConstructor;

/********************************************************
 * END Apix Definition
 ********************************************************/

/**
 * CORE Definition
 */
export interface Control {};

export interface Model {
  api:apix;
};

export interface IContext {
  context: context;
  initialized: boolean;
  overridden: Map<string, any>;
  model: (model: Model, f: Function) => void;
  getControl: (control: Function, target: object) => Control;
  setControl: (target: object, control: Function) => Control;
}

interface contextConstructor {
  new(): IContext;
}

export var context: contextConstructor;

export const core = {
  built: boolean,

  getCookie: (name: string) => string | null,

  document: {
    oncontent: (f: Function) => null,
    onload: (f: Function) => null,
    onunload: (f: Function) => null,
  },

  context: IContext,

  services: object,

  observableProperty: (proto: any, key: string) => null,

  create: (api: object) => object,

  extend: (base: Function, api: object) => any,

  prototypeOf: (target: object, source: object, properties: object) => object,

  inject: (type: Function, services: string) => null,

  build: (ctx: context) => null,

  setContext: (ctx: context) => null
}

export interface deferredAction {
  offset: number;
  timer: null;
  waiting: boolean;
  execute: () => void;
  setOffset: (value: number) => void;
}

export interface deferredActionConstructor {
  new(action: Function, offset?: number): deferredAction;
}

export var deferredAction: deferredActionConstructor;

export interface waitAction {
  time: number;
  action: Function;
  deferred: deferredAction;
  execute: () => void;
  executeNow: () => void;
}

export interface waitActionConstructor {
  new(action: Function, wait?: number): waitAction;
}

export var waitAction: waitActionConstructor;

/***************************************************************
 * END CORE Definition
 ***************************************************************/

export interface lifeCycle {
  load: (fn: Function) => void;
  unload: (fn: Function) => void;
}

export interface webground {
  getCookie: (name: string) => string | null;
  lifeCycle: lifeCycle;
}

export interface wostore {
  save: (object: webObject) => void;
  getData: (object: webObject) => object;
}

export const localStore: wostore;
export const sessionStore: wostore;

export interface webObject {
  data: object;
  initialized: boolean;
  local: boolean;
  option: object;
  pid: string;
  store: wostore;
  syncronize: boolean;
  init: (option: object) => object;
  save: () => void;
  setField: (name: string, value: any) => void;
  setOption: (option: object, reset: boolean) => void;
  sync: () => Promise<object>;
  syncOnNextLoad: () => void;
  toJSON: () => string;
}



export var webObject: webObject;
//export function webObject(pid: string, decorator: Function, option: object);

export type onbreakpoint = (info: object, media: string, breakpoint: string) => void;


export interface wgsession extends webObject {
  logged: string;
  onReady: Array<Function>;
  onresize: waitAction;
  polyfilled: boolean;
  time: number;
  user: webObject;

  onbreakpoint: onbreakpoint;
  ready: (fn: Function) => void;
  resize: () => void;
  start: () => void;
}

export const session: wgsession;



export var isString: (value: string) => boolean;
