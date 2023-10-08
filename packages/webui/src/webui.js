import { ui, _jsx } from "@essenza/ui"
import { $String } from "@essenza/core"

ui.component.modal.parts = { //skin, layout
    overlay: o => _jsx("div", { class: "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" }, o),
    container: o => _jsx("div", {
        class: "fixed inset-0 z-10 overflow-y-auto",
        children: _jsx("div", { class: "flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0" })
    }, o),
};

ui.component.modal.init = function (target, data, parts, component) {
    parts = parts || {};

    for (const key in this.parts) {
        if (!Object.hasOwnProperty.call(parts, key)) {
            parts[key] = this.parts[key]();
        }
        target.appendChild(parts[key]);
    }

    parts.container = parts.container.firstElementChild;

    target.$component = component;
    component.root = target;
    component.parts = parts;
};

ui.component.modal.control = { //TOBE: defined in 
    MUTATING: ({ data, target }) => {
        if (data.field === "content") {
            let content = data.value;
            if ($String.is(content)) content = document.getElementById(content);
            if (!content) return; //Oppure metto quello di default se è null e retun se undefined...

            if (content.nodeName === "TEMPLATE") {
                content = content.content.cloneNode(true);
                ui.attachEvent(content.querySelectorAll(".es-task"));
            }
            const parts = target.parts;
            const child = parts.container.firstElementChild;
            child && child.remove();
            parts.container.appendChild(content);
        }
        else if (data.field === "visible") {
            data.value ? target.root.classList.remove("hidden") : target.root.classList.add("hidden");
        }
    },


};

export const useElement = function (target) {
    return $String.is(target) ? document.getElementById(target).$component : target.$component;
}