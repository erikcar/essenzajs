// --- core/StateMachine.js ---

export class Machine {
    constructor(config) {
        this.states = config.states || {};
    }

    // Controlla se la transizione esiste per lo stato attuale
    canTransition(currentState, actionName) {
        const stateNode = this.states[currentState];
        return stateNode && stateNode.on && !!stateNode.on[actionName];
    }

    // Recupera i dettagli della transizione (quale behavior eseguire, se c'è autoSave, ecc.)
    getTransition(currentState, actionName) {
        if (!this.canTransition(currentState, actionName)) {
            throw new Error(`Transizione non valida: non puoi eseguire '${actionName}' dallo stato '${currentState}'`);
        }
        return this.states[currentState].on[actionName];
    }
}