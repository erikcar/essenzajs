import { useApp } from "../hook/corehook";

export function Authorize({role, children}){
    const app = useApp()
    if(app.role.authorize(role)) 
        return children;
}