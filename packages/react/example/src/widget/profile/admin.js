import { useWidget, UserVM, Widget } from "@essenza/react";
import { Button, Table } from 'antd';

export function UserAdmin({data, roles}) {
    console.log("WIDGET ADMIN", arguments);
    const vm = useWidget(UserVM, arguments);
    
    return (
        <Widget>
            {Array.isArray(data) ? <Table rowKey="id" columns={Columns(vm, roles)} dataSource={data}></Table> : "Nessun utente presente"}
        </Widget>
    )
}

function Columns(vm, roles) {
    return [
        {
            title: "Cognome",
            dataIndex: "surname",
            key: "id",
        },
        {
            title: "Nome",
            dataIndex: "name",
            key: "id",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "id",
        },
        {
            title: "Ruolo",
            dataIndex: "itype",
            key: "id",
            render: (text, record) => {
                return Array.isArray(roles) ? (<>{roles[record.itype]}</>) : "UTENTE"
            },
            width: "100%"
        },
        {
            key: "id",
            render: (text, record) => {
                return (<Button className='btn-lite' onClick={() => vm.emit("USER_DELETE", record)}>Elimina</Button>)
            },
        },
        {
            key: "id",
            render: (text, record) => {
                return (<Button className='btn-pri' onClick={() => vm.emit("USER_DETAIL", record)} >Modifica</Button>)
            },
        },
    ]
}