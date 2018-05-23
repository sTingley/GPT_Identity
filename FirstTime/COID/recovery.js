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

    this.createIcaSigNotification = function (validator, proposalId, sigExpire, txid, assetId, owner) {

        superAgent.post(this.twinUrl + "/signature/writeAttestation")
            .send({
                "pubKey": keccak_256(validator).toUpperCase(),
                "proposalID": proposalId,
                "isHuman": false,
                "gatekeeperAddr": "",
                "sigExpire": sigExpire,
                "message": "ICA has been attested",
                "txid": txid,
                "assetId": assetId,
                "owner": owner
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                //if (res.status == 200) {
                console.log("ICA message sent successfully");
                //}
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
            });
    }


    // this.getSignatures = function (pubKey, callback) {
    //     console.log("\nsig1\n");
    //     superAgent.get(twinUrl + "/recovery/readRecovery/" + keccak_256(pubKey).toUpperCase())
    //         .set('Accept', 'application/json')
    //         .end((err, res) => {
    //             console.log(twinUrl + "/recovery/readRecovery/" + keccak_256(pubKey).toUpperCase());
    //             console.log("Recovery RESBODY: " + JSON.stringify(res.body.data) + "\n");
    //             var result = JSON.parse(res.body.data).messages;
    //             callback(result);

    //         });
    // }



    this.getSignatures = function (pubKey, callback) {
        console.log("\nsig2\n");
        superAgent.get(twinUrl + "/signature/readAttestation/" + keccak_256(pubKey).toUpperCase())
            .set('Accept', 'application/json')
            .end((err, res) => {
                //console.log(twinUrl + "/recovery/r/" + keccak_256(pubKey).toUpperCase());
                console.log("Sig RESBODy: " + JSON.stringify(res.body.data.messages) + "\n");
                var result = res.body.data.messages;
                callback(result);

            });
    }



    this.deleteIcaEntry = function (pid, pubKey, callback) {
        console.log("delete ica sending: " + pid + "   " + pubKey)
        superAgent.post(twinUrl + "/signature/writeAttestation")
            .send({
                "pubKey": pubKey.toUpperCase(),
                "pid": pid,
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                // if(res.status == 200){
                console.log("Written to ICA File")
                callback(res.text);
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

    this.transferRecovery = function (toPubKey, fromPubKey, callback) {
        superAgent.post(twinUrl + "/recovery/transferRecovery")
            .send({
                "toPubKey": keccak_256(toPubKey).toUpperCase(),
                "fromPubKey": keccak_256(fromPubKey).toUpperCase()
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                //if (res.status == 200) {
                console.log("res: " + JSON.stringify(res))
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
        console.log("sending: " + pid + "   " + pubKey)
        superAgent.post(this.twinUrl + "/recovery/deleteRecovery")
            .send({
                "pubKey": pubKey.toUpperCase(),
                "pid": pid,
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                //if (res.status == 200) {
                console.log("recovery delete sent successfully");
                callback(res.text);
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






var Recovery = function (recoveryAddr) {

    this.chain = 'primaryAccount';
    this.erisdburl = chainConfig.chainURL;
    this.contractData = require("./epm.json");
    this.contractAbiAddress = this.contractData['MyGateKeeper'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/" + this.contractAbiAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisContracts.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
    //this.gateKeeperContract = this.contractMgr.newContractFactory(this.erisAbi).at(MyGKaddr);

    //ballot contract
    this.ballotAddress = this.contractData['ballot'];
    // console.log("this is the ballot address: " + this.ballotAddress);
    this.ballotAbi = JSON.parse(fs.readFileSync("./abi/" + this.ballotAddress));
    this.ballotContract = this.contractMgr.newContractFactory(this.ballotAbi).at(this.ballotAddress);

    //verification contract (oraclizer)
    this.VerificationAddress = require('/home/demoadmin/.eris/apps/VerifyOraclizerEthereum/wallet2/epm.json').deployStorageK;
    this.VerificationAbi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/VerifyOraclizerEthereum/wallet2/abi/' + this.VerificationAddress, 'utf8'))
    this.VerificationContract = this.contractMgr.newContractFactory(this.VerificationAbi).at(this.VerificationAddress)
    this.ErisAddress = chainConfig[this.chain].address;

    //bigchain contract (oraclizer)
    this.bigchain_query_addr = require('/home/demoadmin/.eris/apps/BigchainOraclizer/epm.json').deployStorageK
    this.bigchain_abi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/BigchainOraclizer/abi/' + this.bigchain_query_addr, 'utf8'))
    this.bigchain_contract = this.contractMgr.newContractFactory(this.bigchain_abi).at(this.bigchain_query_addr)

    //recovery contract
    this.recoveryAbiAddress = this.contractData['Recovery'];
    this.recoveryAbi = JSON.parse(fs.readFileSync("./abi/" + this.recoveryAbiAddress));
    this.recoveryContract = this.contractMgr.newContractFactory(this.recoveryAbi).at(recoveryAddr);

    var _this = this;

    this.verifyIt = function (formdata, callback) {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var pubKey = formdata.pubKey;
        var sync = true;
        var isValidResult = false;
        console.log("you have reached verifyIt internal function")
        console.log("msg: " + msg)
        console.log("sig: " + sig)
        console.log("key: " + pubKey)
        _this.VerificationContract.VerificationQuery(msg, sig, pubKey, function (error, result) {

            var elEvento;

            _this.VerificationContract.CallbackReady(function (error, result) { elEvento = result; }, function (error, result) {
                if (_this.ErisAddress = result.args.addr) {
                    _this.VerificationContract.myCallback(function (error, result) {
                        if (!error) {
                            elEvento.stop();
                            console.log("Received response from VerifyIt :" + result + "...if that says false, you should not be able to Result0,etc.!!!");
                            callback(result);
                            sync = false;
                        }
                        else { callback(false) }
                    })//end myCallback

                }
            })  //end CallbackReady.once


        })//end VerificationQuery

        while (sync) { require('deasync').sleep(100); }
    } //end verification


    this.startBallot = function (ballotAddress, gkAddr, coidAddr, isHuman, callback) {
        console.log("starting ballot");
        _this.recoveryContract.startBallot(ballotAddress, gkAddr, coidAddr, isHuman, function (error, result) {
            if (result) {
                console.log("ballot complete, waiting for votes");
                callback(result);
            }
            else {
                console.log("start ballot error:\n" + error);
                callback(false);
            }
        })
    }

    this.confirmRecoverer = function (initatorKey, coidAddr, callback) {
        console.log("verifying recoverer");
        _this.recoveryContract.confirmRecoverer(initatorKey, coidAddr, function (error, result) {
            if (result) {
                console.log("verify complete, recoverer valid");
                callback(result);
            }
            else {
                console.log("Mismatch or error:\n" + error);
                callback(false);
            }
        })
    }

    this.readTree = function (formdata, callback) {

        _this.recoveryContract.readTree(function (error, result) {
            if (result) { }
            else {
                console.log("start ballot error:\n" + error)
            }
        })
    }

    this.editTree = function (formdata, callback) {

        _this.recoveryContract.editTree(function (error, result) {
            if (result) { }
            else {
                console.log("start ballot error:\n" + error)
            }
        })
    }




}//end recovery

var eventListener = function () {


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

    console.log("----------------------------------------------------------------------------------------------------------------\n");

    var _this = this;


    //This is for signature generation:
    function createSignature(nonHashedMessage, callback) {
        //make message hash
        var hash = crypto.createHash('sha256').update(nonHashedMessage).digest('hex')
        var pubKey = chainConfig.primaryAccount.pubKey;
        var privKey = chainConfig.primaryAccount.privKey;

        var keyPair = { "publicKey": new Buffer(pubKey, "hex"), "privateKey": new Buffer(privKey, "hex") }

        var signature = ed25519.Sign(new Buffer(hash), keyPair)

        signature = signature.toString('hex')

        var result = { "signature": signature, "pubKey": pubKey, "msg": hash }

        callback(signature, pubKey, hash)
    }



    var eventRecoveryResultReady;

    _this.ballotContract.startRecovery(
        function (error, result) {
            eventRecoveryResultReady = result;
        },
        function (error, result) {

            console.log("Start recovery event caught")
            //grab parameters from the event
            var proposalId = (result.args).proposalId;
            var votingResult = (result.args).requestResult;
            var coidGKAddr = (result.args).myGKaddr;
            var recoveryAddress;
            var chain = 'primaryAccount';
            var erisdburl = chainConfig.chainURL;
            var contractData = require("./epm.json");
            var contractAbiAddress = contractData['Recovery'];
            var erisAbi = JSON.parse(fs.readFileSync("./abi/" + contractAbiAddress));
            var accountData = require("./accounts.json");
            var contractMgr = erisContracts.newContractManagerDev(erisdburl, chainConfig[chain]);
            console.log("--------------------------------------------------------------------");

            //implement logic if and only if votingResult is true:
            if (votingResult) {
                var index = IDArray.indexOf(proposalId);
                if (index != -1) {
                    console.log(JSON.stringify(formdataArray[index]));
                    var recoveryObject = {
                        pubKey: formdataArray[index].newPubKey,
                        oldPubKey: formdataArray[index].owner,
                        gkAddr: coidGKAddr,
                        proposalId: proposalId,
                        msg: formdataArray[index].msg,
                        signature: formdataArray[index].sig,
                        recovererPubkey: formdataArray[index].recoverer,
                        recovererSignature: formdataArray[index].recovererSignature,
                        recoveryAddr: formdataArray[index].recoveryAddr
                    };

                    recoverAll(recoveryObject, function (result) {
                        console.log("Recoverall result: " + result);
                        theNotifier.transferRecovery(recoveryObject.pubKey, recoveryObject.oldPubKey, function (result) {
                            console.log("transfer recovery: " + result)
                            theNotifier.cleanMyTwin(recoveryObject.oldPubKey, function () {
                                theNotifier.bcTransferFileRequest(recoveryObject.pubKey, recoveryObject.oldPubKey, function (result) {
                                    console.log("xfer result: " + result);
                                    console.log("----------------------------------------------------------------------------------------------------------------\n");
                                })
                            });//end clean
                        })//end transfer
                    });//end recoverall
                }
            }


        })//end event

    //this function recovers every asset,dimension, and signature related to an 'oldPubKey' and tansfers it to a 'pubkey'
    function recoverAll(recoveryObject, callback) {
        var pubKey = recoveryObject.pubKey;
        var oldPubKey = recoveryObject.oldPubKey;
        var hashedPubKey = keccak_256(pubKey);
        var oldHashedPubKey = keccak_256(oldPubKey);
        var ownedAssets;
        var controlledAssets;
        var delegatedAssets;
        var time = new Date();//if too many contract calls are called at once,this can stop an invalid jump
        var raSync = true;//for time
        var mutex = false;

        editSignatures(recoveryObject, function (recoverySig, pk, hash) {
            theNotifier.GetAllOwnedAssets(oldPubKey, function (result) {
                console.log("res: " + result)
                if (result) {
                    ownedAssets = result.data;
                    theNotifier.GetAllControlledAssets(oldPubKey, function (result) {
                        if (result) {
                            controlledAssets = result.data;
                            theNotifier.GetAllDelegatedAssets(oldPubKey, function (result) {
                                if (result) {
                                    delegatedAssets = result.data;
                                    console.log("dele length: " + delegatedAssets.length);
                                    //looping vars
                                    var max = Math.max(ownedAssets.length, controlledAssets.length);
                                    max = Math.max(delegatedAssets.length, max);
                                    var totalAssets = ownedAssets.length + controlledAssets.length + delegatedAssets.length;
                                    var t = 0;
                                    recoverMyGatekeeper(recoveryObject, function (gatekeeperAddr) {
                                        //var gatekeeperAddr = "asdsdfsdv";
                                        console.log("new gk addr: " + gatekeeperAddr);
                                        //get the owner for each asset, get the asset, edit the asset, under owner name call writeAllAssets()
                                        console.log("recoverall loop max: " + max + " total: " + totalAssets);
                                        for (var x = 0; x < max; x++) {
                                            raSync = true;
                                            console.log("x: " + x + "  owned: " + ownedAssets[x] + "   controlled: " + controlledAssets[x])
                                            if (ownedAssets[x] != 'undefined' && typeof (ownedAssets[x]) != 'null' && x < ownedAssets.length) {
                                                //var ownerkey = ownedAssets[x].pubKey;
                                                var fileName = ownedAssets[x];
                                                var flag = 0;
                                                theNotifier.GetAsset(oldPubKey, fileName, flag, function (results) {
                                                    if (results) {
                                                        var asset = results;
                                                        if (asset.controlIdList) { }
                                                        else { asset.controlIdList = []; }
                                                        var recovCoidObject = { "oldPubKey": oldPubKey, "pubKey": pubKey, "coidAddr": asset.coidAddr, "propType": asset.propType };
                                                        console.log("\n\nRECOVERING OWNED ASSET: " + asset.assetID + "\n\n");
                                                        recoverCoid(recovCoidObject, function (result) {
                                                            console.log("res: " + result)
                                                            if (result) {
                                                                var recovDimObject = {
                                                                    "pubKey": pubKey,
                                                                    "coidAddr": result,
                                                                    "dimCtrlAddr": asset.dimensionCtrlAddr,
                                                                    "oldPubKey": oldPubKey
                                                                };
                                                                asset.coidAddr = result;
                                                                recoverDimensionControl(recovDimObject, function (result) {
                                                                    asset.dimensionCtrlAddr = result;
                                                                    asset.gatekeeperAddr = gatekeeperAddr;
                                                                    if (asset.pubKey == oldPubKey) { asset.pubKey = pubKey }
                                                                    if (oldHashedPubKey == asset.ownershipId) { asset.ownershipId = hashedPubKey }
                                                                    if (oldHashedPubKey == asset.controlId) { asset.controlId = hashedPubKey }
                                                                    console.log("owneridlist[0]: " + asset.ownerIdList[0]);
                                                                    var indexO = asset.ownerIdList.indexOf(oldHashedPubKey);
                                                                    var indexC = asset.controlIdList.indexOf(oldHashedPubKey);
                                                                    if (indexO != -1) { asset.ownerIdList[indexO] = hashedPubKey; console.log("\n\nchanged an owner\n\n") }
                                                                    if (indexC != -1) { asset.controlIdList[indexC] = hashedPubKey; console.log("\n\nchanged a controller\n\n") }
                                                                    //bigchainPost(asset.proposalId, asset, blockNumber, blockHash, blockchainID, time.getTime(), asset.validatorSigs, recoverySig, function (result, theId, theHash) {
                                                                    
                                                                    while (mutex) { require('deasync').sleep(5000); }
                                                                    
                                                                    mutex = true;
                                                                    theNotifier.bcPreRequest(asset.pubKey, asset.proposalId, asset, blockNumber, blockHashVal, blockchainID, time.getTime(), asset.validatorSigs, recoverySig, asset.bigchainID, asset.bigchainHash, function (result, theId, theHash) {
                                                                        asset.bigchainID = theId;
                                                                        asset.bigchainHash = theHash;
                                                                        mutex = false;
                                                                        //if ica asset, edit all attestation files of those that have attested to the Ica.
                                                                        if (asset.propType == '2') {
                                                                            console.log("Ica sig edit");
                                                                            var attestors = asset.validatorSigs;
                                                                            for (var i = 0; i < attestors.length; i++) {
                                                                                theNotifier.getSignatures(attestors[i], function (sigFile) {
                                                                                    if (sigFile != undefined) {
                                                                                        for (var j = 0; j < sigFile.length; j++) {
                                                                                            if (sigFile[j].proposal_id == asset.proposalId) {
                                                                                                var l = 0;
                                                                                                var expiration = asset.validatorSigs[j][3];
                                                                                                theNotifier.deleteIcaEntry(asset.proposalId, attestors[j][2], function (result) {
                                                                                                    //theNotifier.attestIcaFile(pubKey, asset.proposalId, "recovery", time.getTime(), asset.gatekeeperAddr, expiration, theId, asset.assetID);
                                                                                                    theNotifier.createIcaSigNotification(attestors[j][2], asset.proposalId, attestors[j][3], theId, asset.assetID, pubKey);
                                                                                                    l++;
                                                                                                })
                                                                                            }
                                                                                        }
                                                                                    } 
                                                                                })
                                                                            }
                                                                        }
                                                                        writeAllAssets(asset, function () {
                                                                            if (asset.assetID == 'MyCOID' && asset.pubKey == pubKey) {
                                                                                var k = 0;
                                                                                for (var n = 0; n < asset.identityRecoveryIdList.length; n++) {
                                                                                    theNotifier.deleteRecoveryNotification(asset.proposalId, asset.identityRecoveryIdList[n], function (result) {
                                                                                        theNotifier.createRecoveryNotification(asset, recoveryObject.recoveryAddr, asset.identityRecoveryIdList[k])
                                                                                        k++;
                                                                                    })
                                                                                }
                                                                            }
                                                                            t++;
                                                                            raSync = false;
                                                                            console.log("owner t: " + t + " x: " + x);
                                                                            if (x >= max - 1 && t == totalAssets) { editDimensions(recoveryObject, function (result) { callback(result) }); console.log("DIMcallback"); }
                                                                            //if (x >= max-1 && t != total) { callback(false) }
                                                                        })
                                                                    }, asset.bigchainID, asset.bigchainHash)

                                                                })
                                                            }

                                                        });

                                                    }
                                                })
                                            }//end owned
                                            if (controlledAssets[x] != 'undefined' && typeof (controlledAssets[x]) != 'null' && x < controlledAssets.length) {
                                                var fileNameC = controlledAssets[x];
                                                var flag = 1;
                                                theNotifier.GetAsset(oldPubKey, fileNameC, flag, function (results) {
                                                    if (results) {
                                                        flag = 0;
                                                        if (fileNameC != "MyCOID.json" && oldPubKey != results.pubKey) {
                                                            console.log("\n\nRECOVERING CONTROLLED ASSET: " + fileNameC + "\n\n");
                                                            theNotifier.GetAsset(results.pubKey, fileNameC, flag, function (results2) {
                                                                if (results2) {
                                                                    var asset = results2;
                                                                    console.log("\n\nRESULTS2: " + results2);
                                                                    if (asset.ownerIdList.indexOf(oldHashedPubKey) >= 0 && asset.controlIdList.indexOf(oldHashedPubKey) >= 0) {
                                                                        t++;
                                                                        if (x == max && t == totalAssets) {
                                                                            editDimensions(recoveryObject, function (result) { callback(result) }); console.log("ctrlDIMcallback");
                                                                        }
                                                                    }
                                                                    else {
                                                                        var coidAddress = contractData['CoreIdentity'];
                                                                        var coidAbi = JSON.parse(fs.readFileSync("./abi/" + coidAddress));
                                                                        var coidContract = contractMgr.newContractFactory(coidAbi).at(asset.coidAddr);
                                                                        coidContract.setRecoveryState(function (error, result) {
                                                                            console.log("controller setrecovState: " + result)
                                                                            coidContract.recoverGetAll(function (error, result) {
                                                                                var coidData = result;
                                                                                console.log("\n\ncontroller recov data: " + coidData)
                                                                                coidContract.setInitState(function (error, result) {
                                                                                    console.log("setInitState: " + result)
                                                                                    var indexC = coidData[6].indexOf(oldHashedPubKey);
                                                                                    if (indexC != -1) { coidData[6][indexC] = hashedPubKey; }
                                                                                    coidContract.setControl(coidData[7], coidData[6], function (error, result) {
                                                                                        console.log("\nSETCONTROL\n");
                                                                                        if (asset.pubKey == oldPubKey) { asset.pubKey = pubKey }
                                                                                        if (oldHashedPubKey == asset.ownershipId) { asset.ownershipId = hashedPubKey }
                                                                                        if (oldHashedPubKey == asset.controlId) { asset.controlId = hashedPubKey }
                                                                                        var indexO = asset.ownerIdList.indexOf(oldHashedPubKey);
                                                                                        var indexC = asset.controlIdList.indexOf(oldHashedPubKey);
                                                                                        var indexR = asset.identityRecoveryIdList.indexOf(oldHashedPubKey);
                                                                                        if (indexR != -1) {
                                                                                            asset.identityRecoveryIdList[indexR] = hashedPubKey;
                                                                                            COIDcontract.setRecovery(coidData[8], coidData[9], function (error, result) { })
                                                                                        }
                                                                                        if (indexO != -1) { asset.ownerIdList[indexO] = hashedPubKey }
                                                                                        if (indexC != -1) { asset.controlIdList[indexC] = hashedPubKey }
                                                                                        coidContract.setActiveState(function (error, result) {
                                                                                            console.log("setActiveState: " + result)
                                                                                            console.log("\nCONTROLWRITE\n");
                                                                                            
                                                                                            while (mutex) { require('deasync').sleep(5000); }
                                                                                            
                                                                                            mutex = true;
                                                                                            theNotifier.bcPreRequest(asset.pubKey, asset.proposalId, asset, blockNumber, blockHashVal, blockchainID, time.getTime(), asset.validatorSigs, recoverySig, asset.bigchainID, asset.bigchainHash, function (result, theId, theHash) {
                                                                                                asset.bigchainID = theId;
                                                                                                asset.bigchainHash = theHash;
                                                                                                mutex = false;
                                                                                                writeAllAssets(asset, function () {
                                                                                                    t++;
                                                                                                    raSync = false;
                                                                                                    console.log("controller t: " + t + " x: " + x);
                                                                                                    if (x >= max - 1 && t == totalAssets) { editDimensions(recoveryObject, function (result) { callback(result) }); console.log("DIMcallback"); }
                                                                                                    //if (x == max && t != total) { callback(false) }
                                                                                                })
                                                                                            }, asset.bigchainID, asset.bigchainHash)
                                                                                        })
                                                                                    })//setcontrol
                                                                                })
                                                                            })
                                                                        })
                                                                    }//else
                                                                }

                                                            })
                                                        } else { t++; if (x >= max - 1 && t == totalAssets) { editDimensions(recoveryObject, function (result) { callback(result) }); console.log("ctrlDIMcallback"); } }
                                                    }
                                                })
                                            }//end controlled
                                            if (delegatedAssets[x] != 'undefined' && typeof (delegatedAssets[x]) != 'null' && x < delegatedAssets.length) {
                                                var fileName = delegatedAssets[x];
                                                var flag = 2;
                                                console.log("\n\nRECOVERING DELEGATED ASSET: " + fileName + "\n\n");
                                                theNotifier.GetAsset(oldPubKey, fileName, flag, function (results) {
                                                    if (results) {
                                                        flag = 0;
                                                        //get the original asset owned by another person
                                                        theNotifier.GetAsset(results.pubkey, fileName, flag, function (results2) {
                                                            if (results2) {
                                                                var asset = results2;
                                                                for (var y = 0; y < asset.delegations.length; y++) {
                                                                    if (asset.delegations[y].delegatee == oldHashedPubKey) { asset.delegatee = hashedPubKey }
                                                                }
                                                                //write Assets to all owners controllers and delegatees
                                                                theNotifier.bcPreRequest(asset.pubKey, asset.proposalId, asset, blockNumber, blockHashVal, blockchainID, time.getTime(), asset.validatorSigs, recoverySig, asset.bigchainID, asset.bigchainHash, function (result, theId, theHash) {
                                                                    asset.bigchainID = theId;
                                                                    asset.bigchainHash = theHash;
                                                                    writeAllAssets(asset, function () {
                                                                        t++;
                                                                        raSync = false;
                                                                        console.log("delegated t: " + t);
                                                                        if (x >= max - 1 && t == totalAssets) { editDimensions(recoveryObject, function (result) { callback(result) }); console.log("DIMcallback"); }
                                                                        //if (x == max && t != total) { callback(false) }
                                                                    })
                                                                }, asset.bigchainID, asset.bigchainHash)
                                                            }
                                                        })//end get asset
                                                    }
                                                })//end get asset
                                            }//end delegated
                                            //while (raSync) { require('deasync').sleep(2000); }//may be needed later to prevent too many contract creation calls at once
                                        }//for loop
                                    });//end gatekeeper

                                }

                            })//end get delegated assets
                        }

                    })//end get controlled assets
                }

            })//end get owned assets
        })// end edit signatures
    }//end recoverall

    function recoverCoid(recoveryObject, callback) {
        console.log("recovering coid");
        //coid contract variables
        var newOwner = recoveryObject.pubKey;
        var newOwnerHash = keccak_256(newOwner).toUpperCase();
        var oldOwner = recoveryObject.oldPubKey;
        var oldOwnerHash = keccak_256(oldOwner).toUpperCase();

        //make my new Coid contract
        var coidAddress = contractData['CoreIdentity'];
        var coidAbi = JSON.parse(fs.readFileSync("./abi/" + coidAddress));
        var coidContractFactory = contractMgr.newContractFactory(coidAbi);
        var oldCOIDAddress = recoveryObject.coidAddr;// check name
        var oldCOIDcontract = contractMgr.newContractFactory(coidAbi).at(oldCOIDAddress);
        var COIDcontract;
        //required bin file from monax
        var byteCode = fs.readFileSync("./CoreIdentity.bin");
        console.log("makeing coid contract")
        coidContractFactory.new({ data: byteCode }, function (error, contract) {
            if (error) {
                console.log("\nerror creating recovery contractn\n");
                throw error;
            }
            COIDcontract = contract;
            console.log("new coid contract addr: " + JSON.stringify(COIDcontract.address))

            //get new values-----------------------------------------------------------------------------------------------------------------------------
            oldCOIDcontract.setRecoveryState(function (error, result) {
                console.log("setrecovState: " + result)
                oldCOIDcontract.recoverGetAll(function (error, result) {
                    var coidData = result;
                    //console.log("recov data: " + coidData)
                    //set new values-----------------------------------------------------------------------------------------------------------------------------
                    if (recoveryObject.propType != '2') {
                        console.log("recov data: " + coidData)
                        COIDcontract.setUniqueID(coidData[0], coidData[1], coidData[2], coidData[3], function (error) {
                            //debugging function (getIt)
                            COIDcontract.getIt(function (error, result) {
                                console.log("setUniqueID: " + result);

                                var indexO = coidData[4].indexOf(oldOwnerHash);
                                if (indexO != -1) { coidData[4][indexO] = newOwnerHash; console.log("coid owner changed") }
                                COIDcontract.setOwnership(coidData[4], coidData[5], function (error) {
                                    //debugging function (getIt)
                                    COIDcontract.getIt(function (error, result) {
                                        console.log("setOwnership: " + result);

                                        var indexC = coidData[6].indexOf(oldOwnerHash);
                                        if (indexC != -1) { coidData[6][indexC] = newOwnerHash; console.log("coid controller changed") }
                                        COIDcontract.setControl(coidData[7], coidData[6], function (error) {

                                            //debugging function (getIt)
                                            COIDcontract.getIt(function (error, result) {
                                                console.log("setControl" + result);

                                                var indexR = coidData[8].indexOf(oldOwnerHash);
                                                if (indexR != -1) { coidData[8][indexR] = newOwnerHash; console.log("coid recoverer changed") }
                                                COIDcontract.setRecovery(coidData[8], coidData[9], function (error, result) {

                                                    //debugging function (getIt)
                                                    COIDcontract.getIt(function (error, result) {
                                                        console.log("setRecovery: " + result);

                                                        COIDcontract.StartCoid(function (error, result) {
                                                            console.log("startCoid1: " + result);
                                                            oldCOIDcontract.kill(function (error, result) { });
                                                            callback(COIDcontract.address);
                                                            //COIDcontract.recoverGetAll(function (error, results) {
                                                            //    for (var x = 0; x < results.length; x++) { console.log("New res " + x + ": \n" + results[x]) }
                                                            //})

                                                        })//end StartCoid

                                                    })//end getIT

                                                })//end setRecovery

                                            })//end getIT

                                        })//end setControl

                                    })//end getIT

                                })//end setOwnership

                            })//end getIT

                        })//end setUniqueID

                    }//end if prop
                    else {
                        console.log("recov data ICA: " + coidData)
                        COIDcontract.setUniqueID(coidData[0], coidData[1], coidData[2], coidData[3], function (error) {
                            //debugging function (getIt)
                            COIDcontract.getIt(function (error, result) {
                                console.log("setUniqueID: " + result);

                                var indexO = coidData[4].indexOf(oldOwnerHash);
                                if (indexO != -1) { coidData[4][indexO] = newOwnerHash; }
                                COIDcontract.setOwnership(coidData[4], coidData[5], function (error) {
                                    //debugging function (getIt)
                                    COIDcontract.getIt(function (error, result) {
                                        console.log("setOwnership: " + result);
                                        //needed to tansition to next contract state w/out creating token contracts
                                        COIDcontract.StartCoidIca(function (error, result) {
                                            console.log("startCoid1: " + result);
                                            oldCOIDcontract.kill(function (error, result) { });
                                            callback(COIDcontract.address);
                                        })//startcoid
                                    })//get it
                                })//set owner
                            })//getit
                        })//uid
                    }//end else
                })

            })
        })//end contract creation
    }

    function recoverMyGatekeeper(recoveryObject, callback) {
        console.log("recover gatekeeper");
        // contract variables
        var newOwner = recoveryObject.pubKey;
        var newOwnerHash = keccak_256(newOwner).toUpperCase();
        var oldOwner = recoveryObject.oldPubKey;
        var oldOwnerHash = keccak_256(oldOwner).toUpperCase();

        //make my new GK contract
        var gkAddress = contractData['MyGateKeeper'];
        var gkAbi = JSON.parse(fs.readFileSync("./abi/" + gkAddress));
        var gkContractFactory = contractMgr.newContractFactory(gkAbi);
        var oldGkAddress = recoveryObject.gkAddr;// need to check
        var myOldGkContract = contractMgr.newContractFactory(gkAbi).at(oldGkAddress);
        var myGkContract;
        var i = 0;
        var byteCode = fs.readFileSync("./MyGatekeeper.bin");
        gkContractFactory.new({ data: byteCode }, function (error, contract) {
            if (error) {
                console.log("\nerror creating recovery contract\n");
                throw error;
            }
            myGkContract = contract;
            console.log("new myGatekeeper contract addr: " + JSON.stringify(myGkContract))

            //transfer audit tral of old contract to new one
            //counter: the number of audit trail entries of the gatekeeper contract
            myOldGkContract.counter(function (error, result) {
                var counter = result;
                console.log("counter: " + counter);
                if (counter > 0) {
                    for (var index = 0; index < counter; index++) {
                        //since the audit trail is stored by proposal ID we need to get all of them
                        myOldGkContract.getProposalIdByIndex(index, function (error, result) {
                            var propId = result;
                            console.log("propID: " + propId);
                            myOldGkContract.getmyIdentityAuditTrail(propId, function (error, result) {
                                var auditTrail = result;
                                console.log("audit trail: " + auditTrail);
                                //have to use unhased public key for audit trail atm.....needs to be hashed
                                if (auditTrail[0] == oldOwner) { auditTrail[0] = newOwner; }
                                console.log("DOUBLE?");
                                myGkContract.setmyIdentityAuditTrail(propId, auditTrail[0], auditTrail[1], auditTrail[2], auditTrail[3], function (error, result) {
                                    i++;
                                    if (i == counter) {
                                        console.log("\n--------------GK CALLBACK----------------\n");
                                        myOldGkContract.kill(function (error, result) { });
                                        callback(myGkContract.address);
                                    }
                                })
                            })
                        })
                    }
                } else { callback(myGkContract.address); }//add a kill here
            })//counter
        })//end contract creation

    }//end recover gk

    function recoverDimensionControl(recoveryObject, callback) {
        console.log("recover dimensions");
        // contract variables
        var newOwner = recoveryObject.pubKey;
        var newOwnerHash = keccak_256(newOwner).toUpperCase();
        var oldOwner = recoveryObject.oldPubKey;
        var oldOwnerHash = keccak_256(oldOwner).toUpperCase();

        //make my new Dimension contract
        var dimCtrlAddress = contractData['IdentityDimensionControl'];
        var dimCtrlAbi = JSON.parse(fs.readFileSync("./abi/" + dimCtrlAddress));
        var dimCtrlContractFactory = contractMgr.newContractFactory(dimCtrlAbi);
        var oldDimCtrlAddress = recoveryObject.dimCtrlAddr;
        var oldDimCtrlContract = contractMgr.newContractFactory(dimCtrlAbi).at(oldDimCtrlAddress);
        console.log("oldDimCtrlAddr: " + oldDimCtrlContract);
        var dimCtrlContract;
        var byteCode = fs.readFileSync("./IdentityDimensionControl.bin");
        dimCtrlContractFactory.new({ data: byteCode }, function (error, contract) {
            if (error) {
                console.log("\nerror creating recovery contractn\n");
                throw error;
            }
            else {
                dimCtrlContract = contract;
                console.log("new identityDimensionControl contract addr: " + JSON.stringify(dimCtrlContract.address))

                //move old token contracts to new identity dimension control contract
                oldDimCtrlContract.getTokenAddr(function (error, result) {
                    console.log("token addr: " + result + "  error: " + error);
                    console.log("coidAddr: " + recoveryObject.coidAddr);
                    //Instantiate
                    dimCtrlContract.IdentityDimensionControlInstantiation(recoveryObject.coidAddr, result, function (err, result) {
                        if (err) { console.log("dimensioninstantiation error: " + err + "    res: " + result) }
                        else {
                            console.log("DimensionInstantiation: " + JSON.stringify(result))
                            oldDimCtrlContract.replaceTokenOwnerController(oldOwnerHash, newOwnerHash, function (error, result) {
                                console.log("replacetokenowner  error: " + error + "    res: " + result)
                                oldDimCtrlContract.getDimensionLength(function (error, result) {
                                    console.log("dimlength: " + result + "    err: " + error);
                                    var dimlength = result;
                                    var j = 0;
                                    if (dimlength > 0) {
                                        console.log("Edit dimensions loop");
                                        for (var x = 0; x < dimlength; x++) {
                                            oldDimCtrlContract.getGlobalsByIndex(x, function (error, result) {
                                                theNotifier.GetDimension(keccak_256(oldOwner), result[2] + '.json', 0, function (res) {
                                                    var dimensionFile = res;
                                                    if (dimensionFile.dimension.controllers == undefined) { dimensionFile.dimension.controllers = []; }
                                                    dimensionFile.dimension.coidAddr = recoveryObject.coidAddr;
                                                    dimensionFile.dimension.dimensionCtrlAddr = dimCtrlContract.address;
                                                    if (dimensionFile.dimension.pubKey == oldOwner) { dimensionFile.dimension.pubKey = newOwner }
                                                    //if (oldHashedPubKey == dimensionFile.ownershipId) { dimensionFile.ownershipId = newOwner }
                                                    //if (oldHashedPubKey == dimensionFile.controlId) { dimensionFile.controlId = newOwner }
                                                    var indexO = dimensionFile.dimension.owners.indexOf(keccak_256(oldOwner));
                                                    var indexC = dimensionFile.dimension.controllers.indexOf(keccak_256(oldOwner));
                                                    if (indexO != -1) { dimensionFile.dimension.owners[indexO] = keccak_256(newOwner) }
                                                    if (indexC != -1) { dimensionFile.dimension.controllers[indexC] = keccak_256(newOwner) }
                                                    for (var y = 0; y < dimensionFile.dimension.delegations.length; y++) {
                                                        if (dimensionFile.dimension.delegations[y].delegatee == keccak_256(oldOwner)) { dimensionFile.dimension.delegations[y].delegatee = keccak_256(newOwner) }
                                                        if (dimensionFile.dimension.delegations[y].owner == keccak_256(oldOwner)) { dimensionFile.dimension.delegations[y].owner = keccak_256(newOwner) }
                                                    }
                                                    writeAllDimensions(dimensionFile, function () {
                                                        console.log("writeall#: " + j)

                                                    })

                                                })
                                                dimCtrlContract.setGlobalsByIndex(x, result[0], result[1], result[2], function (error, result) {
                                                    console.log("setGlobalsByIndex: " + x);
                                                    j++;
                                                    if (j >= dimlength - 1) { oldDimCtrlContract.kill(function (error, result) { }); callback(dimCtrlContract.address); }
                                                    //find people who have delegated to owner and change delegation
                                                    //using digital twin in place of airbitz

                                                })
                                            })
                                        }
                                    } else { oldDimCtrlContract.kill(function (error, result) { }); callback(dimCtrlContract.address); }
                                })


                            })
                        }

                    })//end instatiation
                })

            }//end else

        })//end contract creation

    }//end recover dimension

    //add the new signature to all the old signed assets and label the old signature as 'recovered'
    function editSignatures(formdata, callback) {
        var pubKey = formdata.pubKey;
        var oldPubKey = formdata.oldPubKey;
        var hashedPubKey = keccak_256(pubKey);
        var oldHashedPubKey = keccak_256(oldPubKey);
        var signature = formdata.signature;
        var k = 0;
        var l = 0;
        var time = new Date();
        var msg = formdata.msg;
        var blockchainID = keccak_256(chain);
        //these 2 vars seem to not work atm
        var blockNumber = 0;
        var blockHash = 0;
        //var recoverySig = "recoverysig";
        var sync = true;//was causing invalid jump from bigchain without it

        //get the signature of the recovery app a.k.a the eris account
        createSignature('0r1e2c3o4v5e6r7y8', function (recoverySig, recoveryPubKey, recoveryHash) {
            theNotifier.getSignatures(oldPubKey, function (sigFile) {
                if (sigFile != undefined) {
                    console.log("Signature file:\n" + JSON.stringify(sigFile));
                    //loop through all assets that contain the old signature
                    //ADD asset name and owner pubkey to signature files
                    console.log("sigF length: " + sigFile.length);
                    for (var j = 0; j < sigFile.length; j++) {
                        sync = true;
                        //get file from original owners digital twin(not the person being recovered)
                        theNotifier.GetAsset(sigFile[j].owner, sigFile[j].assetId + '.json', 0, function (asset) {
                            console.log("signed asset:\n" + JSON.stringify(asset)); l++;
                            //asset.validatorSigs[1].splice(4,1);asset.validatorSigs.splice(0,1);//testing only
                            for (var y = 0; y < asset.validatorSigs.length; y++) {

                                if (asset.validatorSigs[y][2] == oldPubKey && asset.validatorSigs[y][4] != 'recovered') {
                                    //copy signature object from array, label new object as recovered/invalid,edit old signature with new signature
                                    var newSigObj = JSON.parse(JSON.stringify(asset.validatorSigs[y]));
                                    console.log("newsig \n" + JSON.stringify(newSigObj));
                                    newSigObj[4] = 'recovered';

                                    asset.validatorSigs.push(newSigObj);
                                    asset.validatorSigs[y][2] = pubKey;
                                    asset.validatorSigs[y][1] = signature;
                                    asset.validatorSigs[y][0] = msg;
                                    var expiration = asset.validatorSigs[y][3];
                                    console.log("\n\nL: " + l);
                                    console.log("Vsigs: " + JSON.stringify(asset.validatorSigs));
                                    //write changes to bigchain, digital twin asset folder, and digital twin attestations folder
                                    //bigchainPost(sigFile[l - 1].proposal_id, asset, blockNumber, blockHash, blockchainID, time.getTime(), asset.validatorSigs, recoverySig, function (result, theId, theHash) {
                                    theNotifier.bcPreRequest(asset.pubKey, sigFile[l - 1].proposalId, asset, blockNumber, blockHashVal, blockchainID, time.getTime(), asset.validatorSigs, recoverySig, asset.bigchainID, asset.bigchainHash, function (result, theId, theHash) {
                                        asset.bigchainID = theId;
                                        asset.bigchainHash = theHash;
                                        theNotifier.attestIcaFile(pubKey, sigFile[k].proposal_id, "recovery", time.getTime(), asset.gatekeeperAddr, expiration, theId, asset.assetID);
                                        writeAllAssets(asset, function () {
                                            sync = false;
                                            console.log("Write All Signatures")
                                            k++;
                                            if (k >= sigFile.length) { callback(recoverySig, recoveryPubKey, recoveryHash); }
                                        })
                                    }, asset.bigchainID, asset.bigchainHash)
                                }//if
                                //else{if( y >= asset.validatorSigs.length-1){callback(recoverySig, recoveryPubKey, recoveryHash);}}//only testing
                            }//for
                        })//notifier
                        while (sync) { require('deasync').sleep(10000); }// may not be needed if all signed assets have to be different asset files
                    }//for
                } else { callback(recoverySig, recoveryPubKey, recoveryHash); }
            })//getsig
        })//end create signature
    }//end edit sigs



    // edit controlled and delegated dimension
    // owned dimensions require a coid made sense to recover those when we generate a new coid
    // all the contracts we edit here do not belong to the identity being recovered
    function editDimensions(formdata, callback) {
        var pubKey = formdata.pubKey;
        var oldPubKey = formdata.oldPubKey;
        var hashedPubKey = keccak_256(pubKey);
        var oldHashedPubKey = keccak_256(oldPubKey);
        var ownedAssets;
        var controlledAssets;
        var delegatedAssets;
        //var dimCtrlAddress = formdata.dimCtrlAddr;


        console.log("Edit dimensions JSON");

        theNotifier.GetAllControlledDimensions(oldPubKey, function (result) {
            if (result) {
                controlledAssets = result.data;
                theNotifier.GetAllDelegatedDimensions(oldPubKey, function (result) {
                    if (result) {
                        delegatedAssets = result.data;
                        //looping vars
                        var max = Math.max(delegatedAssets.length, controlledAssets.length);
                        var total = controlledAssets.length + delegatedAssets.length;
                        var t = 0;
                        if (total > 0) {
                            //get the owner for each asset, get the asset, edit the asset, under owner name call writeAllAssets()
                            for (var x = 0; x < max; x++) {

                                if (x < controlledAssets.length && controlledAssets[x] != 'undefined') {
                                    //var controllerkey = controlledAssets[x].pubKey;
                                    var fileNameC = controlledAssets[x];
                                    var flag = 1;
                                    theNotifier.GetDimension(oldHashedPubKey, fileNameC, flag, function (results) {
                                        if (results) {
                                            flag = 0;
                                            theNotifier.GetDimension(results.dimension.owners[0], fileNameC, flag, function (results2) {
                                                if (results2) {
                                                    var asset = results2;
                                                    console.log("Controlled Dimension: " + JSON.stringify(asset));
                                                    if (asset.dimension.owners.indexOf(oldHashedPubKey) >= 0 && asset.dimension.controllers.indexOf(oldHashedPubKey) >= 0) {
                                                        t++;
                                                        if (x >= max - 1 && t == total) { callback(true) }
                                                    }
                                                    else {
                                                        var ownerDimCtrlContract = contractMgr.newContractFactory(dimCtrlAbi).at(asset.dimension.dimensionCtrlAddr);
                                                        ownerDimCtrlContract.replaceTokenOwnerController(oldHashedPubKey, hashedPubKey, function (error, result) {
                                                            if (result) { console.log("replacedTokenOwnerController: " + result) }
                                                            else { console.log("errorTokenOwnerController: " + error) }
                                                        })
                                                        ownerDimCtrlContract.replaceTokenDelegatee(oldHashedPubKey, hashedPubKey, function (error, result) { })
                                                        if (asset.dimension.pubKey == oldPubKey) { asset.dimension.pubKey = pubKey }
                                                        var indexO = asset.dimension.owners.indexOf(oldHashedPubKey);
                                                        var indexC = asset.dimension.controllers.indexOf(oldHashedPubKey);
                                                        var indexDC = asset.dimension.dim_controllers_keys.indexOf(oldHashedPubKey);
                                                        if (indexO != -1) { asset.dimension.owners[indexO] = hashedPubKey }
                                                        if (indexC != -1) { asset.dimension.controllers[indexC] = hashedPubKey }
                                                        if (indexDC != -1) { asset.dimension.controllers[indexDC] = hashedPubKey }
                                                        for (var y = 0; y < asset.dimension.delegations.length; y++) {
                                                            if (asset.dimension.delegations[y].delegatee == oldHashedPubKey) { asset.dimension.delegations[y].delegatee = hashedPubKey }
                                                            if (asset.dimension.delegations[y].owner == oldHashedPubKey) { asset.dimension.delegations[y].owner = hashedPubKey }
                                                        }
                                                        writeAllDimensions(asset, function () {
                                                            t++;
                                                            if (x >= max - 1 && t == total) { callback(true) }
                                                        })
                                                    }//else
                                                }
                                            })
                                        }
                                    })
                                }//end controlled
                                if (x < delegatedAssets.length && delegatedAssets[x] != 'undefined') {
                                    var fileName = delegatedAssets[x];
                                    var flag = 2;
                                    console.log("filename: " + fileName);
                                    theNotifier.GetDimension(oldHashedPubKey, fileName, flag, function (results) {
                                        if (results) {
                                            console.log(result)
                                            flag = 0;
                                            theNotifier.GetDimension(results.dimension.owners[0], fileName, flag, function (results2) {
                                                if (results2) {
                                                    var asset = results2;
                                                    //var dimCtrlAddress = asset.dimCtrlAddr;//may need to change
                                                    var ownerDimCtrlContract = contractMgr.newContractFactory(dimCtrlAbi).at(asset.dimension.dimensionCtrlAddr);
                                                    ownerDimCtrlContract.replaceTokenDelegatee(oldHashedPubKey, hashedPubKey, function (error, result) {
                                                        if (result) { console.log("replacedTokenDelegatee: " + result) }
                                                        else { console.log("errorTokenDelegatee: " + error) }
                                                    })
                                                    if (asset.dimension.pubKey == oldPubKey) { asset.pubKey = pubKey }
                                                    for (var y = 0; y < asset.dimension.delegations.length; y++) {
                                                        if (asset.dimension.delegations[y].delegatee == oldHashedPubKey) { asset.dimension.delegations[y].delegatee = hashedPubKey }
                                                    }
                                                    console.log("asset: \n" + asset)
                                                    //write dimension to all owners controllers and delegatees
                                                    writeAllDimensions(asset, function () {
                                                        t++;
                                                        if (x >= max - 1 && t == total) { callback(true) }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }//end delegated

                            }//for loop
                        } else { callback(true) }

                    }

                })
            }

        })


    }//end edit dimensions


}//end eventListener
var listening = new eventListener();

app.post("/startRecoveryBallot", function (req, res) {
    console.log("reached startrecovery endpoint:\n" + JSON.stringify(req.body));
    var formdata = req.body;
    var recoveryAddr;
    var gkAddr;
    var coidAddr;
    var isHuman = true;
    var recov;
    var initatorKey = formdata.recoverer;
    var initatorSig = formdata.recovererSignature;
    var msg = formdata.msg;
    var propId = formdata.proposalID;
    var verifyObj = { msg: msg, sig: initatorSig, pubKey: initatorKey }
    var newPubKey = formdata.newPubKey;

    theNotifier.getRecovery(initatorKey, propId, function (result) {
        if (result) {
            console.log("getRecov:\n" + JSON.stringify(result))
            var recoveryObj = result
            recoveryAddr = result.recoveryAddr;
            gkAddr = result.gatekeeperAddr;
            coidAddr = result.coidAddr;
            isHuman = result.isHuman;
            recov = new Recovery(recoveryAddr);
            recov.verifyIt(verifyObj, function (verified) {
                console.log("verify: " + verified);
                if (verified == true || verified == 'true') {
                    recov.confirmRecoverer(keccak_256(initatorKey), coidAddr, function (result) {
                        if (result) {
                            recoveryObj.newPubKey = newPubKey;
                            console.log("recovObj:\n" + JSON.stringify(recoveryObj));
                            recoveryObj.msg = msg;
                            recoveryObj.signature = sig;
                            recoveryObj.recoverer = initatorKey;
                            recoveryObj.recovererSignature = initatorSig;
                            recov.startBallot(recov.ballotAddress, gkAddr, coidAddr, isHuman, function (result) {
                                if (result) {
                                    formdataArray.push(recoveryObj);
                                    IDArray.push(result);
                                    res.send("Ballot sent");
                                }
                                else { res.send("Ballot error: " + error); }
                            });
                        }
                        else { res.send("Recoverer not confirmed"); }
                    })

                }
                else { res.send("Recoverer not verified"); }
            })//end verifyit

        }
        else { res.send("No recovery file found"); }
    });



})

app.listen(3008, function () {
    console.log("Connected to contract http://10.101.114.231:1337/rpc");
    console.log("Listening on port 3008");
})
