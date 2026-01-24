import React from "react";
import { PlaceModel } from "../model/place";
import { ViewModel } from "../viewmodel/viewmodel";
import { SearchInput } from "./search";
import { useData } from "../hook/corehook";
import { Tag } from "antd";

function View({ vm, className, itemRender, placeHolder = "Cerca indirizzo o luogo", waiting = 500, digits = 3, ...rest }) {
    let [data] = useData(vm.model);
    
    const item = itemRender ? itemRender : (data) => <>
        <div className="p-2 border-b border-gray-300">
            <div className="font-semibold">{data.display_name}</div>
            <div className="flex gap-1 items-center">
                <Tag>Città</Tag>
                <div className="text-sm text-gray-600"> {`${data.city ?? ''} (${data.county ?? '-'})`}</div>
                <Tag>Cap</Tag>
                <div className="text-sm text-gray-600"> {data.postcode ?? '-'}</div>
            </div>
        </div>
    </>;

    return <SearchInput item={item} className={className || "w-96"} placeHolder={placeHolder} labelField="display_name" field="display_name"
        source={data} digits={digits} onDigits={v => vm.model.search(v)} remote={true} waiting={waiting} onClear={v => vm.onSearch(null)}
        {...rest} />
}

export const PlacePicker = ViewModel.create({
    "@view": View,

    $$constructor() {
        this.model = this.inject(PlaceModel);
    },
});