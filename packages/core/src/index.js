export { core, sessionStore, localStore, waitAction, deferredAction, donothing } from "./core"
export { DataModel } from "./model"
export { context } from "./context"
export { $Data, DataObject, MutableObject } from "./data"
export { axiosChannel } from "./channels/AxiosChannel"
export { fetchChannel } from "./channels/FetchChannel"
export { Link } from "./graph";
export { TypeSchema } from "./metadata"
export { Observable, DataObserver } from "./observe"
export { Block } from "./code"
export {Shared } from "./binding"
export { isString, $Array, assignIfNull, $String, $Type } from "./utils"

export const bool = 0;
export const small = 1;
export const string = 2;
export const decimal = 3;
export const double = 4;
export const float = 5;
export const int = 6;
export const long = 7;
export const date = 8;
export const money = 3;
export const char = 2;