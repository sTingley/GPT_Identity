import React, { Component } from 'react';
import { Link } from 'react-router';
import TagsInput from 'react-tagsinput';
import QRCode from 'qrcode.react';
import AssetTags from './classAndSubClass.js';
//import DimensionCreationForm from './DimensionCreationForm.jsx'
import { Router, Route, IndexRedirect, hashHistory } from 'react-router';

var Web3 = require('web3')
var web3 = new Web3();

//import wallet from './wallet.js';

var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var keccak_256 = require('js-sha3').keccak_256;

// TODO: Static public/private keys has to be changed

class Modal extends Component {

	constructor(props) {
		super(props);
		this.pubKey = localStorage.getItem("pubKey");
		this.privKey = localStorage.getItem("privKey");
		this.tags = new AssetTags(this.pubKey, props.asset.asset_id);
		this.state = {

			//added for identityDimension tab-pane
			inputs: ['input-0'],

			asset: props.asset || {},
			asset_class: this.tags.getAssetData("classes"),
			asset_subclass: this.tags.getAssetData("subclasses"),
			qrCode_signature: {},

			//used for identitydimension file upload
			docs: {}

		};
		this.handleClassChange = this.handleClassChange.bind(this);;
		this.maxUniqAttr = 10;
	}

	componentDidMount() {
		$("#assetDetails").modal('show');
		$("#assetDetails").on('hidden.bs.modal', this.props.hideHandler);

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

		this.setState({ qrCode_signature: { "msgHash": qrCode_Object_hash, "signature": signature, "timestamp": theTime } })
	}

	handleClassChange(tags) {
		this.setState({ asset_class: tags });
		this.tags.updateClasses(tags, this.props.asset.asset_id, "classes");
	}

