import { useVista, Vista, ViewModel, core, useModel, UserModel, RULES } from "@essenza/react";
import { Login } from "../../widget/profile/login";
import { Logo } from "../../layout/logo";
import LoginScreen from '../../assets/img/login.jpg';
import * as yup from 'yup';

export function LoginVista() {
    const vm = useVista(LoginVVM);
    const [user] = useModel(UserModel);

    return (
        <Vista>
            <div className='w100 '>
                <div className='max-width-xl centered'>
                    <div className='max-width-xl h-main padding-sm' align="middle">
                        <div span={0} md={12} className="">
                            <div>
                                <img src={LoginScreen} className="radius-md h-md" style={{ width: "auto" }} alt="Etna Cover"></img>
                            </div>
                        </div>
                        <div span={24} md={12} className="bg-block padding-xl h-md radius-md">
                            <Logo className="mb-lg" />
                            <h1 className="my-lg">
                                Login App!
                            </h1>
                            <Login user={user.newInstance()} rules={vm.rules}  />
                        </div>
                    </div>
                </div>
            </div>
        </Vista>
    )
}

export function LoginVVM() {
    ViewModel.call(this);
}

core.prototypeOf(ViewModel, LoginVVM, {
    get rules(){  return yup.object({
        email: RULES.email(yup),
        password: RULES.password(yup),
    })},
    intent: {

    }
});