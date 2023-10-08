import { options } from "less";

export default function localChannel() {
  this.send = function (opt) {
    return new Promise(function (resolve, reject) {
      resolve({data: opt.data});
    });
  };
}

export function localINT(){
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