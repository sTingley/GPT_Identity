'use strict'

var chainConfig = require('/home/1070933/.monax/ErisChainConfig.json');

var erisContracts = require('@monax/legacy-contracts')
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

//for hex conversion
var Web3 = require('web3')
var web3 = new Web3();

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

//These hold
var formdataArray = [];
var proposalIDArray = [];
var indexer = 0;


//this function is intended to send a notification
var notifier = function () {
    //location of digital twin
    this.twinUrl = "http://35.154.255.203:8000";

    //for grabbing the appropriate scope
    var _this = this;

    //function to send a notification:
    //TODO: CHANGE THE ENDPOINT:

    //NOTE: THE DIGITAL TWIN will reject it without pubKey
    //st: THIS IS NO LONGER NEEDED BECAUSE WE HAVE THE 'writeAll' method
    // this.notifyCoidCreation = function (pubKey, assetID, txnID, txnHash, gkAddr, coidAddr, dimensionCtrlAddr) {

    //     console.log("ASSET ID IS: " + assetID);
    //     superAgent.post(this.twinUrl + "/setAsset")
    //         .send({
    //             "pubKey": keccak_256(pubKey),
    //             "flag": 0,
    //             "fileName": assetID + ".json",
    //             "updateFlag": 1,
    //             "keys": ["bigchainID", "bigchainHash", "gatekeeperAddr", "coidAddr", "dimensionCtrlAddr"],
    //             "values": [txnID, txnHash, gkAddr, coidAddr, dimensionCtrlAddr]
    //         })
    //         .set('Accept', 'application/json')
    //         .end((err, res) => {
    //             // if(res.status == 200){
    //             // do something
    //             // }
    //         });
    // };

    //THIS NOTIFICATION WILL TELL THE REQUESTER OF THE COID THEIR PROPOSAL IS PENDING
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
                if (err) {console.log("error createProposalPendingNotification: " + err)};
                if (res.status == 200) {
                    console.log("proposalPending message sent successfully");
                }
            });
    };

    this.GetAsset = function (pubKey, fileName, flag, callback) {
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

    //THIS WILL WRITE AN ATTESTATION IN THE DT
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



}//end of notifier

var theNotifier = new notifier();

//makes a coid
function CoidMaker(coidAddr, dimensionCtrlAddr, formdata) {

    //get params for their COID contract
    console.log("Inside CoidMaker function")
    var chainUrl = chainConfig.chainURL;
    var contrData = require("./jobs_output.json");
    var accounts = require('./accounts.json')
    var manager = erisContracts.newContractManagerDev(chainUrl, chainConfig.primaryAccount)

    var abiAddr = contrData['CoreIdentity'];
    var abi_COID = JSON.parse(fs.readFileSync('./abi/' + abiAddr, 'utf8'))
    var contract = manager.newContractFactory(abi_COID).at(coidAddr)

    var dimCtrlAddr = contrData['IdentityDimensionControl'];
    var abi_dimCtrl = JSON.parse(fs.readFileSync('./abi/' + dimCtrlAddr, 'utf8'))
    var dimCtrlContract = manager.newContractFactory(abi_dimCtrl).at(dimensionCtrlAddr)

    contract.getIt(function (error, result) {
        console.log(result + " is the result")
    })

    //parse the form data
    var sig = formdata.sig;
    var msg = formdata.msg;
    var requester = formdata.pubKey; // the pubkey of coid requester
    var myUniqueId = formdata.uniqueId;
    var myUniqueIdAttributes = formdata.uniqueIdAttributes.split(",");
    var myOwnershipId = formdata.ownershipId;
    var myOwnerIdList = [];
    myOwnerIdList = formdata.ownerIdList.split(",");
    var myControlId = formdata.controlId;
    var myControlIdList = [];
    myControlIdList = formdata.controlIdList.split(",");

    var myOwnershipTokenId = formdata.ownershipTokenId;
    var myOwnershipTokenAttributes = [];
    var myOwnershipTokenAttributes = formdata.ownershipTokenAttributes;
    var myOwnershipTokenQuantity = formdata.ownershipTokenQuantity.split(",");

    var myControlTokenId = formdata.controlTokenId;
    var myControlTokenAttributes = [];
    var myControlTokenAttributes = formdata.controlTokenAttributes;
    var myControlTokenQuantity = formdata.controlTokenQuantity.split(",");

    var myIdentityRecoveryIdList = [];
    myIdentityRecoveryIdList = formdata.identityRecoveryIdList.split(",");
    var myRecoveryCondition = formdata.recoveryCondition; // number of recoveryList needed

    var isHumanValue = false;
    var theUniqueIDAttributes = myUniqueIdAttributes;
    var UIDAttr = Array(10).fill("0");
    var fileHashes = Array(10).fill("0");
    var k = 0;
    var combinedList = JSON.parse(JSON.stringify(myControlIdList));

    for (var i = 0; i < theUniqueIDAttributes.length; i = i + 3) {
        theUniqueIDAttributes[i] = myUniqueIdAttributes[i];
    }
    for (var i = 0; i < theUniqueIDAttributes.length; i = i + 3) {
        UIDAttr[k] = web3.toHex(myUniqueIdAttributes[i]);
        fileHashes[k] = myUniqueIdAttributes[i + 1]
        k++;
    }
    for (var i = 0; i < myOwnerIdList.length; i++) {
        if(combinedList.indexOf(myOwnerIdList[i]) == -1){
            combinedList.push(myOwnerIdList[i])
        }
    }

    setTimeout(function () {

        theUniqueIDAttributes = theUniqueIDAttributes.concat(Array(10 - theUniqueIDAttributes.length).fill("0"));
        myOwnerIdList = myOwnerIdList.concat(Array(10 - myOwnerIdList.length).fill("0"));
        myControlIdList = myControlIdList.concat(Array(10 - myControlIdList.length).fill("0"));
        myOwnershipTokenQuantity = myOwnershipTokenQuantity.concat(Array(10 - myOwnershipTokenQuantity.length).fill("0"));
        myControlTokenQuantity = myControlTokenQuantity.concat(Array(10 - myControlTokenQuantity.length).fill("0"));
        myIdentityRecoveryIdList = myIdentityRecoveryIdList.concat(Array(10 - myIdentityRecoveryIdList.length).fill("0"));
        combinedList = combinedList.concat(Array(10 - combinedList.length).fill("0"));

        console.log("form atr: " + formdata.uniqueIdAttributes);
        console.log("uid: " + myUniqueId);
        console.log("atr: " + theUniqueIDAttributes);
        console.log("UIDAttr: " + UIDAttr);
        console.log("fileHashes: " + fileHashes);
        console.log("combolist: "+combinedList);
        console.log("ctrllist: "+myControlIdList);

        //instantiate coid
        var _this = this;
        contract.setUniqueID(myUniqueId, UIDAttr, fileHashes, isHumanValue, function (error) {
            //debugging function (getIt)
            contract.getIt(function (error, result) {
                console.log("setUniqueID: " + result);

                contract.setOwnership(myOwnerIdList, myOwnershipTokenQuantity, function (error) {
                    //debugging function (getIt)
                    contract.getIt(function (error, result) {
                        console.log("setOwnership: " + result);

                        contract.setControl(myControlTokenQuantity, myControlIdList, function (error) {

                            //debugging function (getIt)
                            contract.getIt(function (error, result) {
                                console.log("setControl" + result);

                                contract.setRecovery(myIdentityRecoveryIdList, myRecoveryCondition, function (error, result) {

                                    //debugging function (getIt)
                                    contract.getIt(function (error, result) {
                                        console.log("setRecovery: " + result);

                                        contract.StartCoid(function (error, result) {
                                            console.log("startCoid1: " + result);

                                            //debugging function (getIt)
                                            contract.getIt(function (Error, result) {
                                                console.log("startCoid: " + result);

                                                dimCtrlContract.IdentityDimensionControlInstantiation(coidAddr, '0x0', function (err, result) {
                                                    if (err) { console.log("dimensioninstantiation error: " + err) }
                                                    console.log("DimensionInstantiation: " + JSON.stringify(result))
                                                })

                                            })//end getIT

                                        })//end StartCoid

                                    })//end getIT

                                })//end setRecovery

                            })//end getIT

                        })//end setControl

                    })//end getIT

                })//end setOwnership

            })//end getIT

        })//end setUniqueID
    }, 3000)

}//end CoidMaker

