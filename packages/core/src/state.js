/** @fileoverview packages/core/src\state.js */
/**
 * State function.
 * @param {any} name
 * @param {any} temp
 * @returns {void}
 */
export function State(name, temp) {
    this.name = name;
    this.key = null;
    this.storage = temp ? sessionStorage : localStorage;

    let state = JSON.parse(this.storage.getItem(name));
    this.data = state?.data;
    this.dict = new Map(state ? Object.entries(state.map) : null);
}

State.prototype = {
        /**
     * cache method.
     * @returns {void}
     */
        cache() {
        this.name && this.storage.setItem(this.name, JSON.stringify({ data: this.data, map: Object.fromEntries(this.dict) }));
    },

        /**
     * empty method.
     * @param {any} key
     * @returns {void}
     */
        empty(key) {
        this.clean(key);
        this.name && this.storage.removeItem(this.name);
    },

        /**
     * store method.
     * @param {any} value
     * @param {any} key
     * @returns {void}
     */
        store(value, key) {
        key = key || this.key;
        if (key) {
            this.dict.set(key, value);
        }
        else this.data = value;
        this.current = value;
    },

        /**
     * restore method.
     * @param {any} key
     * @returns {any}
     */
        restore(key) {
        this.key = key;
        return key ? this.dict.get(key) : this.data;
    },

        /**
     * clean method.
     * @param {any} key
     * @returns {void}
     */
        clean(key) {
        key = key || this.key;
        if (key) {
            this.dict.delete(key);
        }
        else this.data = null;
        this.current = null;
    }
}


