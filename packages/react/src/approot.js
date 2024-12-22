import React, { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp, useWidget } from "./hook/corehook";
import { AppVM } from "./viewmodel/appvm";
import { Vista } from "./ui/vista";
import { Widget } from "./ui/widget";

/**
 * App is evaluate only the first time of AppRoot rendering. To change app context set value of React AppContext. 
 * Actually change context at runtime is reserved for future development, changing is not tested and can have unattended behvior or exception
 * 
 * @param {boolean} dev compile/build application in development mode
 * @param {boolean} guest compile/build application in guest mode, no login required
 * @returns 
 */
export const AppRoot = ({ children, baseUrl, breakpoint, noErrorHandler, dev, guest }) => {

    const app = useApp();
    const vm = useWidget(AppVM);

    app.navigator = useNavigate();

     /**
     * For now we handle only qp on load. Next qp, if any, are managed by target  
     */

    app.url.params = useSearchParams(); 

    /** 
     * Maybe we want change context at runtime?...Default (spa) context is already built at this stage! => what about context.current???
    */

    let flux = Promise.resolve();

    useMemo(() => {
        flux = vm.emit("BUILD");
    }, [app]);

    useMemo(() => {
        app.session.development = dev;
        app.session.guest = guest;
        flux.then(()=>!app.url.hasRequest && vm.emit("SESSION"));
    }, [dev, guest]);

    useEffect(() => {
        vm.emit("LOADED");
    }); //LA ESEGUO OGNI VOLTA CHE NAVIGO DA UNA PAGINA ALL'ALTRA? OPPURE SOLO QUANDO CAMBIA SESSION STATE (LOGGED/NON LOGGED)? SE CAMBIO TOGLIERE CONDIZIONE SU
    //INTENT LOADED => loaded

/*  <AppContext.Provider value={app} > *///</AppContext.Provider>
    return (<Widget>
        {children /* <PopUp /> */}
    </Widget>  
    )
}