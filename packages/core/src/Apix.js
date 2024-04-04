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
var apix = function(channel, ecatch, retry) {
  
  this.channel = channel || new fetchChannel();
  this.parser = null; //postgreSql;
  this.ecatch = ecatch;
  this.dataOp = "api/jdata";
  this.queryOp = "api/jquery";
  this.apiUrl ="api/";
  this.method = "post";

  if (typeof retry === 'undefined') {
    retry = new callRetry(3, 500);
  }

  this.retry = retry;

  return this;
};

function callRetry(num, wait){
  this.attempts = num;

  if(Array.isArray(wait)){
    this.wait = wait;
  }
  else{
    this.wait = Array(num).fill(wait)
  }
  
  this.count = 0;
  this.onApply = null;
  this.canApply = (er) => this.count < this.attempts;// && er.type !== "RESPONSE";
  this.apply = async (er) => { 
    await sleep(wait[++this.count]);
    if(this.onApply){
      this.onApply(er);
    }
  };
  this.reset = () => this.count = 0;
}

//TODO: Gestire [messaggi utente, progress, assicurarsi di liberare queue, come gestire promise di LOCK (await?)]
apix.fn = apix.prototype = {
  call: function(op, data, opt) {
    console.log("APIX START CALL");
    opt = opt || {};
    opt.url = op;
    opt.data = data;
    console.log("APIX START CALL OPTION", opt);
    this.formatOption(opt);

    //SE è sigleton ed è già in esecuzione DISCARD => restitusco direttamente errore di  Promise.reject({type: ''});
    // canExecute può essere ['SINGLETON', 'LOCK', 'PARALLEL'] ma PARALLEL implica che può fare la chiamata senza controlli quindi si lascia canExecute undefined
    if (opt.mode && !CanExecute(op, opt)) {
      if(opt.mode === 'SINGLETON')
      {
        return Promise.reject({type: 'DISCARD'});
      }
      else{ //LOCK case => put ACTION in queue
        let callObj = { id: op, option: opt, resolve: null, reject: null}
        call_queue.push(callObj);
        opt.lock = true;
        return new Promise(function(resolve, reject) {callObj.resolve = resolve; callObj.reject = reject;});
      } 
    }

    // SE DEVO METTERE IN CODA COSA RESTITUISCO? un promise che aspetta il suo turno ed eventualmente ha un meccanismo per eliminarsi da coda dopo un certo timeout
    //Sarebbe ottimo uno scheduler simple and light
    let instance = this;
    opt.promise = new Promise(function(resolve, reject) {
      instance.rawCall(opt, resolve, reject);
    });

    return opt.promise;
  },

  callMany: function() {},

  syncCall: function() {}, // Serve sol per canExecute di client Action (che non prevedono chiamate remote o async)

  option: function() {
    return { method: this.method, channel: this.channel, parser: this.parser, dataOp: this.dataOp, queryOp: this.queryOp }; //, apiUrl: this.apiUrl
  },

  formatOption: function(opt){
    let defaultOption = this.option();

    for (let key in defaultOption) {
      if (!opt.hasOwnProperty(key)) {
        opt[key] = defaultOption[key];
      }
    }
    opt.attempt = opt.attempt || 3;
    if(opt.apiUrl) opt.url = opt.apiUrl + opt.url;
  },

  canRetray: function(error, opt, resolve, reject){
    let retry = opt.retry || this.retry;
    console.log(error, retry);
    const data = error.response?.data;
    if(error.type === "RESPONSE" && data && data.uidt === "ERROR"){
      if(this.onManagedError)
      this.onManagedError(data);
      //reject(error);
      return false;
    }
    else if (error.type !== "CALL" && retry && retry.canApply(error)) {
      console.log("TENTATIVO: ", retry.count);
      retry.apply(opt);
      this.rawCall(opt, resolve, reject);
      return true;
    } 
    else {
      checkQueue(opt);//error.config);
      if(this.onError) this.onError(error);
      //reject(error);
      return false;
      //Log to server error.message?
    }
  },

  rawCall: function(opt, resolve, reject){
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
        if(data && data.hasOwnProperty("uidt") && data.uidt === "ERROR"){
          if(instance.onManagedError)
            instance.onManagedError(data);
          reject(data);
        }
        else{
          resolve({
            response: response,
            data: response.data,
            args: response.config.args,
            opt: response.config,
          });
        }  
      }, 
      error => !instance.canRetray(error, opt, resolve, reject) && reject(error))
      .catch(function(error) {
        if(!instance.canRetray(error, opt, resolve, reject)) throw error;
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

function CanExecute(id, config) {
  
  console.log("PASSA CanExecute: ", id);

  if(findCall(id)>-1 && (config.mode === 'SINGLETON' || config.mode === 'LOCK') )
  {
      return false;
  }

  return true;
}

//be javascript in browser single thread would be safe index (not change) between findCall and remove
function checkQueue(config){
  if(config.mode)
  {
    let index = findCall(config.url);
    
    //Attenzione se faccio chiamata ad id dopo che ho eliminato potrei eseguire insieme così
    if( index > -1 ){
      if(config.mode === 'LOCK'){
        //DO el call esegue adesso chiamata AXIOS
        let call = call_queue[index];
        const opt = call.option;
        Apix.call(opt.url, opt.data, opt).then(result=>call.resolve(result)).catch(reason=>call.reject(reason));
      }
      call_queue.splice(index, 1)
    }
  }
}

function findCall(id){
  return call_queue.findIndex(e=>e.id = id);
}