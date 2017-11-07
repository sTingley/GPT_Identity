import React from 'react';
import DayPicker from "react-day-picker";
//var crypto = require('crypto');
const secp256k1 = require('secp256k1');
const keccak_256 = require('js-sha3').keccak_256;
const style = { fontSize: '12.5px' };

class ModalWin extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			proposal: this.props.dataHandler,
			proposal_data: {},
			selectedDay: new Date() //for signature expiration
		};
	}
	//*****************************************************************************
	//*****************************************************************************
    //takes in a msg/json and returns a signature (needed for requests)
    getSignature(msg) {
        console.log("creating signature, signing msg: \n" + JSON.stringify(msg))
		//get private key from local storage
        var privKey = localStorage.getItem("privKey")
		//make private key hex buffer
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
	//*****************************************************************************
	//*****************************************************************************
	submitHandler(e) {
		e.preventDefault();
		var ele = $(e.target);

		let day = this.state.selectedDay;
		let sigExpire = day.getTime() / 1000;

		//NOTE: signature not yet in JSON object
		var json = {
			"txnDesc": "sampleDesc",
			"publicKey": localStorage.getItem("pubKey"),
			"proposalID": this.state.proposal.proposal_id,
			"vote": parseInt(ele.attr("data-val")),
			"sigExpire": sigExpire
		};

		let signature = this.getSignature(json);
		var msg_hash = keccak_256(JSON.stringify(json));
        var msg_hash_buffer = new Buffer(msg_hash, "hex");
        json.msg = msg_hash_buffer.toString("hex");
		json.signature = signature;

		$.ajax({
			url: twinUrl + 'voteonCOIDproposal',
			type: 'POST',
			data: json,
			success: function (res) {
				if (res.status == "Ok" && res.msg == "true") {
					var proposalID = this.state.proposal.proposal_id;
					$.ajax({
						url: twinUrl + proposalID + "/" + localStorage.getItem("pubKey"),
						type: 'GET',
						complete: function (xhr) {
							//alert("vote successfully submitted");
							window.location.reload();
							_this.setState({
								proposal_data: result
							});
						}
					});

				}
			}
		});
	}
	//*****************************************************************************
	//*****************************************************************************
	componentDidMount() {
		var _this = this;
		//let propType = this.state.proposal.propType;
		//console.log("propType: " + propType);

		// _this.state.proposal.propType = 0;

		let data1 = {
				"Type": "non_cash",
				"assetID": "MyCOID",
				"bigchainHash": "",
				"bigchainID": "",
				"coidAddr": "",
				"controlId": "aae858de3899d2ff096ddb5384365c6a86ce7964f1c4f1f22878944d39bd943a",
				"controlIdList": ["Jen Smith"],
				"controlTokenAttributes": "My Delegated Identity Tokens",
				"controlTokenId": "289d3c526086b3832f4fd1338e5b0f437e7c84d6d7c556f53ef7d2eaf4e316a4",
				"controlTokenQuantity": ["5"],
				"dimensions": "",
				"gatekeeperAddr": "",
				"identityRecoveryIdList": ["Jen Smith", "Joseph Smith"],
				"isHuman": "true",
				"msg": "e98cfaa4317c583cd87fb1d538bb64eafea1f516adf02b193fe224d2a60610f6",
				"ownerIdList": ["Steve Smith"],
				"ownershipId": "8b44edd090224a5c2350c1b2f3f57ee2d3443744462bb7c3c970c337e570eac4",
				"ownershipTokenAttributes": "My Identity Tokens",
				"ownershipTokenId": "289d3c526086b3832f4fd1338e5b0f437e7c84d6d7c556f53ef7d2eaf4e316a4",
				"ownershipTokenQuantity": ["10"],
				"pubKey": "0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055",
				"recoveryCondition": "2",
				"sig": "4fb1eaab7042e093ed6ca3251af91dca3ec417ef579fe5ea8f079125bd1e6e3c35472aa559fbc6023f2c7c438c1b038b5bc58269b59e3651a65aa3524b22b621",
				"timestamp": "",
				"txn_id": "requestCOID",
				"uniqueId": "01547929f9184f362e1ab0126a15013087f4d1ab25d11ea971e8ffb159546d94",

				"uniqueIdAttributes": [["Steve Smith birth cert.", "557d1294ba620922e1655aa9b5c9be5f2c5dad876740dd2a9a22934b79ee164d", "QmWbbhSo7GzZi6zyi7MpJyAfiqzPRcSfV1oHFRyCgT54iG"],
				["passport USA", "557d1294ba620922e1655aa9b5c9be5f2c5dad876740dd2a9a22934b79ee164d", "QmWbbhSo7GzZi6zyi7MpJyAfiqzPRcSfV1oHFRyCgT54iG"]],

				"yesVotesRequiredToPass": "2",
				"dimensions": ["LIVING_ROOM.json", "Finance.json"]
			}

		_this.setState({proposal_data: data1});

		$("#proposalDetails").modal('show');
		$("#proposalDetails").on('hidden.bs.modal', _this.props.hideHandler);

		// $.ajax({
		// 	type: "POST",
		// 	url: twinUrl + 'getCoidData',
			// data: {
			// 	"publicKey": localStorage.getItem("pubKey"),
			// 	"proposalId": this.state.proposal.proposal_id,
			// 	"gatekeeperAddr": this.state.proposal.gatekeeperAddr,
			// 	"isHuman": this.state.proposal.isHuman
			// },//.bind(this)
		// 	success: function (result) {
		// 		var fileValidation = true;
		// 		// Fill up data in Modal window
		// 		//data.publicKey
		// 		if ($.type(result) == "string") {
		// 			result = JSON.parse(result);
		// 		}
		// 		var ownerArray = [];
		// 		for (var i = 0; i < result.ownershipTokenQuantity.length; i++) {
		// 			var temp = [];
		// 			temp[0] = result.ownerIdList[i];
		// 			temp[1] = result.ownershipTokenQuantity[i];
		// 			ownerArray.push(temp)
		// 		}
		// 		result.ownerArray = ownerArray
		// 		//console.log(result.ownerArray)
		// 		console.log('result of getCoidData' + JSON.stringify(result));

		// 		_this.setState({
		// 			proposal_data: result
		// 		});

		// 		$("#proposalDetails").modal('show');
		// 		$("#proposalDetails").on('hidden.bs.modal', _this.props.hideHandler);
		// 	}//end success
		// });
	}

	//*****************************************************************************
	//renders a normal asset/coid proposal
	//*****************************************************************************
	renderStandardAsset(){
		return(
			<tbody>
				<tr>
					<td>Proposal ID</td>
					<td>{this.state.proposal.proposal_id}</td>
				</tr>
				<tr>
					<td colSpan="2"><b>Unique Attributes</b></td>
				</tr>
				{(() => {
					var ipfs_url = "http://10.101.114.231:8080/ipfs/";
					if (!$.isEmptyObject(this.state.proposal_data)) {
						return this.state.proposal_data.uniqueIdAttributes.map((ids, i) => {
							return (
								<tr key={i}>
									<td>{ids[0]}</td>
									<td><p>Validation ID: {ids[2]}</p><p>Data Pointer: <a target="_blank" href={ipfs_url + "/" + ids[1]}>{ids[1]}</a></p></td>
								</tr>
							)
						});
					} else { return <tr><td colSpan="2">No Ids found</td></tr> }
				})(this)}
				<tr>
					<td>Membership Holding ID</td>
					<td>{this.state.proposal_data.ownershipId}</td>
				</tr>
				<tr>
					<td>Membership Holding ID List</td>
					<td>
						{(() => {
							if (!$.isEmptyObject(this.state.proposal_data)) {
								return this.state.proposal_data.ownerIdList.map((ids, i) => {
									return <p key={i}> {this.state.proposal_data.ownerIdList[i]}</p>
								})
							}
							else {
								return <p>No Ids found</p>
							}
						})(this)}
					</td>
				</tr>
				<tr>
					<td>Membership Holding Token ID</td>
					<td><p> {this.state.proposal_data.ownershipTokenId}</p></td>
				</tr>
				<tr>
					<td>Membership Holding Token Description</td>
					<td><p>{this.state.proposal_data.ownershipTokenAttributes}</p></td>
				</tr>
				<tr>
					<td>Membership Holding Token Quantity</td>
					<td><p> {this.state.proposal_data.ownershipTokenQuantity}</p></td>
				</tr>
				<tr>
					<td>Delegation ID</td>
					<td><p> {this.state.proposal_data.controlId}</p></td>
				</tr>
				<tr>
					<td>Delegation ID List</td>
					<td>{(() => {
						if (!$.isEmptyObject(this.state.proposal_data)) {
							return this.state.proposal_data.controlIdList.map((ids, i) => {
								return <p key={i}> {this.state.proposal_data.controlIdList[i]}</p>
							})
						}
					})(this)}
					</td>
				</tr>
				<tr>
					<td>Delegation Token ID</td>
					<td> <p> {this.state.proposal_data.controlTokenId}</p></td>
				</tr>
				<tr>
					<td>Delegation Token Description</td>
					<td><p>{this.state.proposal_data.controlTokenAttributes}</p></td>
				</tr>
				<tr>
					<td>Delegation Token Quantity</td>
					<td><p> {this.state.proposal_data.controlTokenQuantity}</p></td>
				</tr>
				<tr>
					<td>Trusted ID List</td>
					<td>{(() => {
						if (!$.isEmptyObject(this.state.proposal_data)) {
							return this.state.proposal_data.identityRecoveryIdList.map((ids, i) => {
								return <p key={i}> {this.state.proposal_data.identityRecoveryIdList[i]}</p>
							})
						}
					})(this)}
					</td>
				</tr>
				<tr>
					<td>Recovery Condition</td>
					<td> <p> {this.state.proposal_data.recoveryCondition}</p></td>
				</tr>
				<tr>
					<td>Vote Description</td>
					<td><textarea className="form-control"></textarea></td>
				</tr>
			</tbody>
		)
	}
	//*****************************************************************************
	//renders an ICA proposal which gives ability to set an expiration
	//*****************************************************************************
	renderICA(){
		return(
			<tbody>
				<tr>
					<td>Proposal ID</td>
					<td>{this.state.proposal.proposal_id}</td>
				</tr>
				<tr>
					<td colSpan="2"><b>Official IDs</b></td>
				</tr>
				{(() => {
					var ipfs_url = "http://10.101.114.231:8080/ipfs/";
					if (!$.isEmptyObject(this.state.proposal_data)) {
						return this.state.proposal_data.uniqueIdAttributes.map((ids, i) => {
							return (
								<tr key={i}>
									<td>{ids[0]}</td>
									<td><p>Validation ID: {ids[2]}</p><p>Data Pointer: <a target="_blank" href={ipfs_url + "/" + ids[1]}>{ids[1]}</a></p></td>
								</tr>
							)
						});
					} else { return <tr><td colSpan="2">No Ids found</td></tr> }
				})(this)}
				<tr>
					<td>Signature Expiration:</td>
					<td>
						<DayPicker
							disabledDays={{ daysOfWeek: [0] }}
							onDayClick={day => this.state.selectedDay = day}
						/>
					</td>
				</tr>
			</tbody>
		)
	}
	//*****************************************************************************
	//*****************************************************************************
	render() {
		let _this = this;

		return (
			<div className="modal fade" id="proposalDetails" tabIndex="-1" role="dialog">

				<div className="modal-dialog modal-lg" role="document">
					<div className="modal-content">

						<div className="modal-header">
							<button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
							<h4 className="modal-title" id="asset">Membership Proposal Details</h4>
						</div>

						<div className="modal-body">
							<table className="table table-striped table-hover" style={style}>
								{this.state.proposal.propType == 0 ? this.renderStandardAsset() : null}
								{this.state.proposal.propType == 2 ? this.renderICA() : null}
							</table>
						</div>

						<div className="modal-footer">
							<button type="button" className="btn btn-primary" data-val="2" onClick={this.submitHandler.bind(this)}>Yes</button>
							<button type="button" className="btn btn-default" data-val="1" onClick={this.submitHandler.bind(this)}>No</button>
						</div>
					</div>
				</div>
			</div>
		)
	}
};


