/** @fileoverview packages/core/src\messaging.js */
/**
 * Request function.
 * @param {any} name
 * @param {any} callback
 * @param {any} data
 * @returns {void}
 */
export function Request(name, callback, data){
    this.name = name;
    this.callback = callback;
    this.data = data;
}

Request.prototype = {
    $$type: Request,

        /**
     * response method.
     * @param {any} message
     * @returns {void}
     */
        response(message){
        this.callback && this.callback(message);
    },
}

//Aggiungere classe Messenger che lavora attraverso root context, quindi globalmente