function prepareForm(formdata) {

    var correctForm;/* = {
        "pubKey":"",
        "uniqueId":"",
        "uniqueIdAttributes":[["","",""]],
        "ownershipId":"",
        "ownerIdList":["",""],
        "controlId":"",
        "controlIdList":["",""],
        "ownershipTokenId":"",
        "ownershipTokenAttributes":[""],
        "ownershipTokenQuantity":["",""],
        "controlTokenId":"",
        "controlTokenAttributes":[""],
        "controlTokenQuantity":["",""],
        "identityRecoveryIdList":[""],
        "recoveryCondition":"",
        "yesVotesRequiredToPass":"",
        "validatorList":["","",""],
        "delegateeIdList":[""],
        "delegateeTokenQuantity":[""],
        "isHuman":"",
        "timestamp":"",
        "assetID":[""],
        "Type":"",
        "bigchainHash":"",
        "bigchainID":"",
        "coidAddr":"",
        "sig":"",
        "msg":"",
        "gatekeeperAddr":"",
        "dimensionCtrlAddr":""
    }*/

    correctForm = JSON.parse(JSON.stringify(formdata));
    correctForm.uniqueIdAttributes = [];
    correctForm.uniqueIdAttributes.push(formdata.uniqueIdAttributes.split(","));
    correctForm.ownerIdList = formdata.ownerIdList.split(",");
    correctForm.controlIdList = formdata.controlIdList.split(",") || [];
    correctForm.ownershipTokenAttributes = formdata.ownershipTokenAttributes.split(",") || [];
    correctForm.ownershipTokenQuantity = formdata.ownershipTokenQuantity.split(",") || [];
    correctForm.controlTokenAttributes = formdata.controlTokenAttributes.split(",") || [];
    correctForm.controlTokenQuantity = formdata.controlTokenQuantity.split(",") || [];
    correctForm.identityRecoveryIdList = formdata.identityRecoveryIdList.split(",") || [];
    correctForm.validatorList = formdata.validatorList.split(",");
    correctForm.delegateeIdList = formdata.delegateeIdList.split(",") || [];
    correctForm.delegateeTokenQuantity = formdata.delegateeTokenQuantity.split(",") || [];

    for (var j = correctForm.controlIdList.length - 1; j >= 0; j--) {
        for (var i = correctForm.ownerIdList.length - 1; i >= 0; i--) {
            if (correctForm.controlIdList[j] == correctForm.ownerIdList[i]) {
                correctForm.controlIdList.splice(j, 1);
            }
        }
    }

    return (correctForm);


}

