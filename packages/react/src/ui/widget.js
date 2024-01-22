/**
 * Blur solo se è open (focusin) ovvero è stato chiamato un useVM
 * @param {*} children 
 * @returns 
 */
export function Widget({ children }) {
    const app = useApp();
    console.log("DEBUG-WIDGET", app, children);
    return (<>
        {children}
        {app.scope.blur()}
    </>)
}