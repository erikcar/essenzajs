export function fetchChannel(baseUrl) {
    this.baseURL = baseUrl;
    this.headers = { "Content-type": "application/x-www-form-urlencoded" }; //"application/json; charset=UTF-8"

    this.send = function (opt) {
        const config = {
            method: opt.method,
            headers: this.headers,
        };

        if (!opt.url.startsWith("http") && this.baseURL) opt.url = this.baseUrl + opt.url;

        if (opt.method === "post") {

            if (opt.data && !opt.excludeParams) {
                const params = new URLSearchParams();
                for (let key in opt.data) {
                    params.append(key, opt.data[key]);
                }

                opt.data = params;
                //config.body = params;
            }
            //else???
            config.body = JSON.stringify(opt.data);
        }

        return new Promise(function (resolve, reject) {
            fetch(opt.url, config)
                .then(response => {
                    console.log(response);
                    if (response.ok) {
                        response.config = opt;
                        response.data = response.json();
                        resolve(response);
                    }
                    else {
                        reject({ response: response, type: "RESPONSE" })
                    }
                })
                .catch(err => {
                    console.log(err);
                    err.tytpe = "REQUEST";
                    reject(err)
                });
        });
    }

    this.addHeader = function (name, value) {
        this.headers[name] = value;
    }

    this.setBaseurl = function (url) {
        this.baseURL = url;
    }
}