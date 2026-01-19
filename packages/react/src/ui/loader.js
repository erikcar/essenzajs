/** @fileoverview packages/react/src\ui\loader.js */
import React from 'react';
import './ui.css';

/*export function Loader() {
    return (<div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>);
}*/

/**
 * LoaderB function.
 * @param {any} param1
 * @returns {any}
 */
export function LoaderB({className = ""}){
    return <div className={"loader mx-auto d-block " + className}></div>;
}


