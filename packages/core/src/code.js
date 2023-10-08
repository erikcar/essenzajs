import { $String } from "./utils";

function ITask() { }

export const Task = {
    execute: function (task, info, data, key) {
        return task instanceof ITask ? task.execute(info, data, key) : task(info, data, key);
    }
}

export function TaskAwait() {
    this.await = [];
    this.task;
    this.args;
    this.make.apply(this, arguments);
}

TaskAwait.prototype = {
    wait: task => this.await.push(task),

    make: function (task) {
        if(arguments > 0){
            this.task = task;
            this.args = [].slice.call(arguments, 1);
        }
        return this;
    },

    execute: () => {
        const task = this.task;
        const args = this.args;
        const instance = this;
        Promise.all(this.await).then(() => {
            instance.reset();
            task.apply(null, args);
        });
    },

    reset: () => {
        this.await = [];
    }
}

export function Fragment(name) {
    this.name = name;
    this.task;
    this.execute = function (info, data) {
        this.task && this.task(info, data);
    }
}

Fragment.prototype = ITask.prototype;

export function Block(task, key, data, next) {
    this.key = key;
    this.task = task;
    this.data = data;
    this.next = next;
    this.base = undefined;

    this.link = function (block) {
        this.next = block;
        return this;
    }

    this.execute = function (info) {
        info.base = this.base;
        info.current = this.data;
        this.task && (this.task instanceof ITask
            ? this.task.execute(info)
            : this.task(info));
        info.current = null;
        const obs = this.data.observer;
        obs.disposable && obs.dispose();
    }
}

export function Flow() {

    this.reset = function () {
        const sections = ["_last", "_output", "_after", "_task", "_before", "_input", "_start"];
        let actual;
        sections.forEach(section => { this[section] = new Block(null, section, null, actual); actual = this[section] });
        return this;
    }

    this.format = function (task, key, data, section) {
        section.next = task instanceof Block ? task.link(section.next) : new Block(task, key, data, section.next);
        return section.next;
    }

    this.task = function (task, key, data) {
        this._task = this.format(task, key, data, this._task);
        return this;
    }

    this.output = function (task, key, data) {
        this._output = this.format(task, key, data, this._output);
        return this;
    }

    this.input = function (task, key, data) {
        this._input = this.format(task, key, data, this._input);
        return this;
    }

    this.push = function (task, key, data, input) {
        input ? this.input(task, key, data) : this.output(task, key, data);
    }

    this.first = function (task, key, data) {
        this.format(task, key, data, this._first);
        return this;
    }

    this.last = function (task, key, data) {
        this._last = this.format(task, key, data, this._last);
        return this;
    }

    this.before = function (task, key, data) {
        this._before = this.format(task, key, data, this._before);
        return this;
    }

    this.after = function (task, key, data) {
        this.format(task, key, data, this._after);
        return this;
    }

    this.find = function (source, parent) {
        const predicate = $String.is(source) ? k => k === source : source;
        let block = this._start;
        while (block.next && !predicate(block.next.key)) block = block.next; //block.next.key !== key
        return parent ? block : block.next;
    }

    this.beforeOf = function (source, task, key, data) {
        const block = this.find(source, true);
        block && this.format(task, key, data, block);
        return this;
    }

    this.afterOf = function (source, task, key, data) {
        const block = this.find(source);
        block && this.format(task, key, data, block);
        return this;
    }

    this.override = function (target, task, key, data) {
        const parent = this.find(target, true);
        if (parent) {
            const block = parent.next;
            parent.next = block.next;
            task = this.format(task, key, data, parent);
            task.base = block;
        }
        return this;
    }

    this.remove = function (key) {
        const block = this.find(key, true);
        if (block) block.next = block.next.next;
        return this;
    }

    this.execute = function (info) {
        let block = this._start.next;
        while (block) {
            block.execute(info);
            block = block.next;
        }
    }

    this.reset();
}

Flow.prototype = ITask.prototype;