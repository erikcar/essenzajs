//const axios = require("axios");


/**
 * Un channel deve restituire un promise con result o error. Il formato di result ed error sono quelli di axios,
 * quindi gli altri canali si devono adattare (adapter) a uesto formato.
 * @param {*} opt
 * @returns
 */

export function axiosChannel(baseUrl) {
  this.baseUrl = baseUrl;
  axios.defaults.headers.post["Content-Type"] =
  "application/x-www-form-urlencoded";
  this.send = function (opt) {
    console.log("AXIOS CHANNEL SEND: ", opt.url);
    if(this.baseUrl)
      opt.baseUrl = this.baseUrl;
      
    if (opt.method === "post" && opt.data && !opt.excludeParams) {
      const params = new URLSearchParams();
      for (let key in opt.data) {
        params.append(key, opt.data[key]);
      }

      opt.data = params;
    }
    return new Promise(function (resolve, reject) {
      axios(opt)
        .then((result) => resolve(result))
        .catch((error) => {
          if (error.response) {
            error.type = "RESPONSE";
          } else if (error.request) {
            error.type = "REQUEST";
          } else {
            error.type = "CALL";
          }

          reject(error);
        });
    });
  };

  this.addHeader = function(name, value, method='common'){
    axios.defaults.headers[method][name] = value;
  }

  this.setBaseurl = function(url){
    axios.defaults.baseURL = url;
  }
}
