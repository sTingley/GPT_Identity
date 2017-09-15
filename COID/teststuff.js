'use strict'
/*
TODO
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
!!!!!!CHANGE NOTIFIER CALLS TO *--COMPROMISED--* DIGITAL TWIN TO BE AIRBITZ CALLS!!!!!!
ADD variable in contract to control 'cleanMyTwin' command usage and make ctrl file check for it
EVENTUALLY use crypto-conditions to prevent old owner from accessing bigchainDB and pass owership of all bigchainDB objects to new owner
EVENTUALLY make it so an owner is not listed as a controller or dim_controller in the digital twin
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*/
var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json');

var erisContracts = require('eris-contracts')
var fs = require('fs-extra')
var http = require('http')
var express = require('express')
var bodyParser = require('body-parser');
var morgan = require('morgan');

//for sending a notification
var superAgent = require("superagent");

//for verification
var crypto = require("crypto")
var ed25519 = require("ed25519")

//this library is needed to calculate hash of blockchain id (chain name) and bigchain response
var keccak_256 = require('js-sha3').keccak_256;

//These variables are for creating the server
var hostname = 'localhost';

var app = express();
app.use(morgan('dev'));
app.use(bodyParser.json());

app.set('trust proxy', true);

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, application/json-rpc");
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(morgan('dev'));
var twinUrl = "http://10.100.98.218:5050";

//holding recover objects
var formdataArray = [];
var IDArray = [];
var twinUrl = "http://10.100.98.218:5050";

