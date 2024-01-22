import { DataModel, core } from "@essenza/core";

export function AddressModel() { 
    DataModel.call(this);
}

core.prototypeOf(DataModel, AddressModel, {
    loadLocality: (name) => {
        //restituisce DS poi è richiedente che decide se registrarsi per ricevere aggiornamenti

        /*prima controlla se esiste un ds aggiornato con gli stessi parametri oppure aggiorna sempre richiesta se richiedente lo specifica
            => "etype.name"
        */
       
       this.getSource("localities", name);

       //CONDITION di appartenenza

        //poi devo fare casting prima di passare il dato (come pipe in provider???)
        //DS è un caso specifico del più generale concetto di provider ???!?!?!?
        return this.ExecuteApi("locality", {name}); //ExecuteDataApi("locality", {name})
    },
});