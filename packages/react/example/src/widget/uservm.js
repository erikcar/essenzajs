import { ViewModel, core } from "@essenza/react";

export function UserVM(){
    ViewModel.call(this);
    this.UserData = null;
}

core.prototypeOf(ViewModel, UserVM,{
    intent:{
        DELETE: function({data}){
            
        }
    }
});

export function UserDetailVM(){
    ViewModel.call(this);
    this.userdata = null;
}

core.prototypeOf(ViewModel, UserDetailVM);