import React from 'react';
import TagsInput from 'react-tagsinput';
import Autosuggest from 'react-autosuggest'
import { keccak_256 } from 'js-sha3';
import UploadIpfsFile from '../UploadIpfsFile.jsx';
import UniqueIDAttributeForm from './UniqueIDAttributeForm.jsx';
//var crypto = require('crypto');
var secp256k1 = require('secp256k1');

class MyGatekeeper extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isICA: false,
			file_attrs: [],
			inputs: ['input-0'], //removed input-1
			inputs_control: ['input1-0'],
			inputs_ownership: ['input1-0'],
			official_id: [],		//first official ID is name (see identity spec v1.3)
			owner_id: [[]],
			control_id: [[]],
			recovery_id: [],
			//recoveryCondition: [],
			isHuman: [],
			owner_token_id: [],
			owner_token_desc: [],
			owner_token_quantity: [[]],
			control_token_id: [],
			control_token_desc: [],
			control_token_quantity: [[]],
			showModal: false,
			tmpFile: '',
			pubKey: localStorage.getItem("pubKey"),
			privKey: localStorage.getItem("privKey"),
			//gatekeeperAddr: localStorage.getItem("MyGatekeeperAddr"),
			validators: [],
			signature: '',
			assetID: [],
			dimensions: '',
			//names: localStorage.getItem("contactNames").split(','),
			//keys: localStorage.getItem("contactPubKeys").split(','),
			value: ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
			suggest_attrs: [{
				addKeys: [13, 188],	// Enter and comma
				inputProps: {
					placeholder: "use ENTER to add values",
					style: { width: '30%' },
					id: "4"
				}
			}],
			suggest_attrs2: [{
				addKeys: [13, 188],	// Enter and comma
				inputProps: {
					placeholder: "use ENTER to add values",
					style: { width: '30%' },
					id: "14"
				}
			}],

			currentAsset: "",
			owned_assets: []


		};

		this.pickerChange = this.pickerChange.bind(this);

		this.maxUniqAttr = 10;
		this.onFieldChange = this.onFieldChange.bind(this);
		this.onFieldChange2 = this.onFieldChange2.bind(this);
		this.handleHideModal = this.handleHideModal.bind(this);
		this.checkboxChange = this.checkboxChange.bind(this);
	}

	//*****************************************************************************
	pickerChange(e) {
		this.setState({ currentAsset: e.target.value });
		console.log('asset change: ' + e.target.value);
	}

	componentWillMount() {
		if (localStorage.getItem("owned_assets")) {

			let own_assets = [];

			let owned = localStorage.getItem("owned_assets");
			owned = JSON.parse(owned);

			for (var i = 0; i < owned.length; i++) {
				own_assets.push(owned[i]);
			}
			this.setState({ owned_assets: own_assets })
		}
	}

	componentDidMount() {
		//TODO********** add fileName.json********put in localstorage!

		let publicKey = localStorage.getItem("pubKey");
		console.log("compDidMountAjax");
		$.ajax({
			type: "POST",
			url: twinUrl + 'getAsset',
			data: { "pubKey": publicKey, "flag": 0, "fileName": "MyCOID.json" },
			success: function (result) {
				var data = result;
				if ($.type(result) != "object") {
					data = JSON.parseJSON(result)
				}
				console.log("gkaddr file: " + result.gatekeeperAddr);
				//var gatekeeperAddr = "gatekeeperAddr_" + publicKey 
				//console.log("gkaddr:  " + gatekeeperAddr)
				localStorage.setItem("gatekeeperAddr", result.gatekeeperAddr)
				//localStorage.setItem("coidAddr", result.coidAddr)
				localStorage.setItem("dimensionCtrlAddr", result.dimensionCtrlAddr)
				console.log("GKAddr: " + localStorage.getItem("gatekeeperAddr"));

			}.bind(this),
			complete: function () {
				//console.log("gkaddr file: "+result);
			},
			//console.log(result)	
		})

	}

	onFieldChange(inputField, e) {
		var multipleValues = {};
		if (inputField == "name" || inputField == "signature" || inputField == "message") {
			this.setState({ [inputField]: e.target.value });
		} else {
			multipleValues[inputField] = e;
			this.setState(multipleValues);
		}
	}

	checkboxChange(event) {
		const target = event.target;
		const value = target.type === 'checkbox' ? target.checked : target.value;
		const name = target.name;
		this.setState({
			[name]: value
		});
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

	//used in token form class for control token distribution list.. is called by appendInputControllers()
	getLabelValuesController() {
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

	//used in token form class for control token distribution list.. is called by appendInputOwners()
	getLabelValuesOwner() {
		var labelVals2 = []
		$.each($("input[name^='label2-']"), function (obj) {
			var value = $.trim($(this).val());
			if (value.length > 0) {
				labelVals2.push({
					//replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
					[$(this).attr('name').replace("label2-", "")]: value
				});
			}
			console.log("obj: " + JSON.stringify(obj))
		});
		return labelVals2;
	}



	prepareJsonToSubmit() {
		console.log();

		for (var x = 0; x < this.state.recovery_id.length; x++) {
			var index = this.state.names.indexOf(this.state.recovery_id[x]);
			if (index >= 0) {
				this.state.recovery_id[x] = this.state.keys[index];
			}
		}
		//make control_id an array of values and remove empty values
		var tempArr3 = this.state.owner_id.toString().split(',');
		var tempArr4 = this.state.owner_token_quantity.toString().split(',');
		for (var x = 0; x < tempArr3.length; x++) {
			if (tempArr3[x] == "") {
				tempArr3.splice(x, 1);
				tempArr4.splice(x, 1);
			}
		}
		//return values to state var and replace names with pubkeys
		this.state.owner_id = tempArr3;
		this.state.owner_token_quantity = tempArr4;
		for (var x = 0; x < this.state.owner_id.length; x++) {
			var index = this.state.names.indexOf(this.state.owner_id[x]);
			if (index >= 0) {
				this.state.owner_id[x] = this.state.keys[index];
				console.log("CHANGED: " + this.state.owner_id[x]);
			}
		}
		//make control_id an array of values and remove empty values
		var tempArr = this.state.control_id.toString().split(',');
		var tempArr2 = this.state.control_token_quantity.toString().split(',');
		for (var x = 0; x < tempArr.length; x++) {
			if (tempArr[x] == "") {
				tempArr.splice(x, 1);
				tempArr2.splice(x, 1);
			}
		}
		//return values to state var and replace names with pubkeys
		this.state.control_id = tempArr;
		this.state.control_token_quantity = tempArr2;
		for (var x = 0; x < this.state.control_id.length; x++) {
			var index = this.state.names.indexOf(this.state.control_id[x]);
			if (index >= 0) {
				this.state.control_id[x] = this.state.keys[index];
			}
		}

		for (var x = 0; x < this.state.validators.length; x++) {
			var index = this.state.names.indexOf(this.state.validators[x]);
			if (index >= 0) {
				this.state.validators[x] = this.state.keys[index];
			}
		}
		console.log("temparr1 :" + tempArr);
		console.log("temparr2 :" + tempArr2)
		console.log("temparr3 :" + tempArr3)
		console.log("temparr4 :" + tempArr4)
		this.prepareControlTokenDistribution();
		this.prepareOwnershipTokenDistrbution();
		this.prepareValidators(this.state.validators)

		var inputObj = {
			"pubKey": this.refs.pubKey.value,
			//"sig": this.refs.signature.value,	
			//"msg": this.refs.message.value,
			//"name": this.refs.nameReg.value,		no longer standalone part of JSON object (it is part of unique attributes)

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
			"validatorList": this.state.validators,

			"delegateeIdList": [""],
			"delegateeTokenQuantity": [""],

			"isHuman": false,
			"timestamp": "",
			"assetID": this.state.assetID,
			"propType": 0,
			"bigchainHash": "",
			"bigchainID": "",
			"coidAddr": "",

		};
		if (this.state.isICA == true) {
			inputObj.propType = 2
			inputObj.ownershipId = keccak_256(inputObj.pubKey).toUpperCase()
			inputObj.ownerIdList = keccak_256(inputObj.pubKey).toUpperCase()
			inputObj.controlId = ""
			inputObj.controlIdList = [""]
			inputObj.ownershipTokenId = ""
			inputObj.ownershipTokenAttributes = [""]
			inputObj.ownershipTokenQuantity = [""]
			inputObj.controlTokenId = ""
			inputObj.controlTokenAttributes = [""]
			inputObj.controlTokenQuantity = [""]
			inputObj.identityRecoveryIdList = [""]
			inputObj.recoveryCondition = ""
			inputObj.yesVotesRequiredToPass = ""
			inputObj.delegateeIdList = [""]
			inputObj.delegateeTokenQuantity = [""]
		}
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
		let newArr = [];
		let labels = this.getLabelValues();

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

		let selected_asset = this.state.currentAsset;
		let bigchainTrxnID;
		if (selected_asset != "") {
			let assetDetails = [];
			console.log("currentAsset: " + selected_asset);
			this.state.owned_assets.forEach(function (asset, index) {
				if (selected_asset == asset.asset_id) {
					bigchainTrxnID = asset.asset_bigchainID
				}
			})
			assetDetails.push("bigchainID");
			assetDetails.push(keccak_256(bigchainTrxnID));
			assetDetails.push(bigchainTrxnID);
			console.log("assetDetails: " + assetDetails);
			newArr.push(assetDetails);
		}


		return newArr;
	}

	prepareControlTokenDistribution() {
		var labels = this.getLabelValuesController();
		for (var i = 0; i < labels.length; i += 2) {
			for (var key in labels[i]) {
				this.state.control_id.push(labels[i][key]);
				this.state.control_token_quantity.push(labels[i + 1][key]);
			}
		}
	}

	prepareOwnershipTokenDistrbution() {
		var labels = this.getLabelValuesOwner();
		for (var i = 0; i < labels.length; i += 2) {
			for (var key in labels[i]) {
				this.state.owner_id.push(labels[i][key]);
				this.state.owner_token_quantity.push(labels[i + 1][key]);
			}
		}
		console.log("owner_ID: " + JSON.stringify(this.state.owner_id))
		console.log("owner_token_quantity: " + JSON.stringify(this.state.owner_token_quantity))
	}

	prepareValidators(value) {
		var tempArr = value;
		for (var i = 0; i < tempArr.length; i++) {
			tempArr[i] = this.getHash(tempArr[i]);
		}
		return tempArr;

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
		json.gatekeeperAddr = localStorage.getItem("gatekeeperAddr")
		//this.setState({signature: signature1})

		let COID_controllers = this.state.control_id
		console.log("coid controllers... " + COID_controllers + "\n length: " + COID_controllers.length);

		console.log("JSON: " + JSON.stringify(json));
		$.ajax({
			url: twinUrl + 'request_new_COID',
			type: 'POST',
			data: json,
			success: function (res) {
				var sendMe = {};
				sendMe.flag = 0; //owned asset
				sendMe.fileName = json.assetID[0] + ".json";
				sendMe.pubKey = keccak_256(localStorage.getItem("pubKey"));
				sendMe.updateFlag = 0;
				sendMe.data = json;

				console.log("sendMe object:  " + JSON.stringify(sendMe))
				$.ajax({
					//****************TODO
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
				sendMe.fileName = json.assetID[0] + ".json";
				sendMe.updateFlag = 0; //new identity
				sendMe.data = json;
				for (let i = 0; i < COID_controllers.length; i++) {
					console.log("setting asset for controller, " + COID_controllers[i])
					sendMe.pubKey = keccak_256(COID_controllers[i])
					$.ajax({
						url: twinUrl + 'setAsset',
						type: 'POST',
						data: sendMe,
						success: function (res) {
							console.log("response from setAsset: " + res)
						}
					})
				}
				// do something
			}.bind(this)
		});
	}

	handleHideModal() {
		this.setState({ showModal: false });
	}

	handleShowModal(e) {
		this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
	}

	//used in uniqueIdAttributeForm
	appendInput() {
		var inputLen = this.state.inputs.length;
		if (inputLen < this.maxUniqAttr) {
			var newInput = `input-${inputLen}`;
			this.setState({ inputs: this.state.inputs.concat([newInput]) });

		}
	}

	appendInputControllers() {
		console.log("input name: " + this.state.inputs_control);
		this.state.control_id.push([]);
		this.state.control_token_quantity.push([]);
		console.log("control id: " + this.state.control_id);
		var inputLen = this.state.inputs_control.length;
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
			this.setState({ inputs_control: this.state.inputs_control.concat([newInput1]) });
		}
	}

	appendInputOwners() {
		console.log("input name: " + this.state.inputs_ownership);
		this.state.owner_id.push([]);
		this.state.owner_token_quantity.push([]);
		console.log("control id: " + this.state.owner_id);
		var inputLen = this.state.inputs_ownership.length;
		console.log("ownerlsit length: " + inputLen)
		if (inputLen < this.maxUniqAttr) {
			var newInput2 = `input1-${inputLen}`;
			var theID = inputLen + 14;
			console.log("theID: " + theID);
			var Attrs = {
				addKeys: [13, 188],	// Enter and comma
				inputProps: {
					placeholder: "use ENTER to add values",
					style: { width: '30%' },
					id: theID.toString()
				}
			};
			this.state.suggest_attrs2.push(Attrs);
			this.setState({ inputs_ownership: this.state.inputs_ownership.concat([newInput2]) });
		}
	}
	onChange(event, { newValue }, id) {
		console.log("onchange");
		var arr = this.state.value;
		console.log("state value:  " + this.state.value)
		arr[Number(id)] = newValue;
		this.setState({ value: arr });
	};


	renderNormalAsset() {

	}

	renderICA() {

	}


	render() {

		$('div.react-autosuggest__container').css("display", "inline");
		var that = this;

		function autocompleteRenderInput({ addTag, props }) {

			var passed = JSON.stringify(arguments[0]);
			console.log("passed: " + passed);
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

			//////////////////////////////////////////////////////////////////////
			var inputValue = that.state.value[Number(passed.id)] || "";
			if (inputValue == 'undefined') { inputValue = ""; }
			var inputLength = inputValue.length || 0

			// const suggestions = that.state.names.filter((name) => {
			// 	console.log("FILTER: " + name.toLowerCase().slice(0, inputLength));
			// 	console.log(inputValue);
			// 	var re = new RegExp(inputValue, "i");
			// 	return (Boolean(name.slice(0, inputLength).search(re) + 1))
			// 	//return (name.toLowerCase().slice(0, inputLength) === inputValue  || name.toUpperCase().slice(0, inputLength) === inputValue)
			// })

			// var value = String(that.state.value[Number(passed.id)]) || "";
			// if (value == 'undefined') { value = ""; }
			// //const suggestions = that.state.suggestions;
			// console.log("passed ID: " + passed.id);
			// console.log("suggestions: " + suggestions);
			// console.log("value: " + value);
			// const inputProps = {
			// 	placeholder: passed.placeholder,
			// 	value,
			// 	style: {
			// 		width: '30%',
			// 		height: '100%',
			// 		display: "initial"
			// 	},
			// 	onChange: handleOnChange,
			// 	onKeyPress: handleKeyPress,
			// 	className: "react-tagsinput-input",
			// 	id: passed.id
			// };
			// return (
			// 	<Autosuggest
			// 		id={passed.id}
			// 		ref={passed.ref}
			// 		suggestions={suggestions}
			// 		shouldRenderSuggestions={(value) => value.length > 0}
			// 		getSuggestionValue={(suggestion) => suggestion}
			// 		renderSuggestion={(suggestion) => <span>{suggestion}</span>}
			// 		inputProps={inputProps}
			// 		onSuggestionSelected={(e, { suggestion, method }) => {
			// 			console.log("SELECTED: " + method)
			// 			if (method == 'click') {
			// 				addTag(suggestion)
			// 				that.state.value[passed.id] = "";
			// 			}
			// 		}}
			// 		onSuggestionsClearRequested={() => { }}
			// 		onSuggestionsFetchRequested={() => { }}
			// 		renderInputComponent={renderInputComponent}
			// 	/>
			// )
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
		var inputAttrs4 = {
			addKeys: [13, 188],	// Enter and comma
			inputProps: {
				placeholder: "use ENTER to add values",
				style: { width: '30%' },
				id: "3"
			}
		};
		var syle = {
			marginRight: '15px'
		}
		var style = {
			fontSize: '12.5px'
		}

		var syle2 = {
			marginTop: '26px'
		}

		var syle = {
			marginRight: '15px'
		}

		console.log("\n\nICA:  " + this.state.isICA);
		if (this.state.isICA == false) {
			return (
				<div id="SubmitContainer">
					<h1>Create Asset or Device Identity</h1>
					<form method="POST" id="register" role="form">
						<div className="form-group">
							<label htmlFor="assetID">Name Your Asset. For example, 'My Diploma'.</label>
							<TagsInput {...basicAttrs} value={this.state.assetID} onChange={(e) => { this.onFieldChange("assetID", e) }} />
						</div>
						<div className="form-group">
							<label>
								Request is an identity claim:
								<input
									value="isICA"
									name="isICA"
									type="checkbox"
									checked={this.state.isICA}
									onChange={this.checkboxChange}
									defaultChecked={false} />
							</label>
						</div>

						<div className="panel-group" id="accordion1">
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
											<div className="form-group">
												<label htmlFor="unique_id">Enter Unique Attributes</label>
												{this.state.inputs.map(input => <UniqueIDAttributeForm type="MyGK" handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
											</div>

											<div className="col-md-offset-4 col-md-6">
												<button type="button" className="btn-sm btn-info pull-right" style={syle} onClick={this.appendInput.bind(this)}>
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
											<label>Ownership</label>
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
												<label htmlFor="owner_dist">Enter Owners and their ownership token(s).</label>
												{this.state.inputs_ownership.map((input, i) =>
													<div className="col-md-10">
														<table className="table table-striped table-hover" style={style}>
															<tbody>
																<tr>
																	<th><b>Owner</b></th>
																	<th><b>Token Quantity</b></th>
																</tr>
																<tr>
																	<td><TagsInput {...this.state.suggest_attrs2[i]} maxTags={1} renderInput={autocompleteRenderInput} className="form-control col-md-4" type="text" value={this.state.owner_id[i]} onChange={(e) => { this.onFieldChange2("owner_id," + i, e) }} />
																	</td>
																	<td><TagsInput {...basicAttrs} maxTags={1} className="form-control col-md-4" type="text" value={this.state.owner_token_quantity[i]} onChange={(e) => { this.onFieldChange2("owner_token_quantity," + i, e) }} /></td>
																</tr>
															</tbody>
														</table>
													</div>
												)}
											</div>
											<div className="col-md-offset-4 col-md-6">
												<button type="button" className="btn-sm btn-info pull-right" style={syle} onClick={this.appendInputOwners.bind(this)}>
													<span className="glyphicon glyphicon-plus"></span>Add More
													</button>
											</div>
											<div className="form-group">
												<label htmlFor="owner_token_id">Enter Owner Token Description. For example, 'Spencer's tokens'.</label>
												<TagsInput {...basicAttrs} value={this.state.owner_token_desc} onChange={(e) => { this.onFieldChange("owner_token_desc", e) }} />
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
											<label>Control</label>
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
												<label htmlFor="control_dist">Enter Controllers and their control token(s).</label>
												{this.state.inputs_control.map((input, i) =>
													<div className="col-md-10">
														<table className="table table-striped table-hover" style={style}>
															<tbody>
																<tr>
																	<th><b>Controller</b></th>
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
											<div className="col-md-offset-4 col-md-6">
												<button type="button" className="btn-sm btn-info pull-right" style={syle} onClick={this.appendInputControllers.bind(this)}>
													<span className="glyphicon glyphicon-plus"></span>Add More
													</button>
											</div>
											<div className="form-group">
												<label htmlFor="control_token_id">Enter Control Token Description. For example, 'Spencer's tokens'.</label>
												<TagsInput {...basicAttrs} value={this.state.control_token_desc} onChange={(e) => { this.onFieldChange("control_token_desc", e) }} />
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
											<label>Recovery</label>
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
												<label htmlFor="recovery_id">Identity Recovery: trusted identities who will attest that your identity has been lost or stolen</label>
												<TagsInput {...inputAttrs2} className="form-control col-md-4" renderInput={autocompleteRenderInput} value={this.state.recovery_id} onChange={(e) => { this.onFieldChange("recovery_id", e) }} />
											</div>
											<div className="form-group">
												<label>Recovery Condition (# of trusted individuals required to initiate your identity recovery)</label>
												<input name="recoveryCondition" className="form-control col-md-4" type="text" placeholder="Recovery Condition" />
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="panel-group" id="accordion5">
							<div className="panel panel-default">
								<div className="panel-heading">
									<div className="row">
										<div className="col-xs-11">
											<label>Attestation</label>
										</div>
										<div className="col-xs-1">
											<a data-toggle="collapse" data-parent="#accordion4" href="#collapse5">
												<span className="glyphicon glyphicon-chevron-down"></span>
											</a>
										</div>
									</div>
								</div>
								<div id="collapse5" className="panel-collapse collapse out">
									<div className="panel-body">
										<div className="row">
											<div className="form-group">
												<label htmlFor="validators">Attestors (individuals who will very the authenticity of this identity/asset)</label>
												<TagsInput {...inputAttrs4} className="form-control col-md-4" maxTags={10} renderInput={autocompleteRenderInput} value={this.state.validators} onChange={(e) => { this.onFieldChange("validators", e) }} />
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="form-group">
							<div className="col-sm-6">
								<br />
								<input className="form-control" ref="signature" type="hidden" value={this.state.signature} />
								<input type="hidden" name="pubkey" ref="pubKey" value={localStorage.getItem("pubKey")} />
								<button className="btn-md btn-primary pull-right" data-loading-text="Submit Identity" name="submit-form" type="button" onClick={this.submitCoid.bind(this)}>Submit Identity</button>
							</div>
						</div>
					</form>
					{this.state.showModal ? <UploadIpfsFile pubKey={this.state.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal} /> : null}
				</div>
			);
		} //end if
		else {
			//this.renderICA();
			return (
				<div id="SubmitContainer">
					<h1>Create Asset or Device Identity</h1>
					<form method="POST" id="register" role="form">
						<div className="form-group">
							<label htmlFor="assetID">Name Your Asset. For example, 'My Diploma'.</label>
							<TagsInput {...basicAttrs} value={this.state.assetID} onChange={(e) => { this.onFieldChange("assetID", e) }} />
						</div>
						<div className="form-group">
							<label>
								Request is an identity claim:
							<input
									value="isICA"
									name="isICA"
									type="checkbox"
									checked={this.state.isICA}
									onChange={this.checkboxChange}
									defaultChecked={true} />
							</label>
						</div>
						<div className="form-group">
							<h5><b>Select asset to which this claim will reference:</b></h5>
							<select id="assetSelect" className="selectpicker show-tick" value={this.state.currentAsset} onChange={this.pickerChange}>
								<option selected value="">--- Please select ---</option>
								<optgroup label="Owned Assets">
									{(() => {
										if (this.state.owned_assets.length > 0) {
											return this.state.owned_assets.map((asset, i) => {
												//let val = label.split(',') //get rid of the .json
												return <option key={i} value={asset.asset_id}>{asset.asset_id}</option>
											})
										}
										else { return <option>No Owned Assets</option> }
									})(this)}
								</optgroup>
							</select>
						</div>


						<div className="panel-group" id="accordion_1">
							<div className="panel panel-default">
								<div className="panel-heading">
									<div className="row">
										<div className="col-xs-11">
											<label>Uniqueness</label>
										</div>
										<div className="col-xs-1">
											<a data-toggle="collapse" data-parent="#accordion" href="#collapse_1">
												<span className="glyphicon glyphicon-chevron-down"></span>
											</a>
										</div>
									</div>
								</div>
								<div id="collapse_1" className="panel-collapse collapse out">
									<div className="panel-body">
										<div className="row">
											<div className="form-group">
												<label htmlFor="unique_id">Enter Unique Attributes</label>
												{this.state.inputs.map(input => <UniqueIDAttributeForm type="MyGK" handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
											</div>

											<div className="col-md-offset-4 col-md-6">
												<button type="button" className="btn-sm btn-info pull-right" style={syle} onClick={this.appendInput.bind(this)}>
													<span className="glyphicon glyphicon-plus"></span>Add More
													</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="panel-group" id="accordion_5">
							<div className="panel panel-default">
								<div className="panel-heading">
									<div className="row">
										<div className="col-xs-11">
											<label>Attestation</label>
										</div>
										<div className="col-xs-1">
											<a data-toggle="collapse" data-parent="#accordion4" href="#collapse_5">
												<span className="glyphicon glyphicon-chevron-down"></span>
											</a>
										</div>
									</div>
								</div>
								<div id="collapse_5" className="panel-collapse collapse out">
									<div className="panel-body">
										<div className="row">
											<div className="form-group">
												<label htmlFor="validators">Attestors (individuals who will very the authenticity of this identity/asset)</label>
												<TagsInput {...inputAttrs4} className="form-control col-md-4" maxTags={10} renderInput={autocompleteRenderInput} value={this.state.validators} onChange={(e) => { this.onFieldChange("validators", e) }} />
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="form-group">
							<input type="hidden" ref="signature" value={this.state.signature} />
							<input type="hidden" name="pubkey" ref="pubKey" value={localStorage.getItem("pubKey")} />
							<button className="btn-med btn-primary pull-right" data-loading-text="Submit Identity" name="submit-form" type="button" onClick={this.submitCoid.bind(this)}>Submit</button>
						</div>
					</form>
					{this.state.showModal ? <UploadIpfsFile pubKey={this.state.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal} /> : null}
				</div>
			)
		}

	}//end render
}
export default MyGatekeeper;
