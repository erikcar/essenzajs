/** @fileoverview packages/core/src\provider.js */


/**
 * Provider function.
 * @returns {void}
 */
export function Provider(){
    
}

/**
 * DataProvider function.
 * @returns {void}
 */
export function DataProvider(){
    this.data = null;
    this.args = undefined;
    this.name = undefined;
}

DataProvider.prototype = {
        /**
     * equal method.
     * @param {any} args
     * @returns {any}
     */
        equal: function(args){
        //PROVIDER WITH NO PARAMETERS
        if(args === null) return true;
        else if(this.args === undefined){
            this.args = args;
            return false;
        }
        else{ //Match parameters

        }
    }
}

//Source è una Map di datasource
/**
 *  # GESTISCE SYNC (DI TUTTO IL GRAPH)
 *  # GESTISCE DP CHE LO USANO
 *  # POLITICA DI DISPOSE
 *  # FA CAST DI SOURCE???
 */



