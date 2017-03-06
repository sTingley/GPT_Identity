import React, { Component } from 'react';

class DimensionForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            dimension: this.props.dataHandler,
            dimension_data: {},
            docs: {}, //takes same form as it does in Documents.jsx and CoreIdentity.jsx/MyGatekeeper.jsx
            pubkey: localStorage.getItem("pubKey")
        };

        var owned = true
    }

    //HANDLE THE CHOICE OF USER INPUT
    submitHandler(e) {
        e.preventDefault();
        var ele = $(e.target);

        var button_val = parseInt(ele.attr("data-val"))

        var json = {
            "publicKey": localStorage.getItem("pubKey"),
            "uniqueID": 'getUNIQUEID!!!!',
            "typeInput": 'dimensionName',
            "flag": "flag_value"
        }

        // request to add dimension descriptor/attribute pair
        if (button_val === 1) {
            console.log("hit add descriptor rq")
            let descriptor

            $.each($("input[name^='descriptor']"), function (obj) {
                var value = $.trim($(this).val())
                if (value.length > 0) {
                    descriptor = value
                }
            })

            //descriptor, ex: 'financial history 1/2017'
            json.descriptor = descriptor

            $.ajax({
                url: twinUrl + 'addDimensionAttribute',
                type: 'POST',
                data: json,
                success: function (res) {
                    if (res.status == "Ok" && res.msg == "true") {
                        //var i_dimension = this.state.dimension.ID
                    }
                }
            });
        }//end if

        if (button_val === 2) {
            console.log("hit delegation rq")
            $.ajax({
                url: twinUrl + 'addDelegation',
                type: 'POST',
                data: json,
                success: function (res) {
                    if (res.status == "Ok" && res.msg == "true") {
                        //var i_dimension = this.state.dimension.ID
                    }
                }
            });
        }

    }//end submitHandler



    // componentWillMount(){
    // }

    componentDidMount() {
        this.setState({
            dimension_data: this.props.dimension
        });
        $("#dimension_Details").modal('show');
        $("#dimension_Details").on('hidden.bs.modal', this.props.hideHandler);

        $.ajax({
            url: twinUrl + "ipfs/alldocs/" + this.state.pubKey,
            dataType: 'json',
            cache: false,
            success: function (resp) {
                //console.log("Response Data in Documents (parent) component: ", JSON.stringify(resp.data.documents))
                this.setState({ docs: resp.data.documents });
            }.bind(this)
        });
    }

    render() {
        console.log("state in DimensionForm" + JSON.stringify(this.state))
        var dims = this.state.dimension
        //console.log("dims: " + JSON.stringify(dims))

        var dataArray = []
        var arrayOfArrays = []
        let data = dims.dimension.data //data comes from _dimension.json object structure
        //console.log("Data.length " + data.length)

        Object.keys(data).forEach(key => {
            dataArray.push(data[key].descriptor)
            dataArray.push(data[key].attribute)
            dataArray.push(data[key].flag)
            dataArray.push(data[key].ID)
        })

        //data.length will equal the number of dimensions
        for (var i = 0; i < data.length; i++) {
            var element = [dataArray[4 * i + 0], dataArray[4 * i + 1], dataArray[4 * i + 2], dataArray[4 * i + 3]]
            arrayOfArrays.push(element)
        }

        // console.log("DataArray: " + dataArray)
        // console.log("arrayOfArrays[0][0]: " + arrayOfArrays[0][0])
        // console.log("arrayOfArrays[1][1]: " + arrayOfArrays[1][1])

        var controllers = dims.dimension.controllers

        var syle = {
            marginRight: '15px'
        }
        var center = {
            textAlign: 'center'
        };

        return (
            <div className="modal fade" id="dimension_Details" key={dims.ID} tabIndex="-1" role="dialog" aria-labelledby="dimension">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">

                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times; </span></button>
                            <ul className="nav nav-pills" role="tablist">
                                <li role="presentation" className="active"><a href="#dimensionDetails" role="tab" data-toggle="tab">Identity Dimension Details</a></li>
                                <li role="presentation"><a href="#control" role="tab" data-toggle="tab">Add Descriptor</a></li>
                                <li role="presentation"><a href="#delegations" role="tab" data-toggle="tab">Token Delegations</a></li>
                            </ul>
                        </div>

                        <div className="modal-body">
                            <div className="tab-content">

                                <div role="tabpanel" className="tab-pane active" id="dimensionDetails">
                                    <table className="table table-striped table-hover" style={syle}>
                                        <tbody>
                                            <tr>
                                                <td>Asset</td>
                                                <td>MyCOID</td>
                                            </tr>
                                            <tr>
                                                <td>Dimension Type</td>
                                                <td>{dims.dimension.dimensionName}</td>
                                            </tr>
                                            <tr>
                                                <td>Controller List</td>
                                                <td>{(() => {
                                                    if (!$.isEmptyObject(dims)) {
                                                        return controllers.map((ids, i) => {
                                                            return <p key={i}> {controllers[i]}</p>
                                                        })
                                                    }
                                                })(this)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan="2"><b>Descriptors:</b></td>
                                            </tr>
                                            {(() => {
                                                var ipfs_url = "http://10.101.114.231:8080/ipfs/";
                                                if (arrayOfArrays.length > 0) {
                                                    return arrayOfArrays.map((attrs, i) => {
                                                        console.log("attrs[0]: " + attrs[0] + ", attrs[1]:" + attrs[1] + ", attrs[2]: " + attrs[2] + ", attrs[3]: " + attrs[3])
                                                        if (attrs[1].charAt(0) == "Q") {
                                                            return (
                                                                <tr key={i}>
                                                                    <td>{attrs[0]}</td>
                                                                    <td><p><a target="_blank" href={ipfs_url + "/" + attrs[1]}>{attrs[1]}</a></p></td>
                                                                </tr>
                                                            )
                                                        }
                                                        else
                                                            return (
                                                                <tr key={i}>
                                                                    <td>{attrs[0]}</td>
                                                                    <td><a>{attrs[1]}></a></td>
                                                                </tr>
                                                            )
                                                    });
                                                }
                                                else { return <tr><td colSpan="2">No descriptors found.</td></tr> }
                                            })(this)}
                                        </tbody>
                                    </table>
                                </div>{/*dimensionDetails*/}

                                <div role="tabpanel" className="tab-pane" id="control">
                                    <table className="table table-striped table-hover" style={syle}>
                                        <tbody>
                                            <tr>
                                                <th><b>Add Dimension Descriptor and Attribute</b></th>
                                            </tr>
                                            <tr>
                                                <td><input name="descriptor" className="form-control col-md-4" type="text" placeholder="descriptor name" /></td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <div className="body">
                                        <form>
                                            <div className="form-group">
                                                <label htmlFor="get-hash">Choose from documents</label>
                                                <select className="form-control col-md-4" onChange={this.inputChangeHandler}>
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
                                    </div>{/*body*/}

                                    <button type="button" className="btn btn-info" data-val="1" onClick={this.submitHandler.bind(this)}> Add descriptor</button>
                                </div>{/*control*/}

                                <div role="tabpanel" className="tab-pane" id="delegations">
                                    <table className="table table-striped table-hover" style={syle}>
                                        <thead>
                                            <tr>
                                                <th>Tokens delegated for this dimension: {0}</th>
                                            </tr>
                                        </thead>
                                        <hr />
                                        <tbody>
                                            <tr>
                                                <th colSpan="2"><b>Delegate tokens</b></th>
                                            </tr>
                                            <tr>
                                                <td><input className="form-control col-md-4" type="text" placeholder="Delegatee Address" /></td>
                                            </tr>
                                            <tr>
                                                <td><input className="form-control col-md-4" type="text" placeholder="Token Quantity" /></td>
                                            </tr>
                                            <tr>
                                                <td><input className="form-control col-md-4" type="text" placeholder="Expiration" /></td>
                                            </tr>
                                            <tr>
                                                ACCESS CATEGORIES
                                                <option value="one">One</option>
                                                <option value="two">Two</option>
                                                <option value="three">Three</option>
                                                <option value="four">Four</option>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-info" data-val="2" onClick={this.submitHandler.bind(this)}>Delegate tokens</button>
                                </div>

                            </div>
                        </div>


                    </div>
                </div>
            </div>
        )
    }
}

