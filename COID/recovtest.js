'use strict'

var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json');

var erisContracts = require('eris-contracts')
var fs = require('fs')
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

var Web3 = require('web3')
var web3 = new Web3(chainConfig.chainURL);
web3.setProvider(chainConfig.chainURL);

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
console.log("Provider: " + web3.eth.currentProvider);
//var contractByteCode=fs.readFileSync("./Recovery.bin");// = web3.eth.getCode('C38C22F0942518191B8AB4287DEC2B453369D999');//fs.readFileSync("./Recovery.bin");
//var code = "603d80600c6000396000f3007c01000000000000000000000000000000000000000000000000000000006000350463c6888fa18114602d57005b6007600435028060005260206000f3";
//var MyGKaddr = '2EE51E81DABB330CE43C927BDF82B8A7B6234ECB';
var chain = 'primaryAccount';
var erisdburl = chainConfig.chainURL;
var contractData = require("./epm.json");
var contractAbiAddress = contractData['Recovery'];
var erisAbi = JSON.parse(fs.readFileSync("./abi/" + contractAbiAddress));
var accountData = require("./accounts.json");
var contractMgr = erisContracts.newContractManagerDev(erisdburl, chainConfig[chain]);
//var recoveryContract = web3.contract.Contract(erisAbi).at('9F008B829DA7AFB6DCDD64EC3D84DF22BDD85BF7')//contractMgr.newContractFactory(erisAbi).at('9F008B829DA7AFB6DCDD64EC3D84DF22BDD85BF7');
var recoveryContractFactory = contractMgr.newContractFactory(erisAbi);
var dimCtrlAddress = contractData['IdentityDimensionControl'];
var dimCtrlAbi = JSON.parse(fs.readFileSync("./abi/" + dimCtrlAddress));
console.log("--------------------------------------------------------------------");


var recoveryObject = {
    pubKey: "03f29dad99b4f9f6de255672a751240db618ce1a3c35614553ef246bfcf40e6e89",
    oldPubKey: "02a6f23f064cce4575792fb0c70d2692951d62092109cb16e740a520312d6a1b67",
    gkAddr: "2685D2E2CC8DF8FCE6DD97C121CE89F1C2B2C2A6"
};


recoverAll(recoveryObject, function (result) {
    console.log("Recoverall result: " + result);
});