var notifier = function () {
    //location of digital twin
    this.twinUrl = "http://10.100.98.218:5050";

    //for grabbing the appropriate scope
    var _this = this;

    //function to send a notification:
    //TODO: CHANGE THE ENDPOINT:

    //NOTE: THE DIGITAL TWIN will reject it without pubKey
    this.notifyCoidCreation = function (pubKey, assetID, txnID, txnHash, gkAddr, coidAddr, dimensionCtrlAddr) {

        console.log("ASSET ID IS: " + assetID);
        superAgent.post(this.twinUrl + "/setAsset")
            .send({
                "pubKey": keccak_256(pubKey),
                "flag": 0,
                "fileName": assetID + ".json",
                "updateFlag": 1,
                "keys": ["bigchainID", "bigchainHash", "gatekeeperAddr", "coidAddr", "dimensionCtrlAddr"],
                "values": [txnID, txnHash, gkAddr, coidAddr, dimensionCtrlAddr]
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                // if(res.status == 200){
                // do something
                // }
            });
    };

    this.createProposalPendingNotification = function (requester, proposalId, isHumanVal, gkAddr, propType) {
        console.log("proposal pending event caught.. mygk addr:  " + gkAddr)

        superAgent.post(this.twinUrl + "/notification/writeNotify")
            .send({
                "pubKey": keccak_256(requester).toUpperCase(),
                "proposalID": proposalId,
                "isHuman": isHumanVal,
                "gatekeeperAddr": gkAddr,
                "message": "Your proposal is pending for validation"
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                //if(res.status == 200){
                console.log("proposalPending message sent successfully");
                // }
            });
    };

    this.GetAsset = function (pubKey, fileName, flag, callback) {
        console.log("getting asset: " + fileName + " flag: " + flag + " pubkey: " + pubKey);
        superAgent.post(this.twinUrl + "/getAsset")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag,
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("GET ASSET RETURNED: " + JSON.stringify(res.body) + "\n")
                    var result = res.body;
                    if (result.msg == "Not found.") { result = false; }
                    callback(result);
                }
            });
    }

    this.GetAllOwnedAssets = function (pubKey, callback) {
        superAgent.post(this.twinUrl + "/getOwnedAssets")
            .send({
                "pubKey": pubKey,
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("GET OWNED ASSETS RETURNED: " + JSON.stringify(res.body) + "\n")
                    var result = res.body;
                    callback(res.body);
                }
            });
    }
    this.GetAllControlledAssets = function (pubKey, callback) {
        superAgent.post(this.twinUrl + "/getControlledAssets")
            .send({
                "pubKey": pubKey,
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("GET OWNED ASSETS RETURNED: " + JSON.stringify(res.body) + "\n")
                    var result = res.body;
                    callback(result);
                }
            });
    }
    this.GetAllDelegatedAssets = function (pubKey, callback) {
        superAgent.post(this.twinUrl + "/getDelegatedAssets")
            .send({
                "pubKey": pubKey,
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("GET OWNED ASSETS RETURNED: " + JSON.stringify(res.body) + "\n")
                    var result = res.body;
                    callback(result);
                }
            });
    }

    //Create an Asset in the twin folder (owned, delegated, controlled)
    this.SetAsset = function (pubKey, fileName, flag, updateFlag, data, keys, values, callback) {
        superAgent.post(this.twinUrl + "/setAsset")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag,
                "updateFlag": updateFlag,
                "data": data,
                "keys": keys,
                "values": values
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("\nWRITE COMPLETE\n");
                    callback();
                }
                else { console.log("\nWRITE BAD\n"); }
                // do something
                // }
            });
    }

    this.createIcaSigNotification = function (validator, proposalId, sigExpire, txid) {

        request.post(this.twinUrl + "/signature/writeAttestation")
            .send({
                "pubKey": keccak_256(validator).toUpperCase(),
                "proposalID": proposalId,
                "isHuman": false,
                "gatekeeperAddr": "",
                "sigExpire": sigExpire,
                "message": "ICA has been attested",
                "txid": txid,
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                //if (res.status == 200) {
                console.log("ICA message sent successfully");
                //}
            });

    }




    this.GetAllOwnedDimensions = function (pubKey, callback) {
        superAgent.post(this.twinUrl + "/getOwnedDimensions")
            .send({
                "pubKey": pubKey,
                "flag": 0
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("GET RESBODY : " + JSON.stringify(res.body));
                    console.log("CALLBACK IS A :" + typeof (callback));
                    //for (var i = 0; i < arguments.length; i++) {
                    //    console.log(String(arguments[i]));
                    //}
                    var results = res.body;
                    callback(results);
                    //return res.body;
                }
            });
    }
    this.GetAllControlledDimensions = function (pubKey, callback) {
        superAgent.post(this.twinUrl + "/getControlledDimensions")
            .send({
                "pubKey": pubKey,
                "flag": 1
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("GET RESBODY : " + JSON.stringify(res.body));
                    console.log("CALLBACK IS A :" + typeof (callback));
                    //for (var i = 0; i < arguments.length; i++) {
                    //    console.log(String(arguments[i]));
                    //}
                    var results = res.body;
                    callback(results);
                    //return res.body;
                }
            });
    }
    this.GetAllDelegatedDimensions = function (pubKey, callback) {
        superAgent.post(this.twinUrl + "/getDelegatedDimensions")
            .send({
                "pubKey": pubKey,
                "flag": 2
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("GET RESBODY : " + JSON.stringify(res.body));
                    console.log("CALLBACK IS A :" + typeof (callback));
                    //for (var i = 0; i < arguments.length; i++) {
                    //    console.log(String(arguments[i]));
                    // }
                    var results = res.body;
                    callback(results);
                    //return res.body;
                }
            });
    }
    //Get dimension data from the twin folder (owned, delegated, controlled)
    this.GetDimension = function (pubKey, fileName, flag, callback) {
        superAgent.post(this.twinUrl + "/getDimension")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("GET RESBODY : " + JSON.stringify(res.body));
                    console.log("CALLBACK IS A :" + typeof (callback));
                    //for (var i = 0; i < arguments.length; i++) {
                    //    console.log(String(arguments[i]));
                    //}
                    var results = res.body;
                    callback(results);
                    //return res.body;
                }
            });
    }

    this.SetDimension = function (pubKey, fileName, flag, updateFlag, data, keys, values, callback) {
        console.log("\nSetDimension called\n");
        superAgent.post(this.twinUrl + "/setDimension")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag,
                "updateFlag": updateFlag,
                "data": data,
                "keys": keys,
                "values": values
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("SET RESBODY: " + JSON.stringify(res.body));
                    if (typeof callback === "function") { callback(); }
                    else { console.log("Callback is not a Function"); }
                    //return res.body;
                }
                else {
                    console.log("callerror");
                    if (typeof callback === "function") { callback(); }
                    else { console.log("Callback is not a Function"); }
                }
            });
    }

    //Remove an Dimension in the twin folder (owned, delegated, controlled,callback)
    this.deleteDimension = function (pubKey, fileName, flag, callback) {
        superAgent.post(this.twinUrl + "/deleteDimension")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag,
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("REMOVE RESBODY: " + JSON.stringify(res.body));
                    callback();
                }
            });
    }

    this.getRecovery = function (pubKey, propId, callback) {
        superAgent.get(twinUrl + "/recovery/readRecovery/" + keccak_256(pubKey).toUpperCase())
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (typeof (res.body.data) == undefined) { callback(false) }
                else {
                    console.log(twinUrl + "/recovery/readRecovery/" + keccak_256(pubKey).toUpperCase());
                    console.log("Recovery RESBODY: " + JSON.stringify(JSON.parse(res.body.data).messages) + "\n");
                    var result = JSON.parse(res.body.data).messages;
                    if (propId != "") {
                        var found = false;
                        for (var j = 0; j < result.length; j++) {
                            console.log("resID: " + result[j].proposal_id + "\nPropID: " + propId);
                            if (result[j].proposal_id == propId) { callback(result[j]); found = true; break; }
                            if (!found && j == result.length - 1) { callback(false) }
                        }
                    }
                    else { callback(result) }
                }
            });
    }


    this.getSignatures = function (pubKey, callback) {
        superAgent.get(twinUrl + "/recovery/readRecovery/" + keccak_256(pubKey).toUpperCase())
            .set('Accept', 'application/json')
            .end((err, res) => {
                console.log(twinUrl + "/recovery/readRecovery/" + keccak_256(pubKey).toUpperCase());
                console.log("Recovery RESBODY: " + JSON.stringify(res.body.data) + "\n");
                var result = JSON.parse(res.body.data).messages;
                callback(result);

            });
    }



    this.getSignatures = function (pubKey, callback) {
        superAgent.get(twinUrl + "/signature/readAttestation/" + keccak_256(pubKey).toUpperCase())
            .set('Accept', 'application/json')
            .end((err, res) => {
                //console.log(twinUrl + "/recovery/r/" + keccak_256(pubKey).toUpperCase());
                console.log("Sig RESBODy: " + JSON.stringify(res.body.data.messages) + "\n");
                var result = res.body.data.messages;
                callback(result);

            });
    }

    this.attestIcaFile = function (pubKey, proposalId, message, timestamp, gatekeeperAddr, sigExpire, txid, assetId) {

        superAgent.post(twinUrl + "/signature/writeAttestation")
            .send({
                "pubKey": keccak_256(pubKey),
                "proposalID": proposalId,
                "message": message,
                "read_status": false,
                "time": timestamp,
                "gatekeeperAddr": gatekeeperAddr,
                "isHuman": false,
                "sigExpire": sigExpire,
                "txid": txid,
                "assetId": assetId
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                // if(res.status == 200){
                console.log("Written to ICA File")
                // }
            });
    };

    this.cleanMyTwin = function (pubKey, callback) {

        superAgent.post(twinUrl + "/recovery/cleanMyTwin/" + keccak_256(pubKey).toUpperCase())
            .send({
                "pubKey": keccak_256(pubKey),
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                // if(res.status == 200){
                console.log("Cleanup Achieved")
                callback();
                // }
            });
    };

    this.bcPreRequest = function (pubKey, proposalId, data, blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, serviceSig, bigchainID, bigchainHash, callback) {
        console.log("params:\n" + pubKey);
        superAgent.post(this.twinUrl + "/bigchain/preRequest")
            .send({
                "pubKey": pubKey,
                "proposalId": proposalId,
                "data": JSON.stringify(data),
                "blockNumber": blockNumber,
                "blockHashVal": blockHashVal,
                "blockchainID": blockchainID,
                "timestamp": timestamp,
                "validatorSigs": validatorSigs,
                "serviceSig": serviceSig,
                "bigchainID": bigchainID,
                "bigchainHash": bigchainHash
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("Bigchain message sent successfully");
                    callback(res.body.result, res.body.theId, res.body.theHash);
                }
            });
    };


    this.bcTransferRequest = function (pubKey1, pubKey2, txid, flag, callback) {
        console.log("params:\n" + pubKey2);
        superAgent.post(this.twinUrl + "/bigchain/transferRequest")
            .send({
                "toPubKey": pubKey1,
                "fromPubKey": pubKey2,
                "txid": txid,
                "flag": flag
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("Bigchain transfer message sent successfully");
                    callback(res.body.transferResult);
                }
            });
    };

    this.bcTransferFileRequest = function (pubKey1, pubKey2, callback) {
        console.log("params:\n" + pubKey2);
        superAgent.post(this.twinUrl + "/bigchain/transferFileRequest")
            .send({
                "toPubKey": pubKey1,
                "fromPubKey": pubKey2
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("Bigchain transfer FILE message sent successfully");
                    callback(Boolean(JSON.stringify(res.text)));
                }
            });
    };

    this.bcGetRequest = function (pubKey, txid, callback) {
    console.log("params:\n" + pubKey);
    superAgent.post(this.twinUrl + "/bigchain/getRequest")
        .send({
            "pubKey": pubKey,
            "txid": txid
        })
        .set('Accept', 'application/json')
        .end((err, res) => {
            if (res.status == 200) {
                console.log("Bigchain Get successfully recieved");
                callback(res.body.result, res.body.theId, res.body.theHash);
            }
        });
};


   this.transferRecovery = function (toPubKey, fromPubKey, callback) {
        superAgent.post(twinUrl + "/recovery/transferRecovery")
            .send({
                "toPubKey": keccak_256(toPubKey).toUpperCase(),
                "fromPubKey": keccak_256(fromPubKey).toUpperCase()
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                //if (res.status == 200) {
		    console.log("res: "+JSON.stringify(res))
                    console.log(twinUrl + "/recovery/transferRecovery from:" + keccak_256(fromPubKey).toUpperCase());
                    callback(res.text);
                //}
                //else{callback(false);}
            });
    }


    this.createRecoveryNotification = function (params, recoveryAddr, pubKey) {
        console.log("params:\n" + JSON.stringify(params));
        superAgent.post(this.twinUrl + "/recovery/writeRecovery")
            .send({
                "pubKey": pubKey.toUpperCase(),
                "proposalID": params.proposalId,
                "isHuman": true,
                "proposal_id": params.proposalId,
                "gatekeeperAddr": params.gatekeeperAddr,
                "coidAddr": params.coidAddr,
                "dimensionCtrlAddr": params.dimensionCtrlAddr,
                "trieAddr": params.trieAddr,
                "txid": params.bigchainID,
                "assetId": params.assetID,
                "uniqueId": params.uniqueId,
                "recoveryAddr": recoveryAddr,
                "owner": params.pubKey,
                "message": "Your Recovery has been stored"
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("recovery message sent successfully");
                }
            });
    };

    this.deleteRecoveryNotification = function (pid, pubKey, callback) {
	console.log("sending: " + pid + "   "+ pubKey)
        superAgent.post(this.twinUrl + "/recovery/deleteRecovery")
            .send({
                "pubKey": pubKey.toUpperCase(),
                "pid": pid,
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                //if (res.status == 200) {
                    console.log("recovery delete sent successfully");
                    callback(true);
                //}
            });
    };




}//end of notifier

