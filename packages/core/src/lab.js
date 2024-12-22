//if (Object.hasOwnProperty.call(object, key)) { // per scartare properties ereditate o prototype

function onTheFly() {
    this.procedures = {};

    this.define = function (name, f) {
        this.procedures[name] = f;
    }

    this.walkTheDOM = function (node, func) {
        func(node);
        node = node.firstChild;
        while (node && (!node.hasAttribute || !node.hasAttribute("data-foreach"))) {
            this.walkTheDOM(node, func);
            node = node.nextSibling;
        }
    }

    this.fill = function (obj, container) {
        container = document.getElementById(container) || document;
        let fields = container.querySelectorAll("[data-content], [data-func]");
        let field;
        let v;
        let p;
        for (var i = 0; i < fields.length; i++) {
            field = fields[i];
            if (field.hasAttribute("data-content")) {
                v = field.getAttribute("data-content");
                p = v.split(',');
                v = "";
                for (var j = 0; j < p.length; j++) {
                    v += obj[p[j]] + " ";
                }
                v.trim();
                if (field.tagName === "input")
                    field.value = v;
                else {
                    field.innerText = v;
                }
            }
            if (field.hasAttribute("data-func")) {
                v = field.getAttribute("data-func");
                p = v.split('-');

                this.procedures[p[0]].apply(null, [obj[p[1]], field, obj].concat(p.slice(1)));

            }
        }

        let f = container.querySelectorAll("[data-func]");
    }

    this.forEach = function (container, values, info) {
        if (!container) { return; }
        else if (isString(container)) { container = document.getElementById(container); }
        let item = container.querySelector("[data-template]")
        container.removeChild(item);
        if (!Array.isArray(values)) {
            values = [values];
        }

        let nodes = {};
        let datas = {};
        let c = 0;
        this.walkTheDOM(item, function (node) {
            //console.log("NODE", node, node.nodeType);
            if (node.attributes) {
                var attrs = node.attributes;
                let value;
                let index;
                let jndex;
                for (var i = attrs.length - 1; i >= 0; i--) {
                    if (!attrs[i].value) continue;
                    value = attrs[i].value;
                    if (attrs[i].name === "data-func") {
                        nodes[c] = { e: attrs[i], v: value, k: node };
                        c++;
                        continue;
                    }
                    index = value.indexOf('[');
                    if (index < 0) continue;
                    nodes[c] = { e: attrs[i], v: value, k: [] };
                    while (index > -1 && c < 10) {
                        jndex = value.indexOf(']', index);
                        nodes[c].k.push(value.substr(index, jndex - index + 1));
                        index = value.indexOf('[', jndex);
                        //console.log("index", value.substr(index, jndex - index), index, jndex, attrs[i]);
                    }
                    c++;
                }
            }
            if (node.nodeType === 3) { // Is it a Text node?
                value = node.data.trim();
                index = value.indexOf('[');
                if (index < 0) return;
                nodes[c] = { e: node, v: value, k: [] };
                while (index > -1) {
                    jndex = value.indexOf(']', index);
                    nodes[c].k.push(value.substr(index, jndex - index + 1));
                    index = value.indexOf('[', jndex)
                }
                c++;
            }
        });

        const setValues = (j) => {
            let value;
            let k;
            let v;
            let e;
            for (var key in nodes) {
                k = nodes[key].k;
                v = nodes[key].v;
                e = nodes[key].e;
                if (e.name === "data-func") {
                    this.procedures[e.value](values[j], k, j, info)
                }
                else {
                    for (var z = 0; z < k.length; z++) {
                        //console.log("key", k[z], k[z].substr(2, k[z].length - 3), k[z].substr(1, k[z].length - 2), values[j][k[z].substr(2, k[z].length - 3)]);
                        if (k[z][1] === '$') {
                            v = j;
                            continue;
                        }

                        k[z][1] === '#' ? value = this.procedures[k[z].substr(1, k[z].length - 2)](values[j][k[z].substr(2, k[z].length - 3)], values[j], nodes[key], j, info) : value = values[j][k[z].substr(1, k[z].length - 2)];
                        v = v.replace(k[z], value);
                    }

                    //console.log("VALUE", value);

                    if (v === "null")
                        v = "";

                    if (e.nodeType === 3)
                        e.data = v;
                    else
                        e.value = v;
                }
            }
        }

        let sub = item.querySelectorAll("[data-foreach]");
        let list = [];
        for (let i = 0; i < values.length; i++) {
            setValues(i)
            for (var k = 0; k < sub.length; k++) {
                let el = sub[k]
                this.forEach(el, values[i][el], { index: i, item: values[i] })
            }
            //console.log("ITEM", item)
            container.appendChild(item.cloneNode(true));
            //list.push(item.cloneNode(true));
        }
        //container.append(list);
        //return container;
    }
}

//Se esiste una proprietà (key) con nome data o altre proprietà di dataproxy?
function DataProxy(target) {
    this.data;
    this.setData = function (data) {
        this.data = data;
        for (const key in data) {
            if (Object.hasOwnProperty.call(object, key)) {
                Object.defineProperty(this, key, {
                    get: function () {
                        return this.data[key];
                    },
                    set: function (value) {
                        Data.mutate(key, value, this.data);
                    }
                });
            }
        }
    };
    this.setData(target);
}

function CollectionProxy() {
    this.data = [];
    this.proxy;

    this.at = function (index) {
        if (index > -1 && index < this.data.length) return this.data[index];
    }

    this.forEach = function (f) {
        for (let k = 0; k < this.data.length; k++) {
            this.proxy.data = this.data[k]; //oppure creo nuovo proxy???
            f(this.proxy, k);
        }
    };

    this.findIndex = function (predicate) {
        this.data.findIndex(predicate)
    }

    this.find = function (predicate) {
        return this.at(this.findIndex(predicate));
    }
}

function node() {
    //root?
    this.etype;
    this.isCollection = false;
    this.identity = true;
    this.link;
    this.primaryKey = "id";
}