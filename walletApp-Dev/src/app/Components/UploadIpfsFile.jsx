import React from 'react';

class UploadIpfsFile extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            docs: {},
            pubKey: props.pubKey,
            selected: '0',
            files: ''
        };
        this.inputChangeHandler = this.inputChangeHandler.bind(this);
    }

    componentDidMount() {
        $.ajax({
            url: twinUrl + "ipfs/alldocs/" + this.state.pubKey,
            dataType: 'json',
            cache: false,
            success: function (resp) {
                this.setState({ docs: resp.data.documents });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

        //COMMENTED OUT BC WE ARE MOVING AWAY FROM THE SEPERATE IDENTITYDIMENSION.jsx
        //this comes from IdentityDimension.jsx, DimensionForm updateAttrs flow
        // if(this.props.flag) {
        //     $("#descriptors .modal").modal('show');
        //     $("#descriptors .modal").on('hidden.bs.modal', this.props.handleHideModal);
        // }

        if(this.props.addOfficialID) {
            $("#assetDetails .modal").modal('show');
            $("#assetDetails .modal").on('hidden.bs.modal', this.props.handleHideModal);
        }
        else{
            $("#SubmitContainer .modal").modal('show');
            $("#SubmitContainer .modal").on('hidden.bs.modal', this.props.handleHideModal);
        }

    }

    uploadHandler(data, additionalParams) {
        var params = {
            url: twinUrl + "ipfs/upload",
            type: 'POST',
            data: data,
            cache: false,
            processData: false,
            contentType: false,
        };
        $.extend(params, additionalParams);
        $.ajax(params);
    }

    fileHandler(e) {
        e.preventDefault();
        if (this.state.selected != "0") {
            var hash, fileHash;
            //dataHandler is bound to the parent and passed back 'selected'
            this.props.dataHandler(this.state.selected);
            $("button.close").trigger("click");
        } else {
            //WE COME HERE WHEN WE CLICK SUBMIT?
            console.log("we are in the else");
            console.log("button: " + ($("button.close").attr("id") == "ipfs"))
            if (this.state.files.size > 0) {
                var fileInput = $("input[name=newdoc]");
                var fData = new FormData();
                fData.append("user_pubkey", this.state.pubKey);
                $.each(fileInput[0].files, function (key, value) {
                    fData.append(key, value);
                });
                var _this = this;
                var callbacks = {
                    beforeSend: (xhr) => {
                        $("button[name=uploadsubmit]").button('loading');
                        $("button.close").hide();
                    },
                    success: function (resp) {
                        if (resp.uploded && resp.uploded.length > 0) {
                            var filedata = resp.uploded[0].hash + "|" + resp.uploded[0].file_hash;
                            //data handler forms JSON object
                            this.props.dataHandler(filedata);
                            $("button.close").trigger("click");
                        }
                    }.bind(this),
                    complete: () => {
                        $("button[name=uploadsubmit]").button('reset');
                        $("button.close").show();
                    }
                };
                this.uploadHandler(fData, callbacks);
            }
        }
    }

    inputChangeHandler(e) {
        if (e.target.tagName == "SELECT") {
            this.setState({ selected: e.target.value });
        } else
            this.setState({ files: e.target.files[0] });
    }

    render() {
        console.log("UploadIpfsFile props: " + JSON.stringify(this.props));
        //this.props = UploadIpfsFile props: {"pubKey":"02c3b8b123806fb420e6daa17f87a9eae3246260da62b50f775acb4c701d0d79ef"} //CoreIdentityForm.jsx
        //this.props = UploadIpfsFile props: {"pubKey":"02c3b8b123806fb420e6daa17f87a9eae3246260da62b50f775acb4c701d0d79ef"} //MyGatekeeper.jsx
        //this.props = {"addOfficialID":true,"pubKey":"02c3b8b123806fb420e6daa17f87a9eae3246260da62b50f775acb4c701d0d79ef"} //Assets.jsx (formerly MyCOID.jsx) adding attrs
        var center = { textAlign: 'center' };

        return (
            <div className="modal fade">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" id="ipfs_button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 className="modal-title">Upload Document</h4>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <label htmlFor="get-hash">Choose from documents</label>
                                    <select className="form-control" onChange={this.inputChangeHandler}>
                                        <option value="0">Select Document</option>
                                        {(() => {
                                            if (this.state.docs && this.state.docs.length > 0) {
                                                var i = 0;
                                                return this.state.docs.map((obj) => {
                                                    i++;
                                                    var optsVal = obj.hash + "|" + obj.file_hash;
                                                    return <option value={optsVal} key={i}>{obj.filename}</option>
                                                });
                                            } else {
                                                return <option value="0">-- Empty --</option>
                                            }
                                        })()}
                                    </select>
                                </div>
                                <p style={center}>(or)</p>
                                <div className="form-group">
                                    <label htmlFor="documents">Upload Document</label>
                                    <input type="file" className="form-control" name="newdoc" onChange={this.inputChangeHandler} />
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" data-loading-text="Processing..." name="uploadsubmit" className="btn btn-success" onClick={this.fileHandler.bind(this)}>Submit</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
};

export default UploadIpfsFile
