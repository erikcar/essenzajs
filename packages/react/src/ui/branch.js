
export function Branch({children, name}){
    return (<>
        {children}
        {viewmodel && viewmodel.close()}
    </>)
}