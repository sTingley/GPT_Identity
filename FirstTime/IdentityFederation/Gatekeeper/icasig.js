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

var writeToOwner = function (pubKey, assetID, txnID, txnHash, revokeSig, callback) {

    console.log("ASSET ID IS: " + assetID);
    superAgent.post(twinUrl + "/setAsset")
        .send({
            "pubKey": keccak_256(pubKey),
            "flag": 0,
            "fileName": assetID + ".json",
            "updateFlag": 1,
            "keys": ["bigchainID", "bigchainHash", "revocationSignatures"],
            "values": [txnID, txnHash, revokeSig]
        })
        .set('Accept', 'application/json')
        .end((err, res) => {
            // if(res.status == 200){
            console.log("Written to ICA Asset")
            callback();
            // }
        });
};

var writeToOwner2 = function (pubKey, assetID, txnID, txnHash, attestSig, callback) {

    console.log("ASSET ID IS: " + assetID);
    superAgent.post(twinUrl + "/setAsset")
        .send({
            "pubKey": keccak_256(pubKey),
            "flag": 0,
            "fileName": assetID + ".json",
            "updateFlag": 1,
            "keys": ["bigchainID", "bigchainHash", "validatorSigs"],
            "values": [txnID, txnHash, attestSig]
        })
        .set('Accept', 'application/json')
        .end((err, res) => {
            // if(res.status == 200){
            console.log("Written to ICA Asset")
            callback()
            // }
        });
};

var revokeIcaFile = function (pubKey, proposalId) {

    superAgent.post(twinUrl + "/signature/revokeIcaFile")
        .send({
            "pubKey": keccak_256(pubKey),
            "proposal_id": proposalId
        })
        .set('Accept', 'application/json')
        .end((err, res) => {
            // if(res.status == 200){
            console.log("Written to ICA File")
            // }
        });
};

