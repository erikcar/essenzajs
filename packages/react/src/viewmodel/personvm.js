import { DataObserver } from "@essenza/core/src";
import { ViewModel } from "./viewmodel";

function PersonVM() {
    ViewModel.call(this);
    this.person; //init null??? this.person = new DataSource();

    this.person.mutating("blocality").make(data => {
        this.person.country = data.item?.country;
        this.update(); // Oppure quando cambia 
    });

    //Dovrebbe essere su 
    this.observe("PERSON-ITEM", this.context.data); //per VM posso creare un metodo che fa questo automaticamente

    //O ascolto tutte le mutation discendant e prendo solo quella che corrisponde a this.person, o faccio observe/unobserve ad ogni set di this.person
    this.observe("MUTATING", this.person).use(new DataObserver("blocality").hasValue()).make(data => {
        this.person.country = data.item.country;
        this.update(); // Oppure quando cambia 
    });

    this.observeGlobal("MUTATING").use(new DataObserver("blocality").hasValue()).make(data => {
        this.person.country = data.item.country;
        this.update(); // Oppure quando cambia 
    }); //typeOf(person)??? oppure osservo direttamente ds?
}

core.prototypeOf(ViewModel, PersonVM, {

});

function AddressControl(c, { form }) {

    c.intent.SEARCH = ({ value }) => {
        c.request(ComuneModel, m => m.search(value));
    }

    const obs = c.observe(form.name, "SELECT");

    //Block
    let blk = new EntityBlock("locality").hasValue().intent(({ target, data }) => { //individua autonomamente form a cui view appartiene?
        console.log("LOCALITY OBSERVER", data);
        const form = target.current;
        const item = data.item;
        form.setValue("city", item.city);
        form.setValue("country", item.country);
        form.setValue("code", item.code);
    });

    obs.Append(blk);
}