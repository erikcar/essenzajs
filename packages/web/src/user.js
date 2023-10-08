import { localStore, Observable} from "@essenza/core";
import { webObject } from "./webobject";

/*export function UserControl(ctx) {
    this.init = function (context, user) {
        context.observe("LOGIN").make(({ context, data }) => {
            console.log("LOGIN OBS ON CART", context, data);
            user.control = data ? context.getControl(Logged) : context.getControl(Guest);
            user.skip = data;
        }).execute({ context: context, data: context.logged });
    }
}*/

export function CartControl(ctx) {
    this.init = function (ctx, cart) {
        ctx.observe("LOGIN").make(({ context, data, target }) => {
            console.log("LOGIN OBS ON CART", context, data);
            target.control = data ? context.getControl(Logged) : context.getControl(Guest);
            //ctx.user.skip = data;
        }).execute({ context: ctx, data: ctx.logged, target: cart });
    }
}

//CONTROL DEVE POTER SPECIFICARE TYPE DELL'EMITTER
function Logged() {
    CartControl.call(this);
    //TASK DEL TARGET
    this.CART_ADD = (info, data) => { console.log("CART LOGGED ADD", info, data); }
    this.CART_UPDATE = (info, data) => { console.log("CART LOGGED UPDATE", info, data); }
    this.CART_REMOVE = (info, data) => { console.log("CART LOGGED REMOVE", info, data); }
}

function Guest() {
    CartControl.call(this);

    this.CART_ADD = (info, cart) => {
        cart.items.push(info.data);
        console.log("CART GUEST ADD", info, cart);
    }

    this.CART_UPDATE = (info, cart) => {
        const { item, values } = info.data;
        Object.assign(item, values);
        console.log("CART GUEST UPDATE", info, cart, item, values);
    }

    this.CART_REMOVE = (info, data) => { console.log("CART GUEST REMOVE", info, data); }
}

export function User() {
    webObject.call(this, "user", localStore);

    this.oninit = function (ctx) {
        console.log("USER ON-INIT", ctx);
        //ctx.setControl(this, CartControl).init(ctx, this);
    }
}

User.prototype = webObject.prototype;

//Cambiare comportamento della classe anche a seconda dello stato...compatibile con concetto di block (riutillizare codice);

function Cart() {
    Observable.call(this);

    Object.defineProperty(this, "items", {
        get: function () {
            return this.context.user.Cart;
        },
    });

    this.context.setControl(this, CartControl).init(this.context, this);

    this.check = function (item) {
        return item.hasOwnProperty(this.IField); // && item.hasOwnProperty("quantity");
    }

    this.find = function (id) {
        return this.items.find(item => item[this.IField] === id)
    }

    this.findIndex = function (id) {
        return this.items.findIndex(item => item[this.IField] === id)
    }

    this.add = function (item, skip) {
        if (!item[this.QField]) item[this.QField] = 1;
        if (skip || !this.find(item[this.IField])) this.emit("CART_ADD", item);
    }

    this.update = function (data, insert) {
        if (this.check(data)) {
            const item = this.find(data[this.IField]);
            if (!item) insert && this.add(data, true);
            else {
                if (!data.absolute) data[this.QField] = Math.max(item[this.QField] + (data[this.QField] || 0), 0);
                data[this.QField] > 0 ? this.emit("CART_UPDATE", { item: item, values: data }) : this.emit("CART_REMOVE", item);
            }
        }
    }

    this.remove = function (item) {
        this.check(item) && this.emit("CART_REMOVE", this.findIndex(item[this.IField]));
    }

    this.clear = function () {

    }

    this.lenght = function () {
        this.items ? this.items.lenght : 0;
    }
}

Cart.prototype = Observable.prototype;
Cart.prototype.QField = "quantity";
Cart.prototype.IField = "productid";

export const useUser = function (ctx) {
    ctx.user = new User();
    ctx.register(ctx.user);
    return ctx.user;
}

window.useCart = function () {
    return new Cart();
}

//LOGGED - CART - MODEL - CTX ISTANCE -