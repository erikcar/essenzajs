import React from 'react';
import { PlaceModel } from '../model/place';
import { ViewModel } from '../viewmodel/viewmodel';
import { SearchInput } from './search';
import { useData } from '../hook/corehook';
import { Tag } from 'antd';

function detectAdministrativeLevel(place) {
    const kind = String(place?.addresstype || place?.type || '').toLowerCase();
    const provinceKinds = new Set(['county', 'province', 'state_district', 'region']);
    const comuneKinds = new Set(['city', 'town', 'village', 'municipality', 'hamlet', 'suburb', 'neighbourhood']);

    if (provinceKinds.has(kind)) return 'Provincia';
    if (comuneKinds.has(kind)) return 'Comune';

    if (String(place?.type || '').toLowerCase() === 'administrative') {
        if (!place?.city && place?.county) return 'Provincia';
        if (place?.city || place?.town || place?.village) return 'Comune';
    }
    return 'Comune';
}

function defaultPlaceItemRender(place) {
    const level = detectAdministrativeLevel(place);
    const province = place?.county || place?.state || '-';
    const city = place?.city || place?.town || place?.village || place?.name || '-';

    return (
        <div className='p-2 border-b border-gray-300'>
            <div className='font-semibold truncate'>{place?.display_name}</div>
            <div className='flex gap-2 items-center'>
                <Tag>{level}</Tag>
                <div className='text-sm text-gray-600 truncate'>
                    {level === 'Provincia' ? province : `${city} (${province})`}
                </div>
                <Tag>Cap</Tag>
                <div className='text-sm text-gray-600'>{place?.postcode ?? '-'}</div>
            </div>
        </div>
    );
}

function View({ vm, className, itemRender, placeHolder = 'Cerca indirizzo o luogo', waiting = 500, digits = 3, geo = false, geojson = false, ...rest }) {
    let [data] = useData(vm.model);

    const item = itemRender ? itemRender : defaultPlaceItemRender;
    const useGeoJson = geojson || geo;

    return <SearchInput item={item} className={className || 'w-96'} placeHolder={placeHolder} labelField='display_name' field='display_name'
        source={data} digits={digits} onDigits={v => vm.model.search(v, useGeoJson)} remote={true} waiting={waiting} onClear={v => vm.onSearch(null)}
        hidePrefixWhenSelected
        {...rest} />;
}

export const PlacePicker = ViewModel.create({
    '@view': View,

    $$constructor() {
        this.model = this.inject(PlaceModel);
    },
});
