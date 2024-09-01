import { core } from "./core";
import { Observable } from "./observe";

export function ITask() { }


/*export function Task(task, data, key) {
    this.task = task;

    this.metadata

    this.data = data;
    this.key = key;
    this.owner;
    this.parent;
    this.priority = 0;
    this.input; //Generalizzare
    this.disposable;
    this.filter; //??
    this.rule;
}*/
export function Task(task, metadata, owner) {
    this.task = task;
    metadata && (this.metadata = metadata);
}

Task.Execute = function (task, info) {
    return task instanceof ITask || task.execute ? task.execute(info) : task(info);
}

core.prototypeOf(ITask, Task, {
    useMetadata: function (data) {
        //if (!$Type.isObject(data)) data = { data }; ADD WORNING __DEV__
        this.metadata = { ...this.metadata, ...data };
        return this;
    },

    useTempdata: function (data) {
        this.tempdata = data;
        return this;
    },

    usePolicy: function (policy) {
        this.policy = policy;
        return this;
    },

    /*useIntent: function (name, owner) {
        return this.make(token => {
            owner = owner || this.metadata?.owner;
            if (owner instanceof Observable) owner.execute(name || token.event, token);
        })
    },*/

    useKey: function (key) {
        return this.useMetadata({ key });
    },

    useInfo: function (info) {
        return this.useMetadata({ info });
    },

    useRule: function (rule, predicate) {
        return this.useMetadata({ rule, ...(predicate && { predicate }) });
    },

    usePriority: function (priority) {
        return this.useMetadata({ priority });
    },

    highPriority: function () {
        return this.useMetadata({ priority: 20 });
    },

    mediumPriority: function () {
        return this.useMetadata({ priority: 10 });
    },

    override: function (predicate) {
        return this.useRule("override", predicate);
    },

    prepend: function () {
        return this.useMetadata({ rule: "before" });
    },

    last: function () {
        return this.useMetadata({ rule: "last" });
    },

    once: function () {
        return this.useMetadata({ disposable: true });
    },

    when: function (callback) {
        if (!this.filter) this.filter = [];
        this.filter.push(callback);
        return this;
    },

    /** 
     * TOKEN FILTER (Example EMITTER)
     * */

    withKey: function (key) {
        return this.when(token => token.key === key);
    },

    withTarget: function (target) {
        return this.when((token => token.target === target))
    },

    /*withOwner: function (owner) {
        return this.when((token => token.owner === owner))
    },*/

    etypeOf: function (etype) {
        return this.when((token => token.etype === etype))
    },

    typeOf: function (type) {
        return this.when((token => token.type === type))
    },

    deep: function (value) {
        return this.when((token => token.deep === value))
    },

    /** 
     * END TOKEN FILTER
     * */

    make: function (callback) {
        this.task = callback;
        return this;
    },

    executable: function (token, temp) {
        temp && (this.tempdata = temp);
        const props = { ...this.metadata, ...this.tempdata, ...token, token };
        if (!this.task) return false;
        if (this.filter) {
            for (let k = 0; k < this.filter.length; k++) {
                if (!Task.Execute(this.filter[k], props)) {
                    this.free();
                    return false; //value
                }
            }
        }
        return true;
    },

    execute: async function (token) {
        const props = { ...this.metadata, ...this.tempdata, ...token, token }; //CHI HA PRIORITA' METADATA O TOKEN ???

         this.task && (this.task instanceof ITask
            ? await this.task.execute(props)
            : await this.task(props));

        this.free();
        this.disposable && this.dispose();
    },

    /**
     * Attach this task to currentFlow of main context
     * @param {Function} callback 
     */

    attach: function (callback) {
        const flow = this.context.flow;
        callback ? callback(flow)(this) : flow.task(this);
    },

    free: function () {
        delete this.tempdata;
    },

    /**
     * Capire bene generalizzazione di dispose....
     */

    dispose: function () {
        const parent = this.metadata?.parent;
        parent && parent.remove(this);
    }
});

core.inject(Task, "IContext");

//this.args = [].slice.call(arguments, 1);

export function Block() {
    this.await = [];
    this.tasks = [];
    this.executed;
    //this.make.apply(this, arguments);
}

core.prototypeOf(ITask, Block, {
    wait: function (task) { this.await.push(task) },

    add: function () {
        for (let k = 0; k < arguments.length; k++) {
            if (this.executed)
                Task.Execute(arguments[k], this.executed);
            else
                this.tasks.push(arguments[k]);
        }
        return this;
    },

    execute: function(token) {
        const blk = this;
        Promise.all(this.await).then(result => {
            blk.executed = token;
            for (let key = 0; key < blk.tasks.length; key++) {
                Task.Execute(blk.tasks[key], token);
            }
            this.reset();
            return result;
        }); 
    },

    reset: function () {
        this.await = [];
        this.tasks = [];
        this.executed = undefined;
    }
});

function Pointer() {
    this.map = new Map();
    this.block;
    this.previous;
}

