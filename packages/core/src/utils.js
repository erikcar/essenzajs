export const $Array = {
  remove: (array, p) => {
    const index = array.findIndex(p);
    if (index > -1) array.splice(index, 1);
    return index;
  },

  removeItem: (array, p) => {
    const index = array.findIndex(i => i === p);
    if (index > -1) array.splice(index, 1);
    return index;
  },

  removeAt: (array, index) => {
    index > -1 && index < array.length && array.splice(index, 1);
  }
}

export const $String = {
  capitalize: (word) => word.charAt(0).toUpperCase() + word.slice(1),
  is: value => typeof value === 'string'
}

export const $Type = {
  isObject: obj => obj && typeof obj === 'object' && obj.constructor === Object,
  // typeof(obj) === 'function', Object.prototype.toString.call(x) == '[object Function]', x instanceof Function
  isFunction: obj => obj && typeof (obj) === 'function',// && Object.prototype.toString.call(obj) == '[object Function]', 

  isString: value => typeof value === 'string',

  of: obj => Object.getPrototypeOf(obj).constructor,
  nameOf: obj => this.of(obj).name,
}

export function assignIfNull(target, source) {
  for (const key in source) {
    const field = target[key];
    if (field === undefined || field === null || (Array.isArray(field) && field.length === 0)) target[key] = source[key];
  }
}

export function sleep(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
  var fnStr = func.toString().replace(STRIP_COMMENTS, '');
  var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if (result === null)
    result = [];
  return result;
}

export function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export const DateEnum = { day: 'Day', week: 'WorkWeek', month: 'Month' }

export function DateInterval(format, date) {
  format = format || DateEnum.day;
  date = date || new Date();
  console.log("DateInterval", format, date);
  date.setHours(0, 0, 0, 0);
  let te;
  if (format === DateEnum.day) {
    te = new Date(date);
    te.setDate(date.getDate() + 1)
    return { ts: date.toISOString().substring(0, 19), te: te.toISOString().substring(0, 19) };
  }
  else if (format === DateEnum.week) {
    let day = date.getDay() - 1;
    if (day === -1)
      day = 6;

    date.setDate(date.getDate() - day);
    te = new Date(date);
    te.setDate(date.getDate() + 6);
    return { ts: date.toISOString().substring(0, 19), te: te.toISOString().substring(0, 19) };
  }
  else if (format === DateEnum.month) {
    date.setDate(1);
    let day = date.getDay() - 1;
    if (day === -1)
      day = 6;

    date.setDate(date.getDate() - day);
    te = new Date(date);
    te.setDate(date.getDate() + 35);
    return { ts: date.toISOString().substring(0, 19), te: te.toISOString().substring(0, 19) };
  }
}

export function isString(s) {
  return typeof s === 'string';
}

export function todecimal(value) {
  if (!value) return 0;
  var result = 0;
  if (value.indexOf("€") == -1)
    result = Number(value.replace(/\,/g, "."));
  else if (value[0] == "€")
    result = Number(value.substr(2, value.length - 2).replace(/\,/g, "."));
  else
    result = Number(value.substr(0, value.length - 2).replace(/\,/g, "."));
  return result;
}

export function ArrayMoveElementAt(arr, fromIndex, toIndex) {
  const element = arr.splice(fromIndex, 1)[0];
  console.log(element);
  arr.splice(toIndex, 0, element);
}

export function ArrayOrderElementAt(arr, fromIndex, toIndex, field) {
  field = field || "iorder";

  ArrayMoveElementAt(arr, fromIndex, toIndex);

  let s, e;
  if (fromIndex < toIndex) {
    s = fromIndex;
    e = toIndex + 1;
  }
  else {
    s = toIndex;
    e = fromIndex + 1;
  }
  for (let k = s; k < e; k++) {
    arr[k][field] = k + 1;
  }
}


