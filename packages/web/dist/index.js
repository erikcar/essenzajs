!function(e,n){"object"==typeof exports&&"object"==typeof module?module.exports=n(require("@essenza/core")):"function"==typeof define&&define.amd?define(["@essenza/core"],n):"object"==typeof exports?exports.essenza=n(require("@essenza/core")):e.essenza=n(e["@essenza/core"])}(self,(__WEBPACK_EXTERNAL_MODULE__essenza_core__=>(()=>{"use strict";var __webpack_modules__={"./src/context.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   webControl: () => (/* binding */ webControl),\n/* harmony export */   webcontext: () => (/* binding */ webcontext)\n/* harmony export */ });\n/* harmony import */ var _essenza_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @essenza/core */ "@essenza/core");\n/* harmony import */ var _essenza_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_essenza_core__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _session__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./session */ "./src/session.js");\n/* harmony import */ var _user__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./user */ "./src/user.js");\n//import { core } from "./core";\n\n\n\nfunction webControl() {}\nconst webcontext = function () {\n  _essenza_core__WEBPACK_IMPORTED_MODULE_0__.context.call(this);\n  this.objects = [];\n  this.elements = {};\n  this.setControl(this, webControl);\n};\n_essenza_core__WEBPACK_IMPORTED_MODULE_0__.core.prototypeOf(_essenza_core__WEBPACK_IMPORTED_MODULE_0__.context, webcontext, {\n  register: function (wo) {\n    //, injection) {\n    this.objects.push(wo);\n    //injection && core.inject(null, injection);\n    //wo.context = this; // Siamo sicuri??\n  },\n\n  build: function (core) {\n    Object.defineProperty(webcontext.prototype, "document", {\n      get: function () {\n        return core.document;\n      }\n    });\n    Object.defineProperty(webcontext.prototype, "core", {\n      get: function () {\n        return core;\n      }\n    });\n    core.inject(webcontext, "IApi");\n    this.logged = core.getCookie(\'wgsession_\'); //use cookie Api\n    console.log("CTX LOGGED", this.logged);\n    this.session = (0,_session__WEBPACK_IMPORTED_MODULE_1__.useSession)(this);\n    this.user = (0,_user__WEBPACK_IMPORTED_MODULE_2__.useUser)(this);\n    const instance = this;\n    //session Active/Complete sia onReady che document.load )> \n    core.document.oncontent(function () {\n      //ui.init();\n\n      if (!instance.initialized) {\n        //instance.session.contentReady(); //Mi assicuro di eliminare task, così anche se lo richiama ctx non eseguo di nuovo!\n        instance.init();\n      }\n    });\n  },\n  init: function () {\n    if (!this.initialized) {\n      this.initialized = true;\n      const instance = this;\n      const sync = [];\n      const ready = function (warning) {\n        if (!document.body) {\n          return setTimeout(ready, 13, warning);\n        }\n        for (let k = 0; k < instance.objects.length; k++) {\n          instance.objects[k].onready(instance, warning); //Session chiamerà prima onContent (se già eseguita non ci son più task)\n        }\n      };\n\n      const onReady = function (warning) {\n        console.log("CTX ON READY");\n        warning = warning || false;\n        document.onreadystatechange = () => {\n          if (document.readyState === \'complete\') {\n            ready(warning);\n          }\n        };\n        if (document.readyState === \'complete\') {\n          ready(warning);\n        }\n      };\n      this.document.onunload(evt => {\n        //Event wg unload can be call more time on some os architecture, TODO: handle in webground\n        instance.backup();\n      });\n      for (let k = 0; k < this.objects.length; k++) {\n        const wo = this.objects[k];\n        wo.init(this);\n        if (!wo.local && wo.syncronize) sync.push(wo.etype);\n      }\n      if (sync.length > 0) {\n        this.api.call("wg_sync", sync.join(\',\')).then(v => {\n          this.setData(v);\n          onReady();\n        });\n      } else {\n        onReady();\n      }\n    }\n  },\n  backup: function () {\n    for (let k = 0; k < this.objects.length; k++) {\n      this.objects[k].backup();\n    }\n  },\n  setData: function (data) {\n    let wo;\n    for (let k = 0; k < this.objects.length; k++) {\n      wo = this.objects[k];\n      if (data.hasOwnProperty(wo.etype)) wo.absorb(data[wo.etype]);\n    }\n  }\n});\n\n//# sourceURL=webpack://essenza/./src/context.js?')},"./src/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   webInit: () => (/* binding */ webInit),\n/* harmony export */   webObject: () => (/* reexport safe */ _webobject__WEBPACK_IMPORTED_MODULE_4__.webObject)\n/* harmony export */ });\n/* harmony import */ var _context__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./context */ "./src/context.js");\n/* harmony import */ var _essenza_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @essenza/core */ "@essenza/core");\n/* harmony import */ var _essenza_core__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_essenza_core__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _session__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./session */ "./src/session.js");\n/* harmony import */ var _user__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./user */ "./src/user.js");\n/* harmony import */ var _webobject__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./webobject */ "./src/webobject.js");\n\n\n\n\nfunction webInit() {\n  _essenza_core__WEBPACK_IMPORTED_MODULE_1__.TypeSchema.session = {\n    fields: {},\n    type: _session__WEBPACK_IMPORTED_MODULE_2__.Session,\n    children: []\n  }, _essenza_core__WEBPACK_IMPORTED_MODULE_1__.TypeSchema.user = {\n    fields: {\n      id: true,\n      name: true,\n      surname: true,\n      email: true,\n      password: true,\n      itype: true,\n      address: true,\n      phone: true,\n      username: true,\n      nusername: true,\n      nemail: true,\n      emailvalid: true,\n      phonevalid: true,\n      twofactor: true,\n      cf: true,\n      vatnumber: true,\n      portfolio: true,\n      image: true,\n      website: true,\n      mkt: true,\n      locked: true,\n      dlog: true,\n      dlast: true,\n      businessname: true,\n      bsite: true,\n      businessarea: true,\n      logo: true,\n      street: true,\n      num: true,\n      locality: true,\n      code: true,\n      city: true,\n      affiliate: true\n    },\n    type: _user__WEBPACK_IMPORTED_MODULE_3__.User,\n    children: [{\n      name: "cart",\n      etype: "cartitem",\n      collection: true,\n      link: _essenza_core__WEBPACK_IMPORTED_MODULE_1__.Link.DOWN_WISE\n    }]\n  }, _essenza_core__WEBPACK_IMPORTED_MODULE_1__.TypeSchema.cart = {\n    //table: "CartTable", => optional\n    //type: \n    fields: {},\n    children: [{\n      name: "items",\n      etype: "cartitem",\n      collection: true,\n      link: _essenza_core__WEBPACK_IMPORTED_MODULE_1__.Link.DOWN_WISE\n    }]\n  }, _essenza_core__WEBPACK_IMPORTED_MODULE_1__.TypeSchema.cartitem = {\n    fields: {\n      id: true,\n      title: true,\n      quantity: true,\n      productid: true\n    }\n  }, _essenza_core__WEBPACK_IMPORTED_MODULE_1__.core.EntitySchema = window.hasOwnProperty(\'$wgschema\') ? $wgschema(_essenza_core__WEBPACK_IMPORTED_MODULE_1__.TypeSchema) : _essenza_core__WEBPACK_IMPORTED_MODULE_1__.TypeSchema;\n  _essenza_core__WEBPACK_IMPORTED_MODULE_1__.$Data.buildSchema(_essenza_core__WEBPACK_IMPORTED_MODULE_1__.core.EntitySchema);\n  _essenza_core__WEBPACK_IMPORTED_MODULE_1__.core.build(new _context__WEBPACK_IMPORTED_MODULE_0__.webcontext());\n  window.$es = _essenza_core__WEBPACK_IMPORTED_MODULE_1__.core.context;\n}\n\n//webInit();\n\n\n//export { core, Observable, waitAction, deferredAction, DataObject } from "@essenza/core"\n\n//# sourceURL=webpack://essenza/./src/index.js?')},"./src/session.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Session: () => (/* binding */ Session),\n/* harmony export */   breakPoint: () => (/* binding */ breakPoint),\n/* harmony export */   mediaEnum: () => (/* binding */ mediaEnum),\n/* harmony export */   useSession: () => (/* binding */ useSession),\n/* harmony export */   userEnum: () => (/* binding */ userEnum)\n/* harmony export */ });\n/* harmony import */ var _essenza_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @essenza/core */ "@essenza/core");\n/* harmony import */ var _essenza_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_essenza_core__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _webobject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./webobject */ "./src/webobject.js");\n\n\nconst VERSION = "1.0";\nconst userEnum = {\n  GUEST: "0"\n};\nconst mediaEnum = {\n  MOBILE: "0",\n  TABLET: "1",\n  DESKTOP: "2"\n};\nconst breakPoint = {\n  xs: 0,\n  sm: 576,\n  md: 768,\n  lg: 992,\n  xl: 1200,\n  xxl: 1400\n};\n\n//export const session = new webObject("session", sessionStore, { local: true, language: \'it\', timeout: 1800, store: sessionStore });\n\nfunction Session() {\n  _webobject__WEBPACK_IMPORTED_MODULE_1__.webObject.call(this, "session", _essenza_core__WEBPACK_IMPORTED_MODULE_0__.sessionStore);\n  Object.defineProperty(this, \'readyAction\', {\n    enumerable: false,\n    writable: true,\n    value: []\n  });\n  Object.defineProperty(this, \'completeAction\', {\n    enumerable: false,\n    writable: true,\n    value: []\n  });\n  this.local = true;\n  this.oninit = function (ctx) {\n    console.log("SESSION INIT");\n    this.defaultValues({\n      language: \'it\',\n      timeout: 1800\n    });\n    Object.defineProperty(this, \'context\', {\n      enumerable: false,\n      value: ctx\n    });\n    //TODO:Logica Polyfill\n    //this.polyfilled = true;\n\n    //const data = instance.data;\n\n    if (!this.restored) {\n      if (navigator) {\n        this.locale = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language;\n      } else this.locale = option.language || \'it\';\n    }\n\n    //Check Version se non è aggiornata forzo sync perchè user stored potrebbe essere non compatibile con nuova versione.\n    //const version = localStorage.getItem("version_");\n\n    if (VERSION != this.version) {\n      this.syncronize |= this.version ? true : false;\n      this.version = VERSION;\n    }\n    const last = this.time;\n    this.time = Math.floor(Date.now() / 1000);\n    if (!last || this.time - last > this.timeout) {\n      this.syncronize = true; //Sessione Scaduta o nuova\n    }\n\n    this.logged = ctx.logged;\n\n    //TODO: session resize, mettere in core o in ctx???\n    /*if (this.syncronize)\r\n        this.onresize.executeNow();\r\n      window.onresize = function (e) {\r\n        this.onresize.execute();\r\n    }*/\n\n    ctx.document.onload(() => {\n      this.loaded = true;\n      this.oncomplete();\n    });\n\n    //this.backup();\n  };\n\n  this.ready = function (fn) {\n    this.isready ? fn(this.context) : this.readyAction.push(fn);\n  };\n  this.complete = function (fn) {\n    this.completed ? fn(this.context) : this.completeAction.push(fn);\n  };\n  this.onready = function (ctx, warning) {\n    this.isready = true;\n    this.readyAction.forEach(fn => fn(ctx, warning));\n    //delete this.readyAction;\n    this.oncomplete(ctx, warning);\n  };\n  this.oncomplete = function (ctx, warning) {\n    if (this.isready && this.loaded) {\n      this.completed = true;\n      this.completeAction.forEach(fn => fn(ctx, warning));\n      //delete this.readyAction, this.completeAction;\n    }\n  };\n\n  this.resize = function () {\n    const info = this.data;\n    console.log("RESIZE", this);\n    info.width = document.documentElement.clientWidth;\n    info.height = document.documentElement.clientHeight;\n    let breakpoint = info.breakpoint;\n    let media = info.media;\n    if (info.width < breakPoint.md) {\n      info.media = mediaEnum.MOBILE;\n      info.width < breakPoint.sm ? info.breakpoint = breakPoint.xs : info.breakpoint = breakPoint.sm;\n    } else if (info.width > breakPoint.xl) {\n      info.media = mediaEnum.DESKTOP;\n      info.width > breakPoint.xxl ? info.breakpoint = breakPoint.xxl : info.breakpoint = breakPoint.xl;\n    } else {\n      info.media = mediaEnum.TABLET;\n      info.breakpoint = breakPoint.xxl;\n    }\n    media = media && media !== info.media; //|| info.media; //Anche la prima volta (new session) o no???\n    breakpoint = breakpoint && breakpoint !== info.breakpoint; //|| info.breakpoint;\n\n    if (this.onbreakpoint && (media || breakpoint)) this.onbreakpoint(info, info.media, info.breakpoint);\n  };\n  this.onresize = new _essenza_core__WEBPACK_IMPORTED_MODULE_0__.waitAction(this.resize.bind(this));\n}\nSession.prototype = _webobject__WEBPACK_IMPORTED_MODULE_1__.webObject.prototype;\n/** \r\n * @param {webcontext} ctx optional: override default session config only for the lifecycle of page \r\n * @returns \r\n */\nconst useSession = function (ctx) {\n  const session = new Session();\n  ctx.register(session);\n  return session;\n};\n\n//# sourceURL=webpack://essenza/./src/session.js?')},"./src/user.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   CartControl: () => (/* binding */ CartControl),\n/* harmony export */   User: () => (/* binding */ User),\n/* harmony export */   useUser: () => (/* binding */ useUser)\n/* harmony export */ });\n/* harmony import */ var _essenza_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @essenza/core */ "@essenza/core");\n/* harmony import */ var _essenza_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_essenza_core__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _webobject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./webobject */ "./src/webobject.js");\n\n\n\n/*export function UserControl(ctx) {\r\n    this.init = function (context, user) {\r\n        context.observe("LOGIN").make(({ context, data }) => {\r\n            console.log("LOGIN OBS ON CART", context, data);\r\n            user.control = data ? context.getControl(Logged) : context.getControl(Guest);\r\n            user.skip = data;\r\n        }).execute({ context: context, data: context.logged });\r\n    }\r\n}*/\n\nfunction CartControl(ctx) {\n  this.init = function (ctx, cart) {\n    ctx.observe("LOGIN").make(_ref => {\n      let {\n        context,\n        data,\n        target\n      } = _ref;\n      console.log("LOGIN OBS ON CART", context, data);\n      target.control = data ? context.getControl(Logged) : context.getControl(Guest);\n      //ctx.user.skip = data;\n    }).execute({\n      context: ctx,\n      data: ctx.logged,\n      target: cart\n    });\n  };\n}\n\n//CONTROL DEVE POTER SPECIFICARE TYPE DELL\'EMITTER\nfunction Logged() {\n  CartControl.call(this);\n  //TASK DEL TARGET\n  this.CART_ADD = (info, data) => {\n    console.log("CART LOGGED ADD", info, data);\n  };\n  this.CART_UPDATE = (info, data) => {\n    console.log("CART LOGGED UPDATE", info, data);\n  };\n  this.CART_REMOVE = (info, data) => {\n    console.log("CART LOGGED REMOVE", info, data);\n  };\n}\nfunction Guest() {\n  CartControl.call(this);\n  this.CART_ADD = (info, cart) => {\n    cart.items.push(info.data);\n    console.log("CART GUEST ADD", info, cart);\n  };\n  this.CART_UPDATE = (info, cart) => {\n    const {\n      item,\n      values\n    } = info.data;\n    Object.assign(item, values);\n    console.log("CART GUEST UPDATE", info, cart, item, values);\n  };\n  this.CART_REMOVE = (info, data) => {\n    console.log("CART GUEST REMOVE", info, data);\n  };\n}\nfunction User() {\n  _webobject__WEBPACK_IMPORTED_MODULE_1__.webObject.call(this, "user", _essenza_core__WEBPACK_IMPORTED_MODULE_0__.localStore);\n  this.oninit = function (ctx) {\n    console.log("USER ON-INIT", ctx);\n    //ctx.setControl(this, CartControl).init(ctx, this);\n  };\n}\n\nUser.prototype = _webobject__WEBPACK_IMPORTED_MODULE_1__.webObject.prototype;\n\n//Cambiare comportamento della classe anche a seconda dello stato...compatibile con concetto di block (riutillizare codice);\n\nfunction Cart() {\n  _essenza_core__WEBPACK_IMPORTED_MODULE_0__.Observable.call(this);\n  Object.defineProperty(this, "items", {\n    get: function () {\n      return this.context.user.Cart;\n    }\n  });\n  this.context.setControl(this, CartControl).init(this.context, this);\n  this.check = function (item) {\n    return item.hasOwnProperty(this.IField); // && item.hasOwnProperty("quantity");\n  };\n\n  this.find = function (id) {\n    return this.items.find(item => item[this.IField] === id);\n  };\n  this.findIndex = function (id) {\n    return this.items.findIndex(item => item[this.IField] === id);\n  };\n  this.add = function (item, skip) {\n    if (!item[this.QField]) item[this.QField] = 1;\n    if (skip || !this.find(item[this.IField])) this.emit("CART_ADD", item);\n  };\n  this.update = function (data, insert) {\n    if (this.check(data)) {\n      const item = this.find(data[this.IField]);\n      if (!item) insert && this.add(data, true);else {\n        if (!data.absolute) data[this.QField] = Math.max(item[this.QField] + (data[this.QField] || 0), 0);\n        data[this.QField] > 0 ? this.emit("CART_UPDATE", {\n          item: item,\n          values: data\n        }) : this.emit("CART_REMOVE", item);\n      }\n    }\n  };\n  this.remove = function (item) {\n    this.check(item) && this.emit("CART_REMOVE", this.findIndex(item[this.IField]));\n  };\n  this.clear = function () {};\n  this.lenght = function () {\n    this.items ? this.items.lenght : 0;\n  };\n}\nCart.prototype = _essenza_core__WEBPACK_IMPORTED_MODULE_0__.Observable.prototype;\nCart.prototype.QField = "quantity";\nCart.prototype.IField = "productid";\nconst useUser = function (ctx) {\n  ctx.user = new User();\n  ctx.register(ctx.user);\n  return ctx.user;\n};\nwindow.useCart = function () {\n  return new Cart();\n};\n\n//LOGGED - CART - MODEL - CTX ISTANCE -\n\n//# sourceURL=webpack://essenza/./src/user.js?')},"./src/webobject.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   webObject: () => (/* binding */ webObject)\n/* harmony export */ });\n/* harmony import */ var _essenza_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @essenza/core */ "@essenza/core");\n/* harmony import */ var _essenza_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_essenza_core__WEBPACK_IMPORTED_MODULE_0__);\n\n\n/**\r\n * @param {string} etype string key of object, used to store object.\r\n * @param {Decorator} decorator \r\n * @param {object} option \r\n */\nfunction webObject(etype, store, info) {\n  _essenza_core__WEBPACK_IMPORTED_MODULE_0__.DataObject.call(this, etype);\n  this.etype = etype;\n  Object.defineProperty(this, \'store\', {\n    enumerable: false,\n    value: store || {\n      save: _essenza_core__WEBPACK_IMPORTED_MODULE_0__.donothing,\n      getData: _essenza_core__WEBPACK_IMPORTED_MODULE_0__.donothing\n    }\n  });\n  //this.store = store || { save: donothing, getData: donothing };\n  this.initialized = false;\n  this.local = false;\n  this.syncronize = false;\n  this.skip;\n  this.init = function (ctx) {\n    if (!this.initialized) {\n      console.log("INIT " + this.etype);\n      if (this.beforeInit) this.beforeInit(ctx);\n      this.restore(true);\n      console.log("RESTORED DATA", this.state);\n      if (!this.restored) {\n        this.data = {};\n        this.syncronize = true;\n      }\n      console.log("CHECK FOR SYNC");\n      //Richiesta precedente al Load Attuale (Es. link a nuova pagina che forza sync)\n      if (sessionStorage.getItem("sync_" + this.etype)) {\n        this.syncronize = true;\n        sessionStorage.removeItem("sync_" + this.etype);\n      }\n      this.initialized = true;\n      if (this.oninit) this.oninit(ctx);\n    }\n  };\n\n  /*this.toJSON = function () {\r\n      return JSON.stringify(this);\r\n  };*/\n\n  this.absorb = function (info, preserve) {\n    preserve ? (0,_essenza_core__WEBPACK_IMPORTED_MODULE_0__.assignIfNull)(this, info) : Object.assign(this, info);\n  };\n  this.defaultValues = function (info) {\n    this.absorb(info, true);\n  };\n  this.backup = function (syncronize) {\n    !this.skip && this.store.save(this);\n    syncronize && !this.local && this.save();\n  };\n  this.restore = function (preserve) {\n    const backup = this.store.getData(this);\n    this.absorb(backup, preserve);\n    this.restored = backup !== null;\n  };\n  this.clear = function () {\n    this.store.clear(this);\n  };\n\n  /**\r\n   * Syncronize object data with remote source\r\n   * @param {*} data \r\n   * @returns \r\n   */\n  this.sync = function () {\n    //TODO: aggiungere caso local??\n    return this.api.call("api/wo_sync", {\n      etype: this.etype\n    }).then(v => {\n      this.absorb(v);\n    });\n  };\n  this.syncOnNextLoad = function () {\n    sessionStorage.setItem("sync_" + this.etype, "Y");\n  };\n  this.onready = _essenza_core__WEBPACK_IMPORTED_MODULE_0__.donothing;\n  this.absorb(info);\n}\nwebObject.prototype = _essenza_core__WEBPACK_IMPORTED_MODULE_0__.DataObject.prototype;\n_essenza_core__WEBPACK_IMPORTED_MODULE_0__.core.inject(webObject, "IApi");\n\n//# sourceURL=webpack://essenza/./src/webobject.js?')},"@essenza/core":e=>{e.exports=__WEBPACK_EXTERNAL_MODULE__essenza_core__}},__webpack_module_cache__={};function __webpack_require__(e){var n=__webpack_module_cache__[e];if(void 0!==n)return n.exports;var t=__webpack_module_cache__[e]={exports:{}};return __webpack_modules__[e](t,t.exports,__webpack_require__),t.exports}__webpack_require__.n=e=>{var n=e&&e.__esModule?()=>e.default:()=>e;return __webpack_require__.d(n,{a:n}),n},__webpack_require__.d=(e,n)=>{for(var t in n)__webpack_require__.o(n,t)&&!__webpack_require__.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:n[t]})},__webpack_require__.o=(e,n)=>Object.prototype.hasOwnProperty.call(e,n),__webpack_require__.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var __webpack_exports__=__webpack_require__("./src/index.js");return __webpack_exports__})()));