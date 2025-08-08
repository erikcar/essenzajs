export function State(name, temp) {
    this.name = name;
    this.key = null;
    this.storage = temp ? sessionStorage : localStorage;

    let state = JSON.parse(this.storage.getItem(name));
    this.data = state?.data;
    this.dict = new Map(state ? Object.entries(state.map) : null);
}

State.prototype = {
    cache() {
        this.name && this.storage.setItem(this.name, JSON.stringify({ data: this.data, map: Object.fromEntries(this.dict) }));
    },

    empty() {
        this.name && this.storage.removeItem(this.name);
    },

    store(value, key) {
        key = key || this.key;
        if (key) {
            this.dict.set(key, value);
        }
        else this.data = value;
    },

    restore(key) {
        key = key || this.key;
        return key ? this.dict.get(key) : this.data
    },

    clean(key) {
        key = key || this.key;
        if (key) {
            this.dict.delete(key);
        }
        else this.data = null;
    }
}