function writeAll(formdata, callback) {

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

var test;
//Instantiate one of these
var gatekeeper = function (MyGKaddr) {

    //Debugging Comment:
    console.log("A gatekeeper object has just been instantiated")

    this.chain = 'primaryAccount';
    this.erisdburl = chainConfig.chainURL;
    this.contractData = require("./jobs_output.json");
    this.contractAbiAddress = this.contractData['MyGateKeeper'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/" + this.contractAbiAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisContracts.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
    this.gateKeeperContract = this.contractMgr.newContractFactory(this.erisAbi).at(MyGKaddr);

    //ballot contract
    this.ballotAddress = this.contractData['ballot'];
    // console.log("this is the ballot address: " + this.ballotAddress);
    this.ballotAbi = JSON.parse(fs.readFileSync("./abi/" + this.ballotAddress));
    this.ballotContract = this.contractMgr.newContractFactory(this.ballotAbi).at(this.ballotAddress);

    //verification contract (oraclizer)
    this.VerificationAddress = require('/home/1070933/.monax/apps/VerifyOraclizerEthereum/wallet2/jobs_output.json').deployStorageK;
    this.VerificationAbi = JSON.parse(fs.readFileSync('/home/1070933/.monax/apps/VerifyOraclizerEthereum/wallet2/abi/' + this.VerificationAddress, 'utf8'))
    this.VerificationContract = this.contractMgr.newContractFactory(this.VerificationAbi).at(this.VerificationAddress)
    this.ErisAddress = chainConfig[this.chain].address;

    //bigchain contract (oraclizer)
    this.bigchain_query_addr = require('/home/1070933/.monax/apps/BigchainOraclizer/jobs_output.json').deployStorageK
    this.bigchain_abi = JSON.parse(fs.readFileSync('/home/1070933/.monax/apps/BigchainOraclizer/abi/' + this.bigchain_query_addr, 'utf8'))
    this.bigchain_contract = this.contractMgr.newContractFactory(this.bigchain_abi).at(this.bigchain_query_addr)

    //use this to have the gatekeeper scope inside functions
    var _this = this;
    test = this;
    //for verification
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


    this.checkUnique = function (formdata) {
        console.log("inside checkUnique, formdata: " + JSON.stringify(formdata))
        console.log("inside checkUnique, formdata.uniqueId is: " + formdata.uniqueId)
        var myUniqueId = formdata.uniqueId;//async error second time?
        console.log("myUniqueId: " + myUniqueId)
        var sync = true;
        var isUniqueResult = false;
        _this.gateKeeperContract.isUnique(formdata.uniqueId, function (error, result) {

            if (error) {
                console.log("error returned from isUnique function of gatekeeper contract");
                console.log(error);
            }
            else {
                console.log("received response from isUnique :" + result);
                isUniqueResult = result;
                sync = false;
                console.log("myUniqueID: " + myUniqueId);
            }
        }) // end of callback

        while (sync) {
            require('deasync').sleep(100);
        }
        return isUniqueResult;
    };


    this.setcoidData = function (proposalId, formdata, res, callback) {

        //local variables for API calls
        // var proposalId = formdata.proposalId;
        var sig = formdata.sig;
        var msg = formdata.msg;
        var requester = formdata.pubKey; // the pubkey of coid requester
        var myUniqueId = formdata.uniqueId;
        var myUniqueIdAttributes = formdata.uniqueIdAttributes.split(",");
        var myOwnershipId = formdata.ownershipId;
        var myOwnerIdList = [];
        myOwnerIdList = formdata.ownerIdList.split(",");
        var myControlId = formdata.controlId;
        var myControlIdList = [];
        myControlIdList = formdata.controlIdList.split(",") || [];
        var myOwnershipTokenId = formdata.ownershipTokenId;
        var myOwnershipTokenAttributes = formdata.ownershipTokenAttributes;
        var myOwnershipTokenQuantity = formdata.ownershipTokenQuantity.split(",");
        var myControlTokenId = formdata.controlTokenId;
        var myControlTokenAttributes = formdata.controlTokenAttributes;
        var myControlTokenQuantity = formdata.controlTokenQuantity.split(",");
        var myIdentityRecoveryIdList = [];
        myIdentityRecoveryIdList = formdata.identityRecoveryIdList.split(",");
        var myRecoveryCondition = formdata.recoveryCondition;
        var ballotContractAddr = this.ballotAddress;
        var validators = [];
        validators = formdata.validatorList.split(",");
        var yesVotesRequiredToPass = formdata.yesVotesRequiredToPass;
        var isHuman = formdata.isHuman;
        var gatekeeperAddr = formdata.gatekeeperAddr;
        var propType = Number(formdata.propType);

        try {
            this.setCoidRequester(requester, proposalId, sig, msg);
            this.setmyUniqueID(requester, proposalId, myUniqueId, myUniqueIdAttributes);

            var this1 = this;
            setTimeout(function () {
                console.log("ISHUMAN VALUE: " + isHuman + "************************************************************************")
                this1.setmyOwnershipID(requester, proposalId, myOwnershipId, myOwnerIdList);
                this1.setmyControlID(requester, proposalId, myControlId, myControlIdList);
                this1.setmyOwnershipTokenID(requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes, myOwnershipTokenQuantity);
                this1.setmyControlTokenID(requester, proposalId, myControlTokenId, myControlTokenAttributes, myControlTokenQuantity);
                this1.setmyIdentityRecoveryIdList(requester, proposalId, myIdentityRecoveryIdList, myRecoveryCondition);
                this1.setValidators(proposalId, validators, ballotContractAddr);

                this1.initiateCoidProposalSubmission(ballotContractAddr, proposalId, yesVotesRequiredToPass, false, MyGKaddr, propType);

                theNotifier.createProposalPendingNotification(requester, proposalId, isHuman, gatekeeperAddr, 0);

                callback(false, res);
            }, 4000)
        }
        catch (e) {
            callback(true, res);
        }

        return;

    };

    this.KYC = function (proposalId, formdata, res, callback) {

        //local variables for API calls
        var proposalId = proposalId;
        var sig = formdata.sig;
        var msg = formdata.msg;
        var requester = formdata.pubKey; // the pubkey of coid requester
        var myUniqueId = formdata.uniqueId;
        var myUniqueIdAttributes = formdata.uniqueIdAttributes.split(",");
        var ballotContractAddr = this.ballotAddress;
        var validators = [];
        validators = formdata.validatorList.split(",");
        var yesVotesRequiredToPass = formdata.yesVotesRequiredToPass;
        var isHuman = formdata.isHuman;
        var gatekeeperAddr = formdata.gatekeeperAddr;
        var propType = Number(formdata.propType);

        try {
            this.setCoidRequester(requester, proposalId, sig, msg);
            this.setmyUniqueID(requester, proposalId, myUniqueId, myUniqueIdAttributes);
            this.setPropType(proposalId, propType);
            var this1 = this;
            setTimeout(function () {
                this1.setValidators(proposalId, validators, ballotContractAddr);
                this1.initiateCoidProposalSubmission(ballotContractAddr, proposalId, yesVotesRequiredToPass, false, MyGKaddr, propType);
                theNotifier.createProposalPendingNotification(requester, proposalId, isHuman, gatekeeperAddr, propType);
                callback(false, res);
            }, 3000)
        }
        catch (e) {
            callback(true, res);
        }

        return;

    };


    this.debugging = function (val) {
        _this.gateKeeperContract.debugIt(val, function (error, result) {
            console.log("DEBUGIT: " + val);
        })
    }


    this.getProposalId = function (formdata, res, callback) {

        var proposalId;
        var sync = true;
        var formdata1 = formdata;
        _this.ballotContract.getProposalId(function (error, result) {

            if (error) {

                console.log(error);

            }
            else {

                proposalId = result;

                //add formdata and proposalID
                formdataArray[indexer] = formdata;
                proposalIDArray[indexer] = proposalId;

                //increment indexer
                indexer = indexer + 1;

                sync = false;
                console.log("proposalId is: " + result);
            }
        }) // end of callback

        while (sync) { require('deasync').sleep(1000); }

        switch (Number(formdata.propType)) {
            case 0:
                //coid request
                this.setcoidData(proposalId, formdata, res, callback);
                console.log("right after set coid data....");
                break;
            case 1:
                //Unique Attr request
                console.log("right after Unique....");
                break;
            case 2:
                //KYC request
                console.log("proposalId is: " + proposalId + " or " + this.proposalId);
                this.KYC(proposalId, formdata, res, callback);
                console.log("right after KYC....");
                break;
            default:

        }
        console.log("formdata: " + formdata);
    }; //end of function


    this.setCoidRequester = function (requester, proposalId, sig, msg) {

        var sync = true;
        _this.gateKeeperContract.setCoidRequester(requester, proposalId, sig, msg, function (err, res) {
            console.log("setCoidRequester..\n pubkey: " + requester + ", proposalId: " + proposalId)
            if (err) {
                console.log("Error0");
            }
            else {
                console.log("Result0:" + res);
                console.log("sig: " + sig);
                console.log("msg: " + msg);
                console.log()
                sync = false;
                //next();
                return;
            }

        }) // end of callback


        while (sync) { require('deasync').sleep(1000); }
    }; // end of function setCoidRequester

    this.setmyUniqueID = function (requester, proposalId, myUniqueID, myUniqueIdAttributes) {

        var len = myUniqueIdAttributes.length;
        var sync = true;

        console.log(len + myUniqueIdAttributes + "*MYUNIQUEIDATTRIBUTESARRAY")
        //set vals in gatekeeper contract one at a time
        //NOTE the let statemnt (not var!)
        for (let index = 0; index < (len) / 3; index++) {
            _this.gateKeeperContract.setmyUniqueID(requester, proposalId, myUniqueID, myUniqueIdAttributes[3 * index], myUniqueIdAttributes[(3 * index) + 1], myUniqueIdAttributes[(3 * index) + 2], index, function (err, result) {

                if (err) {
                    console.log("Error1" + err);
                }
                else {
                    if (index < len - 1) {
                        console.log(result + " index is: " + index);
                        sync = true;
                    }
                    else {
                        console.log(result + "  index<> is: " + index);
                        sync = false;
                    }
                }
            }); //end of setmyUniqueID

        } //end of for loop

        //while (sync) { require('deasync').sleep(1000); }
    };

    //set proptype
    this.setPropType = function (proposalId, propType) {
        var sync = true;

        //var propType = Number(propType);
        console.log("proptype: " + propType);
        _this.gateKeeperContract.setPropType(proposalId, Number(propType), function (err, res) {

            if (err) {
                console.log("Error setting propType: " + err)
            }
            else {
                console.log("Result setting propType: " + res)
                sync = false;
                return;
            }
        });//end of callback

        while (sync) { require('deasync').sleep(100); }

    }

    this.setmyOwnershipID = function (requester, proposalId, myOwnershipId, myOwnerIdList) {

        var len = myOwnerIdList.length;
        var sync = true;

        //myOwnerIdList is size 10 array in gatekeeper contract
        // So we need to pass size 10 array as well
        // If the ownerIdList is less than 10, then rest of the values will be null
        if (myOwnerIdList.length < 10) {
            for (var i = len; i < 10; i++) {
                myOwnerIdList[i] = "0";
            }
        }
        _this.gateKeeperContract.setmyOwnershipID(requester, proposalId, myOwnershipId, myOwnerIdList, function (err, res) {

            if (err) {
                console.log("Error2");
                //res.send("Error");
            }
            else {
                //next();
                console.log("Result2:" + res);
                console.log("myOwnershipId: " + myOwnershipId);
                console.log("myOwnerIdList: " + myOwnerIdList);
                console.log()
                sync = false;
                return;
            }


        }); // end of callback

        while (sync) { require('deasync').sleep(1000); }
    }; //end of function setmyOwnershipID

    this.setmyControlID = function (requester, proposalId, myControlId, myControlIdList) {
        var sync = true;
        var len = myControlIdList.length;

        if (myControlIdList.length < 10) {
            for (var i = len; i < 10; i++) {
                myControlIdList[i] = "0";
            }
        }
        _this.gateKeeperContract.setmyControlID(requester, proposalId, myControlId, myControlIdList, function (err, res) {
            if (err) {
                console.log("Error3");
                //res.send("Error");
            }
            else {
                //next();
                console.log("Result3:" + res);
                console.log("myControlId: " + myControlId);
                console.log("myControlIdList: " + myControlIdList);
                console.log()
                sync = false;
                return;
            }

        });//end of callback

        while (sync) { require('deasync').sleep(1000); }

    }; //end of function

    this.setmyOwnershipTokenID = function (requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes, myOwnershipTokenQuantity) {

        var sync = true;

        var len2 = myOwnershipTokenQuantity.length;
        if (myOwnershipTokenQuantity.length < 10) {
            for (var i = len2; i < 10; i++) {
                myOwnershipTokenQuantity[i] = "0";
            }
        }

        console.log("ownershiptokenID is " + myOwnershipTokenId);
        console.log("myOwnershipTokenAttributes :", myOwnershipTokenAttributes);
        console.log("myOwnershipTokenQuantity : ", myOwnershipTokenQuantity);

        _this.gateKeeperContract.setmyOwnershipTokenID(requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes, myOwnershipTokenQuantity, function (err, res) {

            if (err) {
                console.log("Error4", err);
                //res.send("Error");
            }
            else {
                //next();
                console.log("Result4:" + res);
                console.log("myOwnershipTokenId: " + myOwnershipTokenId)
                console.log("myOwnershipTokenAttributes: " + myOwnershipTokenAttributes);
                console.log("myOwnershipTokenQuantity" + myOwnershipTokenQuantity);
                console.log()
                sync = false;
                return;
            }

        });//end of callback
        while (sync) { require('deasync').sleep(1000); }

    };//end of function

    this.setmyControlTokenID = function (requester, proposalId, myControlTokenId, myControlTokenAttributes, myControlTokenQuantity) {
        var sync = true;
        var len2 = myControlTokenQuantity.length;
        if (myControlTokenQuantity.length < 10) {
            for (var i = len2; i < 10; i++) {
                myControlTokenQuantity[i] = "0";
            }
        }

        _this.gateKeeperContract.setmyControlTokenID(requester, proposalId, myControlTokenId, myControlTokenAttributes, myControlTokenQuantity, function (err, res) {

            if (err) {
                console.log("Error5");
                //res.send("Error");
            }
            else {
                //next();
                console.log("Result5:" + res);
                console.log("myControlTokenId: " + myControlTokenId)
                console.log("myControlTokenAttributes: " + myControlTokenAttributes);
                console.log("myControlTokenQuantity" + myControlTokenQuantity);
                console.log()
                sync = false;
                return;
            }

        });// end of callback

        while (sync) { require('deasync').sleep(1000); }
    }; // end of function

    this.setmyIdentityRecoveryIdList = function (requester, proposalId, myIdentityRecoveryIdList, myRecoveryCondition) {
        var sync = true;
        var len = myIdentityRecoveryIdList.length;

        if (myIdentityRecoveryIdList.length < 10) {
            for (var i = len; i < 10; i++) {
                myIdentityRecoveryIdList[i] = "0";

            }
        }

        console.log("Requester is: " + requester);
        console.log("proposalId is: " + proposalId);
        console.log("RecoveryIDLIST: " + myIdentityRecoveryIdList);
        console.log("RecoveryCondition: " + myRecoveryCondition);
        _this.gateKeeperContract.setmyIdentityRecoveryIdList(requester, proposalId, myIdentityRecoveryIdList, myRecoveryCondition, function (err, res) {

            if (err) {
                console.log("Error6" + err);
                res.send("Error");
            }
            else {
                //isCoidInitiated = res;
                console.log("Result6:" + res);
                console.log("myIdentityRecoveryIdList: " + myIdentityRecoveryIdList);
                console.log("myRecoveryCondition: " + myRecoveryCondition);
                console.log();
                sync = false;
                return;
            }

        }) // end of callback

        while (sync) { require('deasync').sleep(1000); }
    }; // end of function

    this.setValidators = function (proposalId, validators, ballotAddress) {
        var sync = true;
        var arr = validators.concat(Array(10 - validators.length).fill(0x0));
        console.log("validators: " + validators);
        console.log("validators for setValidators: " + arr);

        _this.gateKeeperContract.setValidators(proposalId, arr, ballotAddress, function (err, res) {
            console.log(res);
            console.log("proposalId: " + proposalId);
            console.log("ballotAddress: " + ballotAddress);
            console.log("validators: " + validators);
            if (err) {

                console.log("Error to selectValidators: " + err);
            }

            else {
                console.log("validators have been selected.");
                _this.ballotContract.getValidatorList(proposalId, function (error, result) {
                    console.log("list..." + result)
                    _this.ballotContract.getForTest(proposalId, function (error, result) {
                        console.log("" + result);
                    })
                });
                sync = false;
                return;
            }

        })// end of callback

        while (sync) { require('deasync').sleep(1000); }

    }; // end of function

    //after all the COID data has been set
    this.initiateCoidProposalSubmission = function (ballotAddress, proposalId, yesVotesRequiredToPass, isHuman, gkaddr) {
        var sync = true;
        var propType = arguments[5] || 0;
        this.setPropType(proposalId, propType);
        console.log("propType in initcoid: " + propType);

        _this.gateKeeperContract.initiateCoidProposalSubmission(ballotAddress, proposalId, yesVotesRequiredToPass, isHuman, gkaddr, propType, function (err, res) {

            if (err) {
                console.log("Error for initiateCoidProposalSubmission: " + err);
            }
            else {
                _this.gateKeeperContract.getPropType(proposalId, function (error, result) {
                    console.log("Get Proposal Type contract call: " + result);
                })
                console.log("Is COID request has been initiated: " + res);
                sync = false;
                return;
            }

        })// end of callback

        while (sync) { require('deasync').sleep(1000); }

    };// end of function

}


//NOTE: Event listening must be done outside each gatekeeper app instance continuously
//This way, new instances are not done per each instance
var eventListener = function (MyGKAddr) {

    this.chain = 'primaryAccount';
    this.erisdburl = chainConfig.chainURL;
    this.contractData = require("./jobs_output.json");
    this.contractAddress = this.contractData['MyGateKeeper'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/" + this.contractAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisContracts.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
    this.gateKeeperContract = this.contractMgr.newContractFactory(this.erisAbi).at(MyGKAddr);

    //ballot contract
    this.ballotAddress = this.contractData['ballot'];
    this.ballotAbi = JSON.parse(fs.readFileSync("./abi/" + this.ballotAddress));
    this.ballotContract = this.contractMgr.newContractFactory(this.ballotAbi).at(this.ballotAddress);

    //verification contract (oraclizer)
    this.VerificationAddress = require('/home/1070933/.monax/apps/VerifyOraclizerEthereum/wallet2/jobs_output.json').deployStorageK;
    this.VerificationAbi = JSON.parse(fs.readFileSync('/home/1070933/.monax/apps/VerifyOraclizerEthereum/wallet2/abi/' + this.VerificationAddress, 'utf8'))
    this.VerificationContract = this.contractMgr.newContractFactory(this.VerificationAbi).at(this.VerificationAddress)
    this.ErisAddress = chainConfig[this.chain].address;

    //bigchain contract (oraclizer)
    this.bigchain_query_addr = require('/home/1070933/.monax/apps/BigchainOraclizer/jobs_output.json').deployStorageK
    this.bigchain_abi = JSON.parse(fs.readFileSync('/home/1070933/.monax/apps/BigchainOraclizer/abi/' + this.bigchain_query_addr, 'utf8'))
    this.bigchain_contract = this.contractMgr.newContractFactory(this.bigchain_abi).at(this.bigchain_query_addr)

    //use this to have the gatekeeper scope inside functions
    var _this = this;

    //This is for signature generation:
    this.createSignature = function (nonHashedMessage, callback) {
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


    //this is for bigchain writing
    //see the note (above var bigchainInput) for how to input data in this function
    this.bigchainIt = function (proposalID, coidData, coidGKAddress, coidAddr, dimensionCtrlAddr, blockNumber, blockHash, blockchainID, timestamp, validatorSigs, gatekeeperSig, callback) {

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


    //
    //Listening of the proposal expired event:
    //

    var eventBallotProposalExpired;

    _this.ballotContract.proposalExpired(
        function (error, result) {
            eventBallotProposalExpired = result;
        },
        function (error, result) {
            console.log("result.args (line 950): " + JSON.stringify(result.args))
            var expiredProposalId = (result.args).expiredProposalId;
            var isExpired = (result.args).isExpired;

            //delete the proposal from gatekeeper
            _this.gateKeeperContract.deleteProposal(expiredProposalId, function (error, result) {
                if (error) {
                    console.log("error from Gatekeeper Contract function deleteProposal:" + error);
                } else {
                    console.log("The Gatekeeper Contract function deleteProposal has been called with no error");
                }
            })
        })

    //
    // Listening of the resultReady event in gatekeeper:
    // Each time the event is fired, we delete the proposal and write in bigchain
    //

    var eventGatekeeperResultReady;

    _this.gateKeeperContract.resultReady(
        function (error, result) {
            eventGatekeeperResultReady = result;
        },
        function (error, result) {

            //grab parameters from the event
            var proposalId = (result.args).proposalId;
            var votingResult = (result.args).result;
            var resultMessage = (result.args).resultMessage;
            var coidGKAddr = (result.args).coidGKAddr;
            var coidAddr = (result.args).coidAddr;
            var dimensionCtrlAddr = (result.args).dimensionCtrlAddr;
            var blockNumber = (result.args).blockNumberVal;
            var blockHashVal = (result.args).blockHashVal;
            var blockchainID = (result.args).blockchainIdVal;
            var timestamp = (result.args).timestamp;

            //debugging
            console.log("Voting result is: " + votingResult);
            console.log("proposalID is: " + proposalId);
            console.log("resultMessage is: " + resultMessage);
            console.log("coidGKAddr is: " + coidGKAddr);
            console.log("coidAddr is: " + coidAddr);
            console.log("dimensionCtrlAddr is: " + dimensionCtrlAddr);
            console.log("blockNumber is: " + blockNumber);
            console.log("blockHashVal is: " + blockHashVal);
            console.log("blockchainID is: " + blockchainID);
            console.log("timestamp is: " + timestamp);
            console.log("result.args: " + JSON.stringify(result.args));

            //implement logic if and only if votingResult is true:
            if (votingResult) {
                //find data given proposalId
                var index = -1;
                for (var k = 0; k < indexer; k++) {
                    if (proposalIDArray[index] = proposalId) {
                        index = k;
                    }
                }

                console.log("index is: " + index);

                if (index != -1) {
                    //TODO (to make cleaner): un-hardcode m -- grab number of validators from
                    //NOTE: notice the use of let for m, rather than var!
                    var validatorSigs = [];
                    var indexSigs = 0;
                    for (let m = 0; m < 3; m++) {
                        _this.ballotContract.getValidatorSignature_byIndex(proposalId, m, function (error, result) {
                            //TODO: Create labels for validator sigs
                            console.log("This is the result: " + JSON.stringify(result))
                            validatorSigs[indexSigs] = result;
                            indexSigs++;
                            console.log("m is: " + m);
                        });
                    }

                    console.log("validator sigs are: " + validatorSigs);

                    //gatekeeper needs to sign this:
                    setTimeout(function () {
                        _this.createSignature("GatekeeperAppVerified", function (signatureGK, pubkeyGK, hashGK) {

                            var GKSig = { "signature": signatureGK, "pubkeyGK": pubkeyGK, "hashGK": hashGK }
                            console.log("GK Sig: " + JSON.stringify(GKSig));
                            //_this.bigchainIt(proposalId, formdataArray[index], formdataArray[index].gatekeeperAddr, coidAddr, dimensionCtrlAddr, blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, function (result, theId, theHash) {
                            theNotifier.bcPreRequest(formdataArray[index].pubKey, proposalId, formdataArray[index], blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, formdataArray[index].bigchainID, formdataArray[index].bigchainHash, function (result, theId, theHash) {
                                // console.log(result);
                                console.log("THE TXN ID: " + theId)
                                console.log("THE HASH: " + theHash)
                                console.log("GK ADDR: " + formdataArray[index].gatekeeperAddr)
                                console.log("COID ADDR: " + coidAddr)
                                console.log("DIM CTRL ADDR: " + dimensionCtrlAddr)
                                //theNotifier.notifyCoidCreation(formdataArray[index].pubKey, formdataArray[index].assetID, theId, theHash, coidGKAddr, coidAddr, dimensionCtrlAddr)

                                var form = formdataArray[index];
                                form.bigchainID = theId;
                                form.bigchainHash = theHash;
                                //form.gatekeeperAddr = coidGKAddr;
                                form.coidAddr = coidAddr;
                                form.dimensionCtrlAddr = dimensionCtrlAddr;
                                writeAll(prepareForm(form), function () { });

                                //make the core identity
                                CoidMaker(coidAddr, dimensionCtrlAddr, formdataArray[index])

                                //delete the proposal
                                deleteProposal(proposalId);
                            })
                        })
                    },
                        5000);
                }
                else {
                    console.log("error finding form data--could not write acceptance to bigchaindb!")
                    deleteProposal(proposalId);
                }
            }

        })

    var eventGatekeeperResultReadyKYC;
    _this.gateKeeperContract.resultReadyKYC(
        function (error, result) {
            eventGatekeeperResultReadyKYC = result;
        },
        function (error, result) {

            //grab parameters from the event
            var proposalId = (result.args).proposalId;
            var votingResult = (result.args).result;
            var resultMessage = (result.args).resultMessage;
            var coidGKAddr = (result.args).coidGKAddr;
            var coidAddr = (result.args).coidAddr;
            var dimensionCtrlAddr = (result.args).dimensionCtrlAddr;
            var blockNumber = (result.args).blockNumberVal;
            var blockHashVal = (result.args).blockHashVal;
            var blockchainID = (result.args).blockchainIdVal;
            var timestamp = (result.args).timestamp;

            //debugging
            console.log("KYC EVENT RECIEVED");
            console.log("Voting result is: " + votingResult);
            console.log("proposalID is: " + proposalId);
            console.log("resultMessage is: " + resultMessage);
            console.log("coidGKAddr is: " + coidGKAddr);
            console.log("coidAddr is: " + coidAddr);
            console.log("dimensionCtrlAddr is: " + dimensionCtrlAddr);
            console.log("blockNumber is: " + blockNumber);
            console.log("blockHashVal is: " + blockHashVal);
            console.log("blockchainID is: " + blockchainID);
            console.log("timestamp is: " + timestamp);
            console.log("result.args: " + JSON.stringify(result.args));

            //implement logic if and only if votingResult is true:
            if (votingResult) {
                //find data given proposalId
                var index = -1;
                for (var k = 0; k < indexer; k++) {
                    if (proposalIDArray[index] = proposalId) {
                        index = k;
                    }
                }

                console.log("index is: " + index);
                var validatorSigs = [];

                if (index != -1) {
                    //TODO (to make cleaner): un-hardcode m -- grab number of validators from
                    //NOTE: notice the use of let for m, rather than var!
                    var indexSigs = 0;
                    for (let m = 0; m < formdataArray[index].validatorList.split(',').length; m++) {
                        _this.ballotContract.getValidatorSignature_byIndex(proposalId, m, function (error, result) {
                            //TODO: Create labels for validator sigs
                            console.log("This is the result: " + JSON.stringify(result))
                            validatorSigs[indexSigs] = result;
                            indexSigs++;
                            console.log("m is: " + m);
                        });
                    }
                    //ST: we dont need this function anymore because we have getValidatorSignature_byIndex
                    // _this.ballotContract.getSigExpirations(proposalId, function (error, result) {
                    //     console.log("validators: " + result[0]);
                    //     console.log("Expirations: " + result[1]);
                    // })

                    console.log("validator sigs are: " + validatorSigs);

                    //gatekeeper needs to sign this:
                    setTimeout(function () {
                        _this.createSignature("GatekeeperAppVerified", function (signatureGK, pubkeyGK, hashGK) {

                            var GKSig = { "signature": signatureGK, "pubkeyGK": pubkeyGK, "hashGK": hashGK }
                            console.log("GK Sig: " + JSON.stringify(GKSig));
                            //_this.bigchainIt(proposalId, formdataArray[index], formdataArray[index].gatekeeperAddr, coidAddr, dimensionCtrlAddr, blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, function (result, theId, theHash) {
                            theNotifier.bcPreRequest(formdataArray[index].pubKey, proposalId, formdataArray[index], blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, formdataArray[index].bigchainID, formdataArray[index].bigchainHash, function (result, theId, theHash) {
                                // console.log(result);
                                console.log("THE TXN ID: " + theId)
                                console.log("THE HASH: " + theHash)
                                console.log("GK ADDR: " + coidGKAddr)
                                console.log("COID ADDR: " + coidAddr)
                                console.log("DIM CTRL ADDR: " + dimensionCtrlAddr)
                                for (var j = 0; j < formdataArray[index].validatorList.split(',').length; j++) {
                                    theNotifier.createIcaSigNotification(validatorSigs[j][2], proposalId, validatorSigs[j][3], theId, formdataArray[index].assetID, formdataArray[index].pubKey);
                                    console.log("notify: " + validatorSigs[j][2] + " Expires: " + validatorSigs[j][3] + " txid: " + theId);
                                }
                                //theNotifier.notifyCoidCreation(formdataArray[index].pubKey, formdataArray[index].assetID, theId, theHash, coidGKAddr, coidAddr, dimensionCtrlAddr)
                                var form = formdataArray[index];
                                form.bigchainID = theId;
                                form.bigchainHash = theHash;
                                //form.gatekeeperAddr = coidGKAddr;
                                form.coidAddr = coidAddr;
                                form.dimensionCtrlAddr = dimensionCtrlAddr;
                                form.ownerIdList = keccak_256(form.pubKey);
                                form.validatorSigs = validatorSigs;
                                var chainUrl = chainConfig.chainURL;
                                var contrData = require("./jobs_output.json");
                                var accounts = require('./accounts.json')
                                var manager = erisContracts.newContractManagerDev(chainUrl, chainConfig.primaryAccount)

                                var abiAddr = contrData['CoreIdentity'];
                                var abi_COID = JSON.parse(fs.readFileSync('./abi/' + abiAddr, 'utf8'))
                                var contract = manager.newContractFactory(abi_COID).at(coidAddr)

                                var dimCtrlAddr = contrData['IdentityDimensionControl'];
                                var abi_dimCtrl = JSON.parse(fs.readFileSync('./abi/' + dimCtrlAddr, 'utf8'))
                                var dimCtrlContract = manager.newContractFactory(abi_dimCtrl).at(dimensionCtrlAddr)
                                var myOwnerIdList = form.ownerIdList.split(",");
                                myOwnerIdList = myOwnerIdList.concat(Array(10 - myOwnerIdList.length).fill("0"));
                                //var myOwnershipTokenQuantity = form.ownershipTokenQuantity.split(",");
                                var myOwnershipTokenQuantity = Array(10).fill("0");
                                var myUniqueIdAttributes = form.uniqueIdAttributes.split(",");
                                var theUniqueIDAttributes = myUniqueIdAttributes;

                                var theUniqueIDAttributes = myUniqueIdAttributes;
                                var UIDAttr = Array(10).fill("0");
                                var fileHashes = Array(10).fill("0");
                                var k = 0;

                                for (var i = 0; i < theUniqueIDAttributes.length; i = i + 3) {
                                    theUniqueIDAttributes[i] = myUniqueIdAttributes[i];
                                }
                                for (var i = 0; i < theUniqueIDAttributes.length; i = i + 3) {
                                    UIDAttr[k] = web3.toHex(myUniqueIdAttributes[i]);
                                    fileHashes[k] = myUniqueIdAttributes[i + 1]
                                    k++;
                                }
                                theUniqueIDAttributes = theUniqueIDAttributes.concat(Array(10 - theUniqueIDAttributes.length).fill("0"));
                                console.log("form atr: " + form.uniqueIdAttributes);
                                console.log("uid: " + form.uniqueId);
                                console.log("atr: " + theUniqueIDAttributes);
                                console.log("UIDAttr: " + UIDAttr);
                                console.log("fileHashes: " + fileHashes);


                                contract.setUniqueID(form.uniqueId, UIDAttr, fileHashes, false, function (error) {
                                    contract.getIt(function (error, result) {
                                        console.log("setUniqueID: " + result);
                                        contract.setOwnership(myOwnerIdList, myOwnershipTokenQuantity, function (error) {
                                            contract.getIt(function (error, result) {
                                                console.log("set ownership: " + result);
                                                contract.StartCoidIca(function (error, result) {
                                                    console.log("startCoid1: " + result);

                                                    //debugging function (getIt)
                                                    contract.getIt(function (Error, result) {
                                                        console.log("startCoidIca: " + result)


                                                        dimCtrlContract.IdentityDimensionControlInstantiation(coidAddr, '0x0', function (err, result) {
                                                            if (err) { console.log("dimensioninstantiation error: " + err) }
                                                            console.log("DimensionInstantiation: " + JSON.stringify(result))
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                                writeAll(prepareForm(form), function () { });

                                //make the core identity
                                //CoidMaker(coidAddr, dimensionCtrlAddr, formdataArray[index])

                                //delete the proposal
                                deleteProposal(proposalId);
                            })
                        })
                    },
                        5000);
                }
                else {
                    console.log("error finding form data--could not write acceptance to bigchaindb!")
                    deleteProposal(proposalId);
                }
            }

        })


    // Listening of the resultIsReady event in the ballot:
    // When the event is ready, it calls the function in gatekeeper, result is ready
    // Note that after the function is called in gatekeeper, it triggers the gatekeeper resultReady event

    var eventBallotResultIsReady;
    _this.ballotContract.resultIsReady(function (error, res) {

        eventBallotResultIsReady = res
    },

        function (error, result) {
            var proposalId = result.args.proposalId;
            var requestResult = result.args.requestResult;
            var chainID = keccak_256(_this.chain);

            // _this.gateKeeperContract.getPropType(proposalId, function (error, result) {
            // console.log("Get Proposal Type contract call: "+result);
            // })
            // _this.ballotContract.getSigExpirations(proposalId, function (error, result) {
            // console.log("validators: "+result[0]);
            // console.log("Expirations: "+result[1]);
            // })
            //debugging statements
            console.log("ballot contract event -- ResultIsReady")
            console.log("proposalId from event is: " + proposalId)
            console.log("requestResult from event is: " + requestResult)

            _this.gateKeeperContract.ResultIsReady(requestResult, proposalId, chainID, function (error, result) {
                if (error) {
                    console.log("error from Gatekeeper Contract function ResultIsReady:" + error);
                } else {
                    console.log("ResultIsReady function in gatekeeper successfully called.")
                }
            });
        }

    )// end of _this.ballotContract.resultIsReady


    //this is the event listening. the event is just for debugging purposes.
    _this.ballotContract.proposalExpired(
        function (error, result) {

        },
        function (error, result) {
            console.log(JSON.stringify(result.args) + "... is the result from event ballotContract.proposalExpired");
        })


    //for checking expiry of proposals
    //contract function will delete proposal for you
    function isExpired() {
        _this.ballotContract.IsProposalExpired(function (error, result) {
            console.log("is proposal expired has just been called")
            setTimeout(function () {
                //recursively check every 9 seconds. in the future make this a day.
                isExpired()
            }, 9000)
        })
    }

    //start the recursive checking
    setTimeout(function () {
        isExpired()
    }, 500000);


    //this is to delete the proposal in the ballot and gatekeeper, upon consensus (rejection and acceptance)
    function deleteProposal(proposalId) {
        _this.ballotContract.deleteProposal(proposalId, function (error, result) {
            console.log(proposalId + " is the proposalId. Error in delete proposal from ballot? " + error)
        })

        _this.gateKeeperContract.deleteProposal(proposalId, function (error, result) {
            console.log(proposalId + " is the proposalId. Error in delete proposal from gatekeepr? " + error)
        });
    }

}//eventListener


/*******************************************************
 *      THIS IS CALLED BY MYGATEKEEPER.JSX
*******************************************************/
var listening;
var gatekeepers = [];

app.post("/MyGatekeeper", function (req, res) {

    //var listening;

    //Make sure this line is uncommented to test with wallet
    var formdata = req.body;
    console.log('request body...' + JSON.stringify(formdata))


    //for testing with hardcoded data
    /*      var formdata =
            {
       "pubKey":"029fb6ea7e2394df2b10c9157b3e6c37762b83fe09941fe75cef09cbeb38179dea",
       "uniqueId":"a7ab1388c4e945e3e0c0d90be3a1687202a7acb5af4ae6a78b8f9d9c208d52dd",
       "uniqueIdAttributes":"kyc4,e1e1a536e9fc0127738d793451b5dea26dd37d31d76adfa98cfd4a54d118351c,QmcHrja8JXPjPeAm3MwKdRT66pNzqJNrkc1Wp4nR1T3zF5",
       "ownershipId":"",
       "ownerIdList":"",
       "controlId":"",
       "controlIdList":"",
       "ownershipTokenId":"",
       "ownershipTokenAttributes":"xcfv",
       "ownershipTokenQuantity":"2",
       "controlTokenId":"1f840c37063d6c4e129f6d2554519a1e6dbb4bd939a94f5c293c69130ce086da",
       "controlTokenAttributes":"vghgj",
       "controlTokenQuantity":"5",
       "identityRecoveryIdList":"",
       "recoveryCondition":"",
       "yesVotesRequiredToPass":"",
       "validatorList":"7d5da9d6403dad7aeede09977b67fd2c659793036333e5b82e976642800de775",
       "delegateeIdList":"",
       "delegateeTokenQuantity":"",
       "isHuman":"false",
       "timestamp":"",
       "assetID":"kycTESTCHAIN",
       "Type":"non_cash",
       "bigchainHash":"",
       "bigchainID":"",
       "coidAddr":"",
       "sig":"6d47e89278dc6a1c55b152618a19dae7a5412c4754bb3204f746d3e837fea07160a9c909cb6ea29bf29734677dd5e92c6202ddb4520918306c1bd4e99ace24ea",
       "msg":"640b40905d37111b53b56fb7011e449b5e1f0bd9f2f5e7f9978a283c0624311e",
       "gatekeeperAddr":"859537ED6976A033F18A6D78D375804DE1DCCB61",
       "txn_id":"request_new_COID",
       "propType":"2"
    }*/

    if (formdata.isHuman == 'false') {

        console.log(formdata.gatekeeperAddr)
        var gatekeeperApp = new gatekeeper(formdata.gatekeeperAddr);
        formdata.yesVotesRequiredToPass = formdata.validatorList.split(",").length;

        //console.log("THE OBJ: "+ eventListener(formdata.gatekeeperAddr));
        console.log("LISTENING: " + listening);
        //if(listening != undefined){console.log("\ntrying\n");listening = eventListener(formdata.gatekeeperAddr);}
        //      try {
        //
        //       listening = eventListener(formdata.gatekeeperAddr);
        //      console.log("THE OBJ: "+ listening);
        //    }
        //    catch(err) {
        //      console.log("Creating new listener");
        //       listening = new eventListener(formdata.gatekeeperAddr);//WILL THIS EXPIRE AT THE END OF THEIR POST REQUEST?
        //      console.log(listening);
        //    }



        //ONLY ON SECOND REQUEST
        // console.log("AT INDEX 0: " + gatekeeperApp.debugging(0))

        var isValid = gatekeeperApp.verifyIt(formdata);
        var isUnique = gatekeeperApp.checkUnique(formdata);

        if (gatekeepers.indexOf(keccak_256(formdata.pubKey)) == -1) {
            gatekeepers.push(keccak_256(formdata.pubKey));
            var listening = new eventListener(formdata.gatekeeperAddr);//WILL THIS EXPIRE AT THE END OF THEIR POST REQUEST?
        }

        if (isValid) {
            console.log("Is valid value: " + (isValid == "true"))
            if (isUnique) {

                gatekeeperApp.getProposalId(formdata, res, function (err, res) {
                    if (err) {
                        console.log("got an error inside gatekeeperApp.getPRoposalID")
                        res.json({ "error": err });
                        console.log("Error");
                    }
                    else {
                        res.json({ "Method": "POST", "msg": "COID data submitted successfully" });
                    }
                });
            }
            else {
                res.send("The uniqueId is not unique.")
            }
        }
        else {
            res.send("The signature is not valid....check that your public key, signature and message hash are correct.")
        }
    }
});

app.listen(3002, function () {
    console.log("Connected to contract http://10.101.114.231:1337/rpc");
    console.log("Listening on port 3002");
});

