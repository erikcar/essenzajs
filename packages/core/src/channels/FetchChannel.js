/** @fileoverview packages/core/src\channels\FetchChannel.js */
/**
 * fetchChannel function.
 * @returns {void}
 */
export function fetchChannel() {
    this.baseURL = null;
    this.headers = { "Content-type": "application/x-www-form-urlencoded" }; //"application/json; charset=UTF-8"
    this.alive = false;
}

fetchChannel.prototype = {
    /**
 * send method.
 * @param {any} opt
 * @returns {any}
 */
    send: function (opt) {
        const config = {
            method: opt.method,
            headers: { ...this.headers },
        };

        if (this.alive) config.credentials = 'include';

        if (!opt.url.startsWith("http") && this.baseURL) opt.url = this.baseURL + opt.url;

        /*if (opt.method === "post") {

            if (opt.data && !opt.excludeParams) {
                const params = new URLSearchParams();
                for (let key in opt.data) {
                    params.append(key, opt.data[key]);
                }

                opt.data = params;
                config.body = params;
            }
            else {
                config.body = JSON.stringify(opt.data);
                config.headers["Content-type"] = 'application/json';
            }

        }*/

        if (opt.method === "post") {
            if (opt.headers) {
                for (const key in opt.headers) {
                    config.headers[key] = opt.headers[key];
                }
            }

            if (opt.data && !opt.excludeParams) {
                const params = new URLSearchParams();
                for (let key in opt.data) {
                    params.append(key, opt.data[key]);
                }

                opt.data = params;
                config.body = params;
            }
            else if (opt.hasbody) {
                //config.body = new URLSearchParams(opt.data);
                config.body = opt.data;
                delete config.headers["Content-type"];
            }
            else {
                config.body = JSON.stringify(opt.data, function replacer(key, value) {
                    // Filtering out properties
                    if (value === null) {
                        return undefined;
                    }
                    return value;
                });
                config.headers["Content-type"] = 'application/json';
            }
        }

        return new Promise(function (resolve, reject) {
            fetch(opt.url, config)
                .then(async response => {
                    response.data = await response.text();
                    try {
                        response.data = JSON.parse(response.data);
                    } catch (e) {

                    }
                    if (response.ok) {
                        response.config = opt;
                        resolve(response);
                    }
                    else {
                        response.etype = "RESPONSE"
                        reject(response)
                    }
                }, err => {
                    console.log(err);
                    err.data = "Si è verificato un errore di comunicazione.";
                    err.etype = "REQUEST";
                    reject(err)
                })
                .catch(err => {
                    console.log(err);
                    err.data = "Si è verificato un errore di comunicazione.";
                    err.etype = "REQUEST";
                    throw err;
                });
        });
    },

    /**
 * addHeader method.
 * @param {any} name
 * @param {any} value
 * @returns {void}
 */
    addHeader: function (name, value) {
        this.headers[name] = value;
    },

    removeHeader(...names) {
        if (!this.headers) return;

        names.forEach(name => {
            // Usiamo delete per rimuovere la proprietà dall'oggetto
            delete this.headers[name];
        });
    },

    /**
 * setBaseUrl method.
 * @param {any} url
 * @returns {void}
 */
    setBaseUrl: function (url) {
        this.baseURL = url;
    }
}


