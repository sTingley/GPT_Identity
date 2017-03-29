import React, { Component } from 'react';
import { Link } from 'react-router';
import TagsInput from 'react-tagsinput';
import UploadIpfsFile from './UploadIpfsFile.jsx'
var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var keccak_256 = require('js-sha3').keccak_256;


class AttributeForm extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            tmpFile: '',
            showModal: false,
        }
        this.maxAttributes = this.props.max
    }

    handleShowModal(e) {
        this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
    }

    handleHideModal() {
        this.setState({ showModal: false });
    }

    render() {

        var style = {
            fontSize: '12.5px'
        }
        return (
            <div className="form-group col-md-12" style={style}>
                <div className="col-md-10">
                    <label htmlFor="unique_id_attrs"> Dimension Attributes e.g. "My college transcript", "Chase Bank KYC", or "My blockchain research". </label>
                    <input name={'label-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Descriptor" />
                </div>
                <div className="col-md-2">
                    <button style={style} type="button" data-id={this.props.labelref} onClick={this.props.handleShowModal} className="btn btn-warning pull-right">
                        <span className="glyphicon glyphicon-upload"></span>Upload File
                    </button>
                </div>
            </div>
        );
    }
};

class TokenDistributionForm extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            // token_quantity: [],
            // token_list: [],

            // showModal: false
        };
        // this.maxUniqAttr = 10;
        // //this.onFieldChange = this.onFieldChange.bind(this);
        // //this.handleHideModal = this.handleHideModal.bind(this);
    }

    render() {
        var style = {
            fontSize: '12.5px'
        }
        return (
            <div className="form-group col-md-12">
                <div className="col-md-10">
                    <table className="table table-striped table-hover" style={style}>
                        <tbody>
                            <tr>
                                <th><b>Public Key</b></th>
                                <th><b>Token Quantity</b></th>
                            </tr>
                            <tr>
                                <td><input name={'label1-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Public Key" /></td>
                                <td><input name={'label1-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="Token Quantity" /></td>
                            </tr>
                        </tbody>
                    </table>

                </div>
            </div>
        );
    }
};

class Asset extends React.Component {
    constructor(props) {
        super(props)
        this.state = {

            asset: props.asset || {},

            file_attrs: [],
            inputs: ['input-0'],
            tmpFile: '',

            inputs_controllers: ['input1-0'],
            control_id: [],
            control_token_quantity: [],

            inputs_owners: ['input1-0'],
            owner_id: [],
            owner_token_quantity: [],

            showModal: false,

            recovery_list: []
        };

        this.handleHideModal = this.handleHideModal.bind(this);
        this.onFieldChange = this.onFieldChange.bind(this);
    }
    //*****************************************************************************
    //watch for inputs on recovery_list
    onFieldChange(inputField, e) {
        var multipleValues = {};
        multipleValues[inputField] = e;
        this.setState(multipleValues);
    }
    //*****************************************************************************
    //Passed as a prop to DimensionAttributeForm
    handleShowModal(e) {
        this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
    }
    //is passed to UploadIpfsFile so it knows when to close the modal window
    //method also exists in DimensionForm
    handleHideModal(e) {
        this.setState({ showModal: false });
    }
    //*****************************************************************************
    //takes in a msg and returns a signature (needed for requests)
    getSignature(msg) {
        var privKey = localStorage.getItem("privKey")
        var privKey1 = new Buffer(privKey, "hex");
        var msg_hash = keccak_256(JSON.stringify(msg));
        var msg_hash_buffer = new Buffer(msg_hash, "hex")
        let signature = JSON.stringify(secp256k1.sign(msg_hash_buffer, privKey1))
        signature = JSON.parse(signature).signature;
        signature = JSON.stringify(signature);
        signature = JSON.parse(signature).data;
        signature = new Buffer(signature, "hex");
        signature = signature.toString("hex");
        return signature
    }
    //**********************************************************************
    //unique_id_attrs
    appendInput() {
        var inputLen = this.state.inputs.length;
        if (inputLen < 10) {
            var newInput = `input-${inputLen}`;
            this.setState({ inputs: this.state.inputs.concat([newInput]) });
        }
    }
    //used for uniqueID attributes (official IDs)
    getLabelValues() {
        var labelVals = []
        var _this = this;
        $.each($("input[name^='label-']"), function (obj) {
            var value = $.trim($(this).val());
            if (value.length > 0) {
                labelVals.push({
                    //replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
                    [$(this).attr('name').replace("label-", "")]: value
                });
            }
        });
        return labelVals;
    }
    prepareUniqueIdAttrs() {
        var newArr = [],
            labels = this.getLabelValues();
        for (var i = 0; i < labels.length; i++) {
            var tmpArr = [];
            for (var key in labels[i]) {
                tmpArr.push(labels[i][key]);
                var ipfsHash, fileHash;
                [ipfsHash, fileHash] = this.state.file_attrs[i][key].split("|");
                tmpArr.push(fileHash);
                tmpArr.push(ipfsHash);
            }
            newArr.push(tmpArr);
        }
        return newArr;
    }
    /***********************************************************************
    if this.state.showModal is true UploadIpfsFile component is rendered,
        and passed the prop dataHandler={this.getFileDetails.bind(this)}*/
    getFileDetails(filedata) {
        var obj = { [this.state.tmpFile]: filedata };
        this.setState({ file_attrs: this.state.file_attrs.concat([obj]) });
    }

    //**********************************************************************
    // START CONTROLLER FUNCTIONS:

    //used in tokendistrubtionform
    appendControllers() {
        var inputLen = this.state.inputs_controllers.length;
        if (inputLen < 10) {
            var newInput1 = `input1-${inputLen}`;
            this.setState({inputs_controllers:
                this.state.inputs_controllers.concat([newInput1])});
        }
    }
    getTokenLabelValues() {
        var labelVals1 = []
        $.each($("input[name^='label1-']"), function (obj) {
            var value = $.trim($(this).val());
            if (value.length > 0) {
                labelVals1.push({
                    //replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
                    [$(this).attr('name').replace("label1-", "")]: value
                });
            }
        });
        console.log("label vals: " + JSON.stringify(labelVals1))
        return labelVals1;
    }
    //**********************************************************************
    prepareControlTokenDistribution() {
        var labels = this.getTokenLabelValues();
        for (var i = 0; i < labels.length; i += 2) {
            for (var key in labels[i]) {
                this.state.control_id.push(labels[i][key]);
                this.state.control_token_quantity.push(labels[i + 1][key]);
            }
        }
    }
    //**********************************************************************
    requestUpdateController(e) {
        e.preventDefault()
        
        var json = {};

        this.prepareControlTokenDistribution();

        let filename = this.state.asset.asset_id + ".json"
        json.filename = filename
        json.pubKey = localStorage.getItem("pubKey");
        json.address = localStorage.getItem("coidAddr");
        //*********************************************
        var signature = this.getSignature(json);
        console.log("sig: " + signature);
        console.log(typeof (signature));
        // json.sig = signature;
        // json.msg = msg_hash_buffer.toString("hex");
        //*********************************************
        //NEW CONTROLLERS AND THEIR TOKENS
        json.controllers = this.state.control_id;
        json.token_quantity = this.state.control_token_quantity;

        console.log("JSON!! \n" + JSON.stringify(json));

        $.ajax({
            type: "POST",
            url: twinUrl + 'MyCOID/addController',
            data: json,
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }
                console.log("result: " + JSON.stringify(data))
                //get the array:
                //data = data.Result;
                //DEBUGGING:
                //console.log("addController result: " + JSON.stringify(data));
                //data is: MYCOID.json

            }.bind(this),
        })
    }
    // END CONTROLLER UPDATE FUNCTIONS:
    //**********************************************************************

    //**********************************************************************
    // START OWNERSHIP UPDATE FUNCTIONS:

    //used in tokendistrubtionform
    appendOwners() {
        var inputLen = this.state.inputs_owners.length;
        if (inputLen < 10) {
            var newInput1 = `input1-${inputLen}`;
            this.setState({
                inputs_owners: this.state.inputs_owners.concat([newInput1])
            });
        }
    }
    prepareOwnerTokenDistribution() {
        var labels = this.getTokenLabelValues();
        console.log("got labels... " + JSON.stringify(labels))
        for (var i = 0; i < labels.length; i += 2) {
            for (var key in labels[i]) {
                this.state.owner_id.push(labels[i][key]);
                this.state.owner_token_quantity.push(labels[i + 1][key]);
            }
        }
    }
    requestUpdateOwners(e) {
        e.preventDefault()
        
        let asset = this.state.asset.asset_name

        var json = {}

        json.ownerIdList = asset.ownerIdList;
        json.controlIdList = asset.controlIdList;
        
        console.log("got request updateOwners..")
        var owners = this.prepareOwnerTokenDistribution();
        console.log("prepare owners.. " + owners)
    }
    // END OWNER UPDATE FUNCTIONS:
    //**********************************************************************

    //**********************************************************************
    // START RECOVERY UPDATE FUNCTIONS:
    requestUpdateRecovery(e) {

        e.preventDefault();

        var json = {};
        
        let filename = this.state.asset.asset_id + ".json";
        json.filename = filename;
        json.pubKey = localStorage.getItem("pubKey");
        json.address = localStorage.getItem("coidAddr");
        //*********************************************
        let recoveryCondition = $("input[name^='recoveryCondition']").val();
        if(recoveryCondition){json.recoveryCondition = recoveryCondition;}
        //*********************************************
        json.recoveryID = this.state.recovery_list;

        var signature = this.getSignature(json);

        $.ajax({
            type: "POST",
            url: twinUrl + 'MyCOID/addRecoveryID',
            data: json,
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }
                //get the array:
                data = data.Result;
                //DEBUGGING:
                console.log("addRecovery result: " + JSON.stringify(data));
                //data is: MYCOID.json

            }.bind(this),
        })

    }

    // END RECOVERY UPDATE FUNCTIONS:
    //**********************************************************************
    //**********************************************************************
    // START OFFICAL ID FUNCTIONS:

    requestUpdateOfficalIDs(e) {
        e.preventDefault()

        var json = {}
        
        let filename = this.state.asset.asset_id + ".json"
        json.filename = filename

        json.ownerIdList = asset.ownerIdList;
        json.controlIdList = asset.controlIdList;

        console.log("this.state.fileAttrs.. " + JSON.stringify(this.state.file_attrs))
        console.log("this.state.tmpfile.. " + this.state.tmpFile)
        console.log("this.state.inputs.. " + this.state.inputs)
        //[label,shaHash,ipfsHash]
        var attrsArray = this.prepareUniqueIdAttrs();
        console.log("prepared attrs.. " + attrsArray)
        console.log("asset: " + this.props.asset.asset_id)
        console.log("coidAddr: " + this.props.asset.asset_name.coidAddr)


    }

    // END OFFICIAL ID FUNCTIONS:
    //**********************************************************************


    componentDidMount() {
        // $("#assetDetails").modal('show');
        // $("#assetDetails").on('hidden.bs.modal', this.props.hideHandler);
    }

    render() {

        console.log("asset: " + JSON.stringify(this.state.asset))

        console.log("file_Attrs.. " + JSON.stringify(this.state.file_attrs))

        var syle = {
            marginRight: '15px'
        }
        var style = {
            fontSize: '12.5px'
        }

        var inputAttrs = {
            addKeys: [13, 188],	// Enter and comma
            inputProps: {
                placeholder: "use comma(,) to add multiple values",
                style: { width: '30%' }
            }
        };

        var prop = this.props.asset.asset_name;

        //console.log("asset form state: " + JSON.stringify(this.state))
        //console.log("asset form props: " + JSON.stringify(this.props))
        return (
            <div id="SubmitContainer">
                <b>{this.props.asset.asset_id}</b><br />

                <div className="modal-header">
                    <ul className="nav nav-pills" role="tablist">
                        <li role="presentation" className="active"><a href="#officalID" role="tab" data-toggle="tab">Official IDs</a></li>
                        <li role="presentation"><a href="#owners" role="tab" data-toggle="tab">Ownership</a></li>
                        <li role="presentation"><a href="#controllers" role="tab" data-toggle="tab">Control</a></li>
                        <li role="presentation"><a href="#recovery" role="tab" data-toggle="tab">Recovery</a></li>
                    </ul>
                </div>{/*END MODAL-HEADER*/}

                <div className="modal-body">

                    <div className="tab-content">


                        <div role="tabpanel" className="tab-pane active" id="officalID">
                            <table className="table table-striped table-hover" style={style}>
                                <tbody>
                                    <tr>
                                        <td colSpan="2"><b>Official IDs</b></td>
                                    </tr>
                                    {(() => {
                                        var ipfs_url = "http://10.101.114.231:8080/ipfs/";
                                        if (!$.isEmptyObject(prop)) {
                                            return prop.uniqueIdAttributes.map((ids, i) => {
                                                return (
                                                    <tr key={i}>
                                                        <td>{ids[0]}</td>
                                                        <td><p>File hash: {ids[1]}</p><p>IPFS hash: <a target="_blank" href={ipfs_url + "/" + ids[2]}>{ids[2]}</a></p></td>
                                                    </tr>
                                                )
                                            });
                                        } else {
                                            return <tr><td colSpan="2">No Ids found</td></tr>
                                        }
                                    })(this)}
                                </tbody>
                            </table>
                            <div className="form-group">
                                <label htmlFor="unique_id">Enter Unique ID Attributes:</label>
                                {this.state.inputs.map(input => <AttributeForm handleShowModal={this.handleShowModal.bind(this)} max="10" key={input} labelref={input} />)}
                            </div>
                            <div className="col-md-offset-6 col-md-6 ">
                                <button type="button" className="btn btn-info pull-right" style={style} onClick={this.appendInput.bind(this)}>
                                    <span className="glyphicon glyphicon-plus"></span>Add More
							    </button>
                            </div>
                            <div className="form-group">
                                <button style={style} type="button" className="btn btn-primary" onClick={this.requestUpdateOfficalIDs.bind(this)}>
                                    <span className="glyphicon glyphicon-plus"></span>Update Official IDs
                                </button>
                            </div>
                        </div>{/*tab-pane officialIDs*/}

                        <div role="tabpanel" className="tab-pane" id="owners">
                            <table className="table table-striped table-hover" style={style}>
                                <tbody>
                                    <tr>
                                        <td><b>Owner ID List</b></td>
                                        <td>
                                            {(() => {
                                                if (!$.isEmptyObject(prop)) {
                                                    return prop.ownerIdList.map((ids, i) => {
                                                        return <p key={i}> {prop.ownerIdList[i]}</p>
                                                    })
                                                }
                                            })(this)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="form-group">
                                <label htmlFor="control_dist">Enter Owners and their ownership token(s).</label>
                                {this.state.inputs_owners.map(input => <TokenDistributionForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
                            </div>
                            <div className="col-md-offset-6 col-md-6 ">
                                <button type="button" className="btn btn-info pull-right" style={style} onClick={this.appendOwners.bind(this)}>
                                    <span className="glyphicon glyphicon-plus"></span>Add More
							    </button>
                            </div>
                            <div className="form-group">
                                <button style={style} type="button" className="btn btn-primary" onClick={this.requestUpdateOwners.bind(this)}>
                                    <span className="glyphicon glyphicon-plus"></span>Update Ownership
                                </button>
                            </div>


                        </div>{/*tab-pane controllers*/}

                        <div role="tabpanel" className="tab-pane" id="controllers">
                            <table className="table table-striped table-hover" style={style}>
                                <tbody>
                                    <tr>
                                        <td><b>Control ID List</b></td>
                                        <td>
                                            {(() => {
                                                if (!$.isEmptyObject(prop)) {
                                                    return prop.controlIdList.map((ids, i) => {
                                                        return <p key={i}> {prop.controlIdList[i]}</p>
                                                    })
                                                }
                                            })(this)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="form-group">
                                <label htmlFor="control_dist">Enter Controllers and their control token(s).</label>
                                {this.state.inputs_controllers.map(input => <TokenDistributionForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
                            </div>
                            <div className="col-md-offset-6 col-md-6 ">
                                <button type="button" className="btn btn-info pull-right" style={style} onClick={this.appendControllers.bind(this)}>
                                    <span className="glyphicon glyphicon-plus"></span>Add More
							    </button>
                            </div>
                            <div className="form-group">
                                <button style={style} type="button" className="btn btn-primary" onClick={this.requestUpdateController.bind(this)}>
                                    <span className="glyphicon glyphicon-plus"></span>Update Control
                                </button>
                            </div>
                        </div>{/*tab-pane controllers*/}



                        <div role="tabpanel" className="tab-pane" id="recovery">
                            <table className="table table-striped table-hover" style={style}>
                                <tbody>
                                    <tr>
                                        <td>Recovery IDs</td>
                                        <td>{(() => {
                                            if (!$.isEmptyObject(prop)) {
                                                return prop.identityRecoveryIdList.map((ids, i) => {
                                                    return <p key={i}> {prop.identityRecoveryIdList[i]}</p>
                                                })
                                            }
                                        })(this)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Recovery Condition</td>
                                        <td><p>{prop.recoveryCondition}</p></td>
                                    </tr>
                                    <tr>
                                        <td>Change recovery condition:</td>
                                        <td><input name="recoveryCondition" className="form-control col-md-4" type="text" placeholder="# of signatures required." /></td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="form-group">
                                <label style={style} htmlFor="control_dist">Enter Recovery ID(s).</label>
                                <TagsInput {...inputAttrs} value={this.state.recovery_list} onChange={(e) => { this.onFieldChange("recovery_list", e) }} />
                            </div><br />

                            <div className="form-group">
                                <button style={style} type="button" className="btn btn-primary" onClick={this.requestUpdateRecovery.bind(this)}>
                                    <span className="glyphicon glyphicon-plus"></span>Update Recovery
                                </button>
                            </div>

                        </div>{/*tab-pane recovery*/}


                    </div>{/*tab-content*/}
                    {this.state.showModal ? <UploadIpfsFile pubKey={this.state.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal} /> : null}

                </div>{/*modal-body*/}

            </div>

        )
    }

}

Asset.propTypes = {
    hideHandler: React.PropTypes.func.isRequired	// hideHandler method must exists
};


/**************************************************************************
 * This class is the PARENT Component
 * componentWillMount method will populated nav bar tabs with DT assets
/*************************************************************************/
class Identities extends React.Component {

    constructor(props) {
        super(props);
        this.state =
            {
                pubKey: localStorage.getItem("pubKey"),
                own_assets: [], //populated from DT
                controlled_assets: [], //[populated from DT

                showDetails: false, //will be set true when user selects asset
                active_asset: {}, //passes active asset as prop to Asset class
            };

        //handleSelectAsset will be called anytime we select from the nav bar
        this.handleSelectAsset = this.handleSelectAsset.bind(this);
        //if this.state.showDetials is true, handleHideAsset is passed as a prop (hideHandler) to Asset class
        this.handleHideAsset = this.handleHideAsset.bind(this);
    }

    handleHideAsset() {
        this.setState({ showDetails: false, active_asset: {} });
    }

    //handle choice from asset navigation bar
    handleSelectAsset(asset) {
        var _this = this
        let assetID = asset.asset_id
        if (assetID) {
            _this.setState({ showDetails: true, active_asset: asset })
        }
    }

    //************************************************************************
    //Invoke this code immediately before mounting occurs:
    //************************************************************************
    componentWillMount() {
        // -> -> -> START get OWNED assets -> -> ->
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
                //data is: MYCOID.json

                if (data.length > 0) {
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
                                var theArray = this.state.own_assets;

                                console.log("length is: " + theArray.length) //get total number of owned assets
                                console.log(JSON.stringify(theArray))
                                theArray[theArray.length] = { asset_id: dataResult.assetID, asset_name: dataResult }
                                if (dataResult.assetID = "MyCOID")
                                    this.setState({ own_assets: theArray });

                            }.bind(this),
                            complete: function () {
                            },
                            //console.log(result)
                        })
                    }//end for loop
                }
            }.bind(this),
        })
        // <- <- <- END get OWNED assets <- <- <-

        // -> -> -> START get CONTROLLED assets -> -> ->
        $.ajax({
            type: "POST",
            url: twinUrl + 'getControlledAssets',
            data: { "pubKey": localStorage.getItem("pubKey") },
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }
                //get the array:
                data = data.data;
                //debugging:
                console.log("Get Controlled Assets result: " + data);

                if (data.length > 0) {
                    //loop through OWNED assets
                    for (let i = 0; i < data.length; i++) {
                        //AJAX each asset:
                        $.ajax({
                            type: "POST",
                            url: twinUrl + 'getAsset',
                            data: { "pubKey": localStorage.getItem("pubKey"), "flag": 1, "fileName": data[i] },
                            success: function (result) {
                                var dataResult = result;
                                if ($.type(result) != "object") {
                                    dataResult = JSON.parseJSON(result)
                                }
                                //***TODO: CHECK THAT THIS ADDS TO THE ARRAY, NOT REPLACE IT
                                this.setState({ controlled_assets: [{ asset_id: dataResult.assetID, asset_name: dataResult }] });

                            }.bind(this),
                            complete: function () {
                            },
                            //console.log(result)
                        })
                    }//end of for loop
                }
            }.bind(this)
        })
        // <- <- <- END get CONTROLLED assets <- <- <-

    }//componentWillMount()

    //************************************************************************
    //Invoke this code immediately after mounting occurs:
    //************************************************************************
    componentDidMount() {
        //TODO:
        //ADD THE CODE SO THAT MYCOID displays on the page by default?
    }

    render() {
        var inputAttrs = {
            addKeys: [13, 188],	// Enter and comma
            inputProps: {
                placeholder: "use comma(,) to add multiple values",
                style: { width: '30%' }
            }
        };
        var syle = {
            marginRight: '10px'
        }
        var style = {
            fontSize: '12.5px'
        }
        //replace with owned assets
        var controlled = ["iPad", "BMW"]

        return (
            <div id="MyCOIDContainer">

                <h1>Identity Utility</h1><hr />

                <div className="modal-header" role="navigation">
                    <ul className="nav nav-tabs">
                        {/*<li role="presentation" className="active"><a onClick={this.HandleOwnedAsset(own)}>My COID</a></li>*/}

                        <li role="presentation" className="dropdown active">
                            <a className="dropdown-toggle" data-toggle="dropdown" role="button">
                                Owned <span className="caret"></span></a>
                            <ul className="dropdown-menu">
                                {(() => {
                                    {/* POPULATE the owned assets, */ }
                                    if (this.state.own_assets.length > 0) {
                                        return this.state.own_assets.map((own, i) => {
                                            return <li role="presentation" key={i}><a role="tab" data-toggle="tab" onClick={() => this.handleSelectAsset(own)}>{own.asset_id}</a></li>
                                        })
                                    }
                                    else { return <li>None</li> }
                                })(this)}
                            </ul>
                        </li>
                        <li role="presentation" className="dropdown">
                            <a className="dropdown-toggle" data-toggle="dropdown" role="button">
                                Controlled <span className="caret"></span></a>
                            <ul className="dropdown-menu">
                                {(() => {
                                    {/* POPULATE the controlled assets, */ }
                                    if (controlled.length > 0) {
                                        return controlled.map((ctrl, i) => {
                                            return <li role="presentation" key={i}><a role="tab" data-toggle="tab" onClick={() => this.handleSelectAsset(ctrl)}>{ctrl}</a></li>
                                        })
                                    }
                                    else { return <li>None</li> }
                                })(this)}
                            </ul>
                        </li>

                        <li role="presentation"><a href="#/identityDimension">Identity Dimensions</a></li>
                    </ul>{/*nav nav-tabs*/}

                </div><br />{/*END MODAL-HEADER*/}


                <div className="modal-body">
                    {this.state.showDetails ? <Asset hideHandler={this.handleHideAsset} asset={this.state.active_asset} /> : null}
                </div>{/*END MODAL-BODY*/}


            </div>
        );

    }//render

}//class Identities


export default Identities;