function recoverAll(recoveryObject, callback) {
    var pubKey = recoveryObject.pubKey;
    var oldPubKey = recoveryObject.oldPubKey;
    var hashedPubKey = keccak_256(pubKey);
    var oldHashedPubKey = keccak_256(oldPubKey);
    var ownedAssets;
    var controlledAssets;
    var delegatedAssets;



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
                                //get the owner for each asset, get the asset, edit the asset, under owner name call writeAllAssets()
                                console.log("recoverall loop max: " + max + " total: " + totalAssets);
                                for (var x = 0; x < max; x++) {
                                    console.log("x: " + x + "  owned: " + ownedAssets[x] + "   controlled: " + controlledAssets[x])
                                    if (ownedAssets[x] != 'undefined' && typeof (ownedAssets[x]) != 'null' && x < ownedAssets.length) {
                                        //var ownerkey = ownedAssets[x].pubKey;
                                        var fileName = ownedAssets[x];
                                        var flag = 0;
                                        theNotifier.GetAsset(oldPubKey, fileName, flag, function (results) {
                                            if (results) {
                                                var asset = results;
                                                var recovCoidObject = { "oldPubKey": oldPubKey, "pubKey": pubKey, "coidAddr": asset.coidAddr };
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
                                                            writeAllAssets(asset, function () {
                                                                t++;
                                                                console.log("owner t: " + t);
                                                                if (x >= max - 1 && t == totalAssets) { editDimensions(recoveryObject, function (result) { callback(result) }); console.log("DIMcallback"); }
                                                                //if (x >= max-1 && t != total) { callback(false) }
                                                            })
                                                        })
                                                    }

                                                });

                                            }
                                        })
                                    }//end owned
                                    if (controlledAssets[x] != 'undefined' && typeof (controlledAssets[x]) != 'null' && x < controlledAssets.length) {
                                        //var controllerkey = oldPubKey;
                                        var fileName = controlledAssets[x];
                                        var flag = 1;
                                        theNotifier.GetAsset(oldPubKey, fileName, flag, function (results) {
                                            if (results) {
                                                flag = 0;
                                                if (fileName != "MyCOID.json" && oldPubKey == results.pubkey) {
                                                    theNotifier.GetAsset(results.pubkey, fileName, flag, function (results2) {
                                                        if (results2) {
                                                            var asset = results2;
                                                            var coidContract = contractMgr.newContractFactory(coidAbi).at(asset.coidAddr);
                                                            coidContract.recoverGetAll(function (error, result) {
                                                                var coidData = result;
                                                                console.log("recov data" + coidData)
                                                                var indexC = coidData[6].indexOf(oldOwnerHash);
                                                                if (indexC != -1) { coidData[6][indexC] = newOwnerHash; }
                                                                coidContract.setControl(coidData[7], coidData[6], function (error) { console.log("\nSETCONTROL\n"); })
                                                                if (asset.pubKey == oldPubKey) { asset.pubKey = pubkey }
                                                                if (oldHashedPubKey == asset.ownershipId) { asset.ownershipId = hashedPubKey }
                                                                if (oldHashedPubKey == asset.controlId) { asset.controlId = hashedPubKey }
                                                                var indexO = asset.ownerIdList.indexOf(oldHashedPubKey);
                                                                var indexC = asset.controlIdList.indexOf(oldHashedPubKey);
                                                                if (indexO != -1) { asset.ownerIdList[indexO] = hashedPubKey }
                                                                if (indexC != -1) { asset.controlIdList[indexC] = hashedPubKey }
                                                                console.log("\nCONTROLWRITE\n");
                                                                writeAllAssets(asset, function () {
                                                                    t++;
                                                                    console.log("controller t: " + t);
                                                                    if (x >= max - 1 && t == totalAssets) { editDimensions(recoveryObject, function (result) { callback(result) }); console.log("DIMcallback"); }
                                                                    //if (x == max && t != total) { callback(false) }
                                                                })
                                                            })

                                                        }
                                                    })
                                                } else { t++; if (x == max && t == totalAssets) { editDimensions(recoveryObject, function (result) { callback(result) }); console.log("ctrlDIMcallback"); } }
                                            }
                                        })
                                    }//end controlled
                                    if (delegatedAssets[x] != 'undefined' && typeof (delegatedAssets[x]) != 'null' && x < delegatedAssets.length) {
                                        //var delegateekey = delegatedAssets[x].pubKey;
                                        var fileName = delegatedAssets[x];
                                        var flag = 2;
                                        theNotifier.GetAsset(oldPubKey, fileName, flag, function (results) {
                                            if (results) {
                                                flag = 0;
                                                //get the original asset owned by another person
                                                theNotifier.GetAsset(results.pubkey, fileName, flag, function (results2) {
                                                    if (results2) {
                                                        var asset = results2;
                                                        // if (asset.pubKey == formdata.oldPubKey) { asset.pubKey = pubkey }
                                                        // if (oldHashedPubKey == asset.ownershipId) { asset.ownershipId = hashedPubKey }
                                                        // if (oldHashedPubKey == asset.controlId) { asset.controlId = hashedPubKey }
                                                        // indexO = asset.ownerIdList.indexOf(oldHashedPubKey);
                                                        // indexC = asset.controlIdList.indexOf(oldHashedPubKey);
                                                        // if (indexO != -1) { asset.ownerIdList[indexO] = hashedPubKey }
                                                        // if (indexC != -1) { asset.controlIdList[indexC] = hashedPubKey }
                                                        for (var y = 0; y < asset.delegations.length; y++) {
                                                            if (asset.delegations[y].delegatee == oldHashedPubKey) { asset.delegatee = hashedPubKey }
                                                        }
                                                        //write Assets to all owners controllers and delegatees
                                                        writeAllAssets(asset, function () {
                                                            t++;
                                                            console.log("delegated t: " + t);
                                                            if (x >= max - 1 && t == totalAssets) { editDimensions(recoveryObject, function (result) { callback(result) }); console.log("DIMcallback"); }
                                                            //if (x == max && t != total) { callback(false) }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }//end delegated

                                }//for loop
                            });//end gatekeeper

                        }

                    })
                }

            })
        }

    })
}

