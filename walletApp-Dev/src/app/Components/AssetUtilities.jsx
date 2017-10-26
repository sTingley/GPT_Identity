import React, { Component } from 'react';
import AssetTable from './IdentityFederation/AssetTable.jsx'
//import PanelGroup from './IdentityFederation/PanelGroup.jsx'
import DayPicker from 'react-day-picker';
import TagsInput from 'react-tagsinput';
import TokenDistributionForm from './TokenDistributionForm.jsx';
import UniqueIDAttributeForm from './IdentityFederation/UniqueIDAttributeForm.jsx';
import DimensionAttributeForm from './IdentityDimension/DimensionAttributeForm.jsx';
import DimensionDelegationForm from './IdentityDimension/DimensionDelegationForm.jsx';

//Right now we write to localStorage when inspected an asset, before we render this 
class AssetUtilities extends React.Component {

    constructor(props) {
        super(props);

        this.state = {

            selectedAsset: {},
            dimensions: [],

            //added from MYCOID.jsx
            file_attrs: [], //updating asset OfficialIDs
            inputs: ['input-0'], //updating asset OfficialIDs

            tmpFile: '', //comes from UploadIpfsFile class
            showModal: false, //set to true when we want to use UploadIpfsFile class

            inputs_owners: ['input1-0'],

            inputs_controllers: ['inputCtrl-0'], //dimension controllers and their tokens
			controllers_pubkeys: [],
			controllers_tokens: [],
			control_list: [],

            recovery_list: [],
            inputs_delegatees: ['input1-0'],
            delegatee_id: [],
            delegatee_token_quantity: [],

        };
    }

    componentWillMount() {
        //here we will make a call to local storage to get the selected asset
        let selected = localStorage.getItem("selectedAsset");
        if (selected != "empty") {
            this.state.selectedAsset = JSON.parse(selected);
        }
        console.log("selectedAsset: " + JSON.stringify(this.state.selectedAsset));

        localStorage.setItem("selectedAsset", "empty")

        let idims = [{
			"dimension_id": "Mortgate Info Steve Smith",
			"dimension_details": {

				"dimensionName": "Mortgage History BAC Florida",
				"pubKey": "0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055",
				"address": "",
				"flag": 0,
				"ID": 0,
				"coidAddr": "E2B24811DB9B23DDEA8313D82D11A82014C8E3BC",
				"dimensionCtrlAddr": "2C6C1B0DA4B8001C0EE4A8E1ED4704643C372534",
				"uniqueId": "9aaddf7caa690217bddc743102dc7e417608a93418ad5da2c0c82c501004f26f",
				"owners": [
					"59d110a3ab34a2ebd0ddb9d72ead24e8e906bebe794ea13c8c35b8a6c81314cd"
				],
				"controllers": [
					"Steve Smith",
					"BAC Florida"
				],
				"delegations": [
					{
						"owner": "Steve Smith",
						"delegatee": "Moodys",
						"amount": "2",
						"accessCategories": ""
					}
				],
				"data": [
					{
						"descriptor": "Payment confirmation BAC Florida June-2016",
						"attribute": "QmXVFStSMEcoAWPVKLrxJ8wf5ohn2UdmdAxcnfB8TtSAZG",
						"flag": 0
					},
					{
						"descriptor": "Loan ID 122235, Summary 2015",
						"attribute": "QmSMWeGPjtgzQ75Y1YXbnC4uByni8bwHcB4vPXrPVcUTUM",
						"flag": 0
					}
				]
			}
		},
		{
			"dimension_id": "Loan AAA Bundle Miami Fl",

			"dimension_details": {
				"dimensionName": "Car Loan Honda City FL",
				"pubKey": "0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055",
				"address": "",
				"flag": 0,
				"ID": 0,
				"coidAddr": "E2B24811DB9B23DDEA8313D82D11A82014C8E3BC",
				"dimensionCtrlAddr": "2C6C1B0DA4B8001C0EE4A8E1ED4704643C372534",
				"uniqueId": "9aaddf7caa690217bddc743102dc7e417608a93418ad5da2c0c82c501004f26f",
				"owners": [
					"Steve Smith"
				],
				"controllers": [
					"Steve Smith",
					"BAC Florida"
				],
				"delegations": [
					{
						"owner": "Steve Smith",
						"delegatee": "Moodys",
						"amount": "2",
						"accessCategories": ""
					}
				],
				"data": [
					{
						"descriptor": "Leasing Document Signed June-2015",
						"attribute": "QmXVFStSMEcoAWPVKLrxJ8wf5ohn2UdmdAxcnfB8TtSAZG",
						"flag": 0
					},
					{
						"descriptor": "Payment Confirmation Oct-2017",
						"attribute": "QmSMWeGPjtgzQ75Y1YXbnC4uByni8bwHcB4vPXrPVcUTUM",
						"flag": 0
					}
				]
			}
        }]
        
        this.state.dimensions = idims;
        console.log("dimension length: " + this.state.dimensions.length);
    }

