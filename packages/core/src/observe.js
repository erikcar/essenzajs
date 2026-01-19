/** @fileoverview packages/core/src\observe.js */
import { Flow, ITask, Task } from "./code";
import { core } from "./core";
import { $String, $Type } from "./utils";

/**
 * Observable function.
 * @returns {void}
 */
export function Observable() { }

Observable.prototype = {
    $$type: Observable,

        /**
     * base method.
     * @returns {void}
     */
        base: function () {
        //For future implementation
    },

    events: null,

        /**
     * listen_old method.
     * @param {any} event
     * @param {any} observer
     * @returns {any}
     */
        listen_old: function (event, observer) {
        observer = observer || this;
        const list = this.listeners.get(event);

        if (!list) {
            list = new Set();
            this.listeners.set(event, list)
        }

        const task = observer.createTask(event, { parent: list });
        list.add(task);
        return task;
    },

        /**
     * listen method.
     * @param {any} event
     * @param {any} observer
     * @returns {any}
     */
        listen: function (event, observer) {
        observer = observer || this;
        const proto = Object.getPrototypeOf(this); //this.$$type.prototype;

        if (!proto.events?.hasOwnProperty(event))
            proto.events = { ...proto.events, [event]: new ObserverMap() }

        proto.events[event].push(this, observer);

        return observer;
    },

        /**
     * listenGlobal method.
     * @param {any} event
     * @param {any} observer
     * @returns {any}
     */
        listenGlobal: function (event, observer) {
        return core.context.listen(event, observer || this);
    },

        /**
     * listenLocal method.
     * @param {any} event
     * @param {any} observer
     * @returns {any}
     */
        listenLocal: function (event, observer) {
        return this.context.listen(event, observer || this);
    },

    //CHECK CASE of emitter same type of observer, if emit discendant can call twice task associated with observer
        /**
     * observeOld method.
     * @param {any} event
     * @param {any} observable
     * @returns {any}
     */
        observeOld: function (event, observable) {
        return (observable || this).listen(event, this.createTask());
    },

        /**
     * observe method.
     * @param {any} event
     * @param {any} observer
     * @returns {any}
     */
        observe: function (event, observer) {
        const task = observer ? observer.createTask() : new Task();
        this.listen(event, task);
        return task;
    },

        /**
     * observeGlobal method.
     * @param {any} event
     * @returns {any}
     */
        observeGlobal: function (event) {
        return core.context.observe(event, this);
    },

        /**
     * observeLocal method.
     * @param {any} event
     * @returns {any}
     */
        observeLocal: function (event) {
        return this.context.observe(event, this);
    },

        /**
     * override method.
     * @param {any} event
     * @param {any} observable
     * @param {any} predicate
     * @returns {void}
     */
        override: function (event, observable, predicate) {
        this.observe(event, observable).override(predicate);
    },

        /**
     * unobserve method.
     * @param {any} predicate
     * @returns {void}
     */
        unobserve: function (predicate) {
        predicate = predicate || (() => true);
        this.metadata.get("disposable", Array).forEach(el => el instanceof Observer && predicate(el) && el.dispose());
    },

        /**
     * emit method.
     * @param {any} event
     * @param {any} data
     * @param {any} target
     * @param {any} name
     * @returns {any}
     */
        emit: function (event, data, target, name) {
        target = target || this;

        let noglobal = target !== this.context;
        const token = { event, data, target, name, emitter: this, type: this.$$type, context: this.context };
        const flow = new Flow();

        if (target.intent && target.intent[event]) {
            flow.task(target.intent[event].bind(target), { currentTarget: target, current: this });
        }

        if (this !== target && this.intent && this.intent[event]) {
            flow.task(this.intent[event].bind(this), { currentTarget: target, current: this });
        }

        const         /**
         * constructor function.
         * @param {any} collection
         * @param {any} currentTarget
         * @param {any} observable
         * @returns {void}
         */
constructor = function (collection, currentTarget, observable) {
            collection && collection.forEach(task => {
                if (task instanceof Observable) task = task.createTask();
                else if (!(task instanceof Task)) task = new Task(task);
                if (task.executable(token, { currentTarget, current: observable })) {
                    task.policy
                        ? task.policy(flow, token)
                        : flow.import(task);
                }
            });
        }

        const         /**
         * build function.
         * @param {any} current
         * @param {any} currentTarget
         * @returns {void}
         */
build = (current, currentTarget) => {
            while (current) {
                if (current instanceof Observable) {
                    currentTarget = currentTarget?.parent;
                    constructor(current.getListeners(event), currentTarget, current);
                    constructor(current.getListeners('*'), currentTarget, current);
                    current.intent?.hasOwnProperty(event) && current !== target && constructor([current], currentTarget, current);
                }
                current = current.parent;
                if (current === this.context) noglobal = false;
            }
        }

        build(this, target);
        noglobal && build(this.context); // CTX EMIT / GLOBAL EMIT

        return flow.execute(token);
    },

        /**
     * execute method.
     * @param {any} evt
     * @param {any} token
     * @returns {Promise<any>}
     */
        execute: async function (evt, token) {
        return this.intent?.hasOwnProperty(evt) && await this.intent[evt].bind(this)(token);
    },

        /**
     * createTask method.
     * @param {any} data
     * @returns {any}
     */
        createTask: function (data) {
        return new Task(token => this.execute(token.event, token), { ...data, owner: this });
    },

        /**
     * executeIntent method.
     * @param {any} event
     * @param {any} data
     * @param {any} token
     * @returns {any}
     */
        executeIntent(event, data, token){
        return this.execute(event, token || { event, data, target: this, emitter: this, type: this.$$type, context: this.context, token: {} })
    },

        /**
     * createIntent method.
     * @param {any} name
     * @param {any} data
     * @returns {any}
     */
        createIntent: function (name, data) { //createIntent
        return this.intent?.hasOwnProperty(name)
            ? this.createTask(data).make(this.intent[name].bind(this))
            : null; //oppure donothing task !?!?!?
    },

        /**
     * attach method.
     * @param {any} intent
     * @param {any} data
     * @param {any} callback
     * @returns {void}
     */
        attach: function (intent, data, callback) {
        const block = this.task(intent, data);
        const flow = this.context.flow;
        callback ? callback(flow)(block) : flow.task(block);
    },

        /**
     * getListeners method.
     * @param {any} event
     * @returns {any}
     */
        getListeners: function (event) {
        return this.events ? this.events[event]?.get(this) : null;
    },

        /**
     * disposable method.
     * @param {any} disposable
     * @returns {any}
     */
        disposable: function (disposable) {
        this.metadata.get("disposable", Array).push(disposable);
        return disposable;
    },

        /**
     * metadata method.
     * @returns {any}
     */
        metadata: function () {
        return core.metadata(this);
    },

        /**
     * dispose method.
     * @returns {void}
     */
        dispose: function () {
        this.metadata.get("disposable", Array).forEach(el => el.dispose());
    }
}

