import { useVM } from "../hook/corehook";
import { AddressModel } from "../model/addressmodel";
import { SelectFilter } from "../ui/InputFilter";
import { FormiItem } from "../ui/form";

export function Address({ direction, children, form, label }) {
    
    const vm = useVM(AddressModel);

    direction = direction || "horizontal";

    //const options = useGraph(ComuneModel, "search", []); // devo poter distiguere da un altro

    //console.log("ADDRESS", options);

    const content = <>
        <FormiItem name="street" label={label}>
            <Input placeholder="Indirizzo Residenza" style={{ width: '390px' }} />
        </FormiItem>
        <FormiItem name="locality">
            <SelectFilter options={vm.localities} onDigits={v => vm.emit("LOC_REQUEST", v)} onSelect={item => vm.emit("LOC_SELECT", item)} placeholder="Comune Residenza" style={{ width: '350px' }} />
        </FormiItem>
        <FormiItem name="city">
            <Input disabled={true} placeholder="Provicia" style={{ width: '80px' }} />
        </FormiItem>
        <FormiItem name="code">
            <Input placeholder="CAP" style={{ width: '80px' }} />
        </FormiItem>
        <FormiItem name="country">
            <Input disabled={true} placeholder="Stato" style={{ width: '80px' }} />
        </FormiItem>
    </>;

    return (
        direction === "horizontal"
            ? <Space>{content}{children}</Space>
            : <>{content}{children}</>
    )
}