    handleHideModal() {
        this.setState({ showModal: false });
    }

    handleShowModal(e) {
        this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
    }

    //*****************************************************************************
    //takes in a msg/json and returns a signature (needed for requests)
    getSignature(msg) {
        console.log("creating signature, signing msg: \n" + JSON.stringify(msg))
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
    // START ASSET OFFICAL ID FUNCTIONS:

    appendInput() {
        console.log("hit append Input")
        var inputLen = this.state.inputs.length;
        if (inputLen < this.maxUniqAttr) {
            var newInput = `input-${inputLen}`;
            this.setState({ inputs: this.state.inputs.concat([newInput]) });
        }
    }

    getLabelValues() {
        console.log("hit getLabelValues")
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

    requestUpdateOfficalIDs(e) {

        e.preventDefault()
        let asset = this.state.asset;
        var json = {}
        //*********************************************
        let filename = asset.asset_id + ".json"
        json.filename = filename;
        json.forUniqueId = true;
        json.uniqueId = "2222222222222222322323";
        json.isHuman = asset.asset_name.isHuman;
        json.yesVotesRequiredToPass = 2;
        json.pubKey = localStorage.getItem("pubKey");
        //*********************************************
        console.log("this.state.fileAttrs.. " + JSON.stringify(this.state.file_attrs))
        console.log("this.state.tmpfile.. " + this.state.tmpFile)
        console.log("this.state.inputs.. " + this.state.inputs)
        //[label,shaHash,ipfsHash]
        var attrsArray = this.prepareUniqueIdAttrs();
        json.uniqueIdAttributes = attrsArray
        console.log("prepared attrs.. " + attrsArray)
        console.log("asset: " + this.props.asset.asset_id)
        console.log("coidAddr: " + this.props.asset.asset_name.coidAddr)
        //*********************************************
        var signature = this.getSignature(json);
        //*********************************************
        var msg_hash = keccak_256(JSON.stringify(json));
        var msg_hash_buffer = new Buffer(msg_hash, "hex");
        json.msg = msg_hash_buffer.toString("hex");
        json.sig = signature;

        //Request needs to go to gatekeeper to submit officialID proposal

        console.log("JSON: " + JSON.stringify(json))

        $.ajax({
            type: "POST",
            url: twinUrl + 'addOfficialIDs',
            data: json,
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }
                console.log("result: " + JSON.stringify(data))
            }.bind(this),
        })

    }
    // END ASSET OFFICIAL ID FUNCTIONS:
    //**********************************************************************
    //**********************************************************************
    // START OWNERSHIP UPDATE FUNCTIONS:

