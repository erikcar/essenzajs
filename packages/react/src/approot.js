import React, { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { appcontext } from "./context";

export let AppContext;
/**
 * onbuild = (app) =>{
 *  app.observe("LOGIN").make(info=>{
 *      app
 *  }).oneTime();
 * }
 */
/**
 * app is evaluate only the first time of AppRoot rendering. To change app context set value of React AppContext. 
 * Actually change context at runtime is reserved for future development, changing is not tested and can have unattended behvior or exception
 * @param {*} param0 
 * @returns 
 */
export const AppRoot = ({ oninit, onbuild, loaded, start, onlogin, schema, services, children, breakpoint, noErrorHandler, dev, guest }) => {

    const _app = useApp();

    console.log("DEBUG APP ROOT", _app);

    _app.navigate = useNavigate();

    /**
     * For now we handle only load qp. Next qp if any are managed by target  
     */

    const [qp] = useSearchParams();

    useMemo(() => {
        _app.session.development = dev;
        _app.session.guest = guest;
        _app.initialized && _app.session.load();
    }, [dev, guest]);

    /**
     * Apply onbuild before build context. Here we can define and/or change Default behavior of context
     */

    if (!_app.built) {
        console.log("DEBUG APP BUILD", schema, services);

        onbuild && onbuild(_app);
        _app.build(schema, Object.assign({ INavigator: _app.navigate }, services));

        _app.initialize(qp);
        oninit && oninit(_app);

        start && _app.observe("READY", i => start(i.context)).once();
        onlogin && _app.observe("LOGIN", i => onlogin(i.context));
    }

    /** 
     * Maybe we want change context at runtime?...Default (spa) context is already built at this stage! => what about context.current???
    */

    useEffect(() => {
        loaded && loaded(_app);
        _app.loading.execute();
    }, [_app]);

    return (
        <AppContext.Provider value={_app} >
            {children}
            {/* <PopUp /> */}
        </AppContext.Provider>
    )
}

export const useApp = () => {
    if (!AppContext) AppContext = React.createContext(new appcontext());
    return React.useContext(AppContext)?.current;
}