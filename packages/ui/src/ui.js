import { __DEV__, core, MutableObject, $String} from "@essenza/core";

const _add = (parent, child) => {
    parent.appendChild(child?.nodeType ? child : document.createTextNode(child));
};

const _appendChild = (parent, child) => {
    if (Array.isArray(child)) {
        child.forEach(nestedChild => appendChild(parent, nestedChild));
    } else {
        _add(parent, child);
    }
};

export const _jsx = (tag, props) => {
    const { children } = props;
    if (typeof tag === "function") return tag(props, children);
    const element = document.createElement(tag);
    Object.entries(props || {}).forEach(([name, value]) => {
        if (name.startsWith("on") && name.toLowerCase() in window) {
            element.addEventListener(name.toLowerCase().substr(2), value);
        } else if (name !== "children") {
            element.setAttribute(name, value);
        }
    });
    _appendChild(element, children);
    return element;
};

//TODO: Per ottimizzare nei UI framework che hanno compilazione creo uno schema ui con solo i component coinvolti nel progetto!!!
//TODO: Per ottimizzare nei UI framework che hanno compilazione posso creare html template al posto di _jsx dinamico
export const ui = {

    elements: {},

    component: {
        modal: {
            build: function () {
                return core.extend(Component, {
                    $$type: "modal",

                    $observable: { visible: false, content: null },

                    open: function (data) {
                        this.Content = data.content;
                        this.Visible = true;
                    },

                    close: function () {
                        this.Visible = false;
                    },

                    toggle: function () {
                        this.Visible = !this.visible;
                    }
                });
            },
        }
    },

    createElement: function (name, ctx) {
        ctx = ctx || this;

        if (__DEV__) {
            if (!name) console.error("Cannot create an undefined UI Element");
        }

        name = name.toLowerCase();

        if (!ctx.elements[name]) {

            if (__DEV__) {
                if (!this.component.hasOwnProperty(name)) console.error(name + " is not an essenza UI Element");
            }

            ctx.elements[name] = this.component[name].build();
        }

        return new this.elements[name]();
    },

    //unregister per vista?
}

export function Component() {
    MutableObject.call(this);
    //do nothing actually, 
    //a base class for all components 
}

Component.prototype = Object.create(MutableObject.prototype);

Object.defineProperty(Component.prototype, "control", { get: function () { return ui.component[this.$$type].control } });

core.inject(Component, "IContext");

window.useElement = function (target) {
    return $String.is(target) ? document.getElementById(target).$component : target.$component;
}

/*{
    $constructor: function (a,b) { //Constructor
        Component.call(this, a);
        //qui istanzio prop della classe
        this.b = b;
        this.prop = value;
        Object.defineProperties({ _control: { enumerable: false } })
    },

    $$type: "modal",

    $observable: { visible: false, content: null }, //Add default value to prototype

    $properties: { control: { get: () => ui.component.modal.control } },

    $inject: "IContext", //prorotype

    open: function (content) {
        this.Content = content;
        this.Visible = true;
    },

    close: function () {
        this.Visible = false;
    },

    toggle: function () {
        this.Visible = !this.visible;
    }
}*/
