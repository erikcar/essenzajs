/** @fileoverview packages/core/src\Apix.js */
import { fetchChannel } from './channels/FetchChannel';
import { sleep } from './utils';
//import postgreSql from './interpreters/ISql';

//Usa servizio ajax 
console.log("****APIX****");
//Controllo se chiamata ad operazione è già in corso o in coda
//(per le chiamate da eseguire sync potrei anche dare possibilità di dare un riferimento dopo la quale essere eseguita)
//se non trova callID lo mette per ultimo oppure esegue in modo async

var call_queue = [];
//in questo caso è come se fosse un singleton
var /**
 * apix function.
 * @param {any} channel
 * @param {any} ecatch
 * @param {any} retry
 * @returns {any}
 */
  apix = function (channel, ecatch, retry) {

    this.channel = channel || new fetchChannel();
    this.parser = null; //postgreSql;
    this.ecatch = ecatch;
    this.dataOp = "api/jdata";
    this.queryOp = "api/jquery";
    this.apiUrl = "api/";
    this.method = "post";
    this.onError = null;
    this.onRefreshToken = null;
    this.onRefreshTokenExpired = null;
    this.useRefreshToken = false;

    if (typeof retry === 'undefined') {
      retry = new callRetry(3, 500);
    }

    this.retry = retry;

    return this;
  };

/**
 * callRetry function.
 * @param {any} num
 * @param {any} wait
 * @returns {void}
 */
function callRetry(num, wait) {
  this.attempts = num;

  if (Array.isArray(wait)) {
    this.wait = wait;
  }
  else {
    this.wait = Array(num).fill(wait)
  }

  this.count = 0;
  this.onApply = null;
  /**
 * canApply function.
 * @param {any} er
 * @returns {void}
 */
  this.canApply = (er) => this.count < this.attempts;// && er.type !== "RESPONSE";
  /**
 * apply function.
 * @param {any} er
 * @returns {Promise<any>}
 */
  this.apply = async (er) => {
    await sleep(wait[++this.count]);
    if (this.onApply) {
      this.onApply(er);
    }
  };
  /**
 * reset function.
 * @returns {void}
 */
  this.reset = () => this.count = 0;
}

