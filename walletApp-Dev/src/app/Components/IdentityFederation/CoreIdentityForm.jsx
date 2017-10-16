import React from 'react';
import TagsInput from 'react-tagsinput';
import Autosuggest from 'react-autosuggest'
import { keccak_256 } from 'js-sha3';
import UploadIpfsFile from '../UploadIpfsFile.jsx';
import UniqueIDAttributeForm from './UniqueIDAttributeForm.jsx'

//var crypto = require('crypto');
var secp256k1 = require('secp256k1');
var _this;

class CoreIdentity extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			file_attrs: [],
			inputs: ['input-0'], //removed input-1
			inputs_name: ['input1-0'],
			official_id: [],		//first official ID is name (see identity spec v1.3)
			owner_id: [],
			control_id: [[]],
			recovery_id: [],
			//recoveryCondition: [],
			isHuman: [],
			owner_token_id: [],
			owner_token_desc: [],
			owner_token_quantity: [],
			control_token_id: [],
			control_token_desc: [],
			control_token_quantity: [[]],
			showModal: false,
			tmpFile: '',
			pubKey: localStorage.getItem("pubKey"),
			privKey: localStorage.getItem("privKey"),
			signature: '',
			//names: localStorage.getItem("contactNames").split(','),
			//keys: localStorage.getItem("contactPubKeys").split(','),
			value: ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
			suggest_attrs: [{
				addKeys: [13, 188],	// Enter and comma
				inputProps: {
					placeholder: "use ENTER to add values",
					style: { width: '30%' },
					id: "3"
				}
			}]
		};
		_this = this;
		this.maxUniqAttr = 10;
		this.onFieldChange = this.onFieldChange.bind(this);
		this.onFieldChange2 = this.onFieldChange2.bind(this);
		this.handleHideModal = this.handleHideModal.bind(this);
	}

	onFieldChange(inputField, e) {
		var multipleValues = {};
		//var pieces = inputField.split(",");
		//var index = pieces[1];
		//var variable = pieces[0];
		//console.log("input field: "+variable+"   index: "+index);
		if (inputField == "name" || inputField == "signature" || inputField == "message") {
			this.setState({ [inputField]: e.target.value });
		} else {
			multipleValues[inputField] = e;
			//this.state[variable][Number(index)] = e;
			//console.log("field value :"+variable[Number(index)]);
			this.setState(multipleValues);

		}
	}

	onFieldChange2(inputField, e) {
		var multipleValues = {};
		var pieces = inputField.split(",");
		var index = pieces[1];
		var variable = pieces[0];
		console.log("input field: " + variable + "   index: " + index);
		console.log("field value :" + this.state[variable][index]);
		this.state[variable][Number(index)] = e;
		console.log("field value :" + variable[Number(index)]);
		multipleValues[variable] = this.state[variable];
		this.setState(multipleValues);
		console.log("state value :" + this.state[variable]);
	}

	getHash(input) {
		var input = $.trim(input);
		if (input) {
			var hash = keccak_256(input)
			return hash;
		}
		return input;
	}

	getFileDetails(filedata) {
		var obj = { [this.state.tmpFile]: filedata };
		this.setState({ file_attrs: this.state.file_attrs.concat([obj]) });
	}

	//used for uniqueID attributes
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

	//used in token form class for control token distribution list.. is called by appendInput2()
	getLabelValues1() {
		var labelVals1 = []
		$.each($("input[name^='label1-']"), function (obj) {
			var value = $.trim($(this).val());
			if (value.length > 0) {
				labelVals1.push({
					//replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
					[$(this).attr('name').replace("label1-", "")]: value
				});
			}
			console.log("obj: " + JSON.stringify(obj))
		});
		return labelVals1;
	}


	//TODO:
	//1)NEED TO DISTINGUISH COID for person or thing---DONE
	//2)CONTROLLERS need to be able to upload documents---LATER

	prepareJsonToSubmit() {

		console.log("inside prepareJSONToSubmit..");
		this.prepareControlTokenDistribution();

		console.log("before we call createHashAttribute on this.state.file_attrs..\n" + JSON.stringify(this.state.file_attrs));
		console.log("we will call createHashAttribute, to get uniqueId: " + this.createHashAttribute(this.state.file_attrs));

		//replace any values that are not pubkeys, if they are in your contacts list
		// for (var x = 0; x < this.state.recovery_id.length; x++) {
		// 	var index = this.state.names.indexOf(this.state.recovery_id[x]);
		// 	if (index >= 0) {
		// 		this.state.recovery_id[x] = this.state.keys[index];
		// 	}
		// }
		// for (var x = 0; x < this.state.owner_id.length; x++) {
		// 	var index = this.state.names.indexOf(this.state.owner_id[x]);
		// 	if (index >= 0) {
		// 		this.state.owner_id[x] = this.state.keys[index];
		// 		console.log("CHANGED: " + this.state.owner_id[x]);
		// 	}
		// }
		// var tempArr = this.state.control_id.toString().split(',');
		// var tempArr2 = this.state.control_token_quantity.toString().split(',');
		// for (var x = 0; x < tempArr.length; x++) {
		// 	if (tempArr[x] == "") {
		// 		tempArr.splice(x, 1);
		// 		tempArr2.splice(x, 1);
		// 	}
		// }
		// this.state.control_id = tempArr;
		// this.state.control_token_quantity = tempArr2;

		// console.log("tempArr: " + tempArr);
		// for (var x = 0; x < this.state.control_id.length; x++) {
		// 	var index = this.state.names.indexOf(this.state.control_id[x]);
		// 	if (index >= 0) {
		// 		this.state.control_id[x] = this.state.keys[index];
		// 	}
		// }
		var inputObj = {
			"pubKey": this.refs.pubKey.value,
			//"sig": this.refs.signature.value,
			//"msg": this.refs.message.value,

			"uniqueId": this.createHashAttribute(this.state.file_attrs),
			"uniqueIdAttributes": this.prepareUniqueIdAttrs(),

			"ownershipId": this.createHashAttribute(this.state.owner_id),	//calculated from ownerIDlist
			"ownerIdList": this.valueIntoHash(this.state.owner_id),
			"controlId": this.createHashAttribute(this.state.control_id),
			"controlIdList": this.valueIntoHash(this.state.control_id),

			//calculated. should be one time hashing of ownershipTokenAttributes and ownership token quantity
			"ownershipTokenId": this.getHash(this.joinValuesOwnership()),

			"ownershipTokenAttributes": this.state.owner_token_desc,
			"ownershipTokenQuantity": this.state.owner_token_quantity,

			//calculated. should be one time hashing of controlTokenAttributes and control token quantity
			"controlTokenId": this.getHash(this.joinValuesControl()),

			"controlTokenAttributes": this.state.control_token_desc,
			"controlTokenQuantity": this.state.control_token_quantity,

			//pubkeys used for recovery in the event COID is lost or stolen			
			"identityRecoveryIdList": this.valueIntoHash(this.state.recovery_id),
			"recoveryCondition": $("input[name^='recoveryCondition']").val(),
			"yesVotesRequiredToPass": 2,	//needs to be taken out and hardcoded in app

			"isHuman": true,
			"timestamp": "",
			"assetID": "MyCOID",
			"propType": 0,
			"bigchainHash": "",
			"bigchainID": "",
			"coidAddr": "",
			"gatekeeperAddr": "",
			"dimensions": ""

		};
		console.log("uniqueIDAttrs after prepare f'n: " + inputObj.uniqueIdAttributes)
		return inputObj;
	}

	joinValuesOwnership() {
		var value1 = this.state.owner_token_desc;
		var value2 = this.state.owner_token_quantity;
		var tempArr = [];
		tempArr.push(value1);
		tempArr.push(value2);
		tempArr = tempArr.join();
		return tempArr;
	}

	joinValuesControl() {
		var value1 = this.state.control_token_desc;
		var value2 = this.state.control_token_quantity;
		var tempArr = [];
		tempArr.push(value1);
		tempArr.push(value2);
		tempArr = tempArr.join();
		return tempArr;
	}

	createHashAttribute(values) {
		if ($.isArray(values) && values.length > 0) {
			if ($.isPlainObject(values[0])) {
				var str = "";
				for (var i = 0; i < values.length; i++) {
					for (var key in values[i]) {
						var hash, filehash;
						[hash, filehash] = values[i][key].split("|");
						if ((values.length - 1) == i)
							str += hash;
						else
							str += hash + "|";
					}
				}
				return this.getHash(str);

				//if only one value in 'values'
			} else {
				var valStr = values.join("|");
				return this.getHash(valStr);
			}

		}
		return '';
	}

	//hashes arrays (no delimiter)
	valueIntoHash(values) {
		var newArr = [];
		var _this = this;
		if ($.isArray(values)) {
			values.map((value) => {
				newArr.push(_this.getHash(value));
			});
		};
		return newArr;
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

	prepareControlTokenDistribution() {
		var labels = this.getLabelValues1();
		for (var i = 0; i < labels.length; i += 2) {
			for (var key in labels[i]) {
				this.state.control_id.push(labels[i][key]);
				this.state.control_token_quantity.push(labels[i + 1][key]);
			}
		}
	}

	//hashing the pubkeys
	prepareTokenDistribution(value) {
		var tempArr = value;
		for (var i = 0; i < tempArr.length; i += 2) {
			tempArr[i] = this.getHash(tempArr[i]);
		}
		return tempArr;
	}

	submitCoid(e) {
		e.preventDefault();
		var json = this.prepareJsonToSubmit();
		var privKey1 = new Buffer(this.state.privKey, "hex");
		var msg_hash = keccak_256(JSON.stringify(json));
		var msg_hash_buffer = new Buffer(msg_hash, "hex");
		var signature1 = JSON.stringify(secp256k1.sign(msg_hash_buffer, privKey1))

		signature1 = JSON.parse(signature1).signature;
		signature1 = JSON.stringify(signature1);
		signature1 = JSON.parse(signature1).data;
		signature1 = new Buffer(signature1, "hex");
		signature1 = signature1.toString("hex");

		console.log("sig" + signature1)
		console.log(typeof (signature1))

		json.sig = signature1;
		json.msg = msg_hash_buffer.toString("hex");

		let COID_controllers = this.state.control_id
		console.log("coid controllers... " + COID_controllers + "\n length: " + COID_controllers.length)

		console.log("requestCOID json: " + JSON.stringify(json))
		$.ajax({
			url: twinUrl + 'requestCOID',
			type: 'POST',
			data: json,
			success: function (res) {
				console.log(JSON.stringify(json))
				var sendMe = {};
				sendMe.flag = 0; //owned core identity
				sendMe.fileName = "MyCOID.json"
				sendMe.pubKey = keccak_256(localStorage.getItem("pubKey")).toUpperCase();
				sendMe.updateFlag = 0; //new identity
				sendMe.data = json;

				$.ajax({
					url: twinUrl + 'setAsset',
					type: 'POST',
					data: sendMe,
					success: function (res) {
						console.log("response from setAsset: " + res)
					}.bind(this)
				})
			}.bind(this),
			complete: function () {
				var sendMe = {};
				sendMe.flag = 1; //controlled core identity
				sendMe.fileName = "MyCOID.json" //
				sendMe.updateFlag = 0; //new identity
				sendMe.data = json;
				for (let i = 0; i < COID_controllers.length; i++) {
					console.log("setting asset for controller, " + COID_controllers[i])
					sendMe.pubKey = keccak_256(COID_controllers[i]).toUpperCase()
					$.ajax({
						url: twinUrl + 'setAsset',
						type: 'POST',
						data: sendMe,
						success: function (res) {
							console.log("response from setAsset: " + res)
						}
					})
				}
			}.bind(this)
		});
	}

	handleHideModal() {
		this.setState({ showModal: false });
	}

	handleShowModal(e) {
		this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
	}

	appendInput() {
		var inputLen = this.state.inputs.length;
		if (inputLen < this.maxUniqAttr) {
			var newInput = `input-${inputLen}`;
			this.setState({ inputs: this.state.inputs.concat([newInput]) });
		}
	}

	//used in tokendistrubtionform
	appendInput2() {
		console.log("input name: " + this.state.inputs_name);
		this.state.control_id.push([]);
		this.state.control_token_quantity.push([]);
		console.log("control id: " + this.state.control_id);
		var inputLen = this.state.inputs_name.length;
		if (inputLen < this.maxUniqAttr) {
			var newInput1 = `input1-${inputLen}`;
			var theID = inputLen + 4;
			console.log("theID: " + theID);
			var Attrs = {
				addKeys: [13, 188],	// Enter and comma
				inputProps: {
					placeholder: "use ENTER to add values",
					style: { width: '30%' },
					id: theID.toString()
				}
			};
			this.state.suggest_attrs.push(Attrs);
			this.setState({ inputs_name: this.state.inputs_name.concat([newInput1]) });
		}
	}

	onChange(event, { newValue }, id) {
		console.log("onchange");
		var arr = this.state.value;
		console.log("state value:  " + this.state.value)
		arr[Number(id)] = newValue;
		this.setState({ value: arr });
	};

	componentDidMount() {

	}

	render() {
		$('div.react-autosuggest__container').css("display", "inline");
		var that = this;

		function autocompleteRenderInput({ addTag, props }) {

				var passed = JSON.stringify(arguments[0]);
				console.log("passed: " + passed + JSON.stringify(arguments[1]));
				passed = JSON.parse(passed);

				const handleOnChange = (e, { newValue, method }) => {
					console.log("handleonchange params: " + e + "   " + newValue + "   " + method + "   " + passed.id);
					if (method === 'enter' || method === 'click') {
						that.state.value[passed.id] = "";
						e.preventDefault()
					} else {
						that.onChange(e, { newValue }, passed.id)
					}
				}
				const handleKeyPress = (event) => {
					console.log('enter press here! ' + event.key)
					if (event.key == 'Enter') {
						event.preventDefault()
						addTag(that.state.value[passed.id])
						that.state.value[passed.id] = "";
						console.log('current tags: ' + that.state.tags)
					}
				}

				const renderInputComponent = inputProps => (
					<input {...inputProps} />
				);
				var inputValue = that.state.value[Number(passed.id)] || "";
				if (inputValue == 'undefined') { inputValue = ""; }
				var inputLength = inputValue.length || 0

				let names = ["Moodys","Steve Smith CFA","Joe Schmo LLC", "AuditBody1", "Emily Lu", "Josh Phillips", "Aaron Bartwell"];

				//NEED TO COMMENT BACK IN 'that.state.names' ...
				const suggestions = names.filter((name) => {
					console.log("FILTER: " + name.toLowerCase().slice(0, inputLength));
					return name.toLowerCase().slice(0, inputLength) === inputValue
				})
				///////////////////////////////////////



				var value = String(that.state.value[Number(passed.id)]) || "";
				if (value == 'undefined') { value = ""; }
				//const suggestions = that.state.suggestions;
				console.log("passed ID: " + passed.id);
				console.log("suggestions: " + suggestions);
				console.log("value: " + value);
				const inputProps = {
					placeholder: passed.placeholder,
					value,
					style: {
						width: '30%',
						height: '100%',
						display: "initial"
					},
					onChange: handleOnChange,
					onKeyPress: handleKeyPress,
					className: "react-tagsinput-input",
					id: passed.id
				};
				return (
					<Autosuggest
						id={passed.id}
						ref={passed.ref}
						suggestions={suggestions}
						shouldRenderSuggestions={(value) => value.length > 0}
						getSuggestionValue={(suggestion) => suggestion}
						renderSuggestion={(suggestion) => <span>{suggestion}</span>}
						inputProps={inputProps}
						onSuggestionSelected={(e, { suggestion, method }) => {
							console.log("SELECTED: " + method)
							if (method == 'click') {
								addTag(suggestion)
								that.state.value[passed.id] = "";
							}
						}}
						onSuggestionsClearRequested={() => { }}
						onSuggestionsFetchRequested={() => { }}
						renderInputComponent={renderInputComponent}
					/>
				)
		}




		var basicAttrs = {
			addKeys: [13, 188],	// Enter and comma
			inputProps: {
				placeholder: "use ENTER to add values",
				style: { width: '30%' }
			}
		};
		var inputAttrs = {
			addKeys: [13, 188],	// Enter and comma
			inputProps: {
				placeholder: "use ENTER to add values",
				style: { width: '30%' },
				id: "0"
			}
		};
		var inputAttrs2 = {
			addKeys: [13, 188],	// Enter and comma
			inputProps: {
				placeholder: "use ENTER to add values",
				style: { width: '30%' },
				id: "1"
			}
		};
		var inputAttrs3 = {
			addKeys: [13, 188],	// Enter and comma
			inputProps: {
				placeholder: "use ENTER to add values",
				style: { width: '30%' },
				id: "2"
			}
		};
		var marginRight15 = {
			marginRight: '15px'
		}
		var style = {
			fontSize: '12.5px'
		}

		return (
			<div id="SubmitContainer">
				<h1>Membership Application</h1><hr/>
				<form method="POST" id="register" role="form">

					<div className="panel-group" id="accordion1">
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
									<div className="row">
										<div className="form-group">
											<label htmlFor="unique_id">Enter Unique Attributes. The first Attribute has to be name (first, last). Then add any official identification such as SSN or national ID number(s). Make sure to add the supporting file(s) through "Upload File".</label>
											{this.state.inputs.map(input => <UniqueIDAttributeForm type="IDF" handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
										</div>
										<div className="form-group">
											<button type="button" className="btn-sm btn-info pull-right" style={marginRight15} onClick={this.appendInput.bind(this)}>
												<span className="glyphicon glyphicon-plus"></span>Add More
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="panel-group" id="accordion2">
						<div className="panel panel-default">
							<div className="panel-heading">
								<div className="row">
									<div className="col-xs-11">
										<label>Membership Holding</label>
									</div>
									<div className="col-xs-1">
										<a data-toggle="collapse" data-parent="#accordion2" href="#collapse2">
											<span className="glyphicon glyphicon-chevron-down"></span>
										</a>
									</div>
								</div>
							</div>
							<div id="collapse2" className="panel-collapse collapse out">
								<div className="panel-body">
									<div className="row">
										<div className="form-group">
											<label htmlFor="owner_id">Enter yourself as Membership Holder.</label>
											<TagsInput {...inputAttrs} maxTags={1} renderInput={autocompleteRenderInput} value={this.state.owner_id} onChange={(e) => { this.onFieldChange("owner_id", e) }} />
										</div>
										<div className="form-group">
											<label htmlFor="owner_token_id">Membership Holding Description. For example, 'My Identity Ownership Tokens'.</label>
											<TagsInput {...basicAttrs} maxTags={1} value={this.state.owner_token_desc} onChange={(e) => { this.onFieldChange("owner_token_desc", e) }} />
										</div>
										<div className="form-group">
											<label htmlFor="owner_token_id">Enter Token Quantity</label>
											<TagsInput {...basicAttrs} maxTags={1} value={this.state.owner_token_quantity} onChange={(e) => { this.onFieldChange("owner_token_quantity", e) }} />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="panel-group" id="accordion3">
						<div className="panel panel-default">
							<div className="panel-heading">
								<div className="row">
									<div className="col-xs-11" div>
										<label>Membership Delegation</label>
									</div>
									<div className="col-xs-1">
										<a data-toggle="collapse" data-parent="#accordion3" href="#collapse3">
											<span className="glyphicon glyphicon-chevron-down"></span>
										</a>
									</div>
								</div>
							</div>
							<div id="collapse3" className="panel-collapse collapse out">
								<div className="panel-body">
									<div className="row">
										<div className="form-group">
											<label htmlFor="control_dist">Enter Delegatee Token Holders</label>
											{this.state.inputs_name.map((input, i) =>
												<div className="col-md-10">
													<table className="table table-striped table-hover" style={style}>
														<tbody>
															<tr>
																<th><b>Delegatee</b></th>
																<th><b>Token Quantity</b></th>
															</tr>
															<tr>
																<td><TagsInput {...this.state.suggest_attrs[i]} maxTags={1} renderInput={autocompleteRenderInput} className="form-control col-md-4" type="text" value={this.state.control_id[i]} onChange={(e) => { this.onFieldChange2("control_id," + i, e) }} />
																</td>
																<td><TagsInput {...basicAttrs} maxTags={1} className="form-control col-md-4" type="text" value={this.state.control_token_quantity[i]} onChange={(e) => { this.onFieldChange2("control_token_quantity," + i, e) }} /></td>
															</tr>
														</tbody>
													</table>
												</div>
											)}
										</div>
										<div className="form-group col-md-offset-4 col-md-6">
											<button type="button" className="btn-sm btn-info pull-right" style={marginRight15} onClick={this.appendInput2.bind(this)}>
												<span className="glyphicon glyphicon-plus"></span>Add More
											</button>
										</div>
										<div className="form-group">
											<label htmlFor="control_token_id">Enter Delegation Token Description. For example, 'My digital identity access tokens'.</label>
											<TagsInput {...basicAttrs} maxTags={1} value={this.state.control_token_desc} onChange={(e) => { this.onFieldChange("control_token_desc", e) }} />
										</div>

									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="panel-group" id="accordion4">
						<div className="panel panel-default">
							<div className="panel-heading">
								<div className="row">
									<div className="col-xs-11">
										<label>Theft or Loss Recovery</label>
									</div>
									<div className="col-xs-1">
										<a data-toggle="collapse" data-parent="#accordion4" href="#collapse4">
											<span className="glyphicon glyphicon-chevron-down"></span>
										</a>
									</div>
								</div>
							</div>
							<div id="collapse4" className="panel-collapse collapse out">
								<div className="panel-body">
									<div className="row">
										<div className="form-group">
											<label>Trusted identities who will attest that your identity has been lost or stolen</label>
											<TagsInput {...inputAttrs2} renderInput={autocompleteRenderInput} value={this.state.recovery_id} onChange={(e) => { this.onFieldChange("recovery_id", e) }} />
										</div>
										<div className="form-group">
											<label>Recovery Condition (# of trusted individuals required to initiate your identity recovery)</label>
											<input name="recoveryCondition" className="form-control col-md-4" type="text" placeholder="Label" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="form-group">
						<br />
						<input className="form-control" ref="signature" type="hidden" value={this.state.signature} />
						<input type="hidden" name="pubkey" ref="pubKey" value={localStorage.getItem("pubKey")} />
						<button className="btn-md btn-primary" data-loading-text="Submit Identity" name="submit-form" type="button" onClick={this.submitCoid.bind(this)}>Submit</button>
					</div>
				</form>
				{this.state.showModal ? <UploadIpfsFile pubKey={this.state.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal} /> : null}
			</div>
		);
	}
}
export default CoreIdentity;
