import React, { useMemo, useState } from "react";

export function EditableText({ field, data, onChanging, numeric }) {
    const [editable, setEditable] = useState(false);

    const target = useMemo(() => data || {}, [data]);

    if (!field || !target) return null;

    const onblur = (e) => {
        let v = e.target.value;
        if (v !== target[field]) {
            if (numeric) {
                let value = Number(v);
                v = isNaN(value) ? Number(v.replace(/[^0-9\.|\,]/g, '').replace(",", ".")) : value;
            }

            if (onChanging)
                onChanging({ value: v, target, field });
            console.log("onchanging", target, field, v);
            target[(target.$$typeof === Symbol.for('es.dataobject') ? '$' : '') + field] = v;
        }

        setEditable(false);
    }

    return (
        editable
            ? <input className="flex-none" onChange={e => e.target.size = e.target.value.length} size={target[field].length} autoFocus onBlur={onblur} defaultValue={target[field]}></input>
            : <span className="" style={{ minHeight: '16px' }} onBlur={onblur} onClick={() => setEditable(true)} >{target[field]}</span>
    )
}