Pointer.prototype = {
    get next() {
        return this.map.get(this.block);
    },

    //this.next = task.next;
    //task.next = this;
    link: function (task, section) {
        const next = this.map.get(section);
        this.map.set(task, next);
        this.map.set(section, task);
        return task;
    },

    forward: function () {
        this.previous = this.block;
        this.block = this.map.get(this.block);
        return this.block;
    },

    seek: function (block) {
        this.previous = null;
        this.block = block;
        return this;
    },

    jump: function () {
        const previous = this.previous;
        const block = this.block;
        this.forward();
        this.map.set(block, this.next);
        this.previous = previous;
        this.block = block;
        //block.next = block.next.next;
    }
}

export function Flow() {
    this._last; this._output; this._after; this._task; this._before; this._input; this._start;
    this.pointer = new Pointer();
    this.reset();
}

Flow.OVERRIDE = "override";
Flow.FIRST = "first";
Flow.LAST = "last";
Flow.BEFORE = "before";
Flow.AFTER = "after";
Flow.BEFORE_OF = "beforeOf";
Flow.AFTER_OF = "afterOf";

core.prototypeOf(ITask, Flow, {
    reset: function () {
        const sections = ["_input", "_before", "_task", "_after", "_output", "_last"]; //,
        this._start = new Task();
        let actual = this._start;
        sections.forEach(section => { this[section] = this.pointer.link(new Task(), actual); actual = this[section] });
        return this;
    },

    format: function (task, data, section) {
        this.pointer.link(task instanceof Task ? task.useMetadata(data) : new Task(task, data), section);
        return this;
    },

    task: function (task, data) {
        return this.format(task, data, this._task);
    },

    output: function (task, data) {
        return this.format(task, data, this._output);
    },

    input: function (task, data) {
        return this.format(task, data, this._input);
    },

    import: function (task, data) {
        //data && task.useMetadata(data)
        if (task.metadata?.rule) {
            const args = [task, data];
            task.metadata.predicate && args.unshift(task.metadata.predicate);
            this[task.metadata.rule].apply(this, args);
        }
        else {
            this.output(task, data);
        }
        return this;
    },

    first: function (task, data) {
        return this.format(task, data, this._first);
    },

    last: function (task, data) {
        return this.format(task, data, this._last);
    },

    before: function (task, data) {
        return this.format(task, data, this._before);
    },

    after: function (task, data) {
        return this.format(task, data, this._after);
    },

    find: function (predicate, parent) {
        //const pointer = this.pointer.seek(this._start);
        const pointer = this.pointer.seek(this._start);
        while (pointer.block && !predicate(pointer.block)) pointer.forward(); //block.next.key !== key
        return parent ? pointer.previous : pointer.block;
    },

    beforeOf: function (predicate, task, data) {
        const block = this.find(predicate, true);
        block && this.format(task, data, block);
        return this;
    },

    afterOf: function (predicate, task, data) {
        const block = this.find(predicate);
        block && this.format(task, data, block);
        return this;
    },

    //TODO: new implementation
    override: function (predicate, task, data) {
        const parent = predicate ? this.find(predicate, true) : this._task;
        if (parent) {
            const pointer = this.pointer.seek(parent);
            pointer.jump();
            this.format(task, data, parent);
            //task.base = block;
        }
        return this;
    },

    remove: function (predicate) {
        const block = this.find(predicate, true);
        if (block) this.pointer.seek(block).jump();//block.next = block.next.next;
        return this;
    },

    execute: async function (token, preserve) {
        const pointer = this.pointer.seek(this._start);
        let block = pointer.next;
        let result;
        while (block) {
            await block.execute(token);
            if(token.stopFlow) break;
            block = pointer.forward();
        }
        !preserve && this.reset();
        return token;
    }
});

/*first: function () {
    return this.useMetadata({ rule: "first" });
},

last: function () {
    return this.useMetadata({ rule: "last" });
},

before: function () {
    return this.useMetadata({ rule: "before" });
},

after: function () {
    return this.useMetadata({ rule: "after" });
},

beforeOf: function (predicate) {
    return this.useMetadata({ rule: "beforeOf", predicate });
},

afterOf: function (predicate) {
    return this.useMetadata({ rule: "afterOf", predicate });
},*/

/*export function Block(task, data, metadata, key, next) {

    this.event = event;
    this.filter;
    this.task; //Potrebbe sempre essere un block, ovvero se non lo è lo creo....
    this.rule;

    this.parent = parent;
    this.owner = owner; //ok

    this.input;
    this.disposable;

    return this;
}

Block.prototype = {

    prepend: function () {
        this.input = true;
        return this;
    },

    once: function () {
        this.disposable = true;
        return this;
    },

    when: function (callback) {
        if (!this.filter) this.filter = [];
        this.filter.push(callback);
        return this;
    },



    target: function (target) {
        return this.when((token => token.target === target))
    },

    etypeOf: function (etype) {
        return this.when((token => token.etype === etype))
    },

    typeOf: function (type) {
        return this.when((token => token.type === type))
    },



    make: function (callback, prepend) {
        this.task = callback;
        if (prepend) this.input = true;
        return this;
    },

    policy: function (rule) {
        this.rule = rule; return this;
    },

    executable: function (info) {
        if (!this.task) return false;

        if (this.filetr) {
            for (let k = 0; k < this.filter.length; k++) {
                if (!Task.execute(this.filter[k], info)) return false; //value
            }
        }

        return true;
    },

    execute: function (info) {
        return this.executable() && Task.execute(this.task, info);
    },


    dispose: function () {
        this.parent && this.parent.remove(this);
    }
}*/