class ToVote extends React.Component {
	constructor(props) {
		super(props);
		//coid=proposals
		this.state = {
			coid: [], //array of messages from DT
			showDetails: false,
			activeProposal: {}
		};
		this.showHandler = this.showHandler.bind(this);
	}

	getDateFormat(timestamp) {
		var d = new Date(timestamp);
		return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
	}

	componentDidMount() {

		console.log("hash of empty: " + keccak_256(""));
		console.log("hash of spencer: " + keccak_256("spencer"));

		$.ajax({
			url: twinUrl + "/notification/readProposals/" + keccak_256(localStorage.getItem("pubKey")).toUpperCase(),
			dataType: 'json',
			cache: false,
			success: function (result) {
				console.log("result: " + JSON.stringify((result)));
				if (typeof (result) != "object") {
					var data = JSON.parse(result);
				} else {
					var data = result;
					var test = JSON.parse((result.data));
					test = JSON.parse(JSON.stringify(test.messages));
					console.log(test[0].type);
				}
				this.setState({ coid: test });
				console.log("result: " + JSON.stringify((result.data)));
			}.bind(this)
		});
		let coidData = {"data":"{\"id\":\"252B21496C1BB4BD63A26751A09350ABA052B8185A713C6C7FFA8B01DC2B8F1A\",\"messages\":[{\"type\":\"proposal\",\"proposal_id\":\"E6D67871E5D8C63FEE0C756D3BDB979AE3F3585ECAB4B106E274C399B4660F65\",\"message\":\"You have been selected to vote on the proposal.\",\"read_status\":false,\"time\":1508145049990,\"gatekeeperAddr\":\"0000000000000000000000000000000000000000\",\"isHuman\":true,\"propType\":\"0\"},{\"type\":\"proposal\",\"proposal_id\":\"EF904896BED7C07BD3E42163415FD64A8E46C3415DAC0302218E6978C688251E\",\"message\":\"You have been selected to vote on the proposal.\",\"read_status\":false,\"time\":1508143256055,\"gatekeeperAddr\":\"0000000000000000000000000000000000000000\",\"isHuman\":true,\"propType\":\"0\"},{\"type\":\"proposal\",\"proposal_id\":\"D263CCFE3D47B87FA7B2E383F0834D7DD0FDC9FC92ECF361399B1CC3E63BB18E\",\"message\":\"You have been selected to vote on the proposal.\",\"read_status\":false,\"time\":1508137339494,\"gatekeeperAddr\":\"0000000000000000000000000000000000000000\",\"isHuman\":true,\"propType\":\"0\"},{\"type\":\"proposal\",\"proposal_id\":\"B4A24A37903F1F79B57B82F170925CF9D409F774111B947982C1C2447DAE2D1B\",\"message\":\"You have been selected to vote on the proposal.\",\"read_status\":false,\"time\":1508136875822,\"gatekeeperAddr\":\"0000000000000000000000000000000000000000\",\"isHuman\":true,\"propType\":\"0\"},{\"type\":\"proposal\",\"proposal_id\":\"3B08D0AE54888B07DF2BDAD9846153AFCFF2E1E515D8FD41DD083D14EA566879\",\"message\":\"You have been selected to vote on the proposal.\",\"read_status\":false,\"time\":1508135783055,\"gatekeeperAddr\":\"0000000000000000000000000000000000000000\",\"isHuman\":true,\"propType\":\"0\"},{\"type\":\"proposal\",\"proposal_id\":\"D7D6F5CF0E7B6E633D0AC31E1539B62CD7530FF6BF6E36DB8A2191406C74FB7E\",\"message\":\"You have been selected to vote on the proposal.\",\"read_status\":false,\"time\":1508134006740,\"gatekeeperAddr\":\"0000000000000000000000000000000000000000\",\"isHuman\":true,\"propType\":\"0\"},{\"type\":\"proposal\",\"proposal_id\":\"B83BA4A36711D35F65572437E347998F95870C5618018A14FDDFF5891A959A22\",\"message\":\"You have been selected to vote on the proposal.\",\"read_status\":false,\"time\":1508126411714,\"gatekeeperAddr\":\"0000000000000000000000000000000000000000\",\"isHuman\":true,\"propType\":\"0\"},{\"type\":\"proposal\",\"proposal_id\":\"EF6F5DB37441A379B302BA5D9CEA3D9271AD5B21F5AECE3F04D8CC86AC7A4F17\",\"message\":\"You have been selected to vote on the proposal.\",\"read_status\":false,\"time\":1507785222153,\"gatekeeperAddr\":\"0000000000000000000000000000000000000000\",\"isHuman\":true,\"propType\":\"0\"}]}"}
		let test = JSON.parse(coidData.data);
		test = JSON.parse(JSON.stringify(test.messages));
		this.setState({coid: test});
	}

