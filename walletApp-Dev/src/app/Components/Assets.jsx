import React, {Component} from 'react';
import { Link } from 'react-router';
import TagsInput from 'react-tagsinput';


import QRCode from 'qrcode.react';
import AssetTags from './classAndSubClass.js';
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
			asset: props.asset || {},
			asset_class: this.tags.getAssetData("classes"),
			asset_subclass: this.tags.getAssetData("subclasses"),
			qrCode_signature: {}
		};
		this.handleClassChange = this.handleClassChange.bind(this);;
	}

	componentDidMount() {
        $("#assetDetails").modal('show');
        $("#assetDetails").on('hidden.bs.modal', this.props.hideHandler);
		
		var prop = this.props.asset.asset_name;

		var qrCode_Object = JSON.stringify({
			uniqueId: prop.uniqueId,
			name: prop.uniqueIdAttributes[0],
			ownershipId: prop.ownershipId,
			bigchainID: prop.bigchainID,
			bigchainHash: prop.bigchainHash,
			endpoint: twinUrl + "validateQrCode"
		})
		console.log("**" + qrCode_Object)
		
		var qrCode_Object_hash = keccak_256(qrCode_Object);
		console.log(qrCode_Object_hash)
		
		this.privKey = new Buffer(this.privKey,"hex");
		
		var qrCode_Object_hash_buffer = new Buffer(qrCode_Object_hash,"hex");
		//console.log(qrCode_Object_hash_buffer)
		
		 var signature = JSON.stringify(secp256k1.sign(qrCode_Object_hash_buffer, this.privKey));
		 signature = JSON.parse(signature).signature;
		 signature = JSON.stringify(signature);
		 signature = JSON.parse(signature).data;
		 signature = new Buffer(signature,"hex");
		 signature = signature.toString("hex")
		 
		 this.setState({qrCode_signature: {"msgHash": qrCode_Object_hash, "signature":signature}})
		
		console.log("sig" + signature)
		console.log(typeof(signature))



    }

	handleClassChange(tags) {
		this.setState({ asset_class: tags });
		this.tags.updateClasses(tags, this.props.asset.asset_id, "classes");
	}

	handleSubClassChange(tags) {
		this.setState({ asset_subclass: tags });
		this.tags.updateClasses(tags, this.props.asset.asset_id, "subclasses");
	}

	render() {
		
		
		var prop = this.props.asset.asset_name;
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
			endpoint: twinUrl + "validateQrCode"
		});

		var qrStyle = {
			maxWidth: "100%",
			textAlign: "center"
		};

		return (
			<div className="modal fade" id="assetDetails" key={this.props.asset.asset_id} tabIndex="-1" role="dialog" aria-labelledby="asset">
				<div className="modal-dialog modal-lg" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times; </span></button>
							<ul className="nav nav-pills" role="tablist">
								<li role="presentation" className="active"><a href="#asset_details" role="tab" data-toggle="tab">Asset Details</a></li>
								<li role="presentation"><a href="#qrcode" role="tab" data-toggle="tab">QR Code</a></li>
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
												<td><TagsInput {...classInput}  /></td>
											</tr>
											<tr>
												<td>Asset SubClass<p className="text-info">Use comma/enter to add sub class </p></td>
												<td><TagsInput {...subClassInput}  /></td>
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
											})(this) }

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
												})(this) }
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
												})(this) }
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
												})(this) }
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

			//assign local storage.getItem("COID") to own_assets
			//!!!!!!!!!!!!!!!!!!!!!!!!
			//onComponentDidMount call
			own_assets: [{}],
			controlled_assets: [{ asset_id: 161718, asset_name: 'Parents House' }, { asset_id: 192021, asset_name: 'My Car' }],
			active_asset: {},
			show_only: []
		};

		// event handlers must attached with current scope
		this.assetHandler = this.assetHandler.bind(this);
		this.hideHandler = this.hideHandler.bind(this);
		this.searchHandler = this.searchHandler.bind(this);
	}

	componentDidMount() {
		$.ajax({
			type: "POST",
			url: twinUrl + 'pullCoidData',
			data: { "pubKey": localStorage.getItem("pubKey") },
			success: function (result) {
				var data = result;
				if ($.type(result) != "object") {
					data = JSON.parseJSON(result)
				}
				this.setState({ own_assets: [{ asset_id: result.assetID, asset_name: result }] });

			}.bind(this),
			complete: function () {
				// do something
			},
			//console.log(result)	
		})

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
						<h3 className="margin0px">Manage Assets</h3>
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
				</div>
				<div id="my-accounts">
					<h4>My Wallet</h4> <hr/>
					<div className="all-accounts">
						<div className="row accounts">
							<p><b>Public Key: </b>{this.state.wallet.pubKey}</p>
						</div>
					</div>
				</div>
				<div id="own-assets">
					<h4>My Owned Assets</h4> <hr/>
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
									<button type="button" key={i} className={cssClass} onClick={() => this.assetHandler(asset) }>
										<span className="glyphicon glyphicon-ok-circle"></span>
										{asset.asset_id}
									</button>
								);
							}) }
						</div>
					</div>
				</div>
				<div id="controlled-assets">
					<h4>My Controlled Assets</h4> <hr/>
					<div className="row assets">
						{this.state.controlled_assets.map((asset) => {
							var cssClass = "btn btn-info";
							if (this.state.show_only.length > 0) {
								if (this.state.show_only.toString().indexOf(asset.asset_id.toString()) >= 0) {
									cssClass += " show";
								} else cssClass += " hidden";
							}
							return (
								<button type="button" key={asset.asset_id} className={cssClass} onClick={() => this.assetHandler(asset) }>
									<span className="glyphicon glyphicon-link"></span>
									{asset.asset_name}
								</button>
							);
						}) }
					</div>
				</div>
				<div id="qr-code">
					<h4>Qr Code</h4> <hr />
					<div className="row assets">
						<div id="render-qr-code"></div>
					</div>
				</div>
				{this.state.showDetails ? <Modal hideHandler={this.hideHandler} asset={this.state.active_asset} /> : null}
			</div>
		);
	}
}

export default Assets;
