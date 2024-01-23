import { useWidget, useModel, Widget } from "@essenza/react";
import { UserVM } from "./uservm";
import { UserData } from "../data/user";
import { useEffect } from "react";
import { Button, Table } from 'antd';

export function AdminWidget() {
    const vm = useWidget(UserVM);
    const [user, data] = useModel(UserData);

    useEffect(() => {
        user.collection();
    }, [user])

    return (
        <Widget>
            {data ? <Table rowKey="id" columns={Columns(vm)} dataSource={data}></Table> : "Nessun utente presente"}
        </Widget>
    )
}

const users = ["Amministratore", "Operatore", "Partner", "Utente"];

function Columns(vm) {
    return [
        {
            title: "Cognome",
            dataIndex: "tsurname",
            key: "id",
        },
        {
            title: "Nome",
            dataIndex: "tname",
            key: "id",
        },
        {
            title: "Email",
            dataIndex: "temail",
            key: "id",
        },
        {
            title: "Ruolo",
            dataIndex: "itype",
            key: "id",
            render: (text, record) => {
                return (<>{users[record.itype]}</>)
            },
            width: "100%"
        },
        {
            key: "id",
            render: (text, record) => {
                return (<Button className='btn-lite' onClick={() => vm.emit("DELETE", record)}>Elimina</Button>)
            },
        },
        {
            key: "id",
            render: (text, record) => {
                return (<Button className='btn-pri' onClick={() => vm.emit("EDIT", record)} >Modifica</Button>)
            },
        },
    ]
}