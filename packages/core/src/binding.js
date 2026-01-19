/** @fileoverview packages/core/src\binding.js */
import { core } from "./core";

/**
 * Shared function.
 * @param {any} target
 * @param {any} key
 * @returns {void}
 */
export function Shared(target, key) {
    this.target = target;
    this.key = key;
    this.next = null;
    this.format = [];
}

Shared.prototype = {
        /**
     * bind method.
     * @param {any} source
     * @returns {void}
     */
        bind(source) {
        
        this.formatSource(source);
        this.format.forEach(f => f(source, this.target));
        this.name && (this.target[this.name] = source);
    },

        /**
     * formatSource method.
     * @param {any} source
     * @returns {void}
     */
        formatSource(source){
        if(this.all){
            if(!this.source) this.source = [];
            this.source.push(source);
        }
        else{
            this.source = source;
        }
    },

        /**
     * listen method.
     * @param {any} event
     * @param {any} task
     * @returns {any}
     */
        listen(event, task) {
        this.format.push(s => s.listen(event, task || this.target));
        return this;
    },

        /**
     * observe method.
     * @param {any} event
     * @param {any} obs
     * @returns {any}
     */
        observe(event, obs) {
        const task = obs ? obs.createTask() : new Task();
        this.format.push( s => s.listen(event, task));
        return task;
    },

        /**
     * with method.
     * @param {any} f
     * @returns {any}
     */
        with(f) {
        this.format.push(f);
        return this;
    },

        /**
     * as method.
     * @param {any} name
     * @returns {any}
     */
        as(name) {
        this.name = name;
        return this;
    }
}

/**
 * Binder function.
 * @returns {void}
 */
export function Binder() {
    this.map = new Map();
}
 
Binder.prototype = {
    /**Per ora getsisco caso come se esiste un solo type attivo contemporaneamente */
    share: function (type, target, key) {
        const shared = new Shared(target, key)
        if (this.map.has(type))
            shared.next = this.map.get(type);

        this.map.set(type, shared);

        return shared;
    },

        /**
     * unshare method.
     * @param {any} type
     * @param {any} target
     * @param {any} key
     * @returns {any}
     */
    unshare: function (type, target, key) {
        let shared
        if (this.map.has(type)){
            let shared = this.map.get(type);

            while (shared) {
                if(shared.target === target && shared.key === key) break;
                shared = shared.next;
            }

            if(shared){
                shared.next ? this.map.set(type, shared.next) : this.map.delete(type);
            }
        }
        
        return shared;
    },

        /**
     * bind method.
     * @param {any} type
     * @param {any} key
     * @returns {any}
     */
        bind: function (type, key) {
        const source = new type();
        let shared;
        if (this.map.has(type)) {
            shared = this.map.get(type);
            while (shared) {
                shared.key === key && shared.bind(source);
                shared = shared.next;
            }
        }
        return source;
    },

    /*find: function (type, path) {
        let shared;
        if (this.map.has(type)) {
            shared = this.map.get(type);
            while (shared) {
                if (shared.path === path) {
                    break;
                }
                shared = shared.next;
            }
        }
        return shared;
    },

    addOrCreate: function (type, path, target) {
        const node = new Node(target);
        const shared = this.find(type, path);
        return shared ? shared.instance : this.share(type, path).instance;
        return node;
    },

    

    firstOrDefault: function (type, path) {
        const shared = this.first(type, path, false);
        return shared ? shared.instance : new type();
    },

    firstOrCreate: function (type, path) {
        const shared = this.first(type, path);
        return shared ? shared.instance : this.share(type, path).instance;
    },*/
}

/** Da aggiungere poi condition */
/*export function Shared(type, path) {
    this.instance = new type();
    this.path = path;
    this.next = null;
    this.nodes = [];
}

Shared.prototype = {
    bind(source) {
        this.nodes.forEach(n => n.bind(source));
    }
}*/


