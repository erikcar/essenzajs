import LogoSrc from "../assets/img/logo.png";

export function Logo({className, ...rest}){
    return <img src={LogoSrc} {...rest} alt="Logo" className={"img-resize " + className} />
}