    //used in tokendistrubtionform (ASSETS)
    appendOwners() {
        var inputLen = this.state.inputs_owners.length;
        if (inputLen < 10) {
            var newInput1 = `input1-${inputLen}`;
            this.setState({
                inputs_owners: this.state.inputs_owners.concat([newInput1])
            });
        }
    }
    // prepareOwnerTokenDistribution() {
    // 	var labels = this.getTokenLabelValues();
    // 	console.log("got labels... " + JSON.stringify(labels))
    // 	for (var i = 0; i < labels.length; i += 2) {
    // 		for (var key in labels[i]) {
    // 			this.state.owner_id.push(labels[i][key]);
    // 			this.state.owner_token_quantity.push(labels[i + 1][key]);
    // 		}
    // 	}
    // }
    requestUpdateOwners(e) {

        e.preventDefault()
        let asset = this.state.asset
        var json = {}
        //*********************************************
        let filename = asset.asset_id + ".json";
        json.filename = filename;
        json.pubKey = localStorage.getItem("pubKey");
        json.address = asset.asset_name.coidAddr
        //*********************************************
        //NEW OWNERS AND THEIR TOKENS
        //this.prepareOwnerTokenDistribution();

        //OWNERS CAN CREATE TOKENS SO THEY DONT NEED THEM?
        json.owners = this.state.owner_id;
        json.token_quantity = this.state.owner_token_quantity;
        //*********************************************
        var signature = this.getSignature(json);
        //*********************************************
        var msg_hash = keccak_256(JSON.stringify(json));
        var msg_hash_buffer = new Buffer(msg_hash, "hex");
        json.sig = signature;
        json.msg = msg_hash_buffer.toString("hex");
        //*********************************************
        console.log("update owner JSON!! \n" + JSON.stringify(json));

        $.ajax({
            type: "POST",
            url: twinUrl + 'MyCOID/addOwner',
            data: json,
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }
                console.log("result: " + JSON.stringify(data))

            }.bind(this),
        })
    }
    // END OWNER UPDATE FUNCTIONS:
    //**********************************************************************

    //**********************************************************************
    //**********************************************************************
    //**********************************************************************
    //**********************************************************************
    //**********************************************************************
    //**********************************************************************
    //**********************************************************************
    //**********************************************************************

    render() {

        var inputAttrs = {
			addKeys: [13, 188],	// Enter and comma
			inputProps: {
				placeholder: "use comma(,) to add multiple values",
				style: { width: '30%' }
			}
		};

        var style = { fontSize: '12.5px' };
        var alignLeft = {'text-align': 'left'}
        var popUpWidth = { width: '70%' };
        var marginRight15 = { marginRight: '15px' };

        let asset = this.state.selectedAsset.asset_details

        return (
            <div id="assetDetails" tabIndex="-1" role="dialog" aria-labelledby="asset">

                <div className="modal-dialog modal-lg">

                    <div className="modal-header">
                        <ul className="nav nav-tabs" role="tablist">
                            <li role="presentation" className="active"><a href="#asset_details" role="tab" data-toggle="tab">Asset Info</a></li>
                            <li role="presentation"><a href="#menu1" role="tab" data-toggle="tab">Edit Asset</a></li>
                            <li role="presentation"><a href="#menu2" role="tab" data-toggle="tab">Data Repository Info</a></li>
                            <li role="presentation"><a href="#menu3" role="tab" data-toggle="tab">Edit Repositories</a></li>
                            <li role="presentation"><a href="#menu4" role="tab" data-toggle="tab">Create Repository</a></li>
                            <li role="presentation"><a href="#qrcode" role="tab" data-toggle="tab">Proofs</a></li>
                        </ul>
                    </div>

                    <div className="modal-body">
                        <div className="tab-content">

                            <div role="tabpanel" className="tab-pane active" id="asset_details">
                                {this.state.selectedAsset ? <AssetTable asset={this.state.selectedAsset} /> : null()}
                            </div>

                            <div id="menu1" className="tab-pane">

                                <div className="panel-group" id="accordion">
                                    <div className="panel panel-default">
                                        <div className="panel-heading">
                                            <div className="row">
                                                <div className="col-xs-11">
                                                    <label>Membership Attributes</label>
                                                </div>
                                                <div className="col-xs-1">
                                                    <a data-toggle="collapse" data-parent="#accordion" href="#collapse1">
                                                        <span className="glyphicon glyphicon-chevron-down"></span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="collapse1" className="panel-collapse collapse out">
                                            <div className="panel-body">
                                                <div className="form-group col-md-12">
                                                    <table className="table table-striped table-hover" >
                                                        <tbody>
                                                            <tr>
                                                                <td colSpan="2"><b>Official IDs</b></td>
                                                            </tr>
                                                            {(() => {
                                                                var ipfs_url = "http://10.101.114.231:8080/ipfs/";
                                                                if (!$.isEmptyObject(asset.uniqueIdAttributes)) {
                                                                    return asset.uniqueIdAttributes.map((ids, i) => {
                                                                        return (
                                                                            <tr key={i}>
                                                                                <td>{ids[0]}</td>
                                                                                <td><p>Validation ID : {ids[1]}</p><p>Data Pointer: <a target="_blank" href={ipfs_url + "/" + ids[2]}>{ids[2]}</a></p></td>
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
                                                        <label htmlFor="unique_id">Unique ID Attributes:</label>
                                                        {this.state.inputs.map(input => <UniqueIDAttributeForm type={"MyCOID"} handleShowModal={this.handleShowModal.bind(this)} max="10" key={input} labelref={input} />)}
                                                    </div>
                                                    <div className="form-group">
                                                        <button type="button" style={style} className="btn-sm btn-info pull-right" onClick={this.appendInput.bind(this)}>
                                                            <span className="glyphicon glyphicon-plus"></span>Add More
																</button>
                                                    </div>
                                                    <div className="form-group">
                                                        <button style={style} type="button" className="btn-sm btn-primary" onClick={this.requestUpdateOfficalIDs.bind(this)}>
                                                            <span className="glyphicon glyphicon-plus"></span>Update Official IDs
                                                            </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>{/*panel-group*/}

                                <div className="panel-group" id="accordion">
                                    <div className="panel panel-default">
                                        <div className="panel-heading">
                                            <div className="row">
                                                <div className="col-xs-11">
                                                    <label>Membership Holding</label>
                                                </div>
                                                <div className="col-xs-1">
                                                    <a data-toggle="collapse" data-parent="#accordion" href="#collapse2">
                                                        <span className="glyphicon glyphicon-chevron-down"></span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>{/* panel-heading */}

                                        <div id="collapse2" className="panel-collapse collapse out">
                                            <div className="panel-body">
                                                <div className="form-group col-md-12">
                                                    <table className="table table-striped table-hover">
                                                        <tbody>
                                                            <tr>
                                                                <td><b>Membership Holding ID List</b></td>
                                                            </tr>
                                                            {(() => {
                                                                if (!$.isEmptyObject(asset.ownerIdList)) {
                                                                    return asset.ownerIdList.map((ids, i) => {
                                                                        return (
                                                                            <tr key={i}>
                                                                                <td>{asset.ownerIdList[i]}</td>
                                                                            </tr>
                                                                        )
                                                                    })
                                                                }
                                                            })(this)}
                                                        </tbody>
                                                    </table>
                                                    <div id="OWNERSHIP">
                                                        {/*  style={this.state.removeIfMyCOID}> */}
                                                        <div className="form-group">
                                                            <label htmlFor="control_dist">Enter holders and their membership token(s).</label>
                                                            {this.state.inputs_owners.map(input => <TokenDistributionForm min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
                                                        </div>
                                                        <div className="col-md-offset-6 col-md-6">
                                                            <button type="button" className="btn btn-info pull-right" style={style} onClick={this.appendOwners.bind(this)}>
                                                                <span className="glyphicon glyphicon-plus"></span>Add More
							    							</button>
                                                        </div>
                                                        <div className="form-group">
                                                            <button style={style} type="button" className="btn btn-primary" onClick={this.requestUpdateOwners.bind(this)}>
                                                                <span className="glyphicon glyphicon-plus"></span>Update Membership Holdings
                                							</button>
                                                        </div>
                                                    </div>{/*OWNERSHIP*/}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>{/*panel-group*/}

                                <div className="panel-group" id="accordion">
                                    <div className="panel panel-default">
                                        <div className="panel-heading">
                                            <div className="row">
                                                <div className="col-xs-11">
                                                    <label>Delegation</label>
                                                </div>
                                                <div className="col-xs-1">
                                                    <a data-toggle="collapse" data-parent="#accordion" href="#collapse3">
                                                        <span className="glyphicon glyphicon-chevron-down"></span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="collapse3" className="panel-collapse collapse out">
                                            <div className="panel-body">
                                                <div className="form-group col-md-12">
                                                    <table className="table table-striped table-hover">
                                                        <tbody>
                                                            <tr>
                                                                <td><b>Delegation ID List</b></td>
                                                            </tr>
                                                            {(() => {
                                                                if (!$.isEmptyObject(asset.controlIdList)) {
                                                                    return asset.controlIdList.map((ids, i) => {
                                                                        return(
                                                                            <tr key={i}>
                                                                                <td>{asset.controlIdList[i]}</td>
                                                                            </tr>
                                                                        )
                                                                    })
                                                                }
                                                            })(this)}
                                                        </tbody>
                                                    </table>

                                                    <div className="form-group">
                                                        <label htmlFor="control_dist">Enter Delegatees and their delegated token(s).</label>
                                                        {this.state.inputs_controllers.map(input => <TokenDistributionForm min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
                                                    </div>
                                                        {/* onClick={this.appendControllers.bind(this)} */}
                                                    <div className="col-md-offset-6 col-md-6">
                                                        <button type="button" className="btn btn-info pull-right" style={style}>
                                                            <span className="glyphicon glyphicon-plus"></span>Add More
														</button>
                                                    </div>
                                                    <div className="form-group">
                                                        {/* onClick={this.requestUpdateController.bind(this)} */}
                                                        <button style={style} type="button" className="btn-sm btn-primary">
                                                            <span className="glyphicon glyphicon-plus"></span>Update Delegatees
														</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>{/*panel-group*/}

                                <div className="panel-group" id="accordion">
                                    <div className="panel panel-default">
                                        <div className="panel-heading">
                                            <div className="row">
                                                <div className="col-xs-11">
                                                    <label>Recovery</label>
                                                </div>
                                                <div className="col-xs-1">
                                                    <a data-toggle="collapse" data-parent="#accordion" href="#collapse4">
                                                        <span className="glyphicon glyphicon-chevron-down"></span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="collapse4" className="panel-collapse collapse out">
                                            <div className="panel-body">
                                                <div className="form-group col-md-12">
                                                    <table className="table table-striped table-hover">
                                                        <tbody>
                                                            <tr>
                                                                <td><b>Recovery IDs</b></td>
                                                            </tr>
                                                            {(() => {
                                                                if (!$.isEmptyObject(asset.identityRecoveryIdList)) {
                                                                    return asset.identityRecoveryIdList.map((ids, i) => {
                                                                        return(
                                                                            <tr key={i}>
                                                                                <td>{asset.identityRecoveryIdList[i]}</td>
                                                                            </tr>
                                                                        )
                                                                    })
                                                                }
                                                            })(this)}
                                                            <tr>
                                                                <td>Recovery Condition</td>
                                                                <td><p>{asset.recoveryCondition}</p></td>
                                                            </tr>
                                                            <tr>
                                                                <td>Change recovery condition:</td>
                                                                <td><input name="recoveryCondition" className="form-control col-md-4" type="text" placeholder="# of signatures required." /></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <div className="form-group">
                                                        <label htmlFor="control_dist">Enter Recovery ID(s).</label>
                                                        <TagsInput {...inputAttrs} value={this.state.recovery_list} onChange={(e) => { this.onFieldChange("recovery_list", e) }} />
                                                    </div><br />

                                                    <div className="form-group">
                                                    {/* onClick={this.requestUpdateRecovery.bind(this)*/}
                                                        <button style={style} type="button" className="btn btn-primary">
                                                            <span className="glyphicon glyphicon-plus"></span>Update Recovery
													    </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>{/*panel-group*/}

                                <div className="panel-group" id="accordion">
                                    <div className="panel panel-default">
                                        <div className="panel-heading">
                                            <div className="row">
                                                <div className="col-xs-11">
                                                    <label>One-Time or Temporary Delegation</label>
                                                </div>
                                                <div className="col-xs-1">
                                                    <a data-toggle="collapse" data-parent="#accordion" href="#collapse5">
                                                        <span className="glyphicon glyphicon-chevron-down"></span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="collapse5" className="panel-collapse collapse out">
                                            <div className="panel-body">
                                                <div className="form-group col-md-12">
                                                    <table className="table table-striped table-hover" style={style}>
                                                        <tbody>
                                                            <tr>
                                                                <td><b>Temporary Delegations List</b></td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    {(() => {
                                                                        if (!$.isEmptyObject(asset.delegateeIdList)) {
                                                                            return asset.delegateeIdList.map((ids, i) => {
                                                                                return(
                                                                                    <tr key={i}>
                                                                                        <td>{asset.delegateeIdList[i]}</td>
                                                                                    </tr>
                                                                                )
                                                                            })
                                                                        }
                                                                    })(this)}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <div className="form-group">
                                                        <label htmlFor="delegatee_dist">Enter Delegatees and their delegated token(s).</label>
                                                        {this.state.inputs_delegatees.map(input => <TokenDistributionForm min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
                                                    </div>
                                                    <div className="col-md-offset-6 col-md-6">
                                                        {/* onClick={this.appendDelegatees.bind(this)} */}
                                                        <button type="button" className="btn btn-info pull-right" style={style}>
                                                            <span className="glyphicon glyphicon-plus"></span>Add More
							    						</button>
                                                    </div>
                                                    <div className="form-group">
                                                        {/* onClick={this.requestUpdateDelegatees.bind(this)} */}
                                                        <button style={style} type="button" className="btn btn-primary">
                                                            <span className="glyphicon glyphicon-plus"></span>Update Delegations
                                								</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>{/*panel-group*/}

                            </div>

                        </div>

                        <div id="menu2" className="tab-pane">

                        </div>

                        <div id="menu3" className="tab-pane">

                        </div>

                        <div id="menu4" className="tab-pane">

                        </div>

                    </div>

                </div>

            </div>
        )
    }

}

export default AssetUtilities