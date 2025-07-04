import { message, notification, Upload } from "antd";
import { UI } from "./ui";
import React from "react";

function view({ ui, onSuccess, onRemove, children, managed, source, data, ...rest }) {
    if (source && !data) {
        data = { id: source.id, etype: source.$$etype, attach_id: source.attach_id, url: 'api/udoc' }
    }
    return (
        <Upload name="attachment" defaultFileList={ui.list} onRemove={f => ui.onremove(f)} onChange={f => ui.onchange(f)} customRequest={o => ui.upload(o)} data={data} {...rest} >
            {children}
        </Upload>
    )
}

export const Attachment = UI.create({
    "@skin": view,
    "@inject": "IApi",

    $$constructor(props) {
        let list = props.defaultFileList || props.source?.attachments;
        this.len = list ? list.length : 0;
        this.count = 1;
        this.files = [];
        this.success = props.onSuccess;
        this.list = list;
    },

    onremove(f) {
        this.props.onRemove && this.props.onRemove(f);
        if (this.props.managed) {
            const defaultOpt = { delOp: "api/jdelete", excludeParams: true };
            return this.api.call(defaultOpt.delOp, { etype: "attachment", Mutation: [{ id: f.id }] }, defaultOpt)
        }
    },

    onchange: function ({ fileList: list }) {
        if (list) {
            this.list = list;
            const offset = list.length - this.len;
            console.log("UPLOAD ON CHENGE", offset, this.len, list);
            if (offset === 1) {
                for (let k = 0; k < list.length; k++) {
                    const f = list[k];
                    if (f.status !== 'error') f.status = "done";
                }
            }
            else {
                if (offset > this.count) this.count = offset;
            }
            this.len++;
        }
    },

    beforeUpload: (file) => {
        const mime = this.props.mimetype;
        if(mime === "image"){
            mime = "image/jpeg,image/gif,image/png,image/webp,image/svg+xml,image/avif,image/apng"
        }
        if (mime) {
            if (("," + mime + ",").indexOf("," + file.type + ",") > -1)
                return true;
            else {
                notification.info({ message: "Formato file non supporto." })
                return Upload.LIST_IGNORE;
            }
        }
        else {
            return true;
        }
    },

    onSuccess(r, d) {
        const list = this.list;
        let attach_id = r.data;

        if (this.props.managed) {
            const values = r.data.split(',');
            attach_id = Number(values[0]);
            const len = values.length;
            let i = list.length - len;
            for (let k = 1; k < len; k++) {
                list[i + k].uid = values[k];
            }
        }
        const source = this.props.source;
        if (source) {
            source.$attach_id = attach_id;
            source.attachments = list;
        }
        if (this.success) this.success(attach_id, list, r, d);
        message.success("File caricato con successo!");
        //this.update();
    },

    upload: function (options) {
        const { onSuccess, onError, file, onProgress, data, setProgress } = options;
        //console.log("START UPLOAD", options);
        //console.log("START UPLOAD 2", data);


        if (this.count === 1) {
            const option = data.option || {};
            const formData = new FormData();
            formData.append(option.name || "formFile", file);
            if (this.files.length > 0) {
                for (let k = 0; k < this.files.length; k++) {
                    formData.append(option.name || "formFile", this.files[k]);
                }
            }

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

            /*if(this.files.length > 0)
            {
                config.headers = { "Content-type": "multipart/form-data" };
            }*/

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
            this.files = [];
            //this.count--;
            console.log("UPLOAD URL", options.data.url || this.url);
            this.api.call(options.data.url || this.url, formData, config).then((result) => {
                //console.log("UPLOAD SUCCESS", result, data, file);
                if (option.onSuccess) option.onSuccess(result, data, file);
                this.onSuccess(result, data);
            }, onError);
        }
        else {
            this.count--;
            this.files.push(file);
        }
    }
});


