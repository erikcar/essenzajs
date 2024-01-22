import { webcontext } from "./context";
import { core, $Data, TypeSchema, Link } from "@essenza/core";
import { Session } from "./session";
import { User } from "./user";

function webInit(){
    TypeSchema.session = {
        fields: {},
        type: Session,
        children: [],
    },
    
    TypeSchema.user = {
        fields: {
            id:true, name:true, surname:true, email:true, password:true, itype:true, address:true, phone:true, username:true, nusername:true, nemail:true, emailvalid:true, phonevalid:true, twofactor:true, cf:true, vatnumber:true,
            portfolio:true, image:true, website:true, mkt:true, locked:true, dlog:true, dlast:true, businessname:true, bsite:true, businessarea:true, logo:true, street:true, num:true, locality:true, code:true, city:true, affiliate: true,
        },
        type: User,
        children: [{ name: "cart", etype: "cartitem", collection: true, link: Link.DOWN_WISE }],
    },
    
    TypeSchema.cart= {
        //table: "CartTable", => optional
        //type: 
        fields: {},
        children: [{ name: "items", etype: "cartitem", collection: true, link: Link.DOWN_WISE }],
    },
    
    TypeSchema.cartitem = {
        fields: { id:true, title:true, quantity:true, productid:true },
    },
    
    core.typeDef = window.hasOwnProperty('$wgschema') ? $wgschema(TypeSchema) : TypeSchema;
    $Data.buildSchema(core.typeDef);

    new webcontext().build(core);
    //core.build(new webcontext());
    window.$es = core.context;
}

export {webInit};
//webInit();

export { webObject } from "./webobject"
//export { core, Observable, waitAction, deferredAction, DataObject } from "@essenza/core"