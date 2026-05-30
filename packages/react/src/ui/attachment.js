/** @fileoverview packages/react/src\ui\attachment.js */
import { message, notification, Upload } from "antd";
import { UI } from "./ui";
import React from "react";

function resolveFileIdentity(file) {
    return file?.id || file?.uid || file?.url || file?.relative_url || file?.path || file?.name || null;
}

/**
 * view function.
 * @param {any} param1
 * @returns {any}
 */
function view({ ui, onSuccess, onRemove, children, managed, source, data, fileList, onChange, ...rest }) {
    if (source && !data) {
        data = { id: source.id, etype: source.$$etype, attach_id: source.attach_id, url: 'api/udoc' }
    }
    if (managed && !data) data = { url: 'api/udoc' };
    if (!data) data = { url: 'api/upload' };
    if (!data.url) data.url = 'api/upload';
    return (
        <Upload name="attachment" beforeUpload={f => ui.beforeUpload(f)} fileList={ui.list} defaultFileList={ui.list} onPreview={f => ui.onpreview(f)} onRemove={f => ui.onremove(f)} onChange={f => ui.onchange(f)} customRequest={o => ui.upload(o)} data={data} {...rest} >
            {children}
        </Upload>
    )
}

export const Attachment = UI.create({
    "@skin": view,
    "@inject": "IApi",

    /**
 * $$constructor method.
 * @param {any} props
 * @returns {void}
 */
    $$constructor(props) {
        this.props = props;
        this.reset();
    },

    /**
 * reset method.
 * @returns {void}
 */
    reset() {
        let props = this.props;
        let list = props.defaultFileList || props.fileList || props.source?.attachments;
        if(list && !Array.isArray(list))
            list = [list];
        if (list && list.length > 0 && list[0] === null) {
            list.shift();
        }
        this.len = list ? list.length : 0;
        this.count = 1;
        this.files = [];
        this.success = props.onSuccess;
        this.change = props.onChange;
        this.list = list || [];
        this.decorateList();
        this.attach_id = 0;
        this.dataList = null;
        this.render && this.render();
    },

    /**
 * onremove method.
 * @param {any} f
 * @returns {any}
 */
    onremove(f) {
        this.props.onRemove && this.props.onRemove(f);
        if (this.props.managed) {
            const defaultOpt = { delOp: "api/jdelete", excludeParams: true };
            return this.api.call(defaultOpt.delOp, { etype: "attachment", Mutation: [{ id: f.id }] }, defaultOpt)
        }
    },

    /**
 * onchange method.
 * @param {any} param1
 * @returns {void}
 */
    onchange: function ({ fileList: list }) {
        if (list) {
            this.list = list;
            this.decorateList();
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
            this.render();
        }
        this.change && this.change(list);
    },

    resolveUrl(file) {
        return file?.url || file?.relative_url || file?.path || file?.thumbUrl || null;
    },

    openFile(file) {
        const url = this.resolveUrl(file);
        if (!url) return;
        const resolved = typeof url === "string" ? url.replace("\\", "/") : url;
        window.open(resolved.startsWith("http") || resolved.startsWith("/") ? resolved : `/${resolved}`, "_blank", "noopener,noreferrer");
    },

    onpreview(file) {
        this.openFile(file);
        return false;
    },

    decorateList() {
        if (!Array.isArray(this.list)) return;
        this.list.forEach(file => {
            if (!file) return;
            const url = this.resolveUrl(file);
            if (!url) return;
            file.url = url;
        });
    },

    syncUploadedFiles(uploaded) {
        if (!Array.isArray(uploaded) || uploaded.length === 0 || !Array.isArray(this.list) || this.list.length === 0) return;
        const start = Math.max(this.list.length - uploaded.length, 0);

        for (let k = 0; k < uploaded.length; k++) {
            const target = this.list[start + k];
            const source = uploaded[k];
            if (!target || !source) continue;

            Object.assign(target, source, {
                uid: source.uid || target.uid,
                name: source.name || source.filename || target.name,
            });
        }

        this.decorateList();
    },

    removeFile(file) {
        const identity = resolveFileIdentity(file);
        const commit = () => {
            this.list = Array.isArray(this.list) ? this.list.filter(item => {
                if (item === file) return false;
                if (!identity) return true;
                return resolveFileIdentity(item) !== identity;
            }) : [];
            if (Array.isArray(this.dataList)) {
                this.dataList = this.dataList.filter(item => {
                    if (item === file) return false;
                    if (!identity) return true;
                    return resolveFileIdentity(item) !== identity;
                });
            }
            this.len = this.list.length;
            this.render();
            this.change && this.change(this.list);
        };

        const result = this.onremove(file);
        if (result && typeof result.then === "function") {
            return result.then(commit);
        }

        commit();
        return result;
    },

    /**
 * beforeUpload method.
 * @param {any} file
 * @returns {any}
 */
    beforeUpload(file) {
        let mime = this.props.mimetype;
        if (mime === "image") {
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

    /**
 * onSuccess method.
 * @param {any} r
 * @param {any} d
 * @returns {void}
 */
    onSuccess(r, d) {
        const list = this.list;
        this.attach_id = r.data;
        const upload = r.data;
        if (this.props.managed) {
            this.attach_id = upload.attach_id;
        }
        const source = this.props.source;
        if (source) {
            source.$attach_id = this.attach_id;
            source.attachments = list;
        }

        this.syncUploadedFiles(upload.files);
        this.dataList = this.dataList ? this.dataList.concat(upload.files) : upload.files;
        this.len = this.list.length;
        this.render();
        this.change && this.change(this.list);

        if (this.success) this.success(upload.files.length === 1 ? upload.files[0] : upload.files, list, r, d);
        message.success("File caricato con successo!");
        //this.update();
    },

    /**
 * upload method.
 * @param {any} options
 * @returns {void}
 */
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
                /**
 * onUploadProgress function.
 * @param {any} event
 * @returns {void}
 */
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





