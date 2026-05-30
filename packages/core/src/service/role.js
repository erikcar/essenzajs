// --- packages/core/src/services/RoleService.js ---
export class RoleService {
    constructor() {
        this.rolesDict = {}; 
        this.rawRoles = [];  
        this.routesMap = new Map(); 
        this.currentRoleIndex = -1;
    }

    /** Sostituisce Role.configure() */
    configureRoles(rolesArray) {
        this.rawRoles = rolesArray;
        this.rolesDict = {};
        rolesArray.forEach((role, i) => {
            this.rolesDict[role] = 1 << i; // Es: ADMIN: 1, USER: 2, MANAGER: 4
        });
        this.currentRoleIndex = 0; // Default a GUEST
    }

    /** Sostituisce Role.addRoute() */
    setDefaultRouteForRole(rolesString, path) {
        const roles = rolesString.split(',').map(r => r.trim());
        roles.forEach(role => {
            this.routesMap.set(role, path);
        });
    }

    /** Aggiorna il ruolo (chiamato dall'AuthService al login) */
    setCurrentRole(roleName) {
        this.currentRoleIndex = this.rawRoles.indexOf(roleName);
        if (this.currentRoleIndex === -1) this.currentRoleIndex = 0;
    }

    getCurrentRoleName() {
        return this.currentRoleIndex > -1 ? this.rawRoles[this.currentRoleIndex] : 'GUEST';
    }

    /** Sostituisce Role.getRoute() */
    getDefaultRoute() {
        const roleName = this.getCurrentRoleName();
        return this.routesMap.get(roleName) || '/';
    }

    /** Sostituisce Role.authorize() */
    authorize(requiredRoles) {
        if (!requiredRoles || this.currentRoleIndex === -1) return true;

        let requiredMask = 0;
        if (typeof requiredRoles === 'string') {
            const split = requiredRoles.split(',').map(r => r.trim());
            split.forEach(role => {
                if (this.rolesDict.hasOwnProperty(role)) {
                    requiredMask |= this.rolesDict[role];
                }
            });
        } else {
            requiredMask = requiredRoles;
        }

        // Calcolo bitwise per validare il permesso
        return (requiredMask & (1 << this.currentRoleIndex)) > 0;
    }
}