	hideHandler() {
		this.setState({ showDetails: false });
	}

	//assigns entire COID to activeProposal, 
	dataHandler(index) {
		return this.state.coid[index];
	}

	showHandler(e) {
		e.preventDefault();
		this.setState({
			showDetails: true,
			activeProposal: this.dataHandler($(e.target).attr('data-index'))
		});
	}

	render() {

		let names = ["Membership request, Steve Smith",
		"Attestation request, James Rodriguez has 0 delinquent mortgage payments",
		"Membership request, Emily Lou","Membership request, Shane Gield",
		"Attestion request, Steve Smith has valid Chase bank acct",
		"Attestation request, Joe Schmo has a credit score of 780 as of Oct 1, 2017",
		"Membership request, James Rodriguez' car loan has been closed",
		"Membership request, Shane Gield has a credit score of 600",
		"Attestation request, Shane Gield opened a loan with BAC Florida on Jul 6, 2011"]

		console.log("STATE: " + JSON.stringify(this.state));
		var _that = this;
		return (
			<div id="vote_container">
				<h1>Notary Requests Pending for Your Action</h1> <hr />
				<table className="table table-striped">
					<tbody>
						{(() => {
							if ($.isArray(this.state.coid) && this.state.coid.length > 0) {
								return this.state.coid.map(function (el, i) {
									return (
										<tr key={i}>
											<td>
												<div><b>Proposal ID: </b>{el.proposal_id}</div>
												<div><b>Published On: </b>{_that.getDateFormat(el.time)}</div>
												<div><b>Description: </b>{names[i]}</div>
											</td>
											<td className="pull-right">
												<button type="button" title="View proposal to vote" data-item={el} data-index={i} onClick={_that.showHandler} className="btn btn-primary">View</button>
											</td>
										</tr>
									);
								});
							} else { return (<tr><td><p>No data to act upon !</p></td></tr>); }
						})(this)}
					</tbody>
				</table>
				{this.state.showDetails ? <ModalWin hideHandler={this.hideHandler.bind(this)} dataHandler={this.state.activeProposal} /> : null}
			</div>
		)
	}
};
export default ToVote;
