!function(e,n){"object"==typeof exports&&"object"==typeof module?module.exports=n(require("@essenza/core")):"function"==typeof define&&define.amd?define(["@essenza/core"],n):"object"==typeof exports?exports.webground=n(require("@essenza/core")):e.webground=n(e["@essenza/core"])}(self,(__WEBPACK_EXTERNAL_MODULE__essenza_core__=>(()=>{"use strict";var __webpack_modules__={"./src/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Component: () => (/* reexport safe */ _ui__WEBPACK_IMPORTED_MODULE_0__.Component),\n/* harmony export */   _jsx: () => (/* reexport safe */ _ui__WEBPACK_IMPORTED_MODULE_0__._jsx),\n/* harmony export */   ui: () => (/* reexport safe */ _ui__WEBPACK_IMPORTED_MODULE_0__.ui)\n/* harmony export */ });\n/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ui */ "./src/ui.js");\n\n\n//# sourceURL=webpack://webground/./src/index.js?')},"./src/ui.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Component: () => (/* binding */ Component),\n/* harmony export */   _jsx: () => (/* binding */ _jsx),\n/* harmony export */   ui: () => (/* binding */ ui)\n/* harmony export */ });\n/* harmony import */ var _essenza_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @essenza/core */ "@essenza/core");\n/* harmony import */ var _essenza_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_essenza_core__WEBPACK_IMPORTED_MODULE_0__);\n\nconst _add = (parent, child) => {\n  parent.appendChild(child?.nodeType ? child : document.createTextNode(child));\n};\nconst _appendChild = (parent, child) => {\n  if (Array.isArray(child)) {\n    child.forEach(nestedChild => appendChild(parent, nestedChild));\n  } else {\n    _add(parent, child);\n  }\n};\nconst _jsx = (tag, props) => {\n  const {\n    children\n  } = props;\n  if (typeof tag === "function") return tag(props, children);\n  const element = document.createElement(tag);\n  Object.entries(props || {}).forEach(_ref => {\n    let [name, value] = _ref;\n    if (name.startsWith("on") && name.toLowerCase() in window) {\n      element.addEventListener(name.toLowerCase().substr(2), value);\n    } else if (name !== "children") {\n      element.setAttribute(name, value);\n    }\n  });\n  _appendChild(element, children);\n  return element;\n};\n\n//TODO: Per ottimizzare nei UI framework che hanno compilazione creo uno schema ui con solo i component coinvolti nel progetto!!!\n//TODO: Per ottimizzare nei UI framework che hanno compilazione posso creare html template al posto di _jsx dinamico\nconst ui = {\n  elements: {},\n  component: {\n    modal: {\n      build: function () {\n        return _essenza_core__WEBPACK_IMPORTED_MODULE_0__.core.extend(Component, {\n          $$type: "modal",\n          $observable: {\n            visible: false,\n            content: null\n          },\n          open: function (data) {\n            this.Content = data.content;\n            this.Visible = true;\n          },\n          close: function () {\n            this.Visible = false;\n          },\n          toggle: function () {\n            this.Visible = !this.visible;\n          }\n        });\n      }\n    }\n  },\n  createElement: function (name, ctx) {\n    ctx = ctx || this;\n    if (_essenza_core__WEBPACK_IMPORTED_MODULE_0__.__DEV__) {\n      if (!name) console.error("Cannot create an undefined UI Element");\n    }\n    name = name.toLowerCase();\n    if (!ctx.elements[name]) {\n      if (_essenza_core__WEBPACK_IMPORTED_MODULE_0__.__DEV__) {\n        if (!this.component.hasOwnProperty(name)) console.error(name + " is not an essenza UI Element");\n      }\n      ctx.elements[name] = this.component[name].build();\n    }\n    return new this.elements[name]();\n  }\n\n  //unregister per vista?\n};\n\nfunction Component() {\n  _essenza_core__WEBPACK_IMPORTED_MODULE_0__.MutableObject.call(this);\n  //do nothing actually, \n  //a base class for all components \n}\n\nComponent.prototype = Object.create(_essenza_core__WEBPACK_IMPORTED_MODULE_0__.MutableObject.prototype);\nObject.defineProperty(Component.prototype, "control", {\n  get: function () {\n    return ui.component[this.$$type].control;\n  }\n});\n_essenza_core__WEBPACK_IMPORTED_MODULE_0__.core.inject(Component, "IContext");\nwindow.useElement = function (target) {\n  return _essenza_core__WEBPACK_IMPORTED_MODULE_0__.$String.is(target) ? document.getElementById(target).$component : target.$component;\n};\n\n/*{\r\n    $constructor: function (a,b) { //Constructor\r\n        Component.call(this, a);\r\n        //qui istanzio prop della classe\r\n        this.b = b;\r\n        this.prop = value;\r\n        Object.defineProperties({ _control: { enumerable: false } })\r\n    },\r\n\r\n    $$type: "modal",\r\n\r\n    $observable: { visible: false, content: null }, //Add default value to prototype\r\n\r\n    $properties: { control: { get: () => ui.component.modal.control } },\r\n\r\n    $inject: "IContext", //prorotype\r\n\r\n    open: function (content) {\r\n        this.Content = content;\r\n        this.Visible = true;\r\n    },\r\n\r\n    close: function () {\r\n        this.Visible = false;\r\n    },\r\n\r\n    toggle: function () {\r\n        this.Visible = !this.visible;\r\n    }\r\n}*/\n\n//# sourceURL=webpack://webground/./src/ui.js?')},"@essenza/core":e=>{e.exports=__WEBPACK_EXTERNAL_MODULE__essenza_core__}},__webpack_module_cache__={};function __webpack_require__(e){var n=__webpack_module_cache__[e];if(void 0!==n)return n.exports;var _=__webpack_module_cache__[e]={exports:{}};return __webpack_modules__[e](_,_.exports,__webpack_require__),_.exports}__webpack_require__.n=e=>{var n=e&&e.__esModule?()=>e.default:()=>e;return __webpack_require__.d(n,{a:n}),n},__webpack_require__.d=(e,n)=>{for(var _ in n)__webpack_require__.o(n,_)&&!__webpack_require__.o(e,_)&&Object.defineProperty(e,_,{enumerable:!0,get:n[_]})},__webpack_require__.o=(e,n)=>Object.prototype.hasOwnProperty.call(e,n),__webpack_require__.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var __webpack_exports__=__webpack_require__("./src/index.js");return __webpack_exports__})()));