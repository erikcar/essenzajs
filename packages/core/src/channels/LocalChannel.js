/** @fileoverview packages/core/src\channels\LocalChannel.js */
import { options } from "less";

/**
 * localChannel function.
 * @returns {void}
 */
export default function localChannel() {
    /**
   * send function.
   * @param {any} opt
   * @returns {any}
   */
    this.send = function (opt) {
    return new Promise(function (resolve, reject) {
      resolve({data: opt.data});
    });
  };
}

/**
 * localINT function.
 * @returns {void}
 */
export function localINT(){
    /**
   * translate function.
   * @param {any} graph
   * @returns {any}
   */
    this.translate = function(graph){
    if(graph.nonQuery){
      let node = graph.root;
      let item = {etype: node.etype, __ref: node.uid};
      //Traverse children
      node.traverse( (n) => item[n.name] = n.isCollection? [] : null);
      return item;
    }
  }
}


