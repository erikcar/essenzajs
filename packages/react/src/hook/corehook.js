import React, { useEffect, useMemo, useContext, useState } from "react";
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
    core.context.setScope(new context());
    const vm = useWidget(vistamodel || VistaModel);
    //const app = useApp();
    vm.scope = core.context.scope;
    //core.context.setScope(vm.scope);
    console.log("DEBUG-USE-VISTA", vm);

    useEffect(() => () => {
        console.log("FREE VISTA RESOURCE");
        core.unshare(vm.scope);
    }, [vm]);

    return vm;
}

export function useWidget(viewmodel) {
    const vm = useMemo(() => {
        viewmodel = viewmodel || ViewModel;
        return new viewmodel(); //--> Check from context for override other then subscibe  
    }, [viewmodel]);

    //const app = useApp();

    core.context.scope.focus(vm);

    vm.render = React.useReducer(bool => !bool, true)[1];

    return vm; //[vm, core.context, core.context.qp];
}

export function useVM(viewmodel) {
    const vm = useMemo(() => {
        viewmodel = viewmodel || ViewModel;
        return new viewmodel(); //--> Check from context for override other then subscibe  
    }, [viewmodel]);

    //const app = useApp();

    //core.context.scope.focus(vm);

    vm.render = React.useReducer(bool => !bool, true)[1];

    return vm; //[vm, core.context, core.context.qp];
}

export function useModel(modeltype, initialData) {
    const [data, setData] = useState(initialData);

    //const app = useApp();

    const model = useMemo(() => {
        const m = new modeltype();
        m.listen("*", token => setData(token.data));
        core.context.scope.forward(m, modeltype.name); //modeltype.name, m.itype --> da gestire 2 o + dello stesso itype/name
        core.share(m);
        return m;
    }, [modeltype, setData]);

    return [model, data];
}

export function useBreakPoint(size) {
    let app = useApp(); //|| VistaApp;
    const bp = app.breakpoint;
    const [breakpoint, setBreakpoint] = useState(bp.getState());
    if (size)
        bp.register(size, setBreakpoint);
    return breakpoint;
}

export function useInit(callback) {

}