function recoverCoid(recoveryObject, callback) {
    console.log("recover coid");
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
        oldCOIDcontract.recoverGetAll(function (error, result) {
            var coidData = result;
            console.log("recov data" + coidData)
            //set new values-----------------------------------------------------------------------------------------------------------------------------
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

                            var indexC = coidData[6].indexOf(oldOwnerHash);
                            if (indexC != -1) { coidData[6][indexC] = newOwnerHash; }
                            COIDcontract.setControl(coidData[7], coidData[6], function (error) {

                                //debugging function (getIt)
                                COIDcontract.getIt(function (error, result) {
                                    console.log("setControl" + result);

                                    var indexR = coidData[8].indexOf(oldOwnerHash);
                                    if (indexR != -1) { coidData[8][indexR] = newOwnerHash; }
                                    COIDcontract.setRecovery(coidData[8], coidData[9], function (error, result) {

                                        //debugging function (getIt)
                                        COIDcontract.getIt(function (error, result) {
                                            console.log("setRecovery: " + result);

                                            COIDcontract.StartCoid(function (error, result) {
                                                console.log("startCoid1: " + result);
                                                callback(COIDcontract.address);
                                                COIDcontract.recoverGetAll(function (error, results) {
                                                    for (var x = 0; x < results.length; x++) { console.log("New res " + x + ": \n" + results[x]) }
                                                })

                                            })//end StartCoid

                                        })//end getIT

                                    })//end setRecovery

                                })//end getIT

                            })//end setControl

                        })//end getIT

                    })//end setOwnership

                })//end getIT

            })//end setUniqueID

        })//end setUniqueID


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
    var byteCode = fs.readFileSync("./MyGatekeeper.bin");
    gkContractFactory.new({ data: byteCode }, function (error, contract) {
        if (error) {
            console.log("\nerror creating recovery contract\n");
            throw error;
        }
        myGkContract = contract;
        console.log("new myGatekeeper contract addr: " + JSON.stringify(myGkContract))


        myOldGkContract.counter(function (error, result) {
            var counter = result;
            for (var index = 0; index < counter; index++) {
                myOldGkContract.getProposalIdByIndex(index, function (error, result) {
                    var propId = result;
                    myOldGkContract.getmyIdentityAuditTrail(propId, function (error, result) {
                        var auditTrail = result;
                        //have to use unhased public key for audit trail atm.....needs to be hashed
                        if (auditTrail[0] == oldOwner) { auditTrail[0] = newOwner; }
                        myGkContract.setmyIdentityAuditTrail(propId, auditTrail[0], auditTrail[1], auditTrail[2], auditTrail[3], function (error, result) {
                            callback(myGkContract.addresss);
                        })
                    })
                })
            }
        })
    })//end contract creation

}

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
                                                if (j >= dimlength - 1) { callback(dimCtrlContract.address); }
                                                //find people who have delegated to owner and change delegation
                                                //using digital twin in place of airbitz

                                            })
                                        })
                                    }
                                } else { callback(dimCtrlContract.address); }
                            })


                        })
                    }

                })//end instatiation
            })






        }//end else

    })//end contract creation



}//end recover dimension



function editAssets(formdata, callback) {


}//end edit assets


