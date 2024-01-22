
export function AdminBL(){

}

AdminBL.prototype = {
    execute: function(token){
        const { context } = token;
        context.navigate("uadmin");
    }
}
