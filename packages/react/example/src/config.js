import { Link } from "@essenza/react";

export function ConfigureApp(app){
    app.setBaseUrl("https://localhost:7294/");

    //app.configureService({ITask: app})

    app.configureType({
        user:{
            fields: ['id','tname','tsurname','temail','tpassword','itype','taddress','tportfolio','cv','img','phone','tbusinessname','tsite','tbusinessarea','tlogo','twebsiteurl','tanswerablename','tanswerablesurname','username','nusername','nemail','emailvalid','phonevalid','twofactor','cap','jskills','cvdate','mkt','ctrl','tech','tnoty','irange','idbusiness','complete','privacy'],
            children: [{ name: "rules", etype: "permission", collection: true, link: Link.DOWN_WISE }],
        },
        
        permission:{
            fields: ["key", "read", "write", "edit"]
        }
    });
}
