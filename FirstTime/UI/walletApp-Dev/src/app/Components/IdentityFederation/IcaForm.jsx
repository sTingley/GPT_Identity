import React from 'react';
import TagsInput from 'react-tagsinput';
import Autosuggest from 'react-autosuggest'
import { keccak_256 } from 'js-sha3';
import UploadIpfsFile from '../UploadIpfsFile.jsx';
import UniqueIDAttributeForm from './UniqueIDAttributeForm.jsx';
//var crypto = require('crypto');
var secp256k1 = require('secp256k1');

class IcaForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            file_attrs: [],

            inputs: ['input-0'], //removed input-1

            official_id: [],

            isHuman: [],

            showModal: false,
            tmpFile: '',
            pubKey: localStorage.getItem("pubKey"),
            privKey: localStorage.getItem("privKey"),

            //gatekeeperAddr: localStorage.getItem("MyGatekeeperAddr"),
            validators: [],
            signature: '',
            assetID: [],

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

            //for populating the owned assets dropdown
            currentAsset: "",
            owned_assets: []

        };

        //for selecting asset to which ICA references
        this.pickerChange = this.pickerChange.bind(this);

        this.maxUniqAttr = 10;
        this.onFieldChange = this.onFieldChange.bind(this);
        this.onFieldChange2 = this.onFieldChange2.bind(this);
        this.handleHideModal = this.handleHideModal.bind(this);
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


    prepareJsonToSubmit() {

        for (var x = 0; x < this.state.validators.length; x++) {
            var index = this.state.names.indexOf(this.state.validators[x]);
            if (index >= 0) {
                this.state.validators[x] = this.state.keys[index];
            }
        }
        this.prepareValidators(this.state.validators)

        var inputObj = {
            "pubKey": this.refs.pubKey.value,
            //"sig": this.refs.signature.value,	
            //"msg": this.refs.message.value,
            "uniqueId": this.createHashAttribute(this.state.file_attrs),
            "uniqueIdAttributes": this.prepareUniqueIdAttrs(),
            "validatorList": this.state.validators,
            "isHuman": false,
            "timestamp": "",
            "assetID": this.state.assetID,
            "propType": 2,
            "bigchainHash": "",
            "bigchainID": "",
            "coidAddr": "",
        };

        return inputObj;
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

    prepareValidators(value) {
        var tempArr = value;
        for (var i = 0; i < tempArr.length; i++) {
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

    onChange(event, { newValue }, id) {
        console.log("onchange");
        var arr = this.state.value;
        console.log("state value:  " + this.state.value)
        arr[Number(id)] = newValue;
        this.setState({ value: arr });
    };



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


            let names = ["Moodys","Steve Smith CFA","Joe Schmo LLC", "AuditBody1"];

            //add back in the that.names
            const suggestions = names.filter((name) => {
            	console.log("FILTER: " + name.toLowerCase().slice(0, inputLength));
            	console.log(inputValue);
            	var re = new RegExp(inputValue, "i");
            	return (Boolean(name.slice(0, inputLength).search(re) + 1))
            	//return (name.toLowerCase().slice(0, inputLength) === inputValue  || name.toUpperCase().slice(0, inputLength) === inputValue)
            })

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
        var inputAttrs4 = {
            addKeys: [13, 188],	// Enter and comma
            inputProps: {
                placeholder: "use ENTER to add values",
                style: { width: '30%' },
                id: "3"
            }
        };

        var style = {
            fontSize: '12.5px'
        }

        var syle2 = {
            marginTop: '26px'
        }

        var marginRight15 = {
            marginRight: '15px'
        }

        return (
            <div id="SubmitContainer">
                <h1>Create Asset Notary Attestation</h1>
                <form method="POST" id="register" role="form">
                    <div className="form-group">
                        <label htmlFor="assetID">Name Your Attestation. For example, 'No delinquent mortgage payments'</label>
                        <TagsInput {...basicAttrs} value={this.state.assetID} onChange={(e) => { this.onFieldChange("assetID", e) }} />
                    </div>
                    <div className="form-group">
                        <h5><b>Select asset to which this claim will reference:</b></h5>
                        <select id="assetSelect" className="selectpicker show-tick" value={this.state.currentAsset} onChange={this.pickerChange}>
                            <option selected value="">--- Please select ---</option>
                            <optgroup label="Owned Assets">
                                <option>Honda Accord</option>
                                {/* {(() => {
                                    if (this.state.owned_assets.length > 0) {
                                        return this.state.owned_assets.map((asset, i) => {
                                            //let val = label.split(',') //get rid of the .json
                                            return <option key={i} value={asset.asset_id}>{asset.asset_id}</option>
                                        })
                                    }
                                    else { return <option>No Owned Assets</option> }
                                })(this)} */}
                            </optgroup>
                        </select>
                    </div>

                    <div className="panel-group" id="accordion_1">
                        <div className="panel panel-default">
                            <div className="panel-heading">
                                <div className="row">
                                    <div className="col-xs-11">
                                        <label>Membership Attributes</label>
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
                                            {this.state.inputs.map(input => <UniqueIDAttributeForm type="ICA" handleShowModal={this.handleShowModal.bind(this)} min={this.state.subform_cont} max="10" key={input} labelref={input} />)}
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
                        <button className="btn btn-primary pull-right" data-loading-text="Submit Identity" name="submit-form" type="button" onClick={this.submitCoid.bind(this)}>Submit</button>
                    </div>
                </form>
                {this.state.showModal ? <UploadIpfsFile pubKey={this.state.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal} /> : null}
            </div>
        )

    }//end render
}

export default IcaForm;
