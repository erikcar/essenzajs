// --- core/Entity.js ---

export class Entity {
    
    // --- COMPORTAMENTI COMUNI PURI ---
    // Il primo parametro è sempre 'self' (l'istanza del DataObject)

    /**
     * Validazione generica applicabile a qualsiasi DataObject
     */
    validate(self) {
        // Logica comune, es. controllo se ha una proprietà ID valida
        return self !== null && typeof self === 'object';
    }

    /**
     * Un comportamento comune di "Soft Delete"
     */
    markAsDeleted(self) {
        // Muta la proprietà reattiva del DataObject
        self.isDeleted = true;
        self.deletedAt = new Date().toISOString();
    }
}