import { DataModel, core } from "@essenza/react";

export function UserData(){
    DataModel.call(this);
}

core.prototypeOf(DataModel, UserData, {
    itype: "users",
    
});