//TODO: Gestire [messaggi utente, progress, assicurarsi di liberare queue, come gestire promise di LOCK (await?)]
apix.fn = apix.prototype = {
  /**
 * call method.
 * @param {any} op
 * @param {any} data
 * @param {any} opt
 * @returns {any}
 */
  call: async function (op, data, opt) {
    console.log("APIX START CALL");
    opt = opt || {};
    opt.url = op;
    opt.data = data;
    console.log("APIX START CALL OPTION", opt);
    this.formatOption(opt);

    if (this.useRefreshToken) {
      await this.ensureValidToken();
    }

    //SE è sigleton ed è già in esecuzione DISCARD => restitusco direttamente errore di  Promise.reject({type: ''});
    // canExecute può essere ['SINGLETON', 'LOCK', 'PARALLEL'] ma PARALLEL implica che può fare la chiamata senza controlli quindi si lascia canExecute undefined
    if (opt.mode && !CanExecute(op, opt)) {
      if (opt.mode === 'SINGLETON') {
        return Promise.reject({ type: 'DISCARD' });
      }
      else { //LOCK case => put ACTION in queue
        let callObj = { id: op, option: opt, resolve: null, reject: null }
        call_queue.push(callObj);
        opt.lock = true;
        return new Promise(function (resolve, reject) { callObj.resolve = resolve; callObj.reject = reject; });
      }
    }

    // SE DEVO METTERE IN CODA COSA RESTITUISCO? un promise che aspetta il suo turno ed eventualmente ha un meccanismo per eliminarsi da coda dopo un certo timeout
    //Sarebbe ottimo uno scheduler simple and light
    let instance = this;
    opt.promise = new Promise(function (resolve, reject) {
      instance.rawCall(opt, resolve, reject);
    });

    return opt.promise;
  },

  ensureValidToken: async function () {
    let sessionData = localStorage.getItem('_session');
    if (!sessionData) return null;

    try {
      // Usiamo una variabile diversa per l'oggetto parsato
      const session = JSON.parse(sessionData);
      const token = session.token;

      if (!token) return null;

      // Decodifica payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);

      // Se mancano meno di 60 secondi alla scadenza
      if (payload.exp - now < 60) {
        console.log("Token in scadenza o scaduto, avvio refresh...");
        return await this.performRefresh();
      }

      return session; // Il token è ancora valido
    } catch (e) {
      console.error("Errore verifica token o JSON non valido", e);
      return null;
    }
  },

  performRefresh: async function () {
    // Se c'è già un refresh in corso, restituiamo la promessa attiva
    if (this._isRefreshing) {
      console.log("Accodamento a refresh già in corso...");
      return this._refreshPromise;
    }

    this._isRefreshing = true;

    // Prepariamo l'opzione per il tuo fetchChannel
    const option = {
      method: "post",
      url: "service/app/refresh_token",
      excludeParams: true // se non vuoi mandare dati nel body
    };

    this._refreshPromise = this.channel.send(option)
      .then(res => {
        // Il tuo fetchChannel mette il JSON in res.data (o res.value nel tuo snippet)
        // Assicurati di usare la proprietà corretta restituita dal tuo server
        const newSession = res.data;

        localStorage.setItem('_session', JSON.stringify(newSession));

        // Aggiorna l'header del canale per le prossime chiamate
        if (this.channel.addHeader) {
          this.channel.addHeader("Authorization", "Bearer " + newSession.token);
        }

        if (this.onRefreshToken) this.onRefreshToken(newSession);

        return newSession;
      })
      .catch(er => {
        console.error("Refresh fallito", er);
        // er.status è popolato dal tuo fetchChannel in caso di !response.ok
        if (er.status === 401 && this.onRefreshTokenExpired) {
          this.onRefreshTokenExpired();
        }
        localStorage.removeItem('_session'); // Pulizia
        return null;
      })
      .finally(() => {
        this._isRefreshing = false;
        this._refreshPromise = null; // Reset dopo il completamento
      });

    return this._refreshPromise;
  },

  /**
 * callMany method.
 * @returns {void}
 */
  callMany: function () { },

  /**
 * syncCall method.
 * @returns {void}
 */
  syncCall: function () { }, // Serve sol per canExecute di client Action (che non prevedono chiamate remote o async)

  /**
 * option method.
 * @returns {any}
 */
  option: function () {
    return { method: this.method, channel: this.channel, parser: this.parser, dataOp: this.dataOp, queryOp: this.queryOp }; //, apiUrl: this.apiUrl
  },

  /**
 * formatOption method.
 * @param {any} opt
 * @returns {void}
 */
  formatOption: function (opt) {
    let defaultOption = this.option();

    for (let key in defaultOption) {
      if (!opt.hasOwnProperty(key)) {
        opt[key] = defaultOption[key];
      }
    }
    opt.attempt = opt.attempt || 3;
    if (opt.apiUrl && !opt.url.startsWith("http")) opt.url = opt.apiUrl + opt.url;
  },

  /**
 * canRetray method.
 * @param {any} error
 * @param {any} opt
 * @param {any} resolve
 * @param {any} reject
 * @returns {any}
 */
  canRetray: function (error, opt, resolve, reject) {
    let retry = opt.retry || this.retry;
    console.log(error, retry);
    const data = error.response?.data;
    if (error.etype === "RESPONSE" && data && data.uidt === "ERROR") {
      if (this.onManagedError)
        this.onManagedError(data);
      //reject(error);
      return false;
    }
    else if (error.etype !== "CALL" && retry && retry.canApply(error)) {
      console.log("TENTATIVO: ", retry.count);
      retry.apply(opt);
      this.rawCall(opt, resolve, reject);
      return true;
    }
    else {
      checkQueue(opt);//error.config);
      //if (this.onError) this.onError(error);
      //reject(error);
      return false;
      //Log to server error.message?
    }
  },

  /**
 * dispatchError method.
 * @param {any} candispatch
 * @param {any} error
 * @param {any} kind
 * @returns {void}
 */
  dispatchError: function (candispatch, error, kind) {
    candispatch && this.onError && this.onError(error)
  },

  /**
 * rawCall method.
 * @param {any} opt
 * @param {any} resolve
 * @param {any} reject
 * @returns {void}
 */
  rawCall: function (opt, resolve, reject) {
    let channel = opt.channel;
    let instance = this;
    console.log("APIX RAW CALL: ", opt);
    channel.send(opt)
      .then((response) => {
        //GESTIRE ACTION ON RESULT - FACCIO PRIMA O DOPO resolve? ovvero faccio eventuale chiamata prima che venga gestita?
        checkQueue(response.config);
        response.config.promise = null; //Si può? delete? non viene comunque liberata da axios?
        //Qui potrei fare gestione generale di MangaedError
        const data = response.data;
        if (data && data.hasOwnProperty("uidt") && data.uidt === "ERROR") {
          instance.dispatchError(!opt.managed, response, "MAN");
          reject(data);
        }
        else {
          resolve({
            response: response,
            data: response.data,
            args: response.config.args,
            opt: response.config,
          });
        }
      },
        error => {
          if (!instance.canRetray(error, opt, resolve, reject)) {
            //Gestire caso di risposta non autorizzata qui?
            //this.onRefreshTokenExpired && this.onRefreshTokenExpired();
            instance.dispatchError(!opt.managed, error, "REJ");
            reject(error)
          }
        })
      .catch(function (error) {
        if (!instance.canRetray(error, opt, resolve, reject)) {
          instance.dispatchError(!opt.managed, error, "ERR");
          throw error;
        }
      });
  },
};

export const Apix = new apix();
//Potrei creare object o class Request con tutte le info per eseguire la call
//Da esportare, esiste caso in cui stessa op viene chiamata
/**
 *
 * @param {operation} op
 * @param {*Data to send} data
 * @param {*option of axios more args} opt
 */

/*function progressWidth(evt) {
  if (evt.lengthComputable) {
    var percentComplete = evt.loaded / evt.total;
    console.log(percentComplete);
    $(".lbn-progress").css({
      width: percentComplete * 100 + "%",
    });
  }
}*/

/**
 * CanExecute function.
 * @param {any} id
 * @param {any} config
 * @returns {any}
 */
function CanExecute(id, config) {

  console.log("PASSA CanExecute: ", id);

  if (findCall(id) > -1 && (config.mode === 'SINGLETON' || config.mode === 'LOCK')) {
    return false;
  }

  return true;
}

//be javascript in browser single thread would be safe index (not change) between findCall and remove
/**
 * checkQueue function.
 * @param {any} config
 * @returns {void}
 */
function checkQueue(config) {
  if (config.mode) {
    let index = findCall(config.url);

    //Attenzione se faccio chiamata ad id dopo che ho eliminato potrei eseguire insieme così
    if (index > -1) {
      if (config.mode === 'LOCK') {
        //DO el call esegue adesso chiamata AXIOS
        let call = call_queue[index];
        const opt = call.option;
        Apix.call(opt.url, opt.data, opt).then(result => call.resolve(result)).catch(reason => call.reject(reason));
      }
      call_queue.splice(index, 1)
    }
  }
}

/**
 * findCall function.
 * @param {any} id
 * @returns {any}
 */
function findCall(id) {
  return call_queue.findIndex(e => e.id = id);
}


