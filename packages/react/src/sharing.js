/** @fileoverview packages/react/src\sharing.js */
import { ViewModel } from "./viewmodel/viewmodel";

/**
 * sharing function.
 * @returns {void}
 */
export function sharing(){
    this.map = new Map();
    this.current = new node();
    this.map.set("root", this.current);
}

/**
 * branch function.
 * @param {any} key
 * @returns {void}
 */
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

/**
 * unbranch function.
 * @param {any} key
 * @returns {void}
 */
sharing.prototype.unbranch = function(key){
    this.current = this.current.parent;
    ViewModel.prototype.shared = this.current.shared;
}

/**
 * getNode function.
 * @param {any} path
 * @returns {void}
 */
sharing.prototype.getNode = function(path){

}

/**
 * getShared function.
 * @param {any} path
 * @param {any} type
 * @returns {void}
 */
sharing.prototype.getShared = function(path, type){

}

/**
 * getAllShared function.
 * @param {any} path
 * @param {any} type
 * @returns {void}
 */
sharing.prototype.getAllShared = function(path, type){

}



/**
 * node function.
 * @param {any} parent
 * @returns {void}
 */
function node(parent){
    this.parent = parent;
    this.shared = new Map();
}


