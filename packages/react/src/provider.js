import React, { useMemo, useEffect, createContext, useContext, useState } from 'react';
import { Form } from "antd";
import { FormUI } from "./ui/form";

const AppContext = createContext(null);

// Hook dedicato per accedere all'App globale (es. per leggere configurazioni o loggare utente)
export const useEssenza = () => {
    const app = useContext(AppContext);
    if (!app) throw new Error("Manca <AppProvider> radice.");
    return app;
};

// Il Context interno (nascosto al framework consumatore)
const PresenterContext = createContext(null);

/**
 * L'Hook Agnostico:
 * Restituisce l'istanza del Presenter genitore più vicino nell'albero UI.
 * Se un giorno si cambia libreria UI, basta riscrivere questo hook.
 */
export function usePresenter() {
    return useContext(PresenterContext);
}

export const Essenza = ({ app, children }) => {
    return (
        <AppContext.Provider value={app}>
            {children}
        </AppContext.Provider>
    );
};

export function withPresenter(PresenterClass, ViewComponent) {
    
    return function PresenterWrapper(props) {
        // 1. Chiamate incondizionate (Regole di React)
        // Estraiamo il context globale e l'eventuale context del Presenter padre
        const app = useEssenza();
        const parentVp = usePresenter();

        // 2. CREAZIONE STABILE (Eseguita solo al mount)
        const vp = useMemo(() => {
            
            // Quale App usiamo? Quella del padre (se esiste) o quella globale
            const activeApp = parentVp ? parentVp.app : app;
            
            // MAGIC: Sfruttiamo il nostro nuovo container IoC per istanziare!
            // L'istanza avrà già 'instance.app = activeApp' grazie al metodo use()
            const instance = activeApp.use(PresenterClass);
            
            if (parentVp) {
                // Widget: Si aggancia al grafo del genitore
                instance.setParent(parentVp); 
            } else {
                // Vista Radice: L'App funge anche da Scope Radice (dato che estende Scope)
                instance.scope = activeApp; 
            }
            
            instance.onInit();
            return instance;
        }, []); // Nessuna dipendenza = Immutabile nel tempo

        // 3. SINCRONIZZAZIONE REACT -> PRESENTER
        vp.props = props;
        const [, forceRender] = React.useReducer(s => !s, false);
        vp.render = forceRender;

        // 4. GARBAGE COLLECTION
        React.useEffect(() => {
            return () => vp.onDestroy();
        }, [vp]);

        // 5. PROPAGAZIONE DEL GRAFO
        return (
            <PresenterContext.Provider value={vp}>
                <ViewComponent {...props} vp={vp} />
            </PresenterContext.Provider>
        );
    };
}

export const useFormEssenza = (name, data, schema) => {
    // 1. Recupero il Presenter padre dal Context
    const vp = usePresenter(); 
    const [target] = Form.useForm();
    
    // 2. Inizializzo la tua classe legacy FormUI
    const form = useMemo(() => {
        const _form = new FormUI(target, data);
        _form.init(schema);
        target.rules = _form.rules;
        target.vdata = {};
        _form.parent = vp; // Colleghiamo la logica al nuovo genitore
        return _form;
    }, [target]);

    // Sincronizzazione dati (uguale al tuo legacy)
    useEffect(() => {
        form.target.resetFields();
        form.data = data;
    }, [data]);

    // 3. LA MAGIA: Registrazione nel Grafo Logico
    useEffect(() => {
        if (vp && name) {
            vp.share(name, form);
            return () => vp.unshare(name, form);
        }
    }, [vp, name, form]);

    form.data = data;
    return form;
}

// --- packages/react/src/hooks/useNavigate.js ---

export function useNavigate() {
    const app = useEssenza();
    
    /**
     * @param {string} path - L'url a cui andare
     * @param {Object} options - { state: { ...dati } }
     */
    return (path, options = {}) => {
        app.router.navigate(path, options.state || {});
    };
}

export function useLocationState() {
    const app = useEssenza();
    const [data, setData] = useState(app.router.currentData);
    
    useEffect(() => {
        return app.router.subscribe((path, newData) => setData(newData));
    }, [app.router]);
    
    return data;
}

/**
 // --- index.js (o main.js) ---
import { App } from './core/App';
import { AppProvider } from './react/AppProvider';
import { MyRootView } from './views/MyRootView';

// 1. Definisco i servizi reali per l'ambiente browser
const browserServices = {
    ui: new SweetAlertUiService(),
    api: new FetchApiService('https://api.tuosito.com'),
    logger: console
};

// 2. Istanzio il "Core" (L'App) passando configurazioni e servizi
const myApp = new App({
    services: browserServices,
    schemas: {  }
});

// 3. Monto React iniettando l'istanza
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <AppEssenza app={myApp}>
        <MyRootView />
    </AppEssenza>
);
 */