function CFControl(c, {form}){
    
    c.intent.SEARCH = ({value}) => {
        c.request(ComuneModel, m => m.search(value));
    }

    let obs = c.observe(form.name, "SELECT");

    //Block
    let blk = new EntityBlock("blocality").hasValue().intent(({target, data}) => { //individua autonomamente form a cui view appartiene?
        console.log("LOCALITY OBSERVER", data);
        target.current.setValue("bcountry", data.item.country);
    });

    obs.Append(blk);

    obs = c.observe(form.name, "CHANGE");

    blk = new EntityBlock("tsurname,tname,tgender,dborn,blocality").hasValue().intent(({data, target}) => {
        console.log("CF OBSERVABLE", data);
        const v = data.values;
        const info = { tname: v.tname, tsurname: v.tsurname, dborn: v.dborn.format().split('T')[0], tgender: v.tgender, istat: v.blocality.value }
        c.request(UserService, s => s.getFiscalCode(info).then((r) => {
            target.current.setValue("tfiscalcode", r);
        }))
    })

    obs.Append(blk);
}

export function CodiceFiscale({ direction, model, form }) {
    const control = useFragment(model, CFControl, {form});
    direction = direction || "horizontal";
    const options = useGraph("comune.search", null, []);
  
    const content = <>
        <Row gutter={12}>
            <Col flex="none">
                <FormixItem name="tsurname" label="Cognome">
                    <Input placeholder="Cognome" style={{ width: '260px' }} />
                </FormixItem>
            </Col>

            <Col flex="none">
                <FormixItem name="tname" label="Nome">
                    <Input placeholder="Nome" style={{ width: '260px' }} />
                </FormixItem>
            </Col>

            <Col flex="none">
                <FormixItem name="tgender" label="Sesso">
                    <Select defaultValue="M" >
                        <Select.Option value="M">M</Select.Option>
                        <Select.Option value="F">F</Select.Option>
                    </Select>
                </FormixItem>
            </Col>

            <Col flex="none">
                <FormixItem name="dborn" label="Data Nascita">
                    <DatePicker style={{ minWidth: '120px' }} format={['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD']} />
                </FormixItem>
            </Col>

            <Col flex="auto">
                <FormixItem name="blocality" label="Comune Di Nascita">
                    <SelectFilter options={options.data} onDigits={(v) => model.emit("SEARCH", v)} placeholder="Comune Di Nascita" style={{ width: '100%' }}  />
                </FormixItem>
            </Col>

            <Col flex="none">
                <FormixItem name="bcountry" label="Stato">
                    <Input disabled={true} placeholder="Stato" style={{ width: '70px' }} />
                </FormixItem>
            </Col>

            <Col flex="none">
                <FormixItem name="tfiscalcode" label="Codice Fiscale">
                    <Input placeholder="Codice Fiscale"  style={{ width: '180px' }}/>
                </FormixItem>
            </Col>
        </Row>
    </>
    return content;
    /* return (
        direction === "horizontal"
            ? <Space>{content}</Space>
            : content
    ) */
}

function AddressControl(c, {form}){
    
    c.intent.SEARCH = ({value}) => {
        c.request(ComuneModel, m => m.search(value));
    }

    const obs = c.observe(form.name, "SELECT");

    //Block
    let blk = new EntityBlock("locality").hasValue().intent(({target, data}) => { //individua autonomamente form a cui view appartiene?
        console.log("LOCALITY OBSERVER", data);
        const form = target.current;
        const item = data.item;
        form.setValue("city", item.city);
        form.setValue("country", item.country);
        form.setValue("code", item.code);
    });

    obs.Append(blk);
}

export function Address({ model, direction, children, source, form, vid, label, ...info }) {
    const control = useFragment(model, AddressControl, {form});
    direction = direction || "horizontal";
    //const [model] = useModel(vid);
    const options = useGraph(ComuneModel, "search", []); // devo poter distiguere da un altro

    console.log("ADDRESS", options);

    const content = <>
        <FormixItem name="street" label={label}>
            <Input placeholder="Indirizzo Residenza" style={{ width: '390px' }} />
        </FormixItem>
        <FormixItem name="locality">
            <SelectFilter options={options.data} onDigits={(v) => model.emit("SEARCH", v)} placeholder="Comune Residenza" style={{ width: '350px' }} />
        </FormixItem>
        <FormixItem name="city">
            <Input disabled={true} placeholder="Provicia" style={{ width: '80px' }} />
        </FormixItem>
        <FormixItem name="code">
            <Input placeholder="CAP" style={{ width: '80px' }} />
        </FormixItem>
        <FormixItem name="country">
            <Input disabled={true} placeholder="Stato" style={{ width: '80px' }} />
        </FormixItem>
    </>;

    return (
        direction === "horizontal"
            ? <Space>{content}{children}</Space>
            : <>{content}{children}</>
    )
}