var theNotifier = new notifier();


//ED25519 VERIFICATION FUNCTION:
function EDVerify(msg, signature, pubKey) {
    var logme = ed25519.Verify(new Buffer(msg), new Buffer(signature, "hex"), new Buffer(pubKey, "hex"))
    return logme;
}


//SECP VERIFICATION FUNCTION:
function SECPVerify(msg, signature, pubKey) {
    msg = new Buffer(msg, "hex");
    signature = new Buffer(signature, "hex");
    pubKey = new Buffer(pubKey, "hex");

    var verified = secp256k1.verify(msg, signature, pubKey)
    return verified;
}


function writeAllDimensions(formdata, callback) {
    var max = Math.max(formdata.dimension.controllers.length, formdata.dimension.owners.length);
    max = Math.max(formdata.dimension.delegations.length, max);
    max = Math.max(formdata.dimension.dim_controllers_keys.length, max);
    console.log("\n*****THE MIGHTY WRITEALL*****\n");
    console.log(JSON.stringify(formdata));
    console.log("MAX :" + max);
    var k = 0;
    var o = 0;
    var c = 0;
    var d = 0;
    var e = 0;
    var delegateeLog;
    var total = formdata.dimension.controllers.length + formdata.dimension.owners.length + formdata.dimension.delegations.length + formdata.dimension.dim_controllers_keys.length;
    console.log("total calls: " + total);
    for (var i = 0; i < max; i++) {
        if (typeof (formdata.dimension.owners[i]) != 'undefined' && typeof (formdata.dimension.owners[i]) != 'null' && formdata.dimension.owners != "") {
            theNotifier.SetDimension(String(formdata.dimension.owners[i]), String(formdata.dimension.dimensionName) + ".json", 0, 0, formdata, "", "", function () {
                k++;
                console.log("Writing to Owner: " + formdata.dimension.owners[o] + " K: " + k);
                o++;
                if (k == total) { console.log("owner callback "); callback() }
            })
        }
        if (typeof (formdata.dimension.controllers[i]) != 'undefined' && typeof (formdata.dimension.controllers[i]) != 'null' && formdata.dimension.controllers != "") {
            theNotifier.SetDimension(String(formdata.dimension.controllers[i]), String(formdata.dimension.dimensionName) + ".json", 1, 0, formdata, "", "", function () {
                k++;
                console.log("Writing to Controller: " + formdata.dimension.controllers[c] + " K: " + k);
                c++;
                if (k == total) { console.log("controller callback"); callback() }
            })
        }
        if (typeof (formdata.dimension.dim_controllers_keys[i]) != 'undefined' && typeof (formdata.dimension.dim_controllers_keys[i]) != 'null' && formdata.dimension.dim_controllers_keys != "") {
            theNotifier.SetDimension(String(formdata.dimension.dim_controllers_keys[i]), String(formdata.dimension.dimensionName) + ".json", 1, 0, formdata, "", "", function () {
                k++;
                console.log("Writing to Controller: " + formdata.dimension.dim_controllers_keys[e] + " K: " + k);
                e++;
                if (k == total) { console.log("dim_controllers_keys callback"); callback() }
            })
        }
        if (typeof (formdata.dimension.delegations[i]) != 'undefined' && typeof (formdata.dimension.delegations[i]) != 'null' && formdata.dimension.delegations[i] != "" && formdata.dimension.delegations[i].owner != "") {
            var delegatee = formdata.dimension.delegations[i].delegatee;
            var accessCategories = formdata.dimension.delegations[i].accessCategories;
            delegateeLog = formdata;
            delegateeLog.dimension.pubKey = "";
            delegateeLog.dimension.coidAddr = "";
            delegateeLog.dimension.uniqueId = "";
            delegateeLog.dimension.uniqueID = "";
            // delegateeLog.dimension.data=[""];

            for (var n = 0; n < delegateeLog.dimension.delegations.length; n++) {
                if (delegateeLog.dimension.delegations[n].delegatee != delegatee) {
                    delegateeLog.dimension.delegations.splice(n, 1);
                }
            }
            //for(var j=0;j<results.dimension.delegations.length;j++){
            if (accessCategories == "") {
                console.log("setting categories");
                delegateeLog.dimension.data = formdata.dimension.data;
                // break;
            }
            else {
                var keys = accessCategories.split(",");
                delegateeLog.dimension.data = [""];
                for (var j = 0; j < formdata.dimension.data.length; j++) {
                    if (keys.indexOf(formdata.dimension.data[j].descriptor)) {
                        delegateeLog.dimension.data.push(formdata.dimension.data[j]);
                    }
                }
            }

            theNotifier.SetDimension(String(formdata.dimension.delegations[i].delegatee), String(formdata.dimension.dimensionName) + ".json", 2, 0, delegateeLog, "", "", function () {
                k++;
                console.log("Writing to Delegatee: " + formdata.dimension.delegations[d].delegatee + " K: " + k);
                d++;
                if (k == total) { callback() }
            })
        }
    }//end for loop
}//end writeAll


