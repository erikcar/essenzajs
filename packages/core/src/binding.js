import { core } from "./core";

export function Shared(target, key) {
    this.target = target;
    this.key = key;
    this.next = null;
    this.format = [];
}

Shared.prototype = {
    bind(source) {
        this.source = source;
        this.format.forEach(f => f(source, this.target));
        this.name && (this.target[this.name] = source);
    },

    listen(event, task) {
        this.format.push(s => s.listen(event, task || this.target));
        return this;
    },

    observe(event, obs) {
        const task = obs ? obs.createTask() : new Task();
        this.format.push( s => s.listen(event, task));
        return task;
    },

    with(f) {
        this.format.push(f);
        return this;
    },

    as(name) {
        this.name = name;
        return this;
    }
}

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