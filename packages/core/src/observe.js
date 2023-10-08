import { Block, Flow, Task } from "./code";
import { core } from "./core";
import { $Array } from "./utils";

export function Observer(event, task, parent) {
    this.key;
    this.event = event;
    this.filter;
    this.task = task; //Potrebbe sempre essere un block, ovvero se non lo è lo creo....
    this.rule;
    this.parent = parent;
    this.data;
    this.owner;
    this.input;
    this.disposable;

    this.useKey = function(key){
        this.key = key;
        return this;
    }

    this.prepend = function(){
        this.input = true;
        return this;
    }

    this.once = function () {
        this.disposable = true;
        return this;
    }

    this.when = function (callback) {
        if (!this.filter) this.filter = [];
        this.filter.push(callback);
        return this;
    }

    this.target = function (target) {
        return this.when((info => info.target === target))
    }

    this.onEtype = function (etype) {
        return this.when((info => info.etype === etype))
    }

    this.typeOf = function (type) {
        return this.when((info => info.type === type))
    }

    this.withName = function (name) {
        return this.when((info => info.name === name))
    }

    this.onPath = function (path) {
        return this.when((info => info.path === path))
    }

    this.make = function (callback, prepend) {
        this.task = callback;
        if (prepend) this.input = true;
        return this;
    }

    this.with = function (target, prepend) {
        this.owner = target;
        return this.make(info => info.current.observer.execute(info), prepend);
    }

    this.withData = function (data) {
        this.data = data;
        return this;
    }



    //TODO: oneTime() o similare per cui si auto unobserve (potrebbe essere dopo num di volte o in base a condition)

    this.policy = function (rule) { this.rule = rule; return this; }

    this.executable = function (info) {
        if (!this.task) return false;

        if (this.filetr) {
            for (let k = 0; k < this.filter.length; k++) {
                if (!Task.execute(this.filter[k], info)) return false; //value
            }
        }

        return true;
    }

    this.execute = function (info) {
        return this.executable() && Task.execute(this.task, info);
    }

    this.dispose = function () {
        this.parent && this.parent.unobserve(this);
    }
}

export function Observable(name, etype, type) {
    Object.defineProperty(this, 'observers', { enumerable: false, writable: true, value: {} });
    Object.defineProperty(this, 'type', { enumerable: false, writable: true, value: type });

    this.name = name || "root";
    this.etype = etype;
    this.path;

    this.observe = function (event, task) {
        if (!this.observers.hasOwnProperty(event)) this.observers[event] = [];
        const obs = new Observer(task, event, this);
        this.observers[event].push(obs);
        return obs;
    }

    /** 
     * info
     * evt
     * target
     * currentTarget
     * data
     * emitter
     * current
     * obs
     * ctx
     * base
    */
    this.emit = function (event, data, target) {
        target = target || this;

        const info = { event, data, target, emitter: this, etype: this.etype, type: this.type, name: this.name, path: this.path, context: this.context, current: null };
        const flow = new Flow();

        if (target.control && target.control[event]) {
            flow.task(target.control[event].bind(target), "main", target);
        }

        if (this !== target && this.control && this.control[event]) {
            flow.task(this.control[event].bind(this), "main", this);
        }

        const constructor = function (collection, currentTarget, observable) {
            collection && collection.forEach(obs => {
                obs.executable() &&
                    (obs.rule
                        ? obs.rule(flow, new Block(obs.task, { key: obs.key, path: observable.path }, currentTarget), info)
                        : flow.push(obs.task, { key: obs.key, path: observable.path }, { target: currentTarget, data: obs.data, observer: obs.owner }, obs.input)
                    );
            });
        }

        const build = (current, currentTarget) => {
            while (current) {
                if (current instanceof Observable) {
                    currentTarget = currentTarget?.parent;
                    constructor(current.observers[event], currentTarget, current);
                    constructor(current.observers['*'], currentTarget, current);
                }
                current = current.parent;
            }
        }

        build(this, target);
        build(this.context); // CTX EMIT / GLOBAL EMIT

        flow.execute(info);
    }

    this.unobserve = function (obs) {
        if (obs instanceof Observer) $Array.remove(this.observers[obs.event], obs);
        //TODO: Caso elimino in base a key, ciclo tutto però potrei avere in eventi diversi chiavi uguali???
    }

    this.clear = function () { this.observers = {}; }
}

core.inject(Observable, "IContext");

export function IObservable() {
    this.observable = new Observable();
    this.observe = function (event) { this.observable.observe(event); }
    this.emit = function (event, data) { this.observable.emit(event, data, this) }
}

//observe: null=> actual node, '*' => global (graph observer), path => node find by path