core.inject(Observable, "IContext");

/**
 * ObserverMap function.
 * @returns {void}
 */
function ObserverMap() {
    this.map = new WeakMap();
    //this.cache = new WeakMap();
}

core.prototypeOf(ITask, ObserverMap, {
        /**
     * push method.
     * @param {any} target
     * @param {any} observer
     * @returns {void}
     */
        push: function (target, observer) {
        if (!this.map.has(target))
            this.map.set(target, observer);
        else {
            this.map.set(target, [].concat(this.map.get(target), observer));
        }
    },

        /**
     * get method.
     * @param {any} target
     * @returns {any}
     */
        get: function (target) {
        let obs = this.map.get(target);
        if (!Array.isArray(obs)) obs = [obs];
        return obs;
    }
});

/*if (!this.map.has(target))
            this.map.set(traget, observer);
        else if (!this.cache.has(target))
            this.cache.set(traget, observer);
        else{
            this.cache.set(traget, [].concat(this.cache.get(traget), observer));
        }*/

/**
 * DataObserver function.
 * @param {any} fields
 * @param {any} required
 * @returns {void}
 */
export function DataObserver(fields, required) {
    this.fields = fields;
    this.required = required;
}

DataObserver.prototype = {
        /**
     * hasValue method.
     * @returns {any}
     */
        hasValue: function () { this.required = true; return this; },
        /**
     * execute method.
     * @param {any} param1
     * @returns {any}
     */
        execute: function ({ data }) {
        if (this.fields) {
            if (this.required) {
                const fields = this.fields.split(",");
                for (let k = 0; k < fields.length; k++) {
                    if (!data.values[fields[k]]) return false; //Se 0 (zero) rnde false...
                }
            }
            return ("," + this.fields.trim().replaceAll(" ", "") + ",").indexOf("," + data.field + ",") !== -1;
        }
        return false;
    }
}



//observe: null=> actual node, '*' => global (graph observer), path => node find by path