//                             <div className="modal-footer">
//                                <button type="button" className="btn btn-danger" onClick={this.submitHandler.bind(this)}>THIS BUTTON DOES SOMETHING</button>
//                           </div>

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



        $("#AttributesContainer .modal").modal('show');
        $("#AttributesContainer .modal").on('hidden.bs.modal', this.props.handleHideModal);
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
            this.props.dataHandler(this.state.selected);
            $("button.close").trigger("click");
        } else {
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
        console.log("UploadIpfsFile state: " + JSON.stringify(this.state))
        var center = {
            textAlign: 'center'
        };
        return (
            <div className="modal fade">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
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


class DimensionAttributeForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {

            file_attrs: [],
            inputs: ['input-0'],
            tmpFile: '',
            showModal: false,
            pubKey: localStorage.getItem("pubKey")
        };
    }

    handleShowModal(e) {
        this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
    }

    handleHideModal() {
        this.setState({ showModal: false });
    }

    render() {
        return (
            <div className="form-group col-md-12">
                <div className="col-md-10">
                    <label htmlFor="unique_id_attrs"> Dimension Attributes e.g. "My college transcript", "Chase Bank KYC", or "My blockchain research". </label>
                    <input name={'label-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Label" />
                </div>
                <div className="col-md-2">
                    <button type="button" data-id={this.props.labelref} onClick={this.props.handleShowModal} className="btn btn-warning pull-right"><span className="glyphicon glyphicon-upload"></span>Upload File</button>
                </div>
            </div>
        );
    }

};


class IdentityDimensions extends Component {

    constructor(props) {
        super(props);
        this.state = {

            pubKey: localStorage.getItem("pubKey"),

            //********************
            //UniqueIDAttributesForm
            inputs: ['input-0'],
            showModal: false,
            tmpFile: '',

            //TODO: BELIEVE WE CAN TAKE THIS OUT (for use it to genrte new unqiueID)
            file_attrs: [],

            //used to populate the select options for add dimension
            owned_assets_label: [],           //endpoint: getOwnedAssets
            controlled_assets: [],      //endpoint: getControlledAssets

            //contains actual asset data from DT
            own_assets: [],

            //********************
            //DimensionForm
            iDimensions: [],

            delegations: [],
            showDetails: false,
            activeDimension: {}

        };
        this.showDimensionHandler = this.showDimensionHandler.bind(this);
        this.handleHideModal = this.handleHideModal.bind(this);

    }

    handleSelection() {
        //make sure that we are interacting with proper asset
    }

    getDimensions() {

        let dimension1 = {}
        dimension1.dimension = {
            "dimensionName": "FINANCES",
            "pubkey": "0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055",
            "ID": 3432423423,
            "address": "HEXSTRING_address",
            "owner": ["pubkey1", "pubkey2"],
            "controllers": ["c1", "c2"],
            "delegations": [
                { owner: "0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055", delegatee: "d1", amount: "2", dimension: "", expiration: "thursday", accessCategories: "" },
                { owner: "A1", delegatee: "D1", amount: "2", dimension: "", expiration: "friday", accessCategories: "" }
            ],
            "data": [
                { "descriptor": "financial_FEB", "attribute": "QMfgsddfsdffsdfsdsdfsdf", flag: "0", ID: "4465" },
                { "descriptor": "financial_MARCH", "attribute": "Qmsdfsdfsdfsdfsdfsdfsdfsdf", flag: "0", ID: "3433" },
            ]
        }

        let dimension2 = {}
        dimension2.dimension = {
            "dimensionName": "EDUCATION",
            "pubkey": "0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055",
            "ID": 69696969,
            "address": "HEXSTRING_address",
            "owner": ["pubkey1", "pubkey2"],
            "controllers": ["c1", "c2"],
            "delegations": [
                { owner: "0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055", delegatee: "D1", amount: "2", dimension: "", expiration: "thursday", accessCategories: "" },
            ],
            "data": [
                { "descriptor": "education_highschool", "attribute": "QMfgsddfsdffsdfsdsdfsdf", flag: "0", ID: "4465" },
                { "descriptor": "education_college", "attribute": "Qmsdfsdfsdfsdfsdfsdfsdfsdf", flag: "0", ID: "3433" },
            ]
        }

        var arry = []
        arry.push(dimension1)
        arry.push(dimension2)

        this.setState({ iDimensions: arry })

    }//end getDimensions


    componentWillMount() {

        let _this = this

        this.getDimensions();


        // $.ajax({
        //     url: twinUrl + 'getMetaData',
        //     type: 'POST',
        //     data: {
        //         //"pubKey": localStorage.getItem("pubKey")
        //     },
        //     success: function (result) {
        //         var data = result;
        //         if ($.type(result) != "object") {
        //             data = JSON.parse(result)
        //         }
        //         //console.log("data: " + JSON.stringify(data))
        //         data = JSON.stringify(data)
        //         data = JSON.parse(data).data
        //         //console.log("data after parse: " + JSON.stringify(data))
        //         data = JSON.stringify(data)
        //         var dimensions = JSON.parse(data).Dimensions
        //         //console.log("dimensions: " + JSON.stringify(dimensions))

        //         _this.setState({ iDimensions: dimensions })

        //     }.bind(_this),
        //     complete: function () {

        //     }
        // })


        $.ajax({
            type: "POST",
            url: twinUrl + 'getOwnedAssets',
            data: { "pubKey": localStorage.getItem("pubKey") },
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }
                //get the array:
                data = data.data;
                //DEBUGGING:
                console.log("getOwnedAssets result: " + data);

                let owned_array = []

                if (data.length > 0) {
                    for (let i = 0; i < data.length; i++) {
                        owned_array.push(data[i])
                    }
                    console.log(owned_array) //should include MyCOID.json and other owned assets
                    _this.setState({ owned_assets_label: owned_array })
                    //****************************************************

                    //loop through OWNED assets
                    for (let i = 0; i < data.length; i++) {
                        //AJAX each asset:
                        $.ajax({
                            type: "POST",
                            url: twinUrl + 'getAsset',
                            data: { "pubKey": localStorage.getItem("pubKey"), "flag": 0, "fileName": data[i] },
                            success: function (result) {
                                var dataResult = result;
                                if ($.type(result) != "object") {
                                    dataResult = JSON.parseJSON(result)
                                }
                                //***TODO: CHECK THAT THIS ADDS TO THE ARRAY, NOT REPLACE IT
                                var theArray = _this.state.own_assets;

                                console.log("length is: " + theArray.length) //get total number of owned assets
                                console.log(JSON.stringify(theArray))
                                //console.log("######uniqueID " + dataResult.uniqueId)
                                console.log("getAsset result: " + JSON.stringify(dataResult))
                                theArray[theArray.length] = { asset_id: dataResult.assetID, asset_name: dataResult }
                                if (dataResult.assetID = "MyCOID")
                                    _this.setState({ own_assets: theArray });
                                //console.log("this.state.own_assets: " + JSON.stringify(this.state.own_assets))

                            }.bind(_this),
                            complete: function () {
                                // for(let i in this.state.owned_assets){
                                //     localStorage.setItem("uniqueID" + i, i.)
                                // }
                            },
                        })

                    }//end for

                }//end if data>0

            }//end success

        })

    }//componentWillMount

    // $.ajax({
    // 	type: "POST",
    // 	url: twinUrl + 'getControlledAssets',
    // 	data: { "pubKey": localStorage.getItem("pubKey") },
    // 	success: function (result) {
    // 		var data = result;
    // 		if ($.type(result) != "object") {
    // 			data = JSON.parseJSON(result)
    // 		}

    // 		//get the array:
    // 		data = data.data;

    //         let ctrl_array = []
    //         if(data.length > 0){
    //             for(let i=0; i< data.length; i++){
    //                 ctrl_array.push(data[i])
    //             }
    //             console.log(ctrl_array)
    //             this.setState({controlled_assets: ctrl_array})
    //         }

    // 		//debugging:
    // 		console.log("Get Controlled Assets result: " + data);

    // 	}.bind(this),
    // 	complete: function () {
    // 		// do something
    // 	},
    // 	//console.log(result)
    // })



    hideHandler() {
        this.setState({ showDetails: false });
    }

    dataHandler(index) {
        return this.state.iDimensions[index];
    }

    getActiveData() {
        return this.state.activeDimension;
    }

    //used to show activeDimension
    showDimensionHandler(e) {
        e.preventDefault();
        this.setState({
            showDetails: true,
            activeDimension: this.dataHandler($(e.target).attr('data-index'))
        });
    }

    getFileDetails(filedata) {
        var obj = { [this.state.tmpFile]: filedata };
        this.setState({ file_attrs: this.state.file_attrs.concat([obj]) });
    }

    handleHideModal() {
        this.setState({ showModal: false });
    }

    handleShowModal(e) {
        this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
    }

    appendInput() {
        var inputLen = this.state.inputs.length;
        if (inputLen < 10) {
            var newInput = `input-${inputLen}`;
            this.setState({ inputs: this.state.inputs.concat([newInput]) });
        }
        console.log("inputs: " + this.state.inputs)
    }


    createDimension(e) {

        // e.preventDefault();
        // console.log("hit createDimension")
        // var json = this.prepareJSON()
        // console.log("creating dimension with this data... " + JSON.stringify(json))
        $.ajax({
            type: "POST",
            url: twinUrl + 'createDimension',
            data: {
                pubkey: localStorage.getItem("pubKey"),
                flag: '1',
                type: 'public'
            },
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }

                //get the array:
                data = data.data;

                //debugging:
                console.log("createDimensionforDEMO result: " + data);

            }.bind(this),
            complete: function () {
                // do something
            },
        })
    }


    render() {

        //console.log("******* "+JSON.stringify(this.state))
        let dimensions = this.state.iDimensions;
        console.log("dimensions.length " + dimensions.length)
        console.log("the dimensions: " + JSON.stringify(dimensions))

        // for(var dimension in dimensions){
        //     if(dimensions.hasOwnProperty(dimension)){
        //         var obj = dimensions[dimension];
        //         for(var prop in obj){
        //             if(obj.hasOwnPropety(prop)){
        //                 console.log("prop = " + obj[prop])
        //             }
        //         }
        //     }
        // }


        // Object.keys(dimensions).forEach(function(dimension){
        //     console.log(dimension, dimensions(dimension))
        // })


        var _that = this

        var syle = {
            marginRight: '15px'
        }

        var table = {
            margin: '0 auto'
        }

        return (
            <div id="IDENTITYDIMENSIONS_MODAL">

                <h1>IDENTITY DIMENSIONS</h1><hr />

                <div className="modal-header">
                    <ul className="nav nav-tabs" role="tablist">
                        <li role="presentation" className="active"><a href="#dimensions" role="tab" data-toggle="tab">Identity Dimensions</a></li>
                        <li role="presentation"><a href="#addDimension" role="tab" data-toggle="tab">Create new dimension</a></li>
                    </ul>
                </div>

                <div className="modal-body">

                    <div className="tab-content">

                        <div className="tabpanel" role="tabpanel" className="tab-pane active" id="dimensions"><br />
                            <table style={table} className="table table-striped center">
                                <tbody>
                                    {(() => {
                                        if ($.isArray(this.state.iDimensions) && this.state.iDimensions.length > 0) {
                                            return this.state.iDimensions.map(function (el, i) {
                                                return (
                                                    <tr key={i}>
                                                        <td>
                                                            <a data-item={el.dimension} data-index={i} onClick={_that.showDimensionHandler} >{el.dimension.dimensionName}</a>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        } else {
                                            return (
                                                <tr>
                                                    <td>
                                                        <p>No identity dimensions</p>
                                                    </td>
                                                </tr>);
                                        }
                                    })(this)}
                                </tbody>
                            </table>
                            {this.state.showDetails ? <DimensionForm hideHandler={this.hideHandler.bind(this)} dataHandler={this.state.activeDimension} /> : null}

                        </div>{/*tabpanel dimensions*/}

                        <div className="tabpanel" role="tabpanel" className="tab-pane" id="addDimension"><br />

                            <div>
                                <select className="selectpicker show-tick" value={this.state.selectedAsset} onChange={this.handleSelection}>
                                    <optgroup label="Owned">
                                        <option>MyCOID</option>
                                        <option>My Car</option>
                                    </optgroup>
                                    <optgroup label="Controlled">
                                        <option>Parents house</option>
                                    </optgroup>
                                </select>
                            </div><br />


                            <div id="AttributesContainer">
                                <form method="POST" id="register" role="form">
                                    <div className="form-group">
                                        <label htmlFor="unique_id">Enter Identity Dimension Details:</label>
                                        {this.state.inputs.map(input => <DimensionAttributeForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
                                    </div>
                                    <div className="form-group">
                                        <div className="col-md-offset-6 col-md-6 ">
                                            <button type="button" className="btn btn-info pull-right" style={syle} onClick={this.appendInput.bind(this)}>
                                                <span className="glyphicon glyphicon-plus"></span>Add More
							                </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <div className="col-sm-6">
                                            <hr />
                                            <button className="btn btn-primary" data-loading-text="Submit" name="submit-form" type="button" onClick={this.createDimension.bind(this)}>Create Dimension</button>
                                        </div>
                                    </div>
                                </form>
                                {this.state.showModal ? <UploadIpfsFile pubKey={this.state.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal} /> : null}
                            </div>{/*AttributesContainer*/}

                        </div>{/*tabpanel addDimension*/}

                    </div>{/*tab-content*/}

                </div>{/*modal-body*/}






            </div >
        );
    }

};



export default IdentityDimensions


// //temp function
// app.post('/getMetaData', function(req,res)
// {
//         console.log("endpoint getMetaData was hit");
//         var obj1 = {"dimensionType": "financial history", "ID": "1234", "attr_list": ["jan1", "hash_jan1_ptr", "jan 2", "hash_jan2_ptr"], "flag": [0,1] }
//         var obj2 = {"dimensionType": "personal", "ID": "6678", "attr_list": ["val 1", "hash_val_1_ptr", "val 2", "hash_val_2_ptr"], "flag": [1,1] }
//         var obj3 = {"dimensionType": "photography",  "ID": "4538", "attr_list": ["document_1", "hash_ptr_doc1", "document_2", "hash_ptr_doc2"], "flag": [0,1,1] }
//         var response = { "Dimensions": [obj1, obj2, obj3] }
//         res.json({"data": response})

// })


    //USED IF DIGITAL TWIN NOT AVAILABLE
    // getDimensions() {
    //     this.setState({
    //         iDimensions: [
    //             { dimensionType: 'FINANCIAL HISTORY', ID: '12234', owned: true, name: 'Football', descriptors: ["monday", "tuesday", "wednesday"], attributes: ["h1", "h2", "h3"] },
    //             { dimensionType: 'EDUCATION', ID: '34334', owned: true, name: 'iPod Touch', descriptors: ["monday", "tuesday", "wednesday"], attributes: ["h1", "h2", "h3"] },
    //             { dimensionType: 'DIGITAL ASSETS', ID: '56676', owned: false, name: 'iPhone 5', descriptors: ["monday", "tuesday", "wednesday"], attributes: ["h1", "h2", "h3"] }
    //         ]
    //     })
    // }


//<AddDimension addDimension={this.handleAddDimension.bind(this) } /><br /><br />

//<IdentityDimensions dimensions={dimensions} onDelete={this.handleDeleteDimension.bind(this) } key={dimensions.ID} onClick={this.showHandler.bind(this)}/>