var attestIcaFile = function (pubKey, proposalId, message, timestamp, gatekeeperAddr, sigExpire, txid, assetId) {

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

var GetAsset = function (pubKey, fileName, flag, callback) {
    superAgent.post(twinUrl + "/getAsset")
        .send({
            "pubKey": pubKey,
            "fileName": fileName + ".json",
            "flag": flag,
        })
        .set('Accept', 'application/json')
        .end((err, res) => {
            if (res.status == 200) {
                console.log("GET ASSET RETURNED: " + JSON.stringify(res.body) + "\n")
                var result = res.body;
                callback(result);
            }
        });
}

var updateDimensionEntry = function (formdata, callback) {
    superAgent.post(twinUrl + "/dimensions/updateEntry")
        .send(formdata)
        .set('Accept', 'application/json')
        .end((err, res) => {
            if (res.status == 200) {
                console.log("UPDAT ASSET: " + JSON.stringify(res.body) + "\n")
                var result = res.body;
                callback(result);
            }
        });
}


var bcPreRequest = function (pubKey, proposalId, data, blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, serviceSig, bigchainID, bigchainHash, callback) {
    console.log("params:\n" + pubKey);
    superAgent.post(twinUrl + "/bigchain/preRequest")
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

var bcGetRequest = function (pubKey, txid, callback) {
    console.log("params:\n" + pubKey);
    superAgent.post(twinUrl + "/bigchain/getRequest")
        .send({
            "pubKey": pubKey,
            "txid": txid
        })
        .set('Accept', 'application/json')
        .end((err, res) => {
            if (res.status == 200) {
                console.log("Bigchain Get successfully recieved:\n" + JSON.parse(res.text).getResult.response);
                callback(JSON.parse(res.text).getResult, res.text.getId, res.text.getHash);
            }
        });
};


var updateAttestations = function (txid) {

}

//var updateDimension = function (formdata) {
// var pubKey = formdata.pubKey;
// var dimensionName = formdata.type;
// var ID = formdata.ID;
// var descriptor = formdata.descriptor;
// var attribute = web3.toHex(formdata.attribute);
// var flag = formdata.flag;
// console.log("----------UPDATE ENTRY--------------");
// console.log("PUBKEY :" + pubKey);
// console.log("TYPE :" + type);
// console.log("ID :" + ID);
// console.log("DESCRIPTOR :" + descriptor);
// console.log("ATTRIBUTE :" + attribute);
// var attribute3 = attribute.substr(132);
// var attribute2 = attribute.substr(66, 66);
// var attribute = attribute.substr(0, 66);
// //dimension contract
// this.dimensionAddress = this.contractData['dimension'];
// // console.log("this is the ballot address: " + this.ballotAddress);
// this.dimensionAbi = JSON.parse(fs.readFileSync("./abi/" + this.dimensionAddress));
// this.dimensionContract = this.contractMgr.newContractFactory(this.dimensionAbi).at(formdata.dimensionCtrlAddr);

// this.dimensioncontract.updatEntry(pubKey, web3.toHex(dimensionName), web3.toHex(ID), web3.toHex(descriptor), attribute, attribute2, attribute3, flag, function () {
//     console.log("Contract call updateEntry complete")
// })




//}

var IcaSig = function () {

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
    var _this = this;

    this.verifyIt = function (formdata) {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var pubKey = formdata.pubKey;
        var sync = true;
        var isValidResult = false;
        console.log("you have reached verifyIt internal function")
        console.log(msg)
        console.log(sig)
        console.log(pubKey)
        _this.VerificationContract.VerificationQuery(msg, sig, pubKey, function (error, result) {

            var elEvento;

            _this.VerificationContract.CallbackReady(function (error, result) { elEvento = result; }, function (error, result) {
                if (_this.ErisAddress = result.args.addr) {
                    _this.VerificationContract.myCallback(function (error, result) {

                        elEvento.stop();
                        console.log("Received response from VerifyIt :" + result + "...if that says false, you should not be able to Result0,etc.!!!");
                        isValidResult = result;
                        sync = false;
                    })//end myCallback

                }
            })  //end CallbackReady.once


        })//end VerificationQuery

        while (sync) { require('deasync').sleep(100); }
        return isValidResult;
    } //end verification

    this.bigchainGet = function (txid, callback) {
        var thePubkey = this.ErisAddress;
        var bigchainEndpoint = 'getTransaction/' + txid;
        var theobj = { "method": "GET", "stringJsonData": "", "endpoint": bigchainEndpoint }
        console.log("Bigchain Request: " + JSON.stringify(theobj))

        _this.bigchain_contract.BigChainQuery(JSON.stringify(theobj), function (error, result) {

            var theEvent;
            _this.bigchain_contract.CallbackReady(function (error, result) {
                theEvent = result;
            },
                function (error, result) {

                    if (thePubkey == result.args.addr) {
                        console.log("callbackready: " + JSON.stringify(result))

                        _this.bigchain_contract.myCallback(function (error, result) {

                            console.log("RESULT: " + result);
                            var bigchainID = JSON.parse(result).response;
                            console.log("\nResult.response: " + bigchainID)
                            bigchainID = JSON.parse(bigchainID).id;
                            var bigchainHash = keccak_256(JSON.parse(result).response);

                            var signature = JSON.parse(result).signature
                            var msg = JSON.parse(result).msg
                            var pubKey = JSON.parse(result).pubKey
                            console.log("pubkey returns is ......: " + pubKey)

                            //verify oraclizer signature
                            var logme = ed25519.Verify(new Buffer(msg), new Buffer(signature, "hex"), new Buffer(pubKey, "hex"))
                            console.log(logme)

                            //for debugging--ignore:
                            if (logme == true) {
                                console.log("logme is the bool true");
                            }
                            else {
                                console.log("logme is not bool true but if this says true, it is a string: " + logme)
                            }

                            callback(result, bigchainID, bigchainHash)

                            //stop event listening
                            theEvent.stop();

                        })//end calling of myCallback

                    }//end if statement

                })//end callback listening

        })//end bigchain query
    }

    this.bigchainPost = function (proposalID, coidData, coidGKAddress, coidAddr, dimensionCtrlAddr, blockNumber, blockHash, blockchainID, timestamp, validatorSigs, gatekeeperSig, callback) {

        //get public key
        var thePubkey = this.ErisAddress;
        //var thePubkey = _this.ErisAddress;
        console.log("In function bigchainIt, pubKey of eris account is: " + thePubkey)

        var description = "Core Identity"

        //NOTE: signatures inputted to this object should include msg hash, signature and public key
        //NOTE: Coid_Data should include uniqueID and the signature of the one requesting a core identity
        var bigchainInput = {
            "Description": description,
            "proposalID": proposalID,
            "Coid_Data": coidData,
            "coidGK_Address": coidGKAddress,
            "coid_Address": coidAddr,
            "dimensionCtrlAddr": dimensionCtrlAddr,
            "blockNumber": blockNumber,
            "blockHash": blockHash,
            "blockchainID": blockchainID,
            "blockchain_timestamp": timestamp,
            "validator_signatures": validatorSigs,
            "GateKeeper_signature": gatekeeperSig
        };//end json struct


        bigchainInput = JSON.stringify({ "data": bigchainInput, "metadata": "null" })


        console.log("In function bigchainIt, the input to be sent to bigchain is: " + bigchainInput)

        var bigchainEndpoint = 'addData/' + thePubkey + '/1'
        var theobj = { "method": "POST", "stringJsonData": bigchainInput, "endpoint": bigchainEndpoint }
        console.log("Bigchain Request: " + JSON.stringify(theobj))

        _this.bigchain_contract.BigChainQuery(JSON.stringify(theobj), function (error, result) {

            var theEvent;
            _this.bigchain_contract.CallbackReady(function (error, result) {
                theEvent = result;
            },
                function (error, result) {

                    if (thePubkey == result.args.addr) {

                        _this.bigchain_contract.myCallback(function (error, result) {

                            console.log("RESULT: " + result);
                            var bigchainID = JSON.parse(result).response;
                            bigchainID = JSON.parse(bigchainID).id;
                            var bigchainHash = keccak_256(JSON.parse(result).response);

                            var signature = JSON.parse(result).signature
                            var msg = JSON.parse(result).msg
                            var pubKey = JSON.parse(result).pubKey
                            console.log("pubkey returns is ......: " + pubKey)

                            //verify oraclizer signature
                            var logme = ed25519.Verify(new Buffer(msg), new Buffer(signature, "hex"), new Buffer(pubKey, "hex"))
                            console.log(logme)

                            //for debugging--ignore:
                            if (logme == true) {
                                console.log("logme is the bool true");
                            }
                            else {
                                console.log("logme is not bool true but if this says true, it is a string: " + logme)
                            }

                            callback(result, bigchainID, bigchainHash)

                            //stop event listening
                            theEvent.stop();

                        })//end calling of myCallback

                    }//end if statement

                })//end callback listening

        })//end bigchain query
    }

}//end IcaSig


app.post("/revokeIca", function (req, res) {
    /*
    var formdata = {
        sig:"",
        msg:"",
        pubkey:"",
        txid:""
    }
    */
    var formdata = req.body;
    console.log('request body...' + JSON.stringify(formdata))
    var revoker = new IcaSig();
    var isValid = revoker.verifyIt(formdata);
    if (isValid) {
        console.log("Is valid value: " + (isValid == "true"))
        //revoker.bigchainGet(formdata.txid, function (getResult, getId, getHash) {
        bcGetRequest(formdata.pubKey, formdata.txid, function (getResult, getId, getHash) {
            console.log("\nbigchainGet finished\n")
            console.log("getresult: " + getResult)
            getResult = JSON.parse(JSON.parse(getResult).response);
            //console.log("asset: "+getResult.asset);
            //console.log("asset data: "+JSON.stringify(getResult.asset.data));
            //console.log("asset data coid: "+getResult.asset.data.Coid_Data);
            var data = getResult.asset.data.Coid_Data

            GetAsset(getResult.asset.data.Coid_Data.pubKey, getResult.asset.data.Coid_Data.assetID, 0, function (results) {
                if (results.revocationSignatures) { results.revocationSignatures = results.revocationSignatures.split(',') }
                else { results.revocationSignatures = [] }
                results.revocationSignatures.push(formdata.sig)
                console.log("revocationSignatures: " + results.revocationSignatures);
                //getResult.asset.data.Coid_Data.revocationSignatures = data.revocationSignatures;
                var timestamp = Number(new Date().getTime()) / 1000;
                //revoker.bigchainPost(getResult.asset.data.proposalID, results, results.coidGKAddress, results.coidAddr, results.dimensionCtrlAddr, results.blockNumber, results.blockHash, results.blockchainID, timestamp, results.validatorSigs, getResult.asset.data.gatekeeperSig, function (postResult, theId, theHash) {
                bcPreRequest(results.pubKey,getResult.asset.data.proposalID, results, results.blockNumber, results.blockHashVal, results.blockchainID, timestamp, results.validatorSigs, getResult.asset.data.gatekeeperSig, results.bigchainID, results.bigchainHash, function (result, theId, theHash) {
                    console.log("\nbigchainPost finished\n")
                    //(pubKey, assetID, txnID, txnHash, revokeSig)
                    writeToOwner(results.pubKey, results.assetID, theId, theHash, results.revocationSignatures.toString(), function () {
                        console.log("\nRevoking ICA Complete\n")
                        revokeIcaFile(formdata.pubKey, getResult.asset.data.proposalID);
                        console.log("Signature has been revoked");

                        if (results.dimensions) {
                            console.log("inside if: " + JSON.stringify(results.dimensions));
                            console.log(" results.dimensions.length: " + results.dimensions.length);
                            for (var k = 0; k < results.dimensions.length; k++) {
                                console.log("k: " + k + "  results.dimensions.length: " + results.dimensions.length);
                                var form = {
                                    pubKey: keccak_256(results.pubKey),
                                    type: results.dimensions[k].dimensionName,
                                    ID: results.dimensions[k].Id,
                                    descriptor: results.dimensions[k].descriptor,
                                    attribute: theId,
                                    flag: 0,
                                    dimensionCtrlAddr: results.dimensionCtrlAddr
                                }
                                if (form.descriptor != "") {
                                    updateDimensionEntry(form, function () { })
                                }
                                if (k == results.dimensions.length - 1) {
                                    res.send("Signatures have been added");
                                }

                            }
                        }
                        else { res.send("Signature has been added"); }


                    })
                })//end bigchainpost

            })//end GetAsset

        })//end bigchainget
    }//end isvalid
})// end app post

app.post("/attestIca", function (req, res) {
    /*
    var formdata = {
        sig:"",
        msg:"",
        pubkey:"",
        txid:"",
        dimensions:{
            pubKey: "formdata.dimensions[k].pubKey",
                                type: "formdata.dimensions[k].type",
                                ID: "formdata.dimensions[k].ID",
                                descriptor: "formdata.dimensions[k].descriptor",
                                attribute: "formdata.dimensions[k].attribute",
                                flag: "formdata.dimensions[k].flag"
        }
    }
    */
    var formdata = req.body;
    console.log('request body...' + JSON.stringify(formdata))
    var revoker = new IcaSig();
    var isValid = revoker.verifyIt(formdata);
    if (isValid) {
        console.log("Is valid value: " + (isValid == "true"))
        //revoker.bigchainGet(formdata.txid, function (getResult, getId, getHash) {
        bcGetRequest(formdata.pubKey, formdata.txid, function (getResult, getId, getHash) {
            console.log("\nbigchainGet finished\n")
            console.log("getresult: " + getResult)
            getResult = JSON.parse(JSON.parse(getResult).response);
            //console.log("asset: "+getResult.asset);
            //console.log("asset data: "+JSON.stringify(getResult.asset.data));
            //console.log("asset data coid: "+getResult.asset.data.Coid_Data);
            var data = getResult.asset.data.Coid_Data

            GetAsset(getResult.asset.data.Coid_Data.pubKey, getResult.asset.data.Coid_Data.assetID, 0, function (results) {
                if (results.validatorSigs) { }
                else { results.validatorSigs = [] }
                var vSig = [formdata.msg, formdata.sig, formdata.pubKey, formdata.expiration];
                console.log("adding signature: " + vSig)
                results.validatorSigs.push(vSig)
                console.log("AttestedSignatures: " + results.validatorSigs);
                var timestamp = Number(new Date().getTime()) / 1000;
                console.log("propID: " + getResult.asset.data.proposalID);

                //revoker.bigchainPost(getResult.asset.data.proposalID, results, results.coidGKAddress, results.coidAddr, results.dimensionCtrlAddr, results.blockNumber, results.blockHash, results.blockchainID, timestamp, results.validatorSigs, getResult.asset.data.gatekeeperSig, function (postResult, theId, theHash) {
                bcPreRequest(results.pubKey,getResult.asset.data.proposalID, results, results.blockNumber, results.blockHashVal, results.blockchainID, timestamp, results.validatorSigs, getResult.asset.data.gatekeeperSig, results.bigchainID, results.bigchainHash, function (result, theId, theHash) {
                     console.log("\nbigchainPost finished\n")
                    //(pubKey, assetID, txnID, txnHash, revokeSig)
                    writeToOwner2(results.pubKey, results.assetID, theId, theHash, results.validatorSigs, function () {
                        attestIcaFile(formdata.pubKey, getResult.asset.data.proposalID, "signature added", timestamp, results.gatekeeperAddr, formdata.expiration, theId, results.assetID)
                        console.log("\nAttestinging ICA Complete\n")
                        console.log("Signature " + vSig + " has been added\n");
                        if (results.dimensions) {
                            console.log("inside if: " + JSON.stringify(results.dimensions));
                            console.log(" results.dimensions.length: " + results.dimensions.length);
                            for (var k = 0; k < results.dimensions.length; k++) {
                                console.log("k: " + k + "  results.dimensions.length: " + results.dimensions.length);
                                var form = {
                                    pubKey: keccak_256(results.pubKey),
                                    type: results.dimensions[k].dimensionName,
                                    ID: results.dimensions[k].Id,
                                    descriptor: results.dimensions[k].descriptor,
                                    attribute: theId,
                                    flag: 0,
                                    dimensionCtrlAddr: results.dimensionCtrlAddr
                                }
                                if (form.descriptor != "") {
                                    updateDimensionEntry(form, function () { })
                                }
                                if (k >= results.dimensions.length - 1) {
                                    res.send("Signatures have been added");
                                }

                            }
                        }
                        else { res.send("Signature has been added"); }

                    })
                })//end bigchainpost

            })//end GetAsset

        })//end bigchainget
    }//end isvalid

})


app.listen(3004, function () {
    console.log("Connected to contract http://10.101.114.231:1337/rpc");
    console.log("Listening on port 3004");
});

