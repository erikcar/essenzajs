import React, { useEffect, useMemo, useContext, useState, useRef } from "react";
import { appcontext } from "../context";
import { core, context } from "@essenza/core";
import { ViewModel, VistaModel } from "../viewmodel/viewmodel";

export let AppContext;

export const useApp = (init) => {
    /*if (!AppContext) AppContext = React.createContext(new appcontext().build());
    return React.useContext(AppContext)?.current;*/
    if (!AppContext) AppContext = new appcontext().initialize(init);
    return AppContext;
}

export function useVista(vistamodel) { 
    const scope = useRef(new context())
    core.context.setScope(scope.current);
    const vm = useWidget(vistamodel || VistaModel);
    //const app = useApp();
    //vm.scope = core.context.scope;
    //core.context.setScope(vm.scope);
    console.log("DEBUG-USE-VISTA", vm);

    useEffect(() => {
        return () => {
            console.log("FREE VISTA RESOURCE");
            core.unshare(vm.scope);
        }
    }, [vm]);

    return vm;
}

export function useWidget(viewmodel, props) {
    const vm = useMemo(() => {
        return core.context.attachScope(viewmodel || ViewModel, props && props["es-id"]); //--> Check from context for override other then subscibe  
    }, []);
    
    vm.props = props;
    core.context.updateScope(vm);
    //core.context.scope.current = vm;
    vm.render = React.useReducer(bool => !bool, true)[1];
    return vm; 
}



export function useVM(viewmodel) {
    const vm = useMemo(() => {
        return core.context.scope.binding.firstOrDefault(viewmodel || ViewModel); //--> Check from context for override other then subscibe  
    }, [viewmodel]);

    vm.render = React.useReducer(bool => !bool, true)[1];

    return vm; //[vm, core.context, core.context.qp];
}

export function useModel(modeltype, initialData) {
    const [data, setData] = useState(initialData);

    //const app = useApp();

    const model = useMemo(() => {
        const m = new modeltype();
        m.listen("*", token => setData(token.data));
        core.context.scope.forward(m, "$" + m.etype); //modeltype.name, m.itype --> da gestire 2 o + dello stesso itype/name
        core.share(m);
        return m;
    }, [modeltype, setData]);

    return [model, data];
}

export function useData(modeltype, initialData) {
    return useModel(modeltype, initialData)[1];
}

export function useBreakPoint(size) {
    let app = useApp(); //|| VistaApp;
    const bp = app.breakpoint;
    const [breakpoint, setBreakpoint] = useState(bp.getState());
    if (size)
        bp.register(size, setBreakpoint);
    return breakpoint;
}

export function useSource(key, initValue) {
    const [data, setData] = useState(core.source.get(key, initValue));

    useEffect(() => {
        core.source.subscribe(key, setData);
        return () => core.source.unscribe(setData);
    }, [setData])

    return [data, value => core.source.set(key, value)];
}

export function useValue(key, initValue) {
    return core.source.get(key, initValue);
}




