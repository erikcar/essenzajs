import { message, notification, Upload } from "antd";
import { UI } from "./ui";
import React from "react";

function view({ ui, onSuccess, children, ...rest }) {
    const onsuccess = (r,d)=>{
        ui.onSuccess(r);
        onSuccess && onSuccess(r, d);
    }

    return (
        <Upload name="attachment" onChange={f => ui.onchange(f)} onSuccess={onsuccess} customRequest={o => ui.upload(o)} {...rest} >
            {children}
        </Upload>
    )
}

export const Attachment = UI.create({
    "@view": view,
    "@inject": "IApi",

    $$constructor(){

    },

    onchange: ({ fileList: newFileList }) => {
        if (newFileList) {
            newFileList[newFileList.length - 1].status = "done";
        }
    },

    beforeUpload: (file) => {
        const mime = this.props.mimetype;
        if(mime){
            if (("," + mime + ",").indexOf("," + file.type + ",") > -1)
                return true;
            else {
                notification.info({ message: "Formato file non supporto." })
                return Upload.LIST_IGNORE;
            }
        }
        else{
            return true;
        }
    },

    onSuccess: (r) => {
        message.success("File caricato con successo!");
    },

    upload: function (options) {
        const { onSuccess, onError, file, onProgress, data, setProgress } = options;
        //console.log("START UPLOAD", options);
        //console.log("START UPLOAD 2", data);

        const option = data.option || {};
        const formData = new FormData();
        formData.append(option.name || "formFile", file);
        for (const key in data) {
            if (key !== 'option' && Object.hasOwnProperty.call(data, key)) {
                //console.log("UPLOAD DATA", key, data[key]);
                formData.append(key, data[key]);
            }
        }

        const config = {
            //headers: { "Content-type": "multipart/form-data" },
            excludeParams: true,
            hasbody: true
        };

        if (setProgress) {
            config.onUploadProgress = (event) => {
                const percent = Math.floor((event.loaded / event.total) * 100);
                setProgress(percent);
                if (percent === 100) {
                    setTimeout(() => setProgress(0), 1000);
                }
                onProgress({ percent: (event.loaded / event.total) * 100 });
            };
        }
        console.log("UPLOAD URL", options.data.url || this.url);
        this.api.call(options.data.url || this.url, formData, config).then((result) => {
            //console.log("UPLOAD SUCCESS", result, onSuccess);
            if (option.onSuccess) option.onSuccess(result, data, file);
            onSuccess(result, data);
        }, onError);
    }
});