	handleSubClassChange(tags) {
		this.setState({ asset_subclass: tags });
		this.tags.updateClasses(tags, this.props.asset.asset_id, "subclasses");
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


	render() {

		var prop = this.props.asset.asset_details;
		var style = {
			fontSize: '12.5px'
		}

		var classInput = {
			addKeys: [13, 188],	// Enter and comma
			value: this.state.asset_class,
			onChange: this.handleClassChange,
			inputProps: { placeholder: "" }
		};
		var subClassInput = {
			addKeys: [13, 188],	// Enter and comma
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

		var qrStyle = {
			maxWidth: "100%",
			textAlign: "center"
		};

		var syle = {
			marginRight: '15px'
		}

		return (
			<div className="modal fade" id="assetDetails" key={this.props.asset.asset_id} tabIndex="-1" role="dialog" aria-labelledby="asset">
				<div className="modal-dialog modal-lg" role="document">
					<div className="modal-content">

						<div className="modal-header">
							<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times; </span></button>
							<ul className="nav nav-pills" role="tablist">
								<li role="presentation" className="active"><a href="#asset_details" role="tab" data-toggle="tab">Asset Details</a></li>
								<li role="presentation"><a href="#qrcode" role="tab" data-toggle="tab">QR Code</a></li>
								{/*<li role="presentation"><a href="#dimension" role="tab" data-toggle="tab">Identity Dimensions</a></li>*/}
							</ul>
						</div>

						<div className="modal-body">
							<div className="tab-content">

								<div role="tabpanel" className="tab-pane active" id="asset_details">
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
											<tr>
												<td>Ownership ID</td>
												<td><p> {prop.ownershipId}</p></td>
											</tr>
											<tr>
												<td>Ownership ID List</td>
												<td>{(() => {
													if (!$.isEmptyObject(prop)) {
														return prop.ownerIdList.map((ids, i) => {
															return <p key={i}> {prop.ownerIdList[i]}</p>
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
												<td>Ownership Token Description</td>
												<td><p>{prop.ownershipTokenAttributes}</p></td>
											</tr>
											<tr>
												<td>Ownership Token Quantity</td>
												<td><p> {prop.ownershipTokenQuantity}</p></td>
											</tr>
											<tr>
												<td>Control ID</td>
												<td><p> {prop.controlId}</p></td>
											</tr>
											<tr>
												<td>Control ID List</td>
												<td>{(() => {
													if (!$.isEmptyObject(prop)) {
														return prop.controlIdList.map((ids, i) => {
															return <p key={i}> {prop.controlIdList[i]}</p>
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
												<td>Control Token Description</td>
												<td><p>{prop.controlTokenAttributes}</p></td>
											</tr>
											<tr>
												<td>Control Token Quantity</td>
												<td><p> {prop.controlTokenQuantity}</p></td>
											</tr>
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
												<td> <p> {prop.recoveryCondition}</p></td>
											</tr>
										</tbody>
									</table>
								</div>

								<div role="tabpanel" className="tab-pane center-block" id="qrcode" style={qrStyle}>
									<QRCode value={qrConfig} size={200} />
								</div>

							</div>
						</div>

					</div>
				</div>
			</div>
		);
	}
}

Modal.propTypes = {
	hideHandler: React.PropTypes.func.isRequired	// hideHandler method must exists in parent component
};

//**************************************************************************************************************** */

class Dims extends Component {

	constructor(props) {
		super(props);
		this.pubKey = localStorage.getItem("pubKey");
		this.privKey = localStorage.getItem("privKey");
		this.tags = new AssetTags(this.pubKey, props.dimension.dimension_id);
		this.state = {

			//added for identityDimension tab-pane
			inputs: ['input-0'],

			dimension: props.dimension || {},
			asset_class: this.tags.getAssetData("classes"),
			asset_subclass: this.tags.getAssetData("subclasses"),

			//used for identitydimension file upload
			docs: {}

		};
		this.handleClassChange = this.handleClassChange.bind(this);;
		this.maxUniqAttr = 10;
	}

	componentDidMount() {
		$("#assetDetails").modal('show');
		$("#assetDetails").on('hidden.bs.modal', this.props.hideHandler);

		var prop = this.props.dimension.dimension_details;
	}

	handleClassChange(tags) {
		this.setState({ asset_class: tags });
		this.tags.updateClasses(tags, this.props.dimension.dimension_id, "classes");
	}

	handleSubClassChange(tags) {
		this.setState({ asset_subclass: tags });
		this.tags.updateClasses(tags, this.props.dimension.dimension_id, "subclasses");
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

	//**********************************************************************************
	//OnClick of showAttrs button
	showAttrs(e) {
		alert('If you continue, you will spend a token to read entries.')
		var _this = this
		e.preventDefault();
		var ele = $(e.target);
		var value = parseInt(ele.attr("data-val"))
		console.log("got value.. " + value)

		var prop = this.props.dimension

		var json = {};
		let dimensionName = prop.dimension_details.dimensionName;
		let ID = "";
		let descriptor = prop.dimension_details.data[0].descriptor;
		console.log("descriptor: " + JSON.stringify(descriptor))

		let pubKey = keccak_256(localStorage.getItem("pubKey"))
		json.pubKey = pubKey
		json.dimensionName = dimensionName;
		json.dimensionCtrlAddr = prop.dimension_details.dimensionCtrlAddr;
		json.ID = ID;
		json.descriptor = descriptor;

		console.log("JSON: " + JSON.stringify(json))

		var attribute 
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
			}
		})
		

		setTimeout(function(){

			$('#mytabs a[href="#show_descriptors"]').tab('show');

		}, 4000)
	}

	render() {

		var prop = this.props.dimension
		console.log("dimension(prop): " + JSON.stringify(prop))

		//console.log("prop.data: "+JSON.stringify(prop.dimension_details.data))

		//console.log("prop.data[0]: "+ JSON.stringify(prop.dimension_details.data[0]))

		var dataArray = []
		var arrayOfArrays = []
		var data = prop.dimension_details.data

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

		//console.log("DataArray: " + dataArray)
		//console.log("arrayOfArrays[0][0]: " + arrayOfArrays[0][0])
		//console.log("arrayOfArrays[1][1]: " + arrayOfArrays[1][1])


		var style = {
			fontSize: '12.5px'
		}

		var classInput = {
			addKeys: [13, 188],	// Enter and comma
			value: this.state.asset_class,
			onChange: this.handleClassChange,
			inputProps: { placeholder: "" }
		};
		var subClassInput = {
			addKeys: [13, 188],	// Enter and comma
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
								<li role="presentation"><a href="#show_descriptors" role="tab" data-toggle="tab"></a></li>
							</ul>
						</div>

						<div className="modal-body">
							<div className="tab-content">

								<div role="tabpanel" className="tab-pane active" id="asset_details">
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
									<div className="modal-footer">
										<button type="button" className="btn btn-primary" data-val="1" onClick={this.showAttrs.bind(this)}>Show Descriptors</button>
									</div>

								</div>

								<div title="tabs" role="tabpanel" className="tab-pane center-block" id="show_descriptors">

									<table className="table table-striped table-hover" style={style}>
										<tbody>
											<tr>
												<td colSpan="2"><b>Descriptors</b></td>
											</tr>
											{(() => {
												var ipfs_url = "http://10.101.114.231:8080/ipfs/";
												if (arrayOfArrays.length > 0) {
													return arrayOfArrays.map((attrs, i) => {
														//console.log("attrs[0]: " + attrs[0] + ", attrs[1]:" + attrs[1] + ", attrs[2]: " + attrs[2] + ", attrs[3]: " + attrs[3])
														if (attrs[1] && attrs[1].charAt(0) == "Q") {
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
	hideHandler: React.PropTypes.func.isRequired	// hideHandler method must exists in parent component
};



class Assets extends Component {

	constructor(props) {
		super(props);

		this.state = {
			showDetails: false,
			showDetails1: false,
			wallet: { pubKey: localStorage.getItem("pubKey") },
			own_assets: [],
			controlled_assets: [{ asset_id: 161718, asset_name: 'Parents House' }, { asset_id: 192021, asset_name: 'My Car' }],
			delegated_assets: [],
			delegated_dims: [],
			active_asset: {},
			show_only: []
		};

		// event handlers must attached with current scope
		this.assetHandler = this.assetHandler.bind(this);
		this.dimensionHandler = this.dimensionHandler.bind(this);
		this.hideHandler = this.hideHandler.bind(this);
		this.searchHandler = this.searchHandler.bind(this);
	}

	//*******************************************************************************
	//get all assets, OWNED, CONTROLLED, DELEGATAED:
	componentWillMount() {
		// -> -> -> -> -> -> -> -> -> -> -> -> -> -> ->
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
				var assetData = []

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

								console.log("length is: " + theArray.length)
								console.log(theArray)
								//TODO: RENAME asset_name TO ASSET DETAILS
								theArray[theArray.length] = {
									asset_id: dataResult.assetID,
									asset_details: dataResult
								}
								this.setState({ own_assets: theArray });

								assetData[assetData.length] = {
									asset_id: dataResult.assetID,
									asset_uniqueId: dataResult.uniqueId,
									asset_dimCtrlAddr: dataResult.dimensionCtrlAddr,
									asset_coidAddr: dataResult.coidAddr,
									asset_gatekeeperAddr: dataResult.gatekeeperAddr,
									asset_owners: dataResult.ownerIdList,
									asset_controllers: dataResult.controlIdList
								}
								localStorage.setItem("owned_assets", JSON.stringify(assetData))
								//console.log("owned_assets~~: " + JSON.stringify(this.state.own_assets))
							}.bind(this),
							complete: function () { },
						})
					}//end for
				}//end if (data > 0)
			}.bind(this)
		})
		// <- <- <- END get OWNED assets <- <- <-
		// <- <- <- <- <- <- <- <- <- <- <- <- <- <- <-
		// -> -> -> -> -> -> -> -> -> -> -> -> -> -> ->
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

				data = data.data;
				console.log("Get Controlled Assets result: " + data);
				var assetData = []

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
								this.setState({ controlled_assets: [{ asset_id: dataResult.assetID, asset_details: dataResult }] });

								// assetData[assetData.length] = {
								// 	asset_id: dataResult.assetID,
								// 	asset_uniqueId: dataResult.uniqueId,
								// 	asset_dimCtrlAddr: dataResult.dimensionCtrlAddr,
								// 	asset_coidAddr: dataResult.coidAddr,
								// 	asset_gatekeeperAddr: dataResult.gatekeeperAddr,
								// 	asset_owners: dataResult.ownerIdList,
								// 	asset_controllers: dataResult.controlIdList
								// }
								// localStorage.setItem("owned_assets", JSON.stringify(assetData))

							}.bind(this),
							complete: function () { },
						})
					}//end for
				}
			}.bind(this)
		})
		// <- <- <- END get CONTROLLED assets <- <- <-
		// <- <- <- <- <- <- <- <- <- <- <- <- <- <- <-
		// -> -> -> -> -> -> -> -> -> -> -> -> -> -> ->
		// -> -> -> START get DELEGATED assets -> -> ->
		// $.ajax({
		// 	type: "POST",
		// 	url: twinUrl + 'getDelegatedAssets',
		// 	data: { "pubKey": localStorage.getItem("pubKey") },
		// 	success: function (result) {
		// 		var data = result;
		// 		if ($.type(result) != "object") {
		// 			data = JSON.parseJSON(result)
		// 		}

		// 		data = data.data;
		// 		console.log("Get Delegated Assets result: " + data)

		// 		if (data.length > 0) {
		// 			//loop through OWNED assets
		// 			for (let i = 0; i < data.length; i++) {
		// 				//AJAX each asset:
		// 				$.ajax({
		// 					type: "POST",
		// 					url: twinUrl + 'getAsset',
		// 					data: { "pubKey": localStorage.getItem("pubKey"), "flag": 2, "fileName": data[i] },
		// 					success: function (result) {
		// 						var dataResult = result;
		// 						if ($.type(result) != "object") {
		// 							dataResult = JSON.parseJSON(result)
		// 						}

		// 						//***TODO: CHECK THAT THIS ADDS TO THE ARRAY, NOT REPLACE IT
		// 						var theArray1 = this.state.delegated_assets;

		// 						theArray1[theArray1.length] = {
		// 							asset_id: dataResult.assetID,
		// 							asset_details: dataResult
		// 						}
		// 						this.setState({ delegated_assets: theArray1 });

		// 					}.bind(this),
		// 					complete: function () { },
		// 				})
		// 			}//end for
		// 		}
		// 	}.bind(this)
		// })
		$.ajax({
			type: "POST",
			url: twinUrl + 'getDelegatedDimensions',
			data: { "pubKey": localStorage.getItem("pubKey") },
			success: function (result) {
				var data = result;
				if ($.type(result) != "object") {
					data = JSON.parseJSON(result)
				}

				data = data.data;
				console.log("getDelegatedDimensions: " + data);

				var PUBKEY = keccak_256(localStorage.getItem("pubKey"));

				//var delegatedDims = []

				if (data.length > 0) {
					//loop through OWNED assets
					for (let i = 0; i < data.length; i++) {
						console.log("grabbing.. " + data[i])
						//AJAX each asset:
						$.ajax({
							type: "POST",
							url: twinUrl + 'getDimension',
							data: { "pubKey": PUBKEY, "flag": 2, "fileName": data[i] },
							success: function (result) {
								var dataResult = result;
								if ($.type(result) != "object") {
									console.log("result != object");
									dataResult = JSON.parseJSON(result)
								}

								var delegatedDims = this.state.delegated_dims;

								delegatedDims[delegatedDims.length] = {
									dimension_id: dataResult.dimension.dimensionName,
									dimension_details: dataResult.dimension
								}
								this.setState({ delegated_dims: delegatedDims });




								//this.setState({ controlled_assets: [{ asset_id: dataResult.assetID, asset_details: dataResult }] });
								console.log("dataResult get Dimension: \n " + JSON.stringify(dataResult))
								console.log("dataResult dimensionName: " + dataResult.dimension.dimensionName)

							}.bind(this),
							complete: function () { },
						})
					}//end for
				}
			}.bind(this)
		})
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
										{asset.asset_name}
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

				{this.state.showDetails ? <Modal hideHandler={this.hideHandler} asset={this.state.active_asset} /> : null}
				{this.state.showDetails1 ? <Dims hideHandler={this.hideHandler} dimension={this.state.active_dimension} /> : null}
			</div>
		);
	}
}

export default Assets;


// <form action="http://google.com">
// <input type="submit" value="Go to Google" />
// </form>
