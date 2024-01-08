
export function Widget({ children, viewmodel }){
    console.log("MODEL-MAP-WIDGET", children, viewmodel);
    return (<>
        {children}
        {viewmodel && viewmodel.close()}
    </>)
}