function writeAllAssets(formdata, callback) {

    var owners = formdata.ownerIdList;
    var controllers = formdata.controlIdList;
    if (controllers == "") { controllers = []; }
    var max = Math.max(owners.length, controllers.length);
    var fileName = formdata.assetID + ".json";
    console.log("\n*****THE MIGHTY WRITEALL*****\n");
    console.log(JSON.stringify(formdata));
    console.log("MAX :" + max);
    var k = 0;
    var o = 0;
    var c = 0;
    var d = 0;
    var total = owners.length + controllers.length;
    console.log("TOTAL: " + total);
    console.log(owners + " len " + owners.length);
    for (var i = 0; i < max; i++) {
        console.log("loop " + owners[i]);
        if (typeof (owners[i]) != 'undefined' && typeof (owners[i]) != 'null' && owners != "") {
            theNotifier.SetAsset(String(owners[i]), String(fileName), 0, 0, formdata, "", "", function () {
                k++;
                console.log("Writing to Owner: " + owners[o] + " K: " + k);
                o++;
                if (k == total) { console.log("owner callback"); callback() }
            })
        }
        if (typeof (controllers[i]) != 'undefined' && typeof (controllers[i]) != 'null' && controllers != "") {
            theNotifier.SetAsset(String(controllers[i]), String(fileName), 1, 0, formdata, "", "", function () {
                k++;
                console.log("Writing to Controller: " + controllers[c] + " K: " + k);
                c++;
                if (k == total) { console.log("controlller callback"); callback() }
            })
        }
    }//end for loop
}//end writeAll



