export function fetchChannel() {
    this.baseURL = null;
    this.headers = { "Content-type": "application/x-www-form-urlencoded" }; //"application/json; charset=UTF-8"
}

fetchChannel.prototype = {
    send: function (opt) {
        const config = {
            method: opt.method,
            headers: { ...this.headers },
        };

        if (!opt.url.startsWith("http") && this.baseURL) opt.url = this.baseURL + opt.url;

        if (opt.method === "post") {
            if(opt.headers){
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
            else if(opt.hasbody) {
                //config.body = new URLSearchParams(opt.data);
                config.body = opt.data;
                delete config.headers["Content-type"];
            }
            else {
                config.body = JSON.stringify(opt.data);
                config.headers["Content-type"] = 'application/json';
            }
        }

        return new Promise(function (resolve, reject) {
            fetch(opt.url, config)
                .then(async response => {
                    console.log(response);
                    if (response.ok) {
                        response.config = opt;
                        response.data = await response.text();
                        try {
                            response.data = JSON.parse(response.data);
                        } catch (e) {

                        }
                        resolve(response);
                    }
                    else {
                        reject({ response: response, type: "RESPONSE" })
                    }
                }, err => {
                    console.log(err);
                    err.type = "REQUEST";
                    reject(err)
                })
                .catch(err => {
                    console.log(err);
                    err.type = "REQUEST";
                    throw err;
                });
        });
    },

    addHeader: function (name, value) {
        this.headers[name] = value;
    },

    setBaseUrl: function (url) {
        this.baseURL = url;
    }
}