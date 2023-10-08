import { ui } from "@essenza/ui"
import { core } from "@essenza/core"
import { webInit } from "@essenza/web"

webInit();

ui.taskClass = "es-task";
ui.elementClass = "es-element";

window.$es = core.context;

core.document.oncontent(function () {

    function initElement(elements) {
        for (let el of elements) {
            const data = el.dataset;
            let schema;

            if (!data || !data.hasOwnProperty("type") || !(schema = ui.component[data.type])) continue;

            if (el.id === "") el.id = "$" + data.type;

            let parts = {};
            schema.init(el, data, parts, ui.createElement(data.type));
        }
    }

    function attachEvent(tasks) {
        for (let el of tasks)
            el.onclick = () => {
                const data = el.dataset;
                const target = document.getElementById(data.target).$component;
                target[data.intent](data);
                target.emit(data.intent, data);
                //se target undefined => è un task global => tramite CTX EMIT
                //ctx.emit(data.intent, data);
            }
    }

    attachEvent(document.getElementsByClassName(ui.taskClass));
    initElement(document.getElementsByClassName(ui.elementClass));
});

export { useElement } from "./webui"

/*init: function () {
    this.attachEvent(document.getElementsByClassName(this.taskClass));
    this.initElement(document.getElementsByClassName(this.elementClass));
},*/