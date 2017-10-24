import React, { Component } from 'react';
import TagsInput from 'react-tagsinput';
import UploadIpfsFile from '../UploadIpfsFile.jsx';
import DimensionAttributeForm from './DimensionAttributeForm.jsx';
import DimensionDelegationForm from './DimensionDelegationForm.jsx';
import Autosuggest from 'react-autosuggest';

const secp256k1 = require('secp256k1');
const keccak_256 = require('js-sha3').keccak_256;
const pubKey = localStorage.getItem("pubKey");

/*
CLASSES:
    DimensionForm: (rendered when we click an owned or controlled dimension)
    ^^^^^ NUKED THIS BUT SAVED IN FRESCO

    IdentityDimensions: PARENT CLASS
*/


class IdentityDimensions extends Component {

    constructor(props) {
        super(props);
        this.state = {

            pubKey: localStorage.getItem("pubKey"),

            //Dimensions pulled from DT
            iDimensions: [],
            ctrlDimensions: [],
            //prop dataHandler passes activeDimension to DimensionForm
            activeDimension: {},

            //inputs array is pushed when addimg DimensionAttributeForm instances
            inputs: ['input-0'],
            //as we add more Dimension attributes, we end up shifting tmpFile and inputs
            //tmp file always holds current input label, ex: 'input-0'
            tmpFile: '',
            //file_attrs will look like: [ {input-0: IPFS_hash0}, {input-1: IPFS_hash1} ]
            file_attrs: [],

            //delegations array is pushed if 'addMore' is clicked
            delegations: ['input1-0'],
            deleValue: [[]],
            deleToken: [[]],
            suggest_attrs: [{
                addKeys: [13, 188], // Enter and comma
                inputProps: {
                    placeholder: "use ENTER to add values",
                    style: { width: '30%' },
                    id: "1"
                }
            }],

            //names: localStorage.getItem("contactNames").split(','),
            //keys: localStorage.getItem("contactPubKeys").split(','),
            value: ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],

            //******************************************************FOR SUGGESTIONS */

            //contains actual asset data from DT
            control_assets: [],
            controlled_assets_label: [],
            own_assets: [],
            owned_assets_label: [],

            showModal: false,

            showDetails: false,
            currentAsset: "",

            ownedDimension: false, //passed as prop when we render DimensionForm component

            //Controllers for dimension (not necessarily COID controllers)
            inputs_controllers: ['inputCtrl-0'], //dimension controllers and their tokens
            controllers_pubkeys: [],
            controllers_tokens: [],

            control_list: []

        };

        this.hideHandler = this.hideHandler.bind(this);
        this.showDimensionHandler = this.showDimensionHandler.bind(this);

        this.handleHideModal = this.handleHideModal.bind(this); //ipfs

        this.onFieldChange = this.onFieldChange.bind(this);
        this.onFieldChange2 = this.onFieldChange2.bind(this);
        this.pickerChange = this.pickerChange.bind(this);

    }
    //*****************************************************************************
    //watch for inputs on control_list
    onFieldChange(inputField, e) {
        var multipleValues = {};
        multipleValues[inputField] = e;
        this.setState(multipleValues);
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
    //*****************************************************************************
    pickerChange(e) {
        this.setState({ currentAsset: e.target.value });
        console.log('asset change: ' + e.target.value);
    }
    //*****************************************************************************
    hideHandler() {
        this.setState({ showDetails: false, activeDimension: {} });
    }
    //*****************************************************************************
    //used to show activeDimension, is fired onClick
    showDimensionHandler(dim, ownOrCtrl) { //0 is own, 1 is control

        if (ownOrCtrl == 0) {
            console.log("OWNED!!!!!!!!!!!!!!!")
            this.setState({ ownedDimension: true })
        }
        let dimension = dim.dimension_details
        if (dimension) {
            this.setState({ showDetails: true, activeDimension: dimension })
            //console.log("this.state.showDetails: " + this.state.showDetails);
        }
    }
    //*****************************************************************************
    //used to set activeDimension inside showDimensionHandler
    //When we render a DimensionForm, dataHandler={this.state.activeDimension}
    dataHandler(index) {
        return this.state.iDimensions[index];
    }
    //*****************************************************************************
    /*if this.state.showModal is true UploadIpfsFile component is rendered,
        and passed the prop dataHandler={this.getFileDetails.bind(this)}*/
    getFileDetails(filedata) {
        console.log("IdentityDimensions inside getFileDeatils....\n")
        console.log("tmpFile: " + this.state.tmpFile + " \n file_attrs: " + this.state.file_attrs);
        var obj = { [this.state.tmpFile]: filedata };
        this.setState({ file_attrs: this.state.file_attrs.concat([obj]) });
    }
    //*****************************************************************************
    //Passed as a prop to DimensionAttributeForm
    handleShowModal(e) {
        this.setState({ showModal: true, tmpFile: $(e.target).attr('data-id') });
    }
    //is passed to UploadIpfsFile so it knows when to close the modal window
    //method also exists in DimensionForm
    handleHideModal() {
        this.setState({ showModal: false });
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
    //*****************************************************************************
    // Get DT Dimension Data. Call this in componentWillMount
    getDimensions() {

        $.ajax({
            type: "POST",
            url: twinUrl + 'getOwnedDimensions',
            data: { "pubKey": localStorage.getItem("pubKey") },
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }

                data = data.data;
                console.log("getOwnedDimensions: " + data);

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
                            data: { "pubKey": PUBKEY, "flag": 0, "fileName": data[i] },
                            success: function (result) {
                                var dataResult = result;
                                if ($.type(result) != "object") {
                                    console.log("result != object");
                                    dataResult = JSON.parseJSON(result)
                                }

                                var ownedDims = this.state.iDimensions

                                ownedDims[ownedDims.length] = {
                                    //dimension_id: dataResult.dimension.dimensionName,
                                    dimension_details: dataResult.dimension
                                }
                                this.setState({ iDimensions: ownedDims });

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

        $.ajax({
            type: "POST",
            url: twinUrl + 'getControlledDimensions',
            data: { "pubKey": localStorage.getItem("pubKey") },
            success: function (result) {
                var data = result;
                if ($.type(result) != "object") {
                    data = JSON.parseJSON(result)
                }

                data = data.data;
                console.log("getControlledDimensions: " + data);

                var PUBKEY = keccak_256(localStorage.getItem("pubKey"));

                if (data.length > 0) {
                    for (let i = 0; i < data.length; i++) {
                        console.log("grabbing.. " + data[i])
                        //AJAX each asset:
                        $.ajax({
                            type: "POST",
                            url: twinUrl + 'getDimension',
                            data: { "pubKey": PUBKEY, "flag": 1, "fileName": data[i] },
                            success: function (result) {
                                var dataResult = result;
                                if ($.type(result) != "object") {
                                    console.log("result != object");
                                    dataResult = JSON.parseJSON(result)
                                }

                                var ctrlDims = this.state.ctrlDimensions

                                ctrlDims[ctrlDims.length] = {
                                    //dimension_id: dataResult.dimension.dimensionName,
                                    dimension_details: dataResult.dimension
                                }
                                this.setState({ ctrlDimensions: ctrlDims });

                            }.bind(this),
                            complete: function () { },
                        })
                    }//end for
                }
            }.bind(this)
        })


    }//end getDimensions

    componentWillMount() {

        this.getDimensions();
        //****************************************************** */

        if (localStorage.getItem("owned_assets")) {
            let owned_labels = []
            let own_assets = []

            let owned = localStorage.getItem("owned_assets")
            owned = JSON.parse(owned)

            //for loop is preparing arrays to set state vars 'own_assets' and 'owned_assets_label'
            for (var i = 0; i < owned.length; i++) {
                owned_labels.push(owned[i].asset_id)
                own_assets[own_assets.length] = owned[i]
            }
            this.setState({ own_assets: own_assets, owned_assets_label: owned_labels })
        }

        if (localStorage.getItem("controlled_assets")) {
            console.log("WE HAVE CONTROLLED ASSETS!!!!!")
            let controlled_labels = []//set this.state.controlled_assets_label
            let control_assets = []

            let controlled = localStorage.getItem("controlled_assets")
            controlled = JSON.parse(controlled)
            console.log("controlled... " + JSON.stringify(controlled))

            for (var i = 0; i < controlled.length; i++) {
                controlled_labels.push(controlled[i].asset_id)
                control_assets[control_assets.length] = controlled[i]
            }
            this.setState({ control_assets: control_assets, controlled_assets_label: controlled_labels })
        }



    }//componentWillMount
    /*****************************************************************************
    /*****************************************************************************
     * IN ORDER TO ADD DIMENSION ATTRIBUTES, we have these functions
     * 1) define getLabelValues
     * 2) call getLabelValues inside prepareAttributes (where we group descriptors and attributes)
     * (use appendAttribute to make sure max limit isnt hit) ????
    *****************************************************************************/
    //used for DimensionAttributeForm to prepare attributes
    getLabelValues() {
        var labelVals = []
        var _this = this;
        //in DimensionForm
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
    /*file_attrs looks like: [{key: "IPFS_hash | shaHash}]
        [{"input-0":"QmPcY8sJ8hSfWhzqX8iLzQEbgiESjqTaeEEoJUrZwhLNk5|9bb7e24956771c4f1bbfe5eceff9e9e1457fafa5d3af3a56f4d7cef0bdd509dc"},
        {"input-1":"QmUJGfdKUCFiL2cKE3dcVFL5Q6PsvcWJSPxff5snJ46tuk|28a6ce8b3c55a60f5923cb87e5fd1c47decb973d1973f047f722141460fdad71"},]*/
    prepareAttributes(selectedAsset, bigchainTrxnID) {
        console.log("selectedAsset: " + selectedAsset)
        console.log("bigchainID: " + bigchainTrxnID)
        let attrs = [];
        let labels = this.getLabelValues();
        //labelVals: [{"input-0":"mydocument"},{"input-1":"seconddocument"}]
        for (var i = 0; i < labels.length; i++) {
            var tmpArr = [];
            for (var key in labels[i]) {
                tmpArr.push(labels[i][key]);
                let ipfsHash = this.state.file_attrs[i][key].split("|");
                ipfsHash = ipfsHash[0]; //not sending sha3 hash
                tmpArr.push(ipfsHash);
            }
            attrs.push(tmpArr);
        }


        let descrPrivacy = [];

        $.each($("select[name^='privacy-']"), function (obj) {
            console.log("we got into the select name")
            var value = $.trim($(this).val());
            console.log("Value: " + value);
            if (value.length > 0) {
                descrPrivacy.push(value);
            }
        });

        console.log("privacy Array: " + descrPrivacy);

        var objArray = [];
        for (var i = 0; i < attrs.length; i++) {
            let obj = {}
            obj.descriptor = attrs[i][0]
            //console.log("obj.descriptor: " + obj.descriptor + ", type: " + typeof(obj.descriptor))
            obj.attribute = attrs[i][1]
            obj.flag = 0
            objArray.push(obj)
            console.log("objArray: " + JSON.stringify(objArray))
        }

        let passBigchainObj = document.getElementById("passBigchainID");
        if (passBigchainObj.selectedIndex == 0) {
            alert('select one answer');
        }
        //NOTE: WE ARE HARD CODING THIS TO 1 so we will pass the Bigchain object
        //for the asset !!!!!!!!!!!!!!!!!
        //if (passBigchainObj.selectedIndex == 1) {
            let objKYC = {};
            objKYC.descriptor = "bigchainID";
            objKYC.attribute = bigchainTrxnID;
            objKYC.flag = 0;
            objArray.push(objKYC);
        //}

        //needed to stringify this obj Array for backend
        return JSON.stringify(objArray)
    }
    //*****************************************************************************
    //when we click Add More, a new value is pushed into this.state.inputs,
    //and a new DimensionAttributeForm is rendered
    appendAttribute() {
        var inputLen = this.state.inputs.length;
        if (inputLen < 10) {
            var newInput = `input-${inputLen}`;
            this.setState({ inputs: this.state.inputs.concat([newInput]) });
            //inputs: input-0
        }
    }
    /*****************************************************************************
    /*****************************************************************************
     * SAME PROCESS TO ADD DELEGATIONS
     * 1) define getDelegationInputValues
     * 2) getDelegationInputValues inside prepareDelegationDistribution
    *****************************************************************************/
    getDelegationInputValues() {
        var labelVals = []
        var _this = this;
        //in DimensionForm
        $.each($("input[name^='delegatee-']"), function (obj) {
            var value = $.trim($(this).val());
            if (value.length > 0) {
                labelVals.push({
                    //replace the 'label' with the entered unique attribute descriptor, for example 'Name' or 'US SSN'
                    [$(this).attr('name').replace("label-", "")]: value
                });
            }
        });
        return labelVals;
        //returns an object array: [{"delegatee-input1-0":"pubkey"},{"delegatee-input1-0":"2"}
    }
    //*****************************************************************************
    //prepare the delegations object array
    prepareDelegationDistribution(dimension, owners) {
        var dimensionName = dimension
        let owner = owners
        console.log("got owners for delegations: " + owner)

        console.log("preparedelegation dimensionName: " + dimensionName)
        var labels = this.getDelegationInputValues();
        let delegatee = []
        let delegatee_token_quantity = []
        for (var i = 0; i < labels.length; i += 2) {
            for (var key in labels[i]) {
                delegatee.push(labels[i][key]);
                delegatee_token_quantity.push(labels[i + 1][key]);
            }
        }

        let expirationArray = [];
        //grab the expirations from localStorage
        for (var j = 0; j < this.state.delegations.length; j++) {
            console.log("index is: " + j)
            if (localStorage.getItem("expiration-input1-" + j)) {
                let expiration = localStorage.getItem("expiration-input1-" + j);
                console.log(j + "th delegation chose an expiration");
                expirationArray.push(expiration);
                console.log("expirationArray0: " + expirationArray);
            }
            else {
                console.log(j + "th delegation did not chose expiration")
                expirationArray.push(0);
            }
        }

        let delegationsArray = []
        // if (delegatee.length == delegatee_token_quantity.length) {
        //     //{ owner: "", delegatee: "", amount: "", dimension: "", expiration: "", accessCategories: "" }
        //     for (var i = 0; i < delegatee.length; i++) {
        //         var delegationObj = {};
        //         delegationObj.dimension = dimensionName;
        //         delegationObj.owner = owner;// EDIT!!!!!!!!!!
        //         delegationObj.delegatee = keccak_256(delegatee[i]);
        //         delegationObj.amount = delegatee_token_quantity[i];
        //         delegationObj.accessCategories = "";
        //         delegationObj.timeFrame = expirationArray[i];
        //         delegationsArray.push(delegationObj);
        //     }
        // }
        if (this.state.deleValue.length == this.state.deleToken.length) {
            //{ owner: "", delegatee: "", amount: "", dimension: "", expiration: "", accessCategories: "" }
            for (var i = 0; i < this.state.deleValue.length; i++) {
                var delegationObj = {};
                delegationObj.dimension = dimensionName;
                delegationObj.owner = owner;// EDIT!!!!!!!!!!
                delegationObj.delegatee = keccak_256(this.state.deleValue[i]);
                delegationObj.amount = this.state.deleToken[i];
                delegationObj.accessCategories = "";
                delegationObj.timeFrame = expirationArray[i];
                delegationsArray.push(delegationObj);
            }
        }

        //clear the delegations from local storage...
        console.log("delegatee.length: " + delegatee.length);
        for (var k = 0; k < delegatee.length; k++) {
            localStorage.removeItem("expiration-input1-" + k);
            console.log("removed " + k);
        }

        return JSON.stringify(delegationsArray)
    }
    //*****************************************************************************
    appendDelegation() {
        var inputLen = this.state.delegations.length;
        console.log("delegations length: " + inputLen)
        if (inputLen < 10) {
            var theID = Number(this.state.suggest_attrs.length) + 1;
            var attr = {
                addKeys: [13, 188], // Enter and comma
                inputProps: {
                    placeholder: "use ENTER to add values",
                    style: { width: '30%' },
                    id: theID.toString()
                }
            };
            console.log("THEID: " + theID)
            //console.log("suggest : "+JSON.stringify(this.state.suggest_attrs))
            var tmp = [];
            this.state.deleValue.push(tmp);
            this.state.deleToken.push(tmp);
            this.state.suggest_attrs.push(attr);
            console.log("suggest_attrs: " + this.state.suggest_attrs + "  this.state.suggest_attrs length: " + this.state.suggest_attrs.length)
            console.log("suggest : " + JSON.stringify(this.state.suggest_attrs))
            var newInput1 = `input1-${inputLen}`;
            this.setState({ delegations: this.state.delegations.concat([newInput1]) });
        }
    }
    //*****************************************************************************
    addController() {
        var inputLen = this.state.inputs_controllers.length;
        if (inputLen < 10) {
            var newInput = `inputCtrl-${inputLen}`;
            this.setState({ inputs_controllers: this.state.inputs_controllers.concat([newInput]) })
        }
    }
    //*****************************************************************************
    //used for TokenDistributionForm to prepare controllers
    getDimensionControllerValues() {
        var labelVals = []
        var _this = this;
        //in DimensionForm
        $.each($("input[name^='label1-']"), function (obj) {
            var value = $.trim($(this).val());
            if (value.length > 0) {
                labelVals.push({
                    //replace the 'label' with the entered val
                    [$(this).attr('name').replace("label1-", "")]: value
                });
            }
        });
        return labelVals;
    }
    //*****************************************************************************
    prepareControllerDistribution() {
        let labels = this.getDimensionControllerValues();
        for (var i = 0; i < labels.length; i += 2) {
            for (var key in labels[i]) {
                this.state.controllers_pubkeys.push(keccak_256(labels[i][key]));
                this.state.controllers_tokens.push(labels[i + 1][key]);
            }
        }
    }
    //*****************************************************************************
    //called onClick of 'Create Dimension' button
    createDimension(e) {

        e.preventDefault();
        let json = {};

        var theAsset;
        //^^^^^ for the ajax

        //************************************************************************* */
        // var tempArr = this.state.control_list.toString().split(',');
        // for (var x = 0; x < tempArr.length; x++) {
        //     if (tempArr[x] == "") {
        //         tempArr.splice(x, 1);
        //     }
        // }
        // this.state.control_list = tempArr;
        // for (var x = 0; x < this.state.control_list.length; x++) {
        //     var index = this.state.names.indexOf(this.state.control_list[x]);
        //     if (index >= 0) {
        //         this.state.control_list[x] = this.state.keys[index];
        //     }
        // }
        // //**********************flatten 2D array, remove empty values, and replace word values with publick keys*************************************************
        // var tempArr = this.state.deleValue.toString().split(',');
        // var tempArr2 = this.state.deleToken.toString().split(',');
        // for (var x = 0; x < tempArr.length; x++) {
        //     if (tempArr[x] == "") {
        //         tempArr.splice(x, 1);
        //         tempArr2.splice(x, 1);
        //     }
        // }
        // this.state.deleValue = tempArr;
        // this.state.deleToken = tempArr2;
        // for (var x = 0; x < this.state.deleValue.length; x++) {
        //     var index = this.state.names.indexOf(this.state.deleValue[x]);
        //     if (index >= 0) {
        //         this.state.deleValue[x] = this.state.keys[index];
        //     }
        // }
        //*************************************************************************
        //*************************************************************************
        //*************************************************************************
        let dimensionName = $("input[name^='dimensionName']").val();
        if (dimensionName) {
            json.dimensionName = dimensionName;
        }
        json.pubKey = localStorage.getItem("pubKey");
        json.address = "", json.ID = 0, json.flag = 0;
        //*************************************************************************
        // GET PROPER DATA FROM SELECTED ASSET (we will pass owners to prepareDelegations)
        let selected_asset = this.state.currentAsset//$("#assetSelect option:selected").text();

        // let ICA_claim = document.getElementById("ICA");
        // if (ICA_claim.selectedIndex == 1) {
        //     json.propType = 2;
        // }
        // else json.propType = 0;

        //NOTE: WE NEED TO ADD THIS BACK IN AFTER THE VIDEO!!!!!!!!!!!!!!!
        // -ST
        json.propType = 0;

        let bigchainTrxnID; //we will pass this to prepareAttributes function
        this.state.own_assets.forEach(function (asset, index) {
            if (selected_asset == asset.asset_id) {
                //console.log("\n\n SELECTED ASSET: " + selected_asset + "  Owned assetID: " + asset.asset_id);
                //json.flag = 0,
                theAsset = asset;
                json.coidAddr = asset.asset_coidAddr,
                    json.dimensionCtrlAddr = asset.asset_dimCtrlAddr,
                    json.uniqueId = asset.asset_uniqueId,
                    json.owners = asset.asset_owners,
                    json.controllers = asset.asset_controllers,
                    bigchainTrxnID = asset.asset_bigchainID
            }
        })
        this.state.control_assets.forEach(function (asset, index) {
            if (selected_asset == asset.asset_id) {
                //console.log("\n\n SELECTED ASSET: " + selected_asset + "  Controlled assetID: " + asset.asset_id);
                //json.flag = 1,
                theAsset = asset;
                json.coidAddr = asset.asset_coidAddr,
                    json.dimensionCtrlAddr = asset.asset_dimCtrlAddr,
                    json.uniqueId = asset.asset_uniqueId,
                    json.owners = asset.asset_owners,
                    json.controllers = asset.asset_controllers,
                    bigchainTrxnID = asset.asset_bigchainID
            }
        })
        //*************************************************************************
        let delegations = this.prepareDelegationDistribution(dimensionName, json.owners);
        json.delegations = delegations
        let attributes = this.prepareAttributes(selected_asset, bigchainTrxnID);
        json.data = attributes;
        //*************************************************************************
        this.prepareControllerDistribution();
        let controllers_dimension = this.state.controllers_pubkeys;
        if (controllers_dimension) {
            json.dim_controllers_keys = this.state.controllers_pubkeys;
            json.dim_controllers_tokens = this.state.controllers_tokens;
        }
        //*************************************************************************
        var signature = this.getSignature(json);
        var msg_hash = keccak_256(JSON.stringify(json));
        var msg_hash_buffer = new Buffer(msg_hash, "hex");
        json.msg = msg_hash_buffer.toString("hex");
        json.sig = signature;
        //*************************************************************************
        console.log("JSON: " + JSON.stringify(json));

        // $.ajax({
        //     type: "POST",
        //     url: twinUrl + 'dimensions/CreateDimension',
        //     data: json,
        //     success: function (result) {
        //         //returns (bool success, bytes32 callerHash, address test)
        //         var data = result;
        //         if ($.type(result) != "object") {
        //             data = JSON.parseJSON(result)
        //         }
        //         console.log("response createDimenson: " + JSON.stringify(data))
        //     }.bind(this),
        //     complete: function () {
        //         // do something
        //         //ST: HERE WE COULD WRITE DIMENSIONS INTO COID JSON?
        //         $.ajax({
        //             url: twinUrl + 'getAsset',
        //             type: 'POST',
        //             data: { "pubKey": localStorage.getItem("pubKey"), "flag": 0, "fileName": theAsset.asset_id + ".json" },
        //             success: function (res) {
        //                 console.log("response from getAsset: " + res)
        //                 console.log("response from getAsset: " + JSON.stringify(res))
        //                 if (res.dimensions) { }
        //                 else {
        //                     res.dimensions = [];
        //                 }
        //                 //this.state.iDimensions[REPLACEME].dimensions = this.state.iDimensions[REPLACEME].dimensions || [];
        //                 var dim = {};
        //                 dim.dimensionName = json.dimensionName;
        //                 dim.descriptor = "bigchainID";
        //                 dim.flag = 0;
        //                 dim.Id = "";
        //                 //this.state.iDimensions[REPLACEME].dimensions.push(dim);
        //                 res.dimensions.push(dim);
        //                 var sendMe = {};
        //                 sendMe.flag = 0; //owned asset
        //                 sendMe.fileName = theAsset.asset_id + ".json";
        //                 sendMe.pubKey = keccak_256(localStorage.getItem("pubKey"));
        //                 sendMe.updateFlag = 0;
        //                 sendMe.data = res;
        //                 console.log("response edited:\n" + JSON.stringify(res))
        //                 $.ajax({
        //                     url: twinUrl + 'setAsset',
        //                     type: 'POST',
        //                     data: sendMe,
        //                     success: function (res) {
        //                         console.log("response from setAsset:\n" + JSON.stringify(res))
        //                     }
        //                 })// end setasset
        //             }
        //         })//end getasset
        //     },
        // })

    }//end creationDimension
    //*****************************************************************************
    onChange(event, { newValue }, id) {
        console.log("onchange");
        var arr = this.state.value;
        console.log("state value:  " + this.state.value)
        arr[Number(id)] = newValue;
        this.setState({ value: arr });
    };
    //*****************************************************************************
    //*****************************************************************************
    render() {

        console.log("suggest obj : " + JSON.stringify(this.state.suggest_attrs))
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

            let names = ["Moodys","Steve Smith CFA","Joe Schmo LLC", "AuditBody1"];

            //PUT BACK IN 'that.state.names'
            const suggestions = names.filter((name) => {
            //console.log("FILTER: " + name.toLowerCase().slice(0, inputLength));
            //console.log(inputValue);
            var re = new RegExp(inputValue, "i");
            return (Boolean(name.slice(0, inputLength).search(re) + 1))
            //return (name.toLowerCase().slice(0, inputLength) === inputValue  || name.toUpperCase().slice(0, inputLength) === inputValue)
            })
            /////////////////////////////////////

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

        var inputAttrs = {
            addKeys: [13, 188],	// Enter and comma
            inputProps: {
                placeholder: "use ENTER to add values",
                style: { width: '30%' },
                id: "0"
            }
        };

        let marginRight15 = { marginRight: '15px' };
        let table = { margin: '0 auto' };

        //let heynow = "panel-collapse collapse out"


        return (

            <div id="IDENTITYDIMENSIONS_MODAL">

                <h1>Personas</h1>
                <h5><i>Personal Data Repositories</i></h5>
                <hr />
                <div className="modal-header">
                    MODAL HEADER
                </div>

                <div className="modal-body">

                    <div>
                        <h5><b>Select asset:</b></h5>
                        <select id="assetSelect" className="selectpicker show-tick" value={this.state.currentAsset} onChange={this.pickerChange}>
                            <optgroup label="Owned">
                                <option>Steve Smith</option>
                                <option>Honda Accord</option>
                                {/* {(() => {
                                    if (this.state.owned_assets_label.length > 0) {
                                        return this.state.owned_assets_label.map((label, i) => {
                                            //let val = label.split(',') //get rid of the .json
                                            return <option key={i} value={label}>{label}</option>
                                        })
                                    }
                                    else { return <option>None</option> }
                                })(this)} */}
                            </optgroup>
                            {/* <optgroup label="Controlled">
                                {(() => {
                                    if (this.state.controlled_assets_label.length > 0) {
                                        return this.state.controlled_assets_label.map((label, i) => {
                                            //let val = label.split(',') //get rid of the .json
                                            return <option key={i} value={label}>{label}</option>
                                        })
                                    }
                                    else { return <option>None</option> }
                                })(this)}
                            </optgroup> */}
                        </select>
                    </div>
                    {/* select asset --- this should be passed from the screen */}

                    <div id="SubmitContainer">
                        <form method="POST" id="register" role="form">
                            <div className="form-group">
                                <label htmlFor="dimensionName">Persona name:</label>
                                <input name="dimensionName" className="form-control col-md-4" type="text" placeholder="Dimension Name" />
                            </div>


                            {/* IDENTITY DIMENSION CHOICES */}

                            <div className="panel-group" id="accordion2">
                                <div className="panel panel-default">
                                    <div className="panel-heading">
                                        <div className="row">
                                            <div className="col-xs-11">
                                                <label>Repository Attributes</label>
                                            </div>
                                            <div className="col-xs-1">
                                                <a data-toggle="collapse" data-parent="#accordion" href="#collapse2">
                                                    <span className="glyphicon glyphicon-chevron-down"></span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <div id="collapse2" className="panel-collapse collapse out">
                                        <div className="panel-body">
                                            <div className="row">
                                                <div className="form-group" id="unique_id_div">
                                                    <label htmlFor="unique_id">Enter descriptor(s) and attribute(s):</label>
                                                    {this.state.inputs.map(input =>
                                                        <DimensionAttributeForm handleShowModal={this.handleShowModal.bind(this)} max="10" key={input} labelref={input} />)}
                                                </div>
                                                <div className="form-group" id="unique_id_btn">
                                                    {/* onClick={this.appendAttribute.bind(this)} */}
                                                    <button type="button" className="btn btn-info pull-right" style={marginRight15}>
                                                        <span className="glyphicon glyphicon-plus"></span>Add More
                                                    </button>
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
                                            <div className="col-xs-11">
                                                <label>Delegations</label>
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
                                                <div className="form-group">
                                                    <label htmlFor="control_list">Enter additional persona controllers. Note: Core Identity controllers will automatically be controllers of the persona.</label>
                                                    <TagsInput maxTags={10} renderInput={autocompleteRenderInput} value={this.state.control_list} onChange={(e) => { this.onFieldChange("control_list", e) }} />
                                                </div>
                                                <div className="form-group">
                                                    <div className="col-md-offset-6 col-md-6 ">
                                                        {/* onClick={this.addController.bind(this)} */}
                                                        <button type="button" className="btn btn-info pull-right" style={marginRight15}>
                                                            <span className="glyphicon glyphicon-plus"></span>Add More
                                                        </button>
                                                    </div>
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
                                                <label>One-Time or Temporary Delegations</label>
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
                                                <div className="form-group">
                                                    <label htmlFor="control_dist">Share this data repository with a 3rd party? How often?</label>
                                                    {this.state.delegations.map((input, i) =>
                                                        <DimensionDelegationForm attr={this.state.suggest_attrs[i]} max="10" key={input} labelref={input} autocompleteRenderInput={autocompleteRenderInput} deleValue={this.state.deleValue[i]} deleToken={this.state.deleToken[i]} passedFunction={(e) => { this.onFieldChange2("deleValue," + i, e) }} passedFunction2={(e) => { this.onFieldChange2("deleToken," + i, e) }} />)}
                                                </div>
                                                <div className="form-group">
                                                    <div className="col-md-offset-6 col-md-6 ">
                                                        <button type="button" className="btn btn-info pull-right" style={marginRight15} onClick={this.appendDelegation.bind(this)}>
                                                            <span className="glyphicon glyphicon-plus"></span>Add More
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div className="form-group">
                                <div className="col-sm-6">
                                    {/* onClick={this.createDimension.bind(this)} */}
                                    <button className="btn btn-primary" data-loading-text="Submit" name="submit-form" type="button">Create</button>
                                </div>
                            </div>
                        </form>

                        {this.state.showModal ? <UploadIpfsFile pubKey={this.state.pubKey} dataHandler={this.getFileDetails.bind(this)} handleHideModal={this.handleHideModal} /> : null}
                    </div>{/*SubmitContainer*/}


                </div>{/*modal-body*/}

            </div >
        );
    }

};

export default IdentityDimensions
