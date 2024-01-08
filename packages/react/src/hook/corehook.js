import { useEffect, useMemo, useState } from "react";
import { appcontext } from "./context";

export let AppContext;

export const useApp = () => {
    if (!AppContext) AppContext = React.createContext(new appcontext());
    return React.useContext(AppContext)?.current;
}

export function useVista(viewmodel) {
    const app = useApp();
    const ctx = useRef(new context()).current;

    console.log("DEBUG-USE-VISTA", app);

    app.setCurrent(ctx); //--> CREATE new context each rendering? => VM non vengono ricretai e fanno unscribe in dispose...
    
    return useVM(viewmodel);
}

export function useVM(viewmodel) {

    const vm = useMemo(() => {
        return new viewmodel().subscribe(); //--> Check from context for override other then subscibe  
    }, [viewmodel]);

    useEffect(() => () => vm.dispose(), [vm]);

    vm.render = React.useReducer(bool => !bool, true)[1];

    return vm;
}