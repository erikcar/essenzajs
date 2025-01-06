export function Request(name, callback, data){
    this.name = name;
    this.callback = callback;
    this.data = data;
}

Request.prototype = {
    $$type: Request,

    response(message){
        this.callback && this.callback(message);
    },
}

//Aggiungere classe Messenger che lavora attraverso root context, quindi globalmente