var recoveryContract;
var chain = 'primaryAccount';
var erisdburl = chainConfig.chainURL;
var ErisAddress = chainConfig[chain].address;
var contractData = require("./epm.json");
var contractAbiAddress = contractData['Recovery'];
var erisAbi = JSON.parse(fs.readFileSync("./abi/" + contractAbiAddress));
var accountData = require("./accounts.json");
var contractMgr = erisContracts.newContractManagerDev(erisdburl, chainConfig[chain]);
var recoveryContractFactory = contractMgr.newContractFactory(erisAbi);
var dimCtrlAddress = contractData['IdentityDimensionControl'];
var dimCtrlAbi = JSON.parse(fs.readFileSync("./abi/" + dimCtrlAddress));

this.accountData = require("./accounts.json");
this.contractMgr = erisContracts.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
//ballot contract
this.ballotAddress = contractData['ballot'];
this.ballotAbi = JSON.parse(fs.readFileSync("./abi/" + this.ballotAddress));
this.ballotContract = this.contractMgr.newContractFactory(this.ballotAbi).at(this.ballotAddress);

//bigchain contract (oraclizer)
var bigchain_query_addr = require('/home/demoadmin/.eris/apps/BigchainOraclizer/epm.json').deployStorageK
var bigchain_abi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/BigchainOraclizer/abi/' + bigchain_query_addr, 'utf8'))
var bigchain_contract = contractMgr.newContractFactory(bigchain_abi).at(bigchain_query_addr)

