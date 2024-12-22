import { ViewModel } from "./viewmodel/viewmodel";

export function sharing(){
    this.map = new Map();
    this.current = new node();
    this.map.set("root", this.current);
}

sharing.prototype.branch = function(key){
    if(this.map.has(key)){
        const last = this.current;
        this.current = this.map.get[key];
        this.current.parent = last;
    }
    else{
        this.current = new node(this.current);
        this.map[key] = this.current;
    }

    ViewModel.prototype.shared = this.current.shared;
}

sharing.prototype.unbranch = function(key){
    this.current = this.current.parent;
    ViewModel.prototype.shared = this.current.shared;
}

sharing.prototype.getNode = function(path){

}

sharing.prototype.getShared = function(path, type){

}

sharing.prototype.getAllShared = function(path, type){

}



function node(parent){
    this.parent = parent;
    this.shared = new Map();
}