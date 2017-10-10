import React, { Component } from 'react';
import { Link } from 'react-router';
import TagsInput from 'react-tagsinput';
import QRCode from 'qrcode.react';
import AssetTags from './classAndSubClass.js';
import DayPicker from 'react-day-picker';
import UniqueIDAttributeForm from './IdentityFederation/UniqueIDAttributeForm.jsx';
import UploadIpfsFile from './UploadIpfsFile.jsx';

//import { Router, Route, IndexRedirect, hashHistory } from 'react-router';

//var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var keccak_256 = require('js-sha3').keccak_256;

// TODO: Static public/private keys has to be changed

class TokenDistributionForm extends React.Component {

	constructor(props) {
		super(props)
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
		console.log("attribute form props: " + JSON.stringify(this.props))

		var style = {
			fontSize: '12.5px'
		}
		return (
			<div className="form-group col-md-12" style={style}>
				<div className="col-md-10">

					<input name={'label-' + this.props.labelref} className="form-control col-md-4" type="text" placeholder="E.g. My college transcript Chase Bank KYC" />
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
class Modal extends Component {

	//this.props.asset_details will have the selected asset object

	//this.props.dimensions will have the dimension objects for selected asset

	constructor(props) {
		super(props);
		this.pubKey = localStorage.getItem("pubKey");
		this.privKey = localStorage.getItem("privKey");
		this.tags = new AssetTags(this.pubKey, props.asset.asset_id);
		//this.names = localStorage.getItem("contactNames").split(',');
		//this.keys = localStorage.getItem("contactPubKeys").split(',');
		this.state = {

			//added from MYCOID.jsx
			file_attrs: [],
			inputs: ['input-0'],
			tmpFile: '',
			showModal: false,

			inputs_owners: ['input1-0'],
			inputs_controllers: ['input1-0'],
			recovery_list: [],
			inputs_delegatees: ['input1-0'],
			delegatee_id: [],
			delegatee_token_quantity: [],
			//*********************************/


			asset: props.asset || {},
			asset_class: this.tags.getAssetData("classes"),
			asset_subclass: this.tags.getAssetData("subclasses"),
			qrCode_signature: {},

			qrCode_COID_device_relation: {},

			notCOID: true, //if the asset in view is MYCOID, we dont need second QR

			//used for identitydimension file upload
			docs: {}

		};
		this.handleClassChange = this.handleClassChange.bind(this);
		this.handleSubClassChange = this.handleSubClassChange.bind(this);
		this.maxUniqAttr = 10;
		this.bigchainGet = this.bigchainGet.bind(this);
		this.onFieldChange = this.onFieldChange.bind(this); //recoverers
	}

	//*****************************************************************************
	//watch for inputs on recovery_list
	onFieldChange(inputField, e) {
		var multipleValues = {};
		multipleValues[inputField] = e;
		this.setState(multipleValues);
	}

	handleClassChange(tags) {
		this.setState({ asset_class: tags });
		this.tags.updateClasses(tags, this.props.asset.asset_id, "classes");
	}

	handleSubClassChange(tags) {
		this.setState({ asset_subclass: tags });
		this.tags.updateClasses(tags, this.props.asset.asset_id, "subclasses");
	}

	handleHideModal() {
		this.setState({ showModal: false });
	}

	handleShowModal(e) {
		this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
	}

	bigchainGet(attr) {
		//e.preventDefault();
		var txID = attr;//req.body.bigchainID;
		console.log(txID);
		console.log("BIGCHAINGET ONCLICK");
		//var formdata = req.body;
		//BIGCHAIN ENDPOINT:
		var bigchainServer = 'http://10.101.114.230:5000'
		var endpoint = '/getTransaction/' + txID;
		$.ajax({
			method: 'GET',
			url: bigchainServer + endpoint,
			headers: { 'Access-Control-Allow-Origin': '*' },
			crossDomain: true,
			dataType: 'json',
			contentType: 'application/json',
			cache: false,
			success: function (resp) {
				//the response is body -- send that
				console.log(resp)
				var full_data = resp
				var short_data = resp.asset.data.Coid_Data;
				console.log("short data is..." + short_data.ownershipId)
				console.log(JSON.stringify(full_data))
				console.log(JSON.stringify(short_data))
				var something = window.open("data:text/json," + encodeURIComponent(JSON.stringify(short_data)), "_blank");
				something.focus();
			}
		});
	}

	componentDidMount() {
		$("#assetDetails").modal('show');
		$("#assetDetails").on('hidden.bs.modal', this.props.hideHandler);

		var asset_id = this.props.asset.asset_id;
		if (asset_id == "MyCOID") {
			this.setState({ notCOID: false })
		}
		else { this.setState({ notCOID: true }) }

		let standardAsset = document.getElementById("standardAsset");
		let KYC = document.getElementById("KYC");

		if (this.props.asset.asset_details.propType == 2) {
			standardAsset.style.display = 'none';
			KYC.style.display = 'block';
		}
		else { KYC.style.display = 'none' }

		var prop = this.props.asset.asset_details;

		var theTime = (new Date()).toString()

		var qrCode_Object = JSON.stringify({
			uniqueId: prop.uniqueId,
			name: prop.uniqueIdAttributes[0],
			ownershipId: prop.ownershipId,
			bigchainID: prop.bigchainID,
			bigchainHash: prop.bigchainHash,
			endpoint: twinUrl + "validateQrCode"
		})
		console.log("**" + qrCode_Object)

		var qrCode_Object_hash = keccak_256(theTime);

		this.privKey = new Buffer(this.privKey, "hex");

		var qrCode_Object_hash_buffer = new Buffer(qrCode_Object_hash, "hex");

		var signature = JSON.stringify(secp256k1.sign(qrCode_Object_hash_buffer, this.privKey));
		signature = JSON.parse(signature).signature;
		signature = JSON.stringify(signature);
		signature = JSON.parse(signature).data;
		signature = new Buffer(signature, "hex");
		signature = signature.toString("hex")
		console.log("singature: " + signature)

		//***************************************************************************
		//***************************************************************************

		var owners_sig = "348dba954726daeb583726cc1838aacbb2d69038438723987ec5a2223217dcca45bd22528f56eb8dd232ec2345de34243234bdd34124af34f454e7d6f5e7d545";

		var qrCode_owned_Object = JSON.stringify({
			uniqueId: prop.uniqueId,
			owner: prop.ownerIdList,
			owner_signature: owners_sig,
			asset_signature: signature,
			bigchainID: prop.bigchainID,
			bigchainHash: prop.bigchainHash,
		})

		var qrCode_owned_Object_hash = keccak_256(theTime);

		//***************************************************************************.
		//***************************************************************************
		//added second object for second qrCode

		this.setState({
			qrCode_signature: { "msgHash": qrCode_Object_hash, "signature": signature, "timestamp": theTime },
			qrCode_COID_device_relation: { "msgHash": qrCode_owned_Object_hash, "owners_sig": owners_sig, "timestamp": theTime }
		})

	}

	//**********************************************************************
	// START OFFICAL ID FUNCTIONS:

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
	// END OFFICIAL ID FUNCTIONS:
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
		let asset = this.state.asset
		var json = {}
		//*********************************************
		let filename = asset.asset_id + ".json";
		json.filename = filename;
		json.pubKey = localStorage.getItem("pubKey");
		json.address = asset.asset_name.coidAddr
		//*********************************************
		//NEW OWNERS AND THEIR TOKENS
		this.prepareOwnerTokenDistribution();
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
	// START CONTROLLER FUNCTIONS:

	//used in tokendistributionform
	appendControllers() {
		var inputLen = this.state.inputs_controllers.length;
		if (inputLen < 10) {
			var newInput1 = `input1-${inputLen}`;
			this.setState({
				inputs_controllers:
				this.state.inputs_controllers.concat([newInput1])
			});
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

		e.preventDefault();
		let asset = this.state.asset
		var json = {};
		//*********************************************
		let filename = asset.asset_id + ".json";
		json.filename = filename;
		json.pubKey = localStorage.getItem("pubKey");
		json.address = asset.asset_name.coidAddr
		//*********************************************
		//NEW CONTROLLERS AND THEIR TOKENS
		this.prepareControlTokenDistribution();
		json.controllers = this.state.control_id;
		json.token_quantity = this.state.control_token_quantity;
		//*********************************************
		var signature = this.getSignature(json);
		//*********************************************
		var msg_hash = keccak_256(JSON.stringify(json));
		var msg_hash_buffer = new Buffer(msg_hash, "hex");
		json.msg = msg_hash_buffer.toString("hex");
		json.sig = signature;
		//*********************************************
		console.log("update controller JSON!! \n" + JSON.stringify(json));

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
	// START DELEGATEE FUNCTIONS

	//used in tokendistrubtionform
	appendDelegatees() {
		var inputLen = this.state.inputs_delegatees.length;
		if (inputLen < 10) {
			var newInput1 = `input1-${inputLen}`;
			this.setState({
				inputs_delegatees: this.state.inputs_delegatees.concat([newInput1])
			});
		}
	}
	prepareDelegateeTokenDistribution() {
		var labels = this.getTokenLabelValues();
		console.log("got labels... " + JSON.stringify(labels))
		for (var i = 0; i < labels.length; i += 2) {
			for (var key in labels[i]) {
				this.state.delegatee_id.push(labels[i][key]);
				this.state.delegatee_token_quantity.push(labels[i + 1][key]);
			}
		}
	}

	requestUpdateDelegatees(e) {
		e.preventDefault()
		let asset = this.state.asset
		var json = {}
		//*********************************************
		let filename = asset.asset_id + ".json";
		json.filename = filename;
		json.pubKey = localStorage.getItem("pubKey");
		json.address = asset.asset_name.coidAddr;
		//*********************************************
		//NEW OWNERS AND THEIR TOKENS
		this.prepareDelegateeTokenDistribution();
		json.delegatee = this.state.delegatee_id;
		json.amount = this.state.delegatee_token_quantity;
		json.flag = 1;
		//*********************************************
		var signature = this.getSignature(json);
		//*********************************************
		var msg_hash = keccak_256(JSON.stringify(json));
		var msg_hash_buffer = new Buffer(msg_hash, "hex");
		json.sig = signature;
		json.msg = msg_hash_buffer.toString("hex");
		//*********************************************
		console.log("delegatee JSON!! \n" + JSON.stringify(json));

		$.ajax({
			type: "POST",
			url: twinUrl + 'MyCOID/delegate',
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
	// END DELEGATEE FUNCTIONS:
	//**********************************************************************
	//**********************************************************************


	render() {

		console.log("this.props.dimensions: " + JSON.stringify(this.props.dimensions));

		console.log("******" + JSON.stringify(this.state.qrCode_COID_device_relation))

		var _this = this;

		var prop = this.props.asset.asset_details;
		// var hashedKeys = [];
		// for (var i = 0; i < this.keys.length; i++) {
		//  hashedKeys[i] = keccak_256(this.keys[i]);
		// }

		// var oIndex = hashedKeys.indexOf(prop.ownershipId);
		// if (oIndex >= 0) {
		//  prop.ownershipId = this.names[oIndex];
		// }
		// var cIndex = hashedKeys.indexOf(prop.controlId);
		// if (cIndex >= 0) {
		//  prop.controlId = this.names[cIndex];
		// }

		// for (var x = 0; x < prop.ownerIdList.length; x++) {
		//  var index = hashedKeys.indexOf(prop.ownerIdList[x]);
		//  if (index >= 0) {
		//      prop.ownerIdList[x] = this.names[index];
		//      console.log("\n\nCHANGED: " + prop.ownerIdList[x]);
		//  }
		// }

		// for (var x = 0; x < prop.controlIdList.length; x++) {
		//  var index = hashedKeys.indexOf(prop.controlIdList[x]);
		//  if (index >= 0) {
		//      prop.controlIdList[x] = this.names[index];
		//      console.log("\n\nCHANGED: " + prop.controlIdList[x]);
		//  }
		// }

		// for (var x = 0; x < prop.identityRecoveryIdList.length; x++) {
		//  var index = hashedKeys.indexOf(prop.identityRecoveryIdList[x]);
		//  if (index >= 0) {
		//      prop.identityRecoveryIdList[x] = this.names[index];
		//      console.log("\n\nCHANGED: " + prop.identityRecoveryIdList[x]);
		//  }
		// }

		// if (prop.validatorSigs) {
		//  for (var x = 0; x < prop.validatorSigs.length; x++) {
		//      var index = this.keys.indexOf(prop.validatorSigs[x][2]);
		//      if (index >= 0) {
		//          prop.validatorSigs[x][2] = this.names[index];
		//          console.log("\n\nCHANGED: " + prop.validatorSigs[x][2]);
		//      }
		//  }
		// }

		console.log("asset_details.. " + JSON.stringify(prop));
		console.log("names: " + this.names)
		console.log("keys: " + this.keys);
		var style = {
			fontSize: '12.5px'
		}

		var classInput = {
			addKeys: [13, 188], // Enter and comma
			value: this.state.asset_class,
			onChange: this.handleClassChange,
			inputProps: { placeholder: "" }
		};
		var subClassInput = {
			addKeys: [13, 188], // Enter and comma
			value: this.state.asset_subclass,
			onChange: this.handleSubClassChange.bind(this),
			inputProps: { placeholder: "" }
		};

		//message hash is the hash of the elemets
		var qrConfig = JSON.stringify({
			pubKey: prop.pubKey,
			//this.setState({qrCode_signature: {"msgHash": qrCode_Object_hash, "signature":signature}})
			msgHash: this.state.qrCode_signature.msgHash,
			sig: this.state.qrCode_signature.signature,
			uniqueId: prop.uniqueId,
			ownershipId: prop.ownershipId,
			name: prop.uniqueIdAttributes[0][0],
			bigchainID: prop.bigchainID,
			bigchainHash: prop.bigchainHash,
			timestamp: this.state.qrCode_signature.timestamp,
			endpoint: twinUrl + "validateQrCode"
		});

		var qrOwnedDevice = JSON.stringify({
			pubKey: prop.pubkey,
			msgHash: _this.state.qrCode_COID_device_relation.msgHash,
			asset_sig: _this.state.qrCode_COID_device_relation.signature,
			//need to make sure asset_sig is correct
			owners_sig: _this.state.qrCode_COID_device_relation.owners_sig,
			owner: prop.ownerIdList
		});

		var qrStyle = {
			maxWidth: "100%",
			textAlign: "center"
		};

		var syle = {
			marginRight: '15px'
		}

		var popUpWidth = {
			width: '70%'
		}

		var inputAttrs = {
			addKeys: [13, 188],	// Enter and comma
			inputProps: {
				placeholder: "use comma(,) to add multiple values",
				style: { width: '30%' }
			}
		};

		return (
			<div className="modal fade" id="assetDetails" key={this.props.asset.asset_id} tabIndex="-1" role="dialog" aria-labelledby="asset">
				<div className="modal-dialog modal-lg" role="document" style={popUpWidth}>
					<div className="modal-content modalstyle">

						<div className="modal-header">
							<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times; </span></button>
							<ul className="nav nav-pills" role="tablist">
								<li role="presentation" className="active"><a href="#asset_details" role="tab" data-toggle="tab">Asset Details</a></li>
								<li role="presentation"><a href="#menu1" role="tab" data-toggle="tab">Menu1</a></li>
								<li role="presentation"><a href="#menu2" role="tab" data-toggle="tab">Menu2</a></li>
								<li role="presentation"><a href="#menu3" role="tab" data-toggle="tab">Menu3</a></li>
								<li role="presentation"><a href="#qrcode" role="tab" data-toggle="tab">QR Codes</a></li>
							</ul>
						</div>

						<div className="modal-body">
							<div className="tab-content">

								<div role="tabpanel" className="tab-pane active" id="asset_details">

									<div id="standardAsset">
										<table className="table table-striped table-hover" style={style}>
											<tbody>
												<tr>
													<td>Asset Name</td>
													<td>{this.props.asset.asset_id}</td>
												</tr>
												<tr>
													<td>Asset Class<p className="text-info">Use comma/enter to add class </p></td>
													<td><TagsInput {...classInput} /></td>
												</tr>
												<tr>
													<td>Asset SubClass<p className="text-info">Use comma/enter to add sub class </p></td>
													<td><TagsInput {...subClassInput} /></td>
												</tr>
												<tr>
													<td>COID Contract address</td>
													<td><p><b> {prop.coidAddr} </b></p></td>
												</tr>
												<tr>
													<td>Gatekeeper Contract address</td>
													<td><p><b> {prop.gatekeeperAddr} </b></p></td>
												</tr>
												<tr>
													<td>Dimension Control address</td>
													<td><p><b> {prop.dimensionCtrlAddr} </b></p></td>
												</tr>
												<tr>
													<td>BigchainDB Transaction ID</td>
													<td><p> {prop.bigchainID} </p></td>
												</tr>
												<tr>
													<td>BigchainDB Transaction Hash</td>
													<td><p> {prop.bigchainHash} </p></td>
												</tr>
												<tr>
													<td colSpan="2"><b>Official IDs</b></td>
												</tr>
												{(() => {
													var ipfs_url = "http://10.101.114.231:8080/ipfs/";
													if (!$.isEmptyObject(prop.uniqueIdAttributes)) {
														return prop.uniqueIdAttributes.map((ids, i) => {
															if (ids[2].charAt(0) == "Q") {
																return (
																	<tr key={i}>
																		<td>{ids[0]}</td>
																		<td><p>File hash: {ids[1]}</p><p>IPFS hash: <a target="_blank" href={ipfs_url + "/" + ids[2]}>{ids[2]}</a></p></td>
																	</tr>
																)
															}
															else {
																return (
																	<tr key={i}>
																		<td>{ids[0]}</td>
																		<td><p>File hash: {ids[1]}</p><p>BigChain hash: <a href="javascript:" onClick={(e) => { this.bigchainGet(ids[2]) }}>{ids[2]}</a></p></td>
																	</tr>
																)
															}
														});
													} else {
														return <tr><td colSpan="2">No Ids found</td></tr>
													}
												})(this)}
												<tr>
													<td>Ownership Token Description</td>
													<td><p>{prop.ownershipTokenAttributes}</p></td>
												</tr>
												<tr>
													<td>Ownership ID</td>
													<td><p> {prop.ownershipId}</p></td>
												</tr>
												<tr>
													<td>Ownership ID List</td>
													<td>{(() => {
														if (!$.isEmptyObject(prop.ownerIdList)) {
															return prop.ownerIdList.map((ids, i) => {
																return <p key={i}> {prop.ownerIdList[i]}</p>
															})
														}
													})(this)}
													</td>
												</tr>
												<tr>
													<td>Ownership Token Quantity</td>
													<td>{(() => {
														if (!$.isEmptyObject(prop.ownershipTokenQuantity)) {
															return prop.ownershipTokenQuantity.map((ids, i) => {
																return <p key={i}> {prop.ownershipTokenQuantity[i]}</p>
															})
														}
													})(this)}
													</td>
												</tr>
												<tr>
													<td>Ownership Token ID</td>
													<td><p> {prop.ownershipTokenId}</p></td>
												</tr>
												<tr>
													<td>Control Token Description</td>
													<td><p>{prop.controlTokenAttributes}</p></td>
												</tr>
												<tr>
													<td>Control ID</td>
													<td><p> {prop.controlId}</p></td>
												</tr>
												<tr>
													<td>Control ID List</td>
													<td>{(() => {
														if (!$.isEmptyObject(prop.controlIdList)) {
															return prop.controlIdList.map((ids, i) => {
																return <p key={i}> {prop.controlIdList[i]}</p>
															})
														}
													})(this)}
													</td>
												</tr>
												<tr>
													<td>Control Token Quantity</td>
													<td>{(() => {
														if (!$.isEmptyObject(prop.controlTokenQuantity)) {
															return prop.controlIdList.map((ids, i) => {
																return <p key={i}> {prop.controlTokenQuantity[i]}</p>
															})
														}
													})(this)}
													</td>
												</tr>
												<tr>
													<td>Control Token ID</td>
													<td> <p> {prop.controlTokenId}</p></td>
												</tr>
												<tr>
													<td>Recovery IDs</td>
													<td>{(() => {
														if (!$.isEmptyObject(prop.identityRecoveryIdList)) {
															return prop.identityRecoveryIdList.map((ids, i) => {
																return <p key={i}> {prop.identityRecoveryIdList[i]}</p>
															})
														}
													})(this)}
													</td>
												</tr>
												<tr>
													<td>Recovery Condition</td>
													<td> <p> {prop.recoveryCondition}</p></td>
												</tr>
											</tbody>
										</table>
									</div>

									<div id="KYC">
										<table className="table table-striped table-hover" style={style}>
											<tbody>
												<tr>
													<td>Asset Name</td>
													<td>{this.props.asset.asset_id}</td>
												</tr>
												<tr>
													<td colSpan="2"><b>Official IDs</b></td>
												</tr>
												{(() => {
													var ipfs_url = "http://10.101.114.231:8080/ipfs/";
													if (!$.isEmptyObject(prop)) {
														return prop.uniqueIdAttributes.map((ids, i) => {
															if (ids[2].charAt(0) == "Q") {
																return (
																	<tr key={i}>
																		<td>{ids[0]}</td>
																		<td><p>File hash: {ids[1]}</p><p>IPFS hash: <a target="_blank" href={ipfs_url + "/" + ids[2]}>{ids[2]}</a></p></td>
																	</tr>
																)
															}
															else {
																return (
																	<tr key={i}>
																		<td>{ids[0]}</td>
																		<td><p>File hash: {ids[1]}</p><p>BigChain hash: <a href="javascript:" onClick={(e) => { this.bigchainGet(ids[2]) }}>{ids[2]}</a></p></td>
																	</tr>
																)
															}
														});
													} else {
														return <tr><td colSpan="2">No Ids found</td></tr>
													}
												})(this)}
												<tr>
													<td colSpan="2"><b>Attestations</b></td>
												</tr>
												{(() => {
													var ipfs_url = "http://10.101.114.231:8080/ipfs/";
													if (!$.isEmptyObject(prop.validatorSigs)) {
														return prop.validatorSigs.map((ids, i) => {
															return (
																<tr key={i}>
																	<td></td>
																	<td>
																		<p>Attestor: {ids[2]}</p>
																		<p>Signature: {ids[1]}</p>
																		<p>Expiration: {String(new Date(Number(ids[3]) * 1000))}</p>
																	</td>
																</tr>
															)
														});
													} else {
														return <tr><td colSpan="2">No signatures found.</td></tr>
													}
												})(this)}
												<tr>
													<td>Asset Class<p className="text-info">Use comma/enter to add class </p></td>
													<td><TagsInput {...classInput} /></td>
												</tr>
												<tr>
													<td>Asset SubClass<p className="text-info">Use comma/enter to add sub class </p></td>
													<td><TagsInput {...subClassInput} /></td>
												</tr>
											</tbody>menu2
                                    	</table>
									</div>{/*KYC Asset*/}

								</div>

								<div id="menu1" className="tab-pane">
									<br></br>
									
									<div>
										<div className="panel-group" id="accordion">
											<div className="panel panel-default">
												<div className="panel-heading">
													<div className="row">
														<div className="col-xs-11">
															<label>Uniqueness</label>
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
														<div className="row">
															<table className="table table-striped table-hover" >
																<tbody>
																	<tr>
																		<td colSpan="2"><b>Official IDs</b></td>
																	</tr>
																	{/* {(() => {
                                                                    var ipfs_url = "http://10.101.114.231:8080/ipfs/";
                                                                    if (!$.isEmptyObject(prop.uniqueIdAttributes)) {
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
                                                                })(this)} */}
																</tbody>
															</table>
															<div className="form-group col-md-8">
																<label htmlFor="unique_id">Enter Unique ID Attributes:</label>
																{this.state.inputs.map(input => <AttributeForm handleShowModal={this.handleShowModal.bind(this)} max="10" key={input} labelref={input} />)}
															</div>
															<div className="col-md-offset-4 col-md-4 ">
																<button type="button" className="btn btn-info pull-right" style={style} onClick={this.appendInput.bind(this)}>
																	<span className="glyphicon glyphicon-plus"></span>Add More
                                                            </button>
															</div>
															<div className="form-group">
																<button style={style} type="button" className="btn btn-primary" onClick={this.requestUpdateOfficalIDs.bind(this)}>
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
															<label>Ownership</label>
														</div>
														<div className="col-xs-1">
															<a data-toggle="collapse" data-parent="#accordion" href="#collapse2">
																<span className="glyphicon glyphicon-chevron-down"></span>
															</a>
														</div>
													</div>
												</div> {/* panel-heading */}

												<div id="collapse2" className="panel-collapse collapse out">
													<div className="panel-body">
														<div className="row">
															<table className="table table-striped table-hover" style={style}>
																<tbody>
																	<tr>
																		<td><b>Owner ID List</b></td>
																		<td>
																			{(() => {
																				if (!$.isEmptyObject(prop.ownerIdList)) {
																					return prop.ownerIdList.map((ids, i) => {
																						return <p key={i}> {prop.ownerIdList[i]}</p>
																					})
																				}
																			})(this)}
																		</td>
																	</tr>
																</tbody>
															</table>
															<div id="OWNERSHIP">
																{/*  style={this.state.removeIfMyCOID}> */}
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
															<label>Control</label>
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
														<div className="row">
															<table className="table table-striped table-hover" style={style}>
																<tbody>
																	<tr>
																		<td><b>Control ID List</b></td>
																		<td>
																			{(() => {
																				if (!$.isEmptyObject(prop.controlIdList)) {
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
														<div className="row">
															<table className="table table-striped table-hover" style={style}>
																<tbody>
																	<tr>
																		<td>Recovery IDs</td>
																		<td>{(() => {
																			if (!$.isEmptyObject(prop.identityRecoveryIdList)) {
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
																{/* onClick={this.requestUpdateRecovery.bind(this)} */}
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
															<label>Delegations</label>
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
														<div className="row">
															<table className="table table-striped table-hover" style={style}>
																<tbody>
																	<tr>
																		<td><b>Delegations List</b></td>
																		<td>
																			{(() => {
																				if (!$.isEmptyObject(prop.delegateeIdList)) {
																					return prop.delegateeIdList.map((ids, i) => {
																						return <p key={i}> {prop.delegateeIdList[i]}</p>
																					})
																				}
																			})(this)}
																		</td>
																	</tr>
																</tbody>
															</table>
															<div className="form-group">
																<label htmlFor="delegatee_dist">Enter Delegatees and their delegated control token(s).</label>
																{this.state.inputs_delegatees.map(input => <TokenDistributionForm handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
															</div>
															<div className="col-md-offset-6 col-md-6 ">
																<button type="button" className="btn btn-info pull-right" style={style} onClick={this.appendDelegatees.bind(this)}>
																	<span className="glyphicon glyphicon-plus"></span>Add More
							    								</button>
															</div>
															<div className="form-group">
																<button style={style} type="button" className="btn btn-primary" onClick={this.requestUpdateDelegatees.bind(this)}>
																	<span className="glyphicon glyphicon-plus"></span>Update Delegations
                                								</button>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>{/*panel-group*/}
									</div>{/*form-group col-md-offset-1 col-md-10*/}

								</div>{/*menu1*/}

								<div id="menu2" className="tab-pane fade">
									<div className="container">
										<h2>Accordion Example</h2>
										<p><strong>Note:</strong> The <strong>data-parent</strong> attribute makes sure that all collapsible elements under the specified parent will be closed when one of the collapsible item is shown.</p>
										{(() => {
											if (!$.isEmptyObject(this.props.dimensions)) {
												return this.props.dimensions.map((dims, i) => {
													return(
													<div className="panel-group" id="accordion">
														<div className="panel panel-default">
															<div className="panel-heading">
																<h4 className="panel-title">
																	<a data-toggle="collapse" data-parent="#accordion" href={"#collapse_" + i}>{dims.dimensionName}</a>
																</h4>
															</div>
															<div id={"collapse_" + i} className="panel-collapse collapse in">
																<div className="panel-body">
																	<table className="table table-striped table-hover" style={syle}>
																		<tbody>
																			<tr>
																				<td>Contract Address</td>
																				<td>{dims.coidAddr}</td>
																			</tr>
																			<tr>
																				<td>Asset Owner List</td>
																			</tr>
																		</tbody>
																	</table>
																</div>
															</div>
														</div>
													</div>)
												})
											}
										})(this)}


									</div>{/*container*/}
								</div>{/*menu2*/}

								<div id="menu3" className="tab-pane fade">
									<br></br>
									<div className="col-md-offset-1 col-md-10">
										<div className="panel-group" id="accordion">
											<div className="panel panel-default">
												<div className="panel-heading">
													<div className="row">
														<div className="col-xs-11">
															<label>Manage Owner</label>
														</div>
														<div className="col-xs-1">
															<a data-toggle="collapse" data-parent="#accordion" href="#collapseA">
																<span className="glyphicon glyphicon-chevron-down"></span>
															</a>
														</div>
													</div>
												</div>
												<div id="collapseA" className="panel-collapse collapse out">
													<div className="panel-body">
														<div className="row">
															<div className="col-md-8">
																<label htmlFor="unique_id">Enter Unique ID Attributes</label>
																<input className="form-control col-md-4" type="text" placeholder="e.g.Serial Numbers, MAC Addresse" />
															</div>
															<div className="col-md-4">
																<div className="row">
																	<button type="button" className="btn btn-md btn-warning "><span className="glyphicon glyphicon-upload">                                         </span>Upload File</button>
																</div>
																<div className="row">
																	<button type="button" className="btn btn-m btn-info addbutton">
																		<span className="glyphicon glyphicon-plus"></span>Add More</button>
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="panel-group" id="accordion">
											<div className="panel panel-default">
												<div className="panel-heading">
													<div className="row">
														<div className="col-xs-11">
															<label>manage Ownership</label>
														</div>
														<div className="col-xs-1">
															<a data-toggle="collapse" data-parent="#accordion" href="#collapseB">
																<span className="glyphicon glyphicon-chevron-down"></span>
															</a>
														</div>
														<div className="form-group">
															<label htmlFor="unique_id">Enter Unique ID Attributes:</label>
															{this.state.inputs.map(input => <UniqueIDAttributeForm type="MyCOID" handleShowModal={this.handleShowModal.bind(this)} max="10" key={input} labelref={input} />)}
														</div>
														<div className="col-md-offset-6 col-md-6 ">
															<button type="button" className="btn btn-info pull-right" style={style} onClick={this.appendInput.bind(this)}>
																<span className="glyphicon glyphicon-plus"></span>Add More
							    							</button>
														</div>
													</div>
												</div>
												<div id="collapseB" className="panel-collapse collapse out">
													<div className="panel-body">
														<div className="row">
															<div className="col-md-8">
																<label htmlFor="unique_id">Enter Unique ID Attributes</label>
																<input className="form-control col-md-4" type="text" placeholder="e.g.Serial Numbers, MAC Addresse" />
															</div>
															<div className="col-md-4">
																<div className="row">
																	<button type="button" className="btn btn-md btn-warning "><span className="glyphicon glyphicon-upload">                                         </span>Upload File</button>
																</div>
																<div className="row">
																	<button type="button" className="btn btn-m btn-info addbutton">
																		<span className="glyphicon glyphicon-plus"></span>Add More</button>
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div role="tabpanel" className="tab-pane center-block" id="qrcode" style={qrStyle}>
									<QRCode value={qrConfig} size={200} /><hr />
									{this.state.notCOID ? <h2>abc</h2> : null}
									{this.state.notCOID ? <QRCode value={qrOwnedDevice} size={200} /> : null}
								</div>

							</div>{/*tab-content*/}
							{this.state.showModal ? <UploadIpfsFile addOfficialID={true} pubKey={this.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal} /> : null}

						</div>{/*modal-body*/}
					</div>{/*modal-content modalstyle*/}
				</div>{/*modal-dialog modal-lg*/}


			</div>
		);
	}
}

Modal.propTypes = {
	hideHandler: React.PropTypes.func.isRequired // hideHandler method must exists in parent component
};

//**************************************************************************************************************** */

class Dims extends Component {

	constructor(props) {
		super(props);
		this.pubKey = localStorage.getItem("pubKey");
		this.privKey = localStorage.getItem("privKey");
		this.tags = new AssetTags(this.pubKey, props.dimension.dimension_id);
		this.names = localStorage.getItem("contactNames").split(',');
		this.keys = localStorage.getItem("contactPubKeys").split(',');
		this.state = {

			asset_class: this.tags.getAssetData("classes"),
			asset_subclass: this.tags.getAssetData("subclasses"),

			inputs: ['input-0'],

			dimension: props.dimension || {},

			dimensionDataArray: [],

			signICA: false

		};
		this.handleClassChange = this.handleClassChange.bind(this);
		this.handleSubClassChange = this.handleSubClassChange.bind(this);
		this.maxUniqAttr = 10;
	}

	handleClassChange(tags) {
		this.setState({ asset_class: tags });
		this.tags.updateClasses(tags, this.props.dimension.dimension_id, "classes");
	}

	handleSubClassChange(tags) {
		this.setState({ asset_subclass: tags });
		this.tags.updateClasses(tags, this.props.dimension.dimension_id, "subclasses");
	}

	//get the data object array and putting it in one array (so we can use map function)
	componentWillMount() {
		var dataArray = []
		var data = this.props.dimension.dimension_details.data
		//{"descriptor":"jan_history","attribute":"QmTok8Hgi4CCYS3fkxS83XpRjHjfegQZNszU6ekSFFq65s","flag":0}
		Object.keys(data).forEach(key => {
			dataArray.push(data[key].descriptor)
			dataArray.push(data[key].attribute)
			dataArray.push(data[key].flag)
		})
		var arrayOfArrays = []
		for (var i = 0; i < data.length; i++) {
			var element = [dataArray[3 * i + 0], dataArray[3 * i + 1], dataArray[3 * i + 2]] /*, dataArray[4 * i + 3]*/
			arrayOfArrays.push(element)
		}
		this.setState({ dimensionDataArray: arrayOfArrays })
	}

	componentDidMount() {
		$("#assetDetails").modal('show');
		$("#assetDetails").on('hidden.bs.modal', this.props.hideHandler);

		let standardDim = document.getElementById("standardDim");
		let ICA_Dim = document.getElementById("ICA_Dim");

		var prop = this.props.dimension.dimension_details;

		if (prop.propType == 2) {
			standardDim.style.display = 'none';
			ICA_Dim.style.display = 'block';
		}
		else { ICA_Dim.style.display = 'none' }


	}

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

	signICA(e) {
		//e.preventDefault();
		this.state.signICA = true;

		let json = {};
		json.pubKey = localStorage.getItem("pubKey");
		//need transaction ID
		//need bigchain ID (descriptor)
		var dataArray = this.state.dimensionDataArray;
		console.log("dataArray: " + dataArray);
		let txID;

		for (var i = 0; i < dataArray.length; i++) {
			if (String(dataArray[i]).split(",")[1].charAt(0) != "Q") {
				txID = String(dataArray[i]).split(",");
				txID = txID[1]
			}
		}

		//let txID = String(dataArray[0]).split(",");
		console.log("txID: " + txID);
		//txID = txID[1];
		//console.log("now txID: " + txID);

		json.txid = txID;

		var signature = this.getSignature(json);
		var msg_hash = keccak_256(JSON.stringify(json));
		var msg_hash_buffer = new Buffer(msg_hash, "hex");
		json.msg = msg_hash_buffer.toString("hex");
		json.sig = signature;

		console.log("attestICA JSON: " + JSON.stringify(json));

		$.ajax({
			type: "POST",
			url: twinUrl + 'signature/attestIca',
			data: json,
			success: function (result) {
				var data = result;
				if ($.type(result) != "object") {
					console.log("not object")
					//data = JSON.parseJSON(result)
				}
				console.log("repsonse sign ICA: " + JSON.stringify(data))
			}
		})

		//now need to set signICA back to false?
	}


	selectDay(day) {
		console.log("selected day: " + day);
	}


	//**********************************************************************************
	//**********************************************************************************
	showAttrs(e) {
		alert('If you continue, you will spend a token to read entries.')
		e.preventDefault();
		var ele = $(e.target);
		let value = parseInt(ele.attr("data-val"))
		console.log("got value.. " + value)
		var prop = this.props.dimension

		var json = {};
		let dimensionName = prop.dimension_details.dimensionName;
		let ID = "";
		let descriptor = prop.dimension_details.data[value].descriptor;
		console.log("descriptor: " + JSON.stringify(descriptor))

		let owners = prop.dimension_details.owners;
		json.owners = owners;

		let pubKey = keccak_256(localStorage.getItem("pubKey"))
		json.pubKey = pubKey
		json.dimensionName = dimensionName;
		json.dimensionCtrlAddr = prop.dimension_details.dimensionCtrlAddr;
		json.ID = ID;
		json.descriptor = descriptor;

		console.log("JSON: " + JSON.stringify(json))

		var ipfs_url = "http://10.101.114.231:8080/ipfs/";

		let delegations = prop.dimension_details.delegations
		console.log("delegations... " + JSON.stringify(delegations))
		console.log(delegations[0].amount)

		$.ajax({
			type: "POST",
			url: twinUrl + 'dimensions/readEntry',
			data: json,
			success: function (result) {
				var data = result;
				if ($.type(result) != "object") {
					console.log("not object")
					data = JSON.parseJSON(result)
				}

				console.log("repsonse readEntry: " + JSON.stringify(data))
				console.log("data.Result: " + data.Result);
				if (data.Result.charAt(0) == "Q") {
					window.open(ipfs_url + data.Result, '_blank');
				}
				else {
					var bigchainServer = 'http://10.101.114.230:5000'
					var endpoint = '/getTransaction/' + data.Result;
					$.ajax({
						method: 'GET',
						url: bigchainServer + endpoint,
						headers: { 'Access-Control-Allow-Origin': '*' },
						crossDomain: true,
						dataType: 'json',
						contentType: 'application/json',
						cache: false,
						success: function (resp) {
							//the response is body -- send that
							console.log(resp)
							var full_data = resp
							var short_data = resp.asset.data.Coid_Data;
							console.log("short data is..." + short_data.ownershipId)
							console.log(JSON.stringify(full_data))
							console.log(JSON.stringify(short_data))
							var something = window.open("data:text/json," + encodeURIComponent(JSON.stringify(short_data)), "_blank");
							something.focus();
						}//end success
					});//end bigchain ajax
				}//end else
			}
		})

	}


	render() {

		var prop = this.props.dimension

		var hashedKeys = [];
		for (var i = 0; i < this.keys.length; i++) {
			hashedKeys[i] = keccak_256(this.keys[i]);
		}

		for (var x = 0; x < prop.dimension_details.owners.length; x++) {
			var index = hashedKeys.indexOf(prop.dimension_details.owners[x]);
			if (index >= 0) {
				prop.dimension_details.owners[x] = this.names[index];
				console.log("\n\nCHANGED: " + prop.dimension_details.owners[x]);
			}
		}

		console.log("dimension(props): " + JSON.stringify(prop))


		var dataArray = this.state.dimensionDataArray;

		console.log("this.state... \n" + JSON.stringify(this.state))


		var style = {
			fontSize: '12.5px'
		}

		var classInput = {
			addKeys: [13, 188], // Enter and comma
			value: this.state.asset_class,
			onChange: this.handleClassChange,
			inputProps: { placeholder: "" }
		};
		var subClassInput = {
			addKeys: [13, 188], // Enter and comma
			value: this.state.asset_subclass,
			onChange: this.handleSubClassChange.bind(this),
			inputProps: { placeholder: "" }
		};


		var qrStyle = {
			maxWidth: "100%",
			textAlign: "center"
		};

		var syle = {
			marginRight: '15px'
		}

		return (
			<div className="modal fade" id="assetDetails" key={this.props.dimension.dimension_id} tabIndex="-1" role="dialog" aria-labelledby="asset">
				<div className="modal-dialog modal-lg" role="document">
					<div className="modal-content">

						<div className="modal-header">
							<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times; </span></button>
							<ul id="mytabs" className="nav nav-pills" role="tablist">
								<li role="presentation" className="active"><a href="#asset_details" role="tab" data-toggle="tab">Dimension Details</a></li>
								<li role="presentation"><a href="#show_descriptors" role="tab" data-toggle="tab">Descriptors</a></li>
							</ul>
						</div>

						<div className="modal-body">
							<div className="tab-content">

								<div role="tabpanel" className="tab-pane active" id="asset_details">


									<div id="standardDim">
										<table className="table table-striped table-hover" style={style}>
											<tbody>
												<tr>
													<td>Dimension Name</td>
													<td>{prop.dimension_id}</td>
												</tr>
												<tr>
													<td>Dimension Class<p className="text-info">Use comma/enter to add class </p></td>
													<td><TagsInput {...classInput} /></td>
												</tr>
												<tr>
													<td>Dimension SubClass<p className="text-info">Use comma/enter to add sub class </p></td>
													<td><TagsInput {...subClassInput} /></td>
												</tr>
												<tr>
													<td>Dimension Contract address</td>
													<td><p><b> {prop.dimension_details.address} </b></p></td>
												</tr>
											</tbody>
										</table>

									</div>{/*standardDim*/}

									<div id="ICA_Dim">
										<table className="table table-striped table-hover" style={style}>
											<tbody>
												<tr>
													<td>Dimension Name</td>
													<td>{prop.dimension_id}</td>
												</tr>
												<tr>
													<td>Owner List</td>
													<td>{(() => {
														if (!$.isEmptyObject(prop.dimension_details.owners)) {
															return prop.dimension_details.owners.map((ids, i) => {
																return <p key={i}>{ids}</p>
															})
														}
													})(this)}
													</td>
												</tr>
											</tbody>
										</table>
										<button className="btn btn-success" onClick={(e) => this.signICA()}>Sign Identity Claim</button>
									</div>{/*ICA_Dim*/}

									{this.state.signICA ? <DayPicker disabledDays={{ daysOfWeek: [0] }} onDayClick={day => this.selectDay(day)} /> : null}

								</div>

								<div title="tabs" role="tabpanel" className="tab-pane center-block" id="show_descriptors">

									<table className="table table-striped table-hover" style={style}>
										<tbody>
											<tr>
												<td colSpan="2"><b>Descriptors</b></td>
											</tr>
											{(() => {
												if (dataArray.length > 0) {
													return dataArray.map((attrs, i) => {
														//console.log("attrs[0]: " + attrs[0] + ", attrs[1]:" + attrs[1] + ", attrs[2]: " + attrs[2])
														return (
															<tr key={i}>
																<td>{attrs[0]}</td>
																<td><button type="button" className="btn btn-primary btn-sm" data-val={i} onClick={this.showAttrs.bind(this)}>Spend Token</button></td>
															</tr>
														)
													});
												}
												else { return <tr><td colSpan="2">No descriptors found.</td></tr> }
											})(this)}
										</tbody>
									</table>
								</div>{/*tab-panel descriptors*/}

							</div>
						</div>

					</div>
				</div>
			</div>
		);
	}
}

Dims.propTypes = {
	hideHandler: React.PropTypes.func.isRequired // hideHandler method must exists in parent component
};

//**************************************************************************************************************** */

class Assets extends Component {

	constructor(props) {
		super(props);

		this.state = {
			showDetails: false,
			showDetails1: false, //set in dimensionHandler to render delegated data
			wallet: { pubKey: localStorage.getItem("pubKey") },

			own_assets: [],
			owned_dimensions: [],

			controlled_assets: [],
			delegated_assets: [],
			delegated_dims: [],
			active_asset: {},
			show_only: []
		};

		// event handlers must attached with current scope
		this.assetHandler = this.assetHandler.bind(this);
		this.dimensionHandler = this.dimensionHandler.bind(this);
		this.hideHandler = this.hideHandler.bind(this);

		this.hideHandler1 = this.hideHandler1.bind(this);

		this.searchHandler = this.searchHandler.bind(this);
	}

	//*******************************************************************************
	//get all OWNED, CONTROLLED, DELEGATED assets & DELEGATED dimensions
	componentWillMount() {

		let O = [{
			"asset_id": "MYCOID", "asset_details": {
				"Type": "non_cash",
				"assetID": "MyCOID",
				"bigchainHash": "",
				"bigchainID": "",
				"coidAddr": "",
				"controlId": "aae858de3899d2ff096ddb5384365c6a86ce7964f1c4f1f22878944d39bd943a",
				"controlIdList": ["aae858de3899d2ff096ddb5384365c6a86ce7964f1c4f1f22878944d39bd943a"],
				"controlTokenAttributes": "mytoken",
				"controlTokenId": "289d3c526086b3832f4fd1338e5b0f437e7c84d6d7c556f53ef7d2eaf4e316a4",
				"controlTokenQuantity": ["0"],
				"dimensions": "",
				"gatekeeperAddr": "",
				"identityRecoveryIdList": ["aae858de3899d2ff096ddb5384365c6a86ce7964f1c4f1f22878944d39bd943a"],
				"isHuman": "true",
				"msg": "e98cfaa4317c583cd87fb1d538bb64eafea1f516adf02b193fe224d2a60610f6",
				"ownerIdList": ["8b44edd090224a5c2350c1b2f3f57ee2d3443744462bb7c3c970c337e570eac4"],
				"ownershipId": "8b44edd090224a5c2350c1b2f3f57ee2d3443744462bb7c3c970c337e570eac4",
				"ownershipTokenAttributes": "mytoken",
				"ownershipTokenId": "289d3c526086b3832f4fd1338e5b0f437e7c84d6d7c556f53ef7d2eaf4e316a4",
				"ownershipTokenQuantity": ["0"],
				"pubKey": "0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055",
				"recoveryCondition": "2",
				"sig": "4fb1eaab7042e093ed6ca3251af91dca3ec417ef579fe5ea8f079125bd1e6e3c35472aa559fbc6023f2c7c438c1b038b5bc58269b59e3651a65aa3524b22b621",
				"timestamp": "",
				"txn_id": "requestCOID",
				"uniqueId": "01547929f9184f362e1ab0126a15013087f4d1ab25d11ea971e8ffb159546d94",
				"uniqueIdAttributes": ["spencertingley,557d1294ba620922e1655aa9b5c9be5f2c5dad876740dd2a9a22934b79ee164d,QmWbbhSo7GzZi6zyi7MpJyAfiqzPRcSfV1oHFRyCgT54iG"],
				"yesVotesRequiredToPass": "2",
				"dimensions": ["abcd.json", "1234.json"]
			}
		}]

		this.setState({ own_assets: O });

		let ownAssetsDimensionsCount = [];

		//loop thru the owned assets
		// for (var j = 0; j < this.state.own_assets.length; j++) {
		// 	let dim = {};
		// 	ownAssetsDimensionsCount[j] = this.state.own_assets[j].dimensions.length;

		// }


		let dimensions = [{
			"dimensionName": "LIVING_ROOM",
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
				"a016d3445c892d76d9efc222d9598b4bfaf889ef5c5323c5cec67ab20c96c01c",
				"16f121833eee6c25847aa9e63d4aa1b5cc2bf72d0d48f46ad25316b6e9bc5976"
			],
			"delegations": [
				{
					"owner": "COID_OWNER",
					"delegatee": "03683536757fdb821c10810b51caa51a84fc1dfab5c17edbf5246f9713ffe31adf",
					"amount": "2",
					"accessCategories": ""
				}
			],
			"data": [
				{
					"descriptor": "smartTV",
					"attribute": "QmXVFStSMEcoAWPVKLrxJ8wf5ohn2UdmdAxcnfB8TtSAZG",
					"flag": 0
				},
				{
					"descriptor": "family_laptop",
					"attribute": "QmSMWeGPjtgzQ75Y1YXbnC4uByni8bwHcB4vPXrPVcUTUM",
					"flag": 0
				}
			]
		},
		{
			"dimensionName": "FINANCE",
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
				"a016d3445c892d76d9efc222d9598b4bfaf889ef5c5323c5cec67ab20c96c01c",
				"16f121833eee6c25847aa9e63d4aa1b5cc2bf72d0d48f46ad25316b6e9bc5976"
			],
			"delegations": [
				{
					"owner": "COID_OWNER",
					"delegatee": "03683536757fdb821c10810b51caa51a84fc1dfab5c17edbf5246f9713ffe31adf",
					"amount": "2",
					"accessCategories": ""
				}
			],
			"data": [
				{
					"descriptor": "Bank Statement",
					"attribute": "QmXVFStSMEcoAWPVKLrxJ8wf5ohn2UdmdAxcnfB8TtSAZG",
					"flag": 0
				},
				{
					"descriptor": "AMEX Payment history",
					"attribute": "QmSMWeGPjtgzQ75Y1YXbnC4uByni8bwHcB4vPXrPVcUTUM",
					"flag": 0
				}
			]
		}]

		this.setState({ owned_dimensions: dimensions });

		// -> -> -> -> -> -> -> -> -> -> -> -> -> -> ->
		// -> -> -> START get OWNED assets -> -> ->
		// $.ajax({
		//  type: "POST",
		//  url: twinUrl + 'getOwnedAssets',
		//  data: { "pubKey": localStorage.getItem("pubKey") },
		//  success: function (result) {
		//      var data = result;
		//      if ($.type(result) != "object") {
		//          data = JSON.parseJSON(result)
		//      }

		//      //get the array:
		//      data = data.data;

		//      //DEBUGGING:
		//      //console.log("getOwnedAssets result: " + data);
		//      var assetData = []

		//      if (data.length > 0) {

		//          //loop through OWNED assets
		//          for (let i = 0; i < data.length; i++) {
		//              //AJAX each asset:
		//              $.ajax({
		//                  type: "POST",
		//                  url: twinUrl + 'getAsset',
		//                  data: { "pubKey": localStorage.getItem("pubKey"), "flag": 0, "fileName": data[i] },
		//                  success: function (result) {
		//                      var dataResult = result;
		//                      if ($.type(result) != "object") {
		//                          dataResult = JSON.parseJSON(result)
		//                      }

		//                      //***TODO: CHECK THAT THIS ADDS TO THE ARRAY, NOT REPLACE IT
		//                      var theArray = this.state.own_assets;

		//                      //console.log("length is: " + theArray.length)
		//                      //console.log(theArray)
		//                      //TODO: RENAME asset_name TO ASSET DETAILS
		//                      theArray[theArray.length] = {
		//                          asset_id: dataResult.assetID,
		//                          asset_details: dataResult
		//                      }
		//                      this.setState({ own_assets: theArray });

		//                      assetData[assetData.length] = {
		//                          asset_id: dataResult.assetID,
		//                          asset_uniqueId: dataResult.uniqueId,
		//                          asset_dimCtrlAddr: dataResult.dimensionCtrlAddr,
		//                          asset_coidAddr: dataResult.coidAddr,
		//                          asset_gatekeeperAddr: dataResult.gatekeeperAddr,
		//                          asset_owners: dataResult.ownerIdList,
		//                          asset_controllers: dataResult.controlIdList,
		//                          asset_bigchainID: dataResult.bigchainID,
		//                          asset_type: dataResult.propType
		//                      }
		//                      localStorage.setItem("owned_assets", JSON.stringify(assetData))
		//                      //console.log("owned_assets~~: " + JSON.stringify(this.state.own_assets))
		//                  }.bind(this),
		//                  complete: function () { },
		//              })
		//          }//end for
		//      }//end if (data > 0)
		//  }.bind(this)
		// })
		// // <- <- <- END get OWNED assets <- <- <-
		// // <- <- <- <- <- <- <- <- <- <- <- <- <- <- <-
		// // -> -> -> -> -> -> -> -> -> -> -> -> -> -> ->
		// // -> -> -> START get CONTROLLED assets -> -> ->
		// $.ajax({
		//  type: "POST",
		//  url: twinUrl + 'getControlledAssets',
		//  data: { "pubKey": localStorage.getItem("pubKey") },
		//  success: function (result) {
		//      var data = result;
		//      if ($.type(result) != "object") {
		//          data = JSON.parseJSON(result)
		//      }
		//      console.log("got data: " + JSON.stringify(data));

		//      data = data.data;
		//      console.log("Get Controlled Assets result: " + data);
		//      var assetData = []

		//      if (data.length > 0) {
		//          //loop through OWNED assets
		//          for (let i = 0; i < data.length; i++) {
		//              //console.log("i is: " + i + " filename: " + data[i])
		//              //AJAX each asset:
		//              $.ajax({
		//                  type: "POST",
		//                  url: twinUrl + 'getAsset',
		//                  data: { "pubKey": localStorage.getItem("pubKey"), "flag": 1, "fileName": data[i] },
		//                  success: function (result) {
		//                      var dataResult = result;
		//                      if ($.type(result) != "object") {
		//                          dataResult = JSON.parseJSON(result)
		//                      }

		//                      var theArray = this.state.controlled_assets;
		//                      //console.log("length is: " + theArray.length)
		//                      //console.log(JSON.stringify(theArray))

		//                      theArray[theArray.length] = {
		//                          asset_id: dataResult.assetID,
		//                          asset_details: dataResult
		//                      }
		//                      this.setState({ controlled_assets: theArray });
		//                      //this.setState({ controlled_assets: [{ asset_id: dataResult.assetID, asset_details: dataResult }] });

		//                      assetData[assetData.length] = {
		//                          asset_id: dataResult.assetID,
		//                          asset_uniqueId: dataResult.uniqueId,
		//                          asset_dimCtrlAddr: dataResult.dimensionCtrlAddr,
		//                          asset_coidAddr: dataResult.coidAddr,
		//                          asset_gatekeeperAddr: dataResult.gatekeeperAddr,
		//                          asset_owners: dataResult.ownerIdList,
		//                          asset_controllers: dataResult.controlIdList,
		//                          asset_bigchainID: dataResult.bigchainID,
		//                          asset_type: dataResult.propType
		//                      }
		//                      localStorage.setItem("controlled_assets", JSON.stringify(assetData))

		//                  }.bind(this),
		//                  complete: function () { },
		//              })
		//          }//end for
		//      }
		//  }.bind(this)
		// })
		// // <- <- <- END get CONTROLLED assets <- <- <-
		// // <- <- <- <- <- <- <- <- <- <- <- <- <- <- <-
		// // -> -> -> -> -> -> -> -> -> -> -> -> -> -> ->
		// // -> -> -> START get DELEGATED assets -> -> ->
		// $.ajax({
		//  type: "POST",
		//  url: twinUrl + 'getDelegatedAssets',
		//  data: { "pubKey": localStorage.getItem("pubKey") },
		//  success: function (result) {
		//      var data = result;
		//      if ($.type(result) != "object") {
		//          data = JSON.parseJSON(result)
		//      }

		//      data = data.data;
		//      console.log("Get Delegated Assets result: " + data)

		//      if (data.length > 0) {
		//          //loop through OWNED assets
		//          for (let i = 0; i < data.length; i++) {
		//              //AJAX each asset:
		//              $.ajax({
		//                  type: "POST",
		//                  url: twinUrl + 'getAsset',
		//                  data: { "pubKey": localStorage.getItem("pubKey"), "flag": 2, "fileName": data[i] },
		//                  success: function (result) {
		//                      var dataResult = result;
		//                      if ($.type(result) != "object") {
		//                          dataResult = JSON.parseJSON(result)
		//                      }

		//                      //***TODO: CHECK THAT THIS ADDS TO THE ARRAY, NOT REPLACE IT
		//                      var theArray1 = this.state.delegated_assets;

		//                      theArray1[theArray1.length] = {
		//                          asset_id: dataResult.assetID,
		//                          asset_details: dataResult
		//                      }
		//                      this.setState({ delegated_assets: theArray1 });

		//                  }.bind(this),
		//                  complete: function () { },
		//              })
		//          }//end for
		//      }
		//  }.bind(this)
		// })
		// // <- <- <- END get CONTROLLED assets <- <- <-
		// // <- <- <- <- <- <- <- <- <- <- <- <- <- <- <-
		// // -> -> -> -> -> -> -> -> -> -> -> -> -> -> ->
		// // -> -> -> START get DELEGATED dimensions -> -> ->
		// $.ajax({
		//  type: "POST",
		//  url: twinUrl + 'getDelegatedDimensions',
		//  data: { "pubKey": localStorage.getItem("pubKey") },
		//  success: function (result) {
		//      var data = result;
		//      if ($.type(result) != "object") {
		//          data = JSON.parseJSON(result)
		//      }

		//      data = data.data;
		//      console.log("getDelegatedDimensions: " + data);

		//      var PUBKEY = keccak_256(localStorage.getItem("pubKey"));

		//      //var delegatedDims = []

		//      if (data.length > 0) {
		//          //loop through OWNED assets
		//          for (let i = 0; i < data.length; i++) {
		//              console.log("grabbing.. " + data[i])
		//              //AJAX each asset:
		//              $.ajax({
		//                  type: "POST",
		//                  url: twinUrl + 'getDimension',
		//                  data: { "pubKey": PUBKEY, "flag": 2, "fileName": data[i] },
		//                  success: function (result) {
		//                      var dataResult = result;
		//                      if ($.type(result) != "object") {
		//                          console.log("result != object");
		//                          dataResult = JSON.parseJSON(result)
		//                      }

		//                      var delegatedDims = this.state.delegated_dims;

		//                      delegatedDims[delegatedDims.length] = {
		//                          dimension_id: dataResult.dimension.dimensionName,
		//                          dimension_details: dataResult.dimension
		//                      }
		//                      this.setState({ delegated_dims: delegatedDims });

		//                      console.log("dataResult get Dimension: \n " + JSON.stringify(dataResult))
		//                      console.log("dimensionName: " + dataResult.dimension.dimensionName)

		//                  }.bind(this),
		//                  complete: function () { },
		//              })
		//          }//end for
		//      }
		//  }.bind(this)
		// })
		// <- <- <- END get DELEGATED assets <- <- <-
		// <- <- <- <- <- <- <- <- <- <- <- <- <- <- <-

	}



	assetHandler(asset) {
		var assetID = asset.asset_id;
		if (assetID) {
			this.setState({ showDetails: true, active_asset: asset });
		}
	}

	dimensionHandler(dimension) {
		console.log("dimension handler.. " + dimension)
		var dimensionID = dimension.dimension_id
		if (dimensionID) {
			console.log("dimensionID: " + dimensionID)
			this.setState({ showDetails1: true, active_dimension: dimension });
		}
	}

	// Close Asset Details Window
	hideHandler() {
		this.setState({ showDetails: false, active_asset: {} });
	}

	hideHandler1() {
		this.setState({ showDetails1: false, active_dimension: {} });
	}

	searchHandler(e) {
		var str = e.target.value.trim();
		var _this = this;
		setTimeout(function () {
			var data = JSON.parse(localStorage.getItem(_this.state.wallet.pubKey));
			var indexed = [];
			for (var assetID in data) {
				var allTags = data[assetID].classes.concat(data[assetID].subclasses);
				allTags.map((ele) => {
					if (ele.toLowerCase() == str.toLowerCase()) {
						indexed.push(assetID);
					}
				})
			}
			_this.setState({ show_only: indexed });
		}, 350);
		if (!str.length) this.setState({ show_only: [] });
	}

	render() {

		return (
			<div id="assets-container" className="assets">

				<div className="row" id="search-bar">
					<div className="col-md-6">
						<h3 className="margin0px">Manage Assets</h3><hr />
						<p><b>Public Key: </b>{this.state.wallet.pubKey}</p><hr />
					</div>
					<div className="col-md-6">
						<form className="form-inline">
							<div className="form-group pull-right">
								<div className="input-group">
									<input type="text" name="search-assets" id="search-assets" className="form-control" placeholder="Search Assets" onKeyUp={this.searchHandler} />
									<div className="input-group-addon"><span className="glyphicon glyphicon-search"></span></div>
								</div>
							</div>
						</form>
					</div>
				</div><br />

				<div id="own-assets">
					<h4>My Owned Assets</h4><hr />
					<div className="owned-assets">
						<div className="row assets">
							{this.state.own_assets.map((asset, i) => {
								var cssClass = "btn btn-success";
								if (this.state.show_only.length > 0) {
									if (this.state.show_only.toString().indexOf(asset.asset_id.toString()) == -1) {
										cssClass += " hidden";
									} else cssClass.replace("hidden", "");
								}
								return (
									<button type="button" key={i} className={cssClass} onClick={() => this.assetHandler(asset)}>
										<span className="glyphicon glyphicon-ok-circle"></span>
										{asset.asset_id}
									</button>
								);
							})}
						</div>
					</div>
				</div><br />

				<div id="controlled-assets">
					<h4>My Controlled Assets</h4><hr />
					<div className="controlled-assets">
						<div className="row assets">
							{this.state.controlled_assets.map((asset) => {
								var cssClass = "btn btn-info";
								if (this.state.show_only.length > 0) {
									if (this.state.show_only.toString().indexOf(asset.asset_id.toString()) >= 0) {
										cssClass += " show";
									} else cssClass += " hidden";
								}
								return (
									<button type="button" key={asset.asset_id} className={cssClass} onClick={() => this.assetHandler(asset)}>
										<span className="glyphicon glyphicon-link"></span>
										{asset.asset_id}
									</button>
								);
							})}
						</div>
					</div>
				</div><br />

				<div id="delegated-assets">
					<h4>My Delegated Data</h4><hr />
					<div className="delegated-assets">
						<div className="row assets">
							{this.state.delegated_dims.map((dimension, i) => {
								var cssClass = "btn btn-danger";
								if (this.state.show_only.length > 0) {
									if (this.state.show_only.toString().indexOf(dimension.dimension_id.toString()) >= 0) {
										cssClass += " show";
									} else cssClass += " hidden";
								}
								return (
									<button type="button" key={i} className={cssClass} onClick={() => this.dimensionHandler(dimension)}>
										<span className="glyphicon glyphicon-piggy-bank"></span>
										{dimension.dimension_id}
									</button>
								);
							})}
						</div>
					</div>
				</div><br />

				{this.state.showDetails ? <Modal hideHandler={this.hideHandler} asset={this.state.active_asset} dimensions={this.state.owned_dimensions} /> : null}
				{this.state.showDetails1 ? <Dims hideHandler={this.hideHandler1} dimension={this.state.active_dimension} /> : null}
			</div>
		);
	}
}

export default Assets;

// <form action="http://google.com">
// <input type="submit" value="Go to Google" />
// </form>

