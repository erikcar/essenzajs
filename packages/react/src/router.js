// --- packages/react/src/Router.jsx ---
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useEssenza } from './provider'; // Presumo tu abbia un hook per l'app

// Il contesto che passa i pezzi di URL ai figli
const RouterContext = createContext({ remainingPath: '', matchedChildren: null });

/** * <Route> è un componente "fantasma". Non renderizza nulla da solo, 
 * serve solo a definire la configurazione in formato JSX.
 */
export const Route = () => null;

/**
 * <Routes> è il vero motore di matching.
 */
export const Routes = ({ children }) => {
    const app = useEssenza();
    
    // 1. Reattività: Ascoltiamo i cambi di URL dal Core
    const [url, setUrl] = useState(app.router.currentPath);
    useEffect(() => app.router.subscribe(setUrl), [app.router]);

    // 2. Capiamo dove siamo nell'albero
    const parentCtx = useContext(RouterContext);
    
    // Se siamo al livello root, guardiamo l'intero URL. 
    // Se siamo in un figlio (es. in un Outlet), guardiamo solo la parte rimanente.
    const pathToMatch = parentCtx.remainingPath !== undefined ? parentCtx.remainingPath : url;
    
    // Dividiamo l'URL in segmenti. Es: "/home/details" -> ["home", "details"]
    const segments = pathToMatch.split('/').filter(Boolean);

    // 3. Estraiamo la configurazione dai figli JSX
    const routeList = React.Children.toArray(children).map(child => child.props);

    // 4. Troviamo il primo Match!
    for (const route of routeList) {
        let matched = false;
        let newRemainingPath = pathToMatch;

        if (route.index) {
            // <Route index /> fa match se non ci sono più segmenti
            if (segments.length === 0) matched = true;
        } 
        else if (route.path === '/') {
            // Un Layout principale. Fa match sempre, e passa TUTTI i segmenti ai figli.
            matched = true;
            newRemainingPath = pathToMatch;
        } 
        else {
            // Una rotta normale es: path="home"
            const routeSegments = route.path.split('/').filter(Boolean);
            
            // Controlla se la parte iniziale dei segmenti correnti coincide con la rotta
            const isMatch = routeSegments.every((seg, i) => seg === segments[i]);
            
            if (isMatch) {
                matched = true;
                // Tagliamo la parte "consumata". Es: se matcho "home", passo al figlio "details"
                newRemainingPath = segments.slice(routeSegments.length).join('/');
            }
        }

        // 5. Se fa Match, Disegniamo!
        if (matched) {
            return (
                <RouterContext.Provider value={{ 
                    remainingPath: newRemainingPath, 
                    matchedChildren: route.children // Salviamo i figli per l'Outlet!
                }}>
                    {route.element}
                </RouterContext.Provider>
            );
        }
    }

    return null; // Rotta non trovata (Qui potresti renderizzare un 404 custom)
};

/**
 * L'Outlet estrae i figli matchati dal padre e li ridisegna come nuove Rotte.
 */
export const Outlet = () => {
    const ctx = useContext(RouterContext);
    if (!ctx || !ctx.matchedChildren) return null;
    
    // Ricorsione! L'outlet crea un mini-contesto Routes per i figli
    return <Routes>{ctx.matchedChildren}</Routes>;
};