/** @fileoverview packages/react/src\approot.js */
import React, { useEffect, useMemo, useState, createContext, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "./hook/corehook";
import { AppVM } from "./viewmodel/appvm";

/**
 * App is evaluate only the first time of AppRoot rendering. To change app context set value of React AppContext. 
 * Actually change context at runtime is reserved for future development, changing is not tested and can have unattended behvior or exception
 * 
 * @param {boolean} dev compile/build application in development mode
 * @param {boolean} guest compile/build application in guest mode, no login required
 * @returns 
 */
export const /**
 * AppRoot function.
 * @param {any} param1
 * @returns {any}
 */
    AppRoot = (props) => {
        const app = useApp();
        const [isInitialized, setIsInitialized] = useState(false);
        const [restored, setRestored] = useState(false);

        useEffect(() => {
            async function setup() {
                // Se 'alive' è true, attendiamo il token qui
                if (props.alive) {
                    app.alive = true;

                    //if (app.url.isRestricted()) {
                        const iapi = props.service?.iapi ?? app.core.services.iapi;
                        const session = await iapi.ensureValidToken();
                        setRestored(session);
                   // }
                    if(session) app.session.restored = true;
                    app.core.document.onunload(() => {
                        app.scopes.forEach(scope => scope.states && scope.states.forEach(s => s.cache()));
                    });
                }
                setIsInitialized(true);
            }
            setup();
        }, [app]);

        // Finché non è inizializzato, non renderizziamo AppCore.
        // Gli Hook dentro AppCore non verranno mai eseguiti finché non restituiamo il componente.
        if (!isInitialized) {
            return null; // O uno spinner di caricamento
        }

        return <AppCore {...props} app={app} restored={restored} />;
    }
/**
 * App is evaluate only the first time of AppRoot rendering. To change app context set value of React AppContext. 
 * Actually change context at runtime is reserved for future development, changing is not tested and can have unattended behvior or exception
 * 
 * @param {boolean} dev compile/build application in development mode
 * @param {boolean} guest compile/build application in guest mode, no login required
 * @returns 
 */
export const /**
 * AppRoot function.
 * @param {any} param1
 * @returns {any}
 */
    AppCore = ({ children, restored, baseUrl, breakpoint, noErrorHandler, dev, guest, alive, service, app }) => {

        const vm = useMemo(() => {
            const m = new AppVM(restored);
            m.init();
            m.parent = app;
            return m;
        }, [app]);//useWidget(AppVM);

        app.navigator = useNavigate();

        /**
        * For now we handle only qp on load. Next qp, if any, are managed by target  
        */

        app.url.params = useSearchParams();

        /** 
         * Maybe we want change context at runtime?...Default (spa) context is already built at this stage! => what about context.current???
        */

        //let flux = Promise.resolve();

        useMemo(() => {
            //flux = vm.emit("BUILD");
            vm.build();
        }, [app]);

        useMemo(() => {
            app.session.development = dev;
            app.session.guest = guest;
            //se ho session faccio context.build e poi context.session.start
            //flux.then(() => !app.url.hasRequest && vm.emit("SESSION"));
            vm.loadSession();
        }, [dev, guest]);

        useEffect(() => {
            vm.emit("LOADED");
        }); //LA ESEGUO OGNI VOLTA CHE NAVIGO DA UNA PAGINA ALL'ALTRA? OPPURE SOLO QUANDO CAMBIA SESSION STATE (LOGGED/NON LOGGED)? SE CAMBIO TOGLIERE CONDIZIONE SU
        //INTENT LOADED => loaded

        /*  <AppContext.Provider value={app} > *///</AppContext.Provider>
        return (<>
            {children /* <PopUp /> */}
        </>
        )
    }


