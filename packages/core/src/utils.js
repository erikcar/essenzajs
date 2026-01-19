/** @fileoverview packages/core/src\utils.js */
export const $Array = {
    /**
   * remove method.
   * @param {any} array
   * @param {any} p
   * @returns {any}
   */
    remove: (array, p) => {
    const index = array.findIndex(p);
    if (index > -1) array.splice(index, 1);
    return index;
  },

    /**
   * removeItem method.
   * @param {any} array
   * @param {any} item
   * @returns {any}
   */
    removeItem: function (array, item) {
    return this.remove(array, i => i === item)
  },

    /**
   * removeById method.
   * @param {any} array
   * @param {any} item
   * @returns {any}
   */
    removeById: function (array, item) {
    return this.remove(array, i => i.id === item.id);
  },

    /**
   * removeAt method.
   * @param {any} array
   * @param {any} index
   * @returns {void}
   */
    removeAt: (array, index) => {
    index > -1 && index < array.length && array.splice(index, 1);
  },

    /**
   * split method.
   * @param {any} array
   * @param {any} p
   * @returns {any}
   */
    split: (array, p) => {
    const index = array.findIndex(p);
    let removed = array.splice(index, 1);
    return removed.length > 0 ? removed[0] : null;
  },

    /**
   * concat method.
   * @param {any} ...arrays
   * @returns {void}
   */
    concat: (...arrays) => arrays.filter(Array.isArray).reduce((acc, curr) => acc.concat(curr), []),
}

export const $String = {
    /**
   * capitalize method.
   * @param {any} word
   * @returns {void}
   */
    capitalize: (word) => word.charAt(0).toUpperCase() + word.slice(1),
    /**
   * is method.
   * @param {any} value
   * @returns {void}
   */
    is: value => typeof value === 'string',
    /**
   * toColor method.
   * @param {any} text
   * @returns {void}
   */
    toColor: text => HSLtoString(generateHSL(text)),
    /**
   * initial method.
   * @param {any} name
   * @param {any} len
   * @returns {any}
   */
    initial: (name, len) => {
    const parts = name.split(' ')
    let initials = '';
    if (parts.length === 1) {
      initials = parts[0].substr(0, len || 2).toUpperCase();
    }
    else {
      len = len || parts.length;
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].length > 0 && parts[i] !== '') {
          initials += parts[i][0].toUpperCase();
        }
      }
    }
    return initials;
  }
}

export const $Type = {
    /**
   * isObject method.
   * @param {any} obj
   * @returns {void}
   */
    isObject: obj => obj && typeof obj === 'object' && obj.constructor === Object,
  // typeof(obj) === 'function', Object.prototype.toString.call(x) == '[object Function]', x instanceof Function
    /**
   * isFunction method.
   * @param {any} obj
   * @returns {void}
   */
    isFunction: obj => obj && typeof (obj) === 'function',// && Object.prototype.toString.call(obj) == '[object Function]', 

    /**
   * isString method.
   * @param {any} value
   * @returns {void}
   */
    isString: value => typeof value === 'string',

    /**
   * of method.
   * @param {any} obj
   * @returns {void}
   */
    of: obj => Object.getPrototypeOf(obj).constructor,
    /**
   * nameOf method.
   * @param {any} obj
   * @returns {void}
   */
    nameOf: obj => this.of(obj).name,
}

export const $date = {
    /**
   * addDays method.
   * @param {any} date
   * @param {any} days
   * @returns {any}
   */
    addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

/**
 * createRandomString function.
 * @param {any} length
 * @returns {any}
 */
export function createRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * assignIfNull function.
 * @param {any} target
 * @param {any} source
 * @returns {void}
 */
export function assignIfNull(target, source) {
  for (const key in source) {
    const field = target[key];
    if (field === undefined || field === null || (Array.isArray(field) && field.length === 0)) target[key] = source[key];
  }
}

/**
 * sleep function.
 * @param {any} timeout
 * @returns {any}
 */
export function sleep(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
/**
 * getParamNames function.
 * @param {any} func
 * @returns {any}
 */
function getParamNames(func) {
  var fnStr = func.toString().replace(STRIP_COMMENTS, '');
  var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if (result === null)
    result = [];
  return result;
}

/**
 * randomIntFromInterval function.
 * @param {any} min
 * @param {any} max
 * @returns {any}
 */
export function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export const DateEnum = { day: 'Day', week: 'WorkWeek', month: 'Month' }

/**
 * DateInterval function.
 * @param {any} format
 * @param {any} date
 * @returns {any}
 */
export function DateInterval(format, date) {
  format = format || DateEnum.day;
  date = date || new Date();
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

/**
 * isString function.
 * @param {any} s
 * @returns {any}
 */
export function isString(s) {
  return typeof s === 'string';
}

/**
 * todecimal function.
 * @param {any} value
 * @returns {any}
 */
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

/**
 * ArrayMoveElementAt function.
 * @param {any} arr
 * @param {any} fromIndex
 * @param {any} toIndex
 * @returns {void}
 */
export function ArrayMoveElementAt(arr, fromIndex, toIndex) {
  const element = arr.splice(fromIndex, 1)[0];
  arr.splice(toIndex, 0, element);
}

/**
 * ArrayOrderElementAt function.
 * @param {any} arr
 * @param {any} fromIndex
 * @param {any} toIndex
 * @param {any} field
 * @returns {void}
 */
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

const hRange = [0, 360];
const sRange = [0, 100];
const lRange = [0, 100];

const /**
 * getHashOfString function.
 * @param {any} str
 * @returns {any}
 */
getHashOfString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  return hash;
};

const /**
 * normalizeHash function.
 * @param {any} hash
 * @param {any} min
 * @param {any} max
 * @returns {any}
 */
normalizeHash = (hash, min, max) => {
  return Math.floor((hash % (max - min)) + min);
};

const /**
 * generateHSL function.
 * @param {any} name
 * @returns {any}
 */
generateHSL = (name) => {
  const hash = getHashOfString(name);
  const h = normalizeHash(hash, hRange[0], hRange[1]);
  const s = normalizeHash(hash, sRange[0], sRange[1]);
  const l = normalizeHash(hash, lRange[0], lRange[1]);
  return [h, s, l];
};

const /**
 * HSLtoString function.
 * @param {any} hsl
 * @returns {any}
 */
HSLtoString = (hsl) => {
  return `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
};

export const /**
 * stringToColor function.
 * @param {any} text
 * @returns {void}
 */
stringToColor = (text) => HSLtoString(generateHSL(text));

/**
 * debounce function.
 * @returns {void}
 */
export function debounce() {
  this.$$debouncing = new Set();
}

debounce.prototype = {
    /**
   * ensure method.
   * @param {any} evt
   * @param {any} timeout
   * @returns {any}
   */
    ensure(evt, timeout = 200) {
    evt = "default";
    if (!this.$$debouncing.has(evt)) {
      this.$$debouncing.add(evt);
      setTimeout(() => this.$$debouncing.delete(evt), timeout);
      return true;
    }
    return false;
  }
}




