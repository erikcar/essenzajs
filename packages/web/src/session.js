import { sessionStore, waitAction } from "@essenza/core";
import { webObject } from "./webobject";

const VERSION = "1.0";

export const userEnum = { GUEST: "0" }
export const mediaEnum = { MOBILE: "0", TABLET: "1", DESKTOP: "2" }
export const breakPoint = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
}

//export const session = new webObject("session", sessionStore, { local: true, language: 'it', timeout: 1800, store: sessionStore });

export function Session() {
    webObject.call(this, "session", sessionStore);
    Object.defineProperty(this, 'readyAction', { enumerable: false, writable: true, value: [] });
    Object.defineProperty(this, 'completeAction', { enumerable: false, writable: true, value: [] });
    this.local = true;

    this.oninit = function (ctx) {
        console.log("SESSION INIT");
        this.defaultValues({ language: 'it', timeout: 1800 });
        Object.defineProperty(this,'context',{enumerable:false, value: ctx});
        //TODO:Logica Polyfill
        //this.polyfilled = true;

        //const data = instance.data;

        if (!this.restored) {
            if (navigator) {
                this.locale = navigator.languages && navigator.languages.length
                    ? navigator.languages[0]
                    : navigator.language;
            }
            else this.locale = option.language || 'it';
        }

        //Check Version se non è aggiornata forzo sync perchè user stored potrebbe essere non compatibile con nuova versione.
        //const version = localStorage.getItem("version_");

        if (VERSION != this.version) {
            this.syncronize |= this.version ? true : false;
            this.version = VERSION;
        }

        const last = this.time;
        this.time = Math.floor(Date.now() / 1000);

        if (!last || (this.time - last) > this.timeout) {
            this.syncronize = true; //Sessione Scaduta o nuova
        }

        this.logged = ctx.logged;

        //TODO: session resize, mettere in core o in ctx???
        /*if (this.syncronize)
            this.onresize.executeNow();

        window.onresize = function (e) {
            this.onresize.execute();
        }*/

        ctx.document.onload(() => {
            this.loaded = true;
            this.oncomplete();
        });

        //this.backup();
    }

    this.ready = function (fn) {
        this.isready ? fn(this.context) : this.readyAction.push(fn);
    };

    this.complete = function (fn) {
        this.completed ? fn(this.context) : this.completeAction.push(fn);
    };

    this.onready = function (ctx, warning) {
        this.isready = true;
        this.readyAction.forEach(fn => fn(ctx, warning));
        //delete this.readyAction;
        this.oncomplete(ctx, warning);
    };

    this.oncomplete = function (ctx, warning) {
        if (this.isready && this.loaded) {
            this.completed = true;
            this.completeAction.forEach(fn => fn(ctx, warning));
            //delete this.readyAction, this.completeAction;
        }
    };

    this.resize = function () {
        const info = this.data;
        console.log("RESIZE", this);

        info.width = document.documentElement.clientWidth;
        info.height = document.documentElement.clientHeight;

        let breakpoint = info.breakpoint;
        let media = info.media;

        if (info.width < breakPoint.md) {
            info.media = mediaEnum.MOBILE;
            info.width < breakPoint.sm
                ? info.breakpoint = breakPoint.xs
                : info.breakpoint = breakPoint.sm;
        }
        else if (info.width > breakPoint.xl) {
            info.media = mediaEnum.DESKTOP;
            info.width > breakPoint.xxl
                ? info.breakpoint = breakPoint.xxl
                : info.breakpoint = breakPoint.xl;
        }
        else {
            info.media = mediaEnum.TABLET;
            info.breakpoint = breakPoint.xxl
        }

        media = media && media !== info.media;  //|| info.media; //Anche la prima volta (new session) o no???
        breakpoint = breakpoint && breakpoint !== info.breakpoint; //|| info.breakpoint;

        if (this.onbreakpoint && (media || breakpoint))
            this.onbreakpoint(info, info.media, info.breakpoint);
    }

    this.onresize = new waitAction(this.resize.bind(this));
}

Session.prototype = webObject.prototype;
/** 
 * @param {webcontext} ctx optional: override default session config only for the lifecycle of page 
 * @returns 
 */
export const useSession = function (ctx) {
    const session = new Session();
    ctx.register(session);
    return session;
}
