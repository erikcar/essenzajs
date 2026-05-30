// --- packages/react/src/EssenzaReact.js ---
import React, { useEffect } from 'react';
import { EssenzaApp } from '@essenza/core';


export class EssenzaReact extends EssenzaApp {
    
    constructor(config = {}) {
        super(config);
    }

    /**
     * Override del boot. Esegue la logica base e poi monta l'albero React.
     */
    async boot(root, AppTreeComponent) {
        
        // 1. Esegue tutta la logica asincrona del Core (Auth, Servizi, Flow)
        await super.boot();

        // Wrapper invisibile per sparare APP_LOADED a rendering ultimato
        const RootWrapper = () => {
            useEffect(() => {
                this.bus.emit('APP_LOADED', this);
            }, []);
            
            return <AppTreeComponent app={this} />;
        };

        root.render(<RootWrapper />);
    }
}