var blockchinID = keccak_256(chain);
//these 2 vars seem to not work atm but will keep placeholders for when they do
var blockNumber = 0;
var blockHashVal = 0;
var blockHash = 0;
var blockchainID = keccak_256(chain);

console.log("--------------------------------------------TESTING--------------------------------------------------------\n");

var recoveryObject = {
    oldPubKey: '029fb6ea7e2394df2b10c9157b3e6c37762b83fe09941fe75cef09cbeb38179dea',
    pubKey: '02b78a3df0b0cc08e50a7a740a0113761f8988a9f3535f7a8cc849057f77660674'
};
var txid = 'facabd5fbbc1303eb57863c6e4f59be931e91169e7d3b7bba34e5ae025d188da';
var flag = 1;

editRecoverer(recoveryObject,function(){console.log("fin")});


    function editRecoverer(recoveryObject, callback) {
        //coid contract variables
        var newOwner = recoveryObject.pubKey;
        var newOwnerHash = keccak_256(newOwner);
        var oldOwner = recoveryObject.oldPubKey;
        var oldOwnerHash = keccak_256(oldOwner);

        //coid contract setup
        var coidAddress = contractData['CoreIdentity'];
        var coidAbi = JSON.parse(fs.readFileSync("./abi/" + coidAddress));
        var coidContractFactory = contractMgr.newContractFactory(coidAbi);
	var j = 0;

        theNotifier.getRecovery(oldOwner, "", function (recoveryFile) {
            console.log("getRecov:\n" + JSON.stringify(recoveryFile))
            if (recoveryFile) {
                for (var x = 0; x < recoveryFile.length;x++) {
                    //get coid contract of people in recovery file and change recoverers
                    theNotifier.GetAsset(recoveryFile[x].owner, 'MyCOID.json', 0, function (asset) {
			console.log("asset: "+ JSON.stringify(asset));
                        var indexR = asset.identityRecoveryIdList.indexOf(oldOwnerHash);
                        if (indexR != -1) {
                            asset.identityRecoveryIdList[indexR] = newOwnerHash;
                            var COIDcontract = contractMgr.newContractFactory(coidAbi).at(recoveryFile[j].coidAddr);
                            COIDcontract.removeRecovery(oldOwnerHash, 0x0, function (error, result) {
				console.log("removeRecovery res: "+ result+"   err: "+error);
                                COIDcontract.addRecovery(newOwnerHash, 0x0, function (error, result) {
				    console.log("addRecovery res: "+ result+"   err: "+error);
                                    COIDcontract.getRecovery(function (error, result) {console.log("result: "+ result)})
				    writeAllAssets(asset, function () {})
				    j++
                                    if(j == recoveryFile.length){callback();}
                                })//add
                            })//remove
                        }
                    })//get asset
                }//for
            }else{callback();}
        })//get recovery
    }//edit recoverer