// edit controlled and delegated dimension
// owned dimensions require a coid made sense to recover those when we generate a new coid
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
                    //max = Math.max(delegatedAssets.length, max);
                    var total = controlledAssets.length + delegatedAssets.length;
                    var t = 0;
                    //get the owner for each asset, get the asset, edit the asset, under owner name call writeAllAssets()
                    for (var x = 0; x < max; x++) {

                        if (x < controlledAssets.length && controlledAssets[x] != 'undefined') {
                            //var controllerkey = controlledAssets[x].pubKey;
                            var fileName = controlledAssets[x];
                            var flag = 1;
                            theNotifier.GetDimension(oldHashedPubKey, fileName, flag, function (results) {
                                if (results) {
                                    flag = 0;
                                    theNotifier.GetDimension(results.dimension.owners[0], fileName, flag, function (results2) {
                                        if (results2) {
                                            var asset = results2;
                                            var ownerDimCtrlContract = contractMgr.newContractFactory(dimCtrlAbi).at(asset.dimension.dimensionCtrlAddr);
                                            ownerDimCtrlContract.replaceTokenOwnerController(oldHashedPubKey, hashedPubKey, function (error, result) {
                                                if (result) { console.log("replacedTokenOwnerController: " + result) }
                                                else { console.log("errorTokenOwnerController: " + error) }
                                            })
                                            ownerDimCtrlContract.replaceTokenDelegatee(oldHashedPubKey, hashedPubKey, function (error, result) { })
                                            if (asset.dimension.pubKey == oldPubKey) { asset.dimension.pubKey = pubkey }
                                            //if (oldHashedPubKey == asset.dimension.ownershipId) { asset.dimension.ownershipId = hashedPubKey }
                                            //if (oldHashedPubKey == asset.dimension.controlId) { asset.dimension.controlId = hashedPubKey }
                                            var indexO = asset.dimension.owners.indexOf(oldHashedPubKey);
                                            var indexC = asset.dimension.controllers.indexOf(oldHashedPubKey);
                                            if (indexO != -1) { asset.dimension.owners[indexO] = hashedPubKey }
                                            if (indexC != -1) { asset.dimension.controllers[indexC] = hashedPubKey }
                                            for (var y = 0; y < asset.dimension.delegations.length; y++) {
                                                if (asset.dimension.delegations[y].delegatee == oldHashedPubKey) { asset.dimension.delegations[y].delegatee = hashedPubKey }
                                                if (asset.dimension.delegations[y].owner == oldHashedPubKey) { asset.dimension.delegations[y].owner = hashedPubKey }
                                            }
                                            writeAllDimensions(asset, function () {
                                                t++;
                                                if (x >= max - 1 && t == total) { callback(true) }
                                                //if (x == max && t != total) { callback(false) }
                                            })
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
                                            if (asset.dimension.pubKey == oldPubKey) { asset.pubKey = pubkey }
                                            //if (oldHashedPubKey == asset.ownershipId) { asset.ownershipId = hashedPubKey }
                                            //if (oldHashedPubKey == asset.controlId) { asset.controlId = hashedPubKey }
                                            //var indexO = asset.dimension.owners.indexOf(oldHashedPubKey);
                                            //var indexC = asset.dimension.controllers.indexOf(oldHashedPubKey);
                                            //if (indexO != -1) { asset.dimension.owners[indexO] = hashedPubKey }
                                            //if (indexC != -1) { asset.dimension.controllers[indexC] = hashedPubKey }
                                            for (var y = 0; y < asset.dimension.delegations.length; y++) {
                                                if (asset.dimension.delegations[y].delegatee == oldHashedPubKey) { asset.dimension.delegations[y].delegatee = hashedPubKey }
                                            }
                                            console.log("asset: \n" + asset)
                                            //write dimension to all owners controllers and delegatees
                                            writeAllDimensions(asset, function () {
                                                t++;
                                                if (x >= max - 1 && t == total) { callback(true) }
                                                //if (x == max && t != total) { callback(false) }
                                            })
                                        }
                                    })
                                }
                            })
                        }//end delegated

                    }//for loop

                }

            })
        }

    })


}//end edit dimensions


