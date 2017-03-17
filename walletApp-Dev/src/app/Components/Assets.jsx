import React, { Component } from 'react';
import { Link } from 'react-router';
import TagsInput from 'react-tagsinput';
import QRCode from 'qrcode.react';
import AssetTags from './classAndSubClass.js';
//import DimensionCreationForm from './DimensionCreationForm.jsx'
import { Router, Route, IndexRedirect, hashHistory } from 'react-router';

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

	handleDimensionSubmit(e) {
		e.preventDefault();
		//var json = my data

		console.log("handleDimensionSubmit")

		// $.ajax({
		// 	url: twinUrl + 'requestIdentityDimension',
		// 	type: 'POST',
		// 	data: json,
		// 	success: function(res){
		//         console.log(JSON.stringify(json))
		//         var sendMe = {};
		//         sendMe.flag = 0; //owned core identity
		//         sendMe.fileName = "MyCOID.json" //
		//         sendMe.updateFlag = 0; //new identity
		//         //sendMe.data = json;
		//         sendMe.pubKey = localStorage.getItem("pubKey");

		// 		$.ajax({
		// 			url: twinUrl + 'setDimension',
		// 			type: 'POST',
		// 			data: sendMe,
		//             success: function(res)
		//             {
		//                 console.log("response from setDimension: " + res)
		//             }
		// 		})
		// 	},
		// 	complete: function(){
		// 		// do something
		// 	}
		// });

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
											<tr>
												<td>BigchainDB Transaction ID</td>
												<td><p> {prop.bigchainID} </p></td>
											</tr>
											<tr>
												<td>BigchainDB Transaction Hash</td>
												<td><p> {prop.bigchainHash} </p></td>
											</tr>
										</tbody>
									</table>
								</div>

								<div role="tabpanel" className="tab-pane center-block" id="qrcode" style={qrStyle}>
									<QRCode value={qrConfig} size={200} />
								</div>
								{/*
								<div role="tabpanel" className="tab-pane" id="dimension">
									<label className="custom-file">
										<input type="file" id="file" className="custom-file-input"></input>
										<span className="custom-file-control"></span>
									</label>



									<form className="form-horizontal">
										<div className="form-group">
											<label for="inputEmail" className="control-label col-xs-2">Email</label>
											<div className="col-xs-10">
												<input type="email" className="form-control" id="inputEmail" placeholder="Email" />
											</div>
										</div>
										<div className="form-group">
											<label for="inputPassword" className="control-label col-xs-2">Password</label>
											<div className="col-xs-10">
												<input type="password" className="form-control" id="inputPassword" placeholder="Password" />
											</div>
										</div>
										<div className="form-group">
											<div className="col-xs-offset-2 col-xs-10">
												<div className="checkbox">
													<label><input type="checkbox" /> Remember me</label>
												</div>
											</div>
										</div>
										<div className="form-group">
											<div className="col-xs-offset-2 col-xs-10">
												<button type="submit" className="btn btn-primary">Login</button>
											</div>
										</div>
									</form>


								</div>
*/}
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

class Assets extends Component {

	constructor(props) {
		super(props);

		// static values
		this.state = {
			showDetails: false,
			wallet: { pubKey: localStorage.getItem("pubKey") },
			own_assets: [],
			controlled_assets: [{ asset_id: 161718, asset_name: 'Parents House' }, { asset_id: 192021, asset_name: 'My Car' }],
			delegated_assets: [{}],
			active_asset: {},
			show_only: []
		};

		// event handlers must attached with current scope
		this.assetHandler = this.assetHandler.bind(this);
		this.hideHandler = this.hideHandler.bind(this);
		this.searchHandler = this.searchHandler.bind(this);
	}

	componentWillMount() {

		//get all assets, OWNED, CONTROLLED, DELEGATAED:        

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

								//var localStorage_owned = this.state.own_assets

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

								//console.log("assetData " + JSON.stringify(assetData))
								localStorage.setItem("owned_assets", JSON.stringify(assetData))
								console.log("owned_assets~~: " + JSON.stringify(this.state.own_assets))

							}.bind(this),
							complete: function () {

							},
							//console.log(result)	
						})

					}


				}
			}.bind(this),
			complete: function () {
			},
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
								this.setState({ controlled_assets: [{ asset_id: dataResult.assetID, asset_details: dataResult }] });

							}.bind(this),
							complete: function () {
								// do something
							},
							//console.log(result)	
						})

					}
				}
			}.bind(this),
			complete: function () {
				// do something
			},
			//console.log(result)
		})
		// <- <- <- END get CONTROLLED assets <- <- <-
		// <- <- <- <- <- <- <- <- <- <- <- <- <- <- <-



		// -> -> -> -> -> -> -> -> -> -> -> -> -> -> ->
		// -> -> -> START get DELEGATED assets -> -> ->
		$.ajax({
			type: "POST",
			url: twinUrl + 'getDelegatedAssets',
			data: { "pubKey": localStorage.getItem("pubKey") },
			success: function (result) {
				var data = result;
				if ($.type(result) != "object") {
					data = JSON.parseJSON(result)
				}

				//get the array:
				data = data.data;

				//debugging:
				console.log("Get Delegated Assets result: " + data)

				if (data.length > 0) {
					//loop through OWNED assets
					for (let i = 0; i < data.length; i++) {
						//AJAX each asset:
						$.ajax({
							type: "POST",
							url: twinUrl + 'getAsset',
							data: { "pubKey": localStorage.getItem("pubKey"), "flag": 2, "fileName": data[i] },
							success: function (result) {
								var dataResult = result;
								if ($.type(result) != "object") {
									dataResult = JSON.parseJSON(result)
								}

								//***TODO: CHECK THAT THIS ADDS TO THE ARRAY, NOT REPLACE IT
								this.setState({ delegated_assets: [{ asset_id: dataResult.assetID, asset_details: dataResult }] });

							}.bind(this),
							complete: function () {
								// do something
							},
							//console.log(result)	
						})

					}
				}
			}.bind(this),
			complete: function () {
				// do something
			},
			//console.log(result)
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
					<div className="own-assets">
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
				</div><br />

				<div id="delegated-assets">
					<h4>My Delegated Assets</h4><hr />
					<div className="row assets">
						{this.state.delegated_assets.map((asset) => {
							var cssClass = "btn btn-info";
							if (this.state.show_only.length > 0) {
								if (this.state.show_only.toString().indexOf(asset.asset_id.toString()) >= 0) {
									cssClass += " show";
								} else cssClass += " hidden";
							}
							return (
								<button type="button" key={asset.asset_id} className={cssClass} onClick={() => this.assetHandler(asset)}>
									<span className="glyphicon glyphicon-piggy-bank"></span>
									{asset.asset_name}
								</button>
							);
						})}
					</div>
				</div><br />

				{this.state.showDetails ? <Modal hideHandler={this.hideHandler} asset={this.state.active_asset} /> : null}
			</div>
		);
	}
}

export default Assets;