//theNotifier.GetAsset(recoveryObject.oldPubKey, 'MyCOID.json', 0, function (results) {
//    var k = 0;
//    var asset = results;
//    console.log("theAsset:" + JSON.stringify(asset) + "\n\n" + "idlist length: " + asset.proposalId);
//    for (var x = 0; x < asset.identityRecoveryIdList.length; x++) {
//        theNotifier.deleteRecoveryNotification(asset.proposalId, asset.identityRecoveryIdList[x], function (result) {
//            theNotifier.createRecoveryNotification(asset, "EEEHHHHHHHno", asset.identityRecoveryIdList[k])
//	    k++;
//        })
//    }
//})


//theNotifier.transferRecovery(recoveryObject.pubKey, recoveryObject.oldPubKey, function(result){console.log("RESULT: "+result)})
//bigchainTransferAssetHistory(recoveryObject, txid, flag);

/*function bigchainTransferAssetHistory(recoveryObject,txid,flag){
    var newOwner = recoveryObject.pubKey;
    var newOwnerHash = keccak_256(newOwner).toUpperCase();
    var oldOwner = recoveryObject.oldPubKey;
    var oldOwnerHash = keccak_256(oldOwner).toUpperCase();
    var nextId = txid;
    var bcSync = true;

    while(nextId != null || nextId != '' || nextId != undefined){
        bcSync = true;
        theNotifier.bcGetRequest(newOwner, '9f03f7a8801a4822e2918c75753b3c4fd67eaf8f57e95b3b3ebb267cc22f6939', function(result){
            console.log("xfer result: " + result);
            //bcSync = false;
        })
        while (bcSync) { require('deasync').sleep(10000); }
    }
    
    
}*/


