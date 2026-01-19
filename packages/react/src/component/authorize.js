/** @fileoverview packages/react/src\component\authorize.js */
import { useApp } from "../hook/corehook";

/**
 * Authorize function.
 * @param {any} param1
 * @returns {any}
 */
export function Authorize({role, children}){
    const app = useApp()
    if(app.role.authorize(role)) 
        return children;
}


