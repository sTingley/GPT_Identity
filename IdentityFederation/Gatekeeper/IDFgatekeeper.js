'use strict'
var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json')
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


var formdataArray = [];
var proposalIDArray = [];
var indexer = 0;


//this function is intended to send a notification
var notifier = function () {
    //location of digital twin
    this.twinUrl = "http://10.100.98.218:5050";

    //for grabbing the appropriate scope
    var _this = this;

    //function to send a notification:
    //TODO: CHANGE THE ENDPOINT:

    //NOTE: THE DIGITAL TWIN will reject it without pubKey
    this.notifyCoidCreation = function (pubKey, txnID, txnHash, gkAddr, coidAddr, dimensionCtrlAddr) {
        console.log("Notify coid creation: "+pubKey);
        superAgent.post(this.twinUrl + "/setAsset")
            .send({
                "pubKey":keccak_256(pubKey),
                "flag": 0,
                "fileName": "MyCOID.json",
                "updateFlag": 1,
                "keys": ["bigchainID", "bigchainHash", "gatekeeperAddr", "coidAddr", "dimensionCtrlAddr"],
                "values": [txnID, txnHash, gkAddr, coidAddr, dimensionCtrlAddr]
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                // if(res.status == 200){
                 console.log("Notify coid creation finished");
                // }
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

    this.createProposalPendingNotification = function (requester, proposalId) {

        superAgent.post(this.twinUrl + "/ballot/writeNotify")
            .send({
                "notificationType": "proposalPending",
                "pubKey": requester,
                "proposalID": proposalId,
                "isHuman": true,
                "gatekeeperAddr": "",
                "message": "Your proposal is pending for validation"
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                if (res.status == 200) {
                    console.log("proposalPending message sent successfully");
                }
            });
    };


} //end var notifier


var theNotifier = new notifier();

//Below for testing
//theNotifier.notifyCoidCreation("03683536757fdb821c10810b51caa51a84fc1dfab5c17edbf5246f9713ffe31adf","hii","hiii","hihi","hihihi");

//Below for testing
//theNotifier.createProposalPendingNotification("Requester","ImaproposalId")


//makes a coid
function CoidMaker(coidAddr, dimensionCtrlAddr, formdata) {

    //get params for their COID contract
    console.log("hi")
    var chain = 'primaryAccount';
    var chainUrl = chainConfig.URL;
    var contrData = require("./epm.json");
    var accounts = require('./accounts.json')
    var manager = erisContracts.newContractManagerDev(chainUrl, chainConfig[chain])

    var COIDabiAddr = contrData['CoreIdentity'];
    var abi_COID = JSON.parse(fs.readFileSync('./abi/' + COIDabiAddr, 'utf8'))
    var COIDcontract = manager.newContractFactory(abi_COID).at(coidAddr)

    var dimCtrlAddr = contrData['IdentityDimensionControl'];
    var abi_dimCtrl = JSON.parse(fs.readFileSync('./abi/' + dimCtrlAddr, 'utf8'))
    var dimCtrlContract = manager.newContractFactory(abi_dimCtrl).at(dimensionCtrlAddr)

    COIDcontract.getIt(function (error, result) {
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
    myOwnershipTokenAttributes = formdata.ownershipTokenAttributes.split(",");
    var myOwnershipTokenQuantity = formdata.ownershipTokenQuantity.split(",");
    var myControlTokenId = formdata.controlTokenId;
    var myControlTokenAttributes = [];
    myControlTokenAttributes = formdata.controlTokenAttributes.split(",");
    var myControlTokenQuantity = formdata.controlTokenQuantity.split(",");
    var myIdentityRecoveryIdList = [];
    myIdentityRecoveryIdList = formdata.identityRecoveryIdList.split(",");
    var myRecoveryCondition = formdata.recoveryCondition; // number of recoveryList needed

    //should isHumanValue be true?
    var isHumanValue = true;
    var theUniqueIDAttributes = myUniqueIdAttributes;

    for (var i = 0; i < theUniqueIDAttributes.length; i = i + 3) {
        theUniqueIDAttributes[i] = myUniqueIdAttributes[i];
    }



    setTimeout(function () {

        theUniqueIDAttributes = theUniqueIDAttributes.concat(Array(10 - theUniqueIDAttributes.length).fill("0"));
        myOwnerIdList = myOwnerIdList.concat(Array(10 - myOwnerIdList.length).fill("0"));
        myControlIdList = myControlIdList.concat(Array(10 - myControlIdList.length).fill("0"));
        myOwnershipTokenQuantity = myOwnershipTokenQuantity.concat(Array(10 - myOwnershipTokenQuantity.length).fill("0"));
        myControlTokenQuantity = myControlTokenQuantity.concat(Array(10 - myControlTokenQuantity.length).fill("0"));
        myIdentityRecoveryIdList = myIdentityRecoveryIdList.concat(Array(10 - myIdentityRecoveryIdList.length).fill("0"));


        //instantiate coid
        var _this = this;
        COIDcontract.setUniqueID(myUniqueId, theUniqueIDAttributes, isHumanValue, function (error) {
            //debugging function (getIt)
            COIDcontract.getIt(function (error, result) {
                console.log("setUniqueID: " + result);

                COIDcontract.setOwnership(myOwnerIdList, myOwnershipTokenQuantity, function (error) {
                    //debugging function (getIt)
                    COIDcontract.getIt(function (error, result) {
                        console.log("setOwnership: " + result);

                        COIDcontract.setControl(myControlTokenQuantity, myControlIdList, function (error) {

                            //debugging function (getIt)
                            COIDcontract.getIt(function (error, result) {
                                console.log("setControl" + result);

                                COIDcontract.setRecovery(myIdentityRecoveryIdList, myRecoveryCondition, function (error, result) {

                                    //debugging function (getIt)
                                    COIDcontract.getIt(function (error, result) {
                                        console.log("setRecovery: " + result);

                                        COIDcontract.StartCoid(function (error, result) {
                                            console.log("startCoid1: " + result);

                                            //debugging function (getIt)
                                            COIDcontract.getIt(function (Error, result) {
                                                console.log("startCoid: " + result);

                                                dimCtrlContract.IdentityDimensionControlInstantiation(coidAddr, function (err, result) {
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

function prepareForm(formdata){

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
        correctForm.uniqueIdAttributes=[];
correctForm.uniqueIdAttributes.push(formdata.uniqueIdAttributes.split(","));
correctForm.ownerIdList=formdata.ownerIdList.split(",");
correctForm.controlIdList=formdata.controlIdList.split(",");
correctForm.ownershipTokenAttributes=formdata.ownershipTokenAttributes.split(",");
correctForm.ownershipTokenQuantity=formdata.ownershipTokenQuantity.split(",");
correctForm.controlTokenAttributes=formdata.controlTokenAttributes.split(",");
correctForm.controlTokenQuantity=formdata.controlTokenQuantity.split(",");
correctForm.identityRecoveryIdList=formdata.identityRecoveryIdList.split(",");

return(correctForm);


}

function writeAll(formdata, callback) {

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


//makes a change unique attributes for a unique ID
function UniqueAttributeChanger(coidAddr, dimensionCtrlAddr, formdata) {

    //get params for their COID contract
    console.log("Unique Attribute Changer formdata:\n"+ JSON.stringify(formdata)+"\n")
    var chain = 'primaryAccount';
    var chainUrl = chainConfig.URL;
    var contrData = require("./epm.json");
    var accounts = require('./accounts.json')
    var manager = erisContracts.newContractManagerDev(chainUrl, chainConfig[chain])

    var COIDabiAddr = contrData['CoreIdentity'];
    var abi_COID = JSON.parse(fs.readFileSync('./abi/' + COIDabiAddr, 'utf8'))
    var COIDcontract = manager.newContractFactory(abi_COID).at(coidAddr)

    //var dimCtrlAddr = contrData['IdentityDimensionControl'];
    //var abi_dimCtrl = JSON.parse(fs.readFileSync('./abi/' + dimCtrlAddr, 'utf8'))
    //var dimCtrlContract = manager.newContractFactory(abi_dimCtrl).at(dimensionCtrlAddr)

    COIDcontract.getIt(function (error, result) {
        console.log(result + " is the result")
    })

    //parse the form data
    var sig = formdata.sig;
    var msg = formdata.msg;
    var requester = formdata.pubKey; // the pubkey of coid requester
    var myUniqueId = formdata.uniqueId;// since we are not changing the actual unique ID field
    var myUniqueIdAttributes = formdata.uniqueIdAttributes;
    var proposalId = formdata.proposalId;// needed to get values
    //should isHumanValue be true?
    var isHumanValue = true;
    var theUniqueIDAttributes = myUniqueIdAttributes;

    for (var i = 0; i < theUniqueIDAttributes.length; i = i + 3) {
        theUniqueIDAttributes[i] = myUniqueIdAttributes[i];
    }



    setTimeout(function () {

        //instantiate coid
        var _this = this;
       /* COIDcontract.getUniqueID( function (error,result) {

            oldAttr = result[1];
            var k=0;
            for(var i=0;i<oldAttr.length;i++){
                if(oldAttr[i] == 0 && k<theUniqueIDAttributes.length){
                    oldAttr[i] = theUniqueIDAttributes[k];
                    k++;
                }
            }*/
            console.log("\nATTRIBUTES:\n" + theUniqueIDAttributes);
            theUniqueIDAttributes = theUniqueIDAttributes.concat(Array(10 - theUniqueIDAttributes.length).fill("0"));
            COIDcontract.setUniqueID(myUniqueId, theUniqueIDAttributes, isHumanValue, function (error) {})//end setUniqueID
       // })
    }, 3000)

}//end UniqueAttributeChanger

//Instantiate one of these
var gatekeeper = function () {

    //Debugging Comment:
    console.log("A gatekeeper object has just been instantiated")

    this.chain = 'primaryAccount';
    this.erisdburl = chainConfig.chainURL;
    this.contractData = require("./epm.json");
    this.contractAddress = this.contractData['GateKeeper'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/" + this.contractAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisContracts.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
    this.gateKeeperContract = this.contractMgr.newContractFactory(this.erisAbi).at(this.contractAddress);

    //ballot contract
    this.ballotAddress = this.contractData['ballot'];
    // console.log("this is the ballot address: " + this.ballotAddress);
    this.ballotAbi = JSON.parse(fs.readFileSync("./abi/" + this.ballotAddress));
    this.ballotContract = this.contractMgr.newContractFactory(this.ballotAbi).at(this.ballotAddress);

    //dao contract
    this.DaoData = require("/home/demoadmin/.eris/apps/Dao/epm.json");
    this.DaoAddress = this.DaoData['Dao'];
    this.DaoAbi = JSON.parse(fs.readFileSync("/home/demoadmin/.eris/apps/Dao/abi/" + this.DaoAddress));
    this.DaoContract = this.contractMgr.newContractFactory(this.DaoAbi).at(this.DaoAddress);

    //verification contract (oraclizer)
    this.VerificationAddress = require('/home/demoadmin/.eris/apps/VerifyOraclizerEthereum/wallet2/epm.json').deployStorageK;
    this.VerificationAbi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/VerifyOraclizerEthereum/wallet2/abi/' + this.VerificationAddress, 'utf8'))
    this.VerificationContract = this.contractMgr.newContractFactory(this.VerificationAbi).at(this.VerificationAddress)
    this.ErisAddress = chainConfig[this.chain].address;

    //bigchain contract (oraclizer)
    this.bigchain_query_addr = require('/home/demoadmin/.eris/apps/BigchainOraclizer/epm.json').deployStorageK
    this.bigchain_abi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/BigchainOraclizer/abi/' + this.bigchain_query_addr, 'utf8'))
    this.bigchain_contract = this.contractMgr.newContractFactory(this.bigchain_abi).at(this.bigchain_query_addr)


    //use this to have the gatekeeper scope inside functions
    var _this = this;


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
        var myUniqueId = formdata.uniqueId;
        var sync = true;
        var isUniqueResult = false;
        _this.gateKeeperContract.isUnique(myUniqueId, function (error, result) {

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
        myControlIdList = formdata.controlIdList.split(",");
        var myOwnershipTokenId = formdata.ownershipTokenId;
        var myOwnershipTokenAttributes = formdata.ownershipTokenAttributes;
        var myOwnershipTokenQuantity = formdata.ownershipTokenQuantity.split(",");
        var myControlTokenId = formdata.controlTokenId;
        var myControlTokenAttributes = formdata.controlTokenAttributes;
        var myControlTokenQuantity = formdata.controlTokenQuantity.split(",");
        var myIdentityRecoveryIdList = [];
        myIdentityRecoveryIdList = formdata.identityRecoveryIdList.split(",");
        var myRecoveryCondition = formdata.recoveryCondition; // number of recoveryList needed

        var ballotContractAddr = this.ballotAddress;
        var DaoContractAddr = this.DaoAddress;
        var yesVotesRequiredToPass = formdata.yesVotesRequiredToPass;
        var isHuman = formdata.isHuman;


        try {
            this.setCoidRequester(requester, proposalId, sig, msg);
            this.setisHuman(proposalId, isHuman);
            this.setmyUniqueID(requester, proposalId, myUniqueId, myUniqueIdAttributes);
            var this1 = this;
            setTimeout(function () {
                this1.setmyOwnershipID(requester, proposalId, myOwnershipId, myOwnerIdList);
                this1.setmyControlID(requester, proposalId, myControlId, myControlIdList);
                this1.setmyOwnershipTokenID(requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes, myOwnershipTokenQuantity);
                this1.setmyControlTokenID(requester, proposalId, myControlTokenId, myControlTokenAttributes, myControlTokenQuantity);
                this1.setmyIdentityRecoveryIdList(requester, proposalId, myIdentityRecoveryIdList, myRecoveryCondition);
                this1.selectValidators(proposalId, DaoContractAddr, ballotContractAddr);

                this1.initiateCoidProposalSubmission(ballotContractAddr, proposalId, yesVotesRequiredToPass, isHuman);
                //this.selectValidators(proposalId, DaoContractAddr, ballotContractAddr);
                //theNotifier.createProposalPendingNotification(requester, proposalId);


                callback(false, res);
            }, 3000)
        }
        catch (e) {
            callback(true, res);
        }

        return;

    };

    this.addUID = function (proposalId, formdata, res, callback) {

        //local variables for API calls
        console.log("addUID reached");
        // var proposalId = formdata.proposalId;
        var sig = formdata.sig;
        var msg = formdata.msg;
        var requester = formdata.pubKey; // the pubkey of coid requester
        var myUniqueId = formdata.uniqueId;
        var myUniqueIdAttributes = formdata.uniqueIdAttributes.split(",");

        var ballotContractAddr = this.ballotAddress;
        var DaoContractAddr = this.DaoAddress;
        var yesVotesRequiredToPass = formdata.yesVotesRequiredToPass;
        var isHuman = formdata.isHuman;
        var forUID = formdata.forUniqueId;
console.log("adduid try catch");
        try {
                this.setCoidRequester(requester, proposalId, sig, msg);
                this.setisHuman(proposalId, isHuman);
                this.setmyUniqueID(requester, proposalId, myUniqueId, myUniqueIdAttributes);
                this.setForUID(proposalId, forUID);
                var this1 = this;
            setTimeout(function () {
                this1.selectValidators(proposalId, DaoContractAddr, ballotContractAddr);
                this1.initiateCoidProposalSubmission(ballotContractAddr, proposalId, yesVotesRequiredToPass, isHuman);
                //theNotifier.createProposalPendingNotification(requester, proposalId);
                callback(false, res);
            }, 3000)
        }
        catch (e) {
            callback(true, res);
        }

        return;

    };


    this.getProposalId = function (formdata, res, callback) {

        var proposalId;
        var sync = true;
        var formdata1 = formdata;
        _this.ballotContract.getProposalId(function (error, result) {

            if (error) {

                console.log(err);
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

        while (sync) { require('deasync').sleep(100); }
        if(typeof(formdata.forUniqueId) == 'undefined' || typeof(formdata.forUniqueId) == 'null' || formdata.forUniqueId != 'true'){
            this.setcoidData(proposalId, formdata, res, callback);
            console.log("547: called set coid data");
        }
        else{
            this.addUID(proposalId, formdata, res, callback);
            console.log("called addUID");
        }
        //console.log("419: called set coid data....");
    }; //end of function


    this.setCoidRequester = function (requester, proposalId, sig, msg) {

        var sync = true;
        _this.gateKeeperContract.setCoidRequester(requester, proposalId, sig, msg, function (err, res) {

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

        while (sync) { require('deasync').sleep(100); }
    }; // end of function setCoidRequester


    //CHECK IF PROPOSAL IS FOR AN INDIVIDUAL OR A THING
    this.setisHuman = function (proposalId, isHuman) {
        var sync = true;

        var isHuman = Boolean(isHuman);
        _this.gateKeeperContract.setisHuman(proposalId, isHuman, function (err, res) {

            if (err) {
                console.log("Error setting is human: " + err)
            }
            else {
                console.log("Result setting isHuman: " + res)
                sync = false;
                return;
            }
        });//end of callback

        while (sync) { require('deasync').sleep(100); }

    }


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

            });
        }

        //wh
        //ile (sync) { require('deasync').sleep(100); }
    }; //end setMyUniqueID

    //set UID attributes
    this.setForUID = function (proposalId, uid) {
        var sync = true;

        var uid = Boolean(uid);
        _this.gateKeeperContract.setForUID(proposalId, uid, function (err, res) {

            if (err) {
                console.log("Error setting is UID attributes bool: " + err)
            }
            else {
                console.log("Result setting UID attributes bool: " + res)
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
                sync = false;
                return;
            }

        }); // end of callback

        while (sync) { require('deasync').sleep(100); }
    }; //end of function setmyOwnershipID


    this.setmyControlID = function (requester, proposalId, myControlId, myControlIdList) {
        var sync = true;
        var len = myControlIdList.length;

        if (myControlIdList.length < 10) {
            for (var i = len; i < 10; i++) {
                myControlIdList[i] = "0";
            }
        }//end if

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

        while (sync) { require('deasync').sleep(100); }

    }; //end of function


    this.setmyOwnershipTokenID = function (requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes, myOwnershipTokenQuantity) {

        var sync = true;
        //var len = myOwnershipTokenAttributes.length;

        //if (myOwnershipTokenAttributes.length < 10) {
        //    for (var i = len; i < 10; i++) {
        //        myOwnershipTokenAttributes[i] = "0";
        //    }
        // }

        var len2 = myOwnershipTokenQuantity.length;
        if (myOwnershipTokenQuantity.length < 10) {
            for (var i = len2; i < 10; i++) {
                myOwnershipTokenQuantity[i] = "0";
            }
        }
        _this.gateKeeperContract.setmyOwnershipTokenID(requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes, myOwnershipTokenQuantity, function (err, res) {


            if (err) {
                console.log("Error4");
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
        while (sync) { require('deasync').sleep(100); }

    };//end of function

    this.setmyControlTokenID = function (requester, proposalId, myControlTokenId, myControlTokenAttributes, myControlTokenQuantity) {
        var sync = true;
        // var len = myControlTokenAttributes.length;

        // if (myControlTokenAttributes.length < 10) {
        //    for (var i = len; i < 10; i++) {
        //        myControlTokenAttributes[i] = "0";
        //    }
        //}

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

        while (sync) { require('deasync').sleep(100); }
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

        while (sync) { require('deasync').sleep(100); }
    }; // end of function

    this.selectValidators = function (proposalId, daoAddr, ballotAddress) {
        var sync = true;

        _this.gateKeeperContract.selectValidators(proposalId, daoAddr, ballotAddress, function (err, res) {
            console.log(res);
            console.log("proposalId: " + proposalId);
            console.log("daoAddr: " + daoAddr);
            console.log("ballotAddress: " + ballotAddress);
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

        while (sync) { require('deasync').sleep(100); }

    }; // end of function


    this.initiateCoidProposalSubmission = function (ballotAddress, proposalId, yesVotesRequiredToPass, isHuman) {
        var sync = true;
        _this.gateKeeperContract.initiateCoidProposalSubmission(ballotAddress, proposalId, yesVotesRequiredToPass, isHuman, function (err, res) {

            if (err) {
                console.log("Error for initiateCoidProposalSubmission: " + err);
            }
            else {
                console.log("Is COID request has been initiated: " + res);
                sync = false;
                return;
            }


        })// end of callback


        while (sync) { require('deasync').sleep(100); }

    };// end of function

}


//NOTE: Event listening must be done outside each gatekeeper app instance continuously
//This way, new instances are not done per each instance
var eventListener = function () {

    this.chain = 'primaryAccount';
    this.erisdburl = chainConfig.chainURL;
    this.contractData = require("./epm.json");
    this.contractAddress = this.contractData['GateKeeper'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/" + this.contractAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisContracts.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
    this.gateKeeperContract = this.contractMgr.newContractFactory(this.erisAbi).at(this.contractAddress);

    //ballot contract
    this.ballotAddress = this.contractData['ballot'];
    // console.log("this is the ballot address: " + this.ballotAddress);
    this.ballotAbi = JSON.parse(fs.readFileSync("./abi/" + this.ballotAddress));
    this.ballotContract = this.contractMgr.newContractFactory(this.ballotAbi).at(this.ballotAddress);

    //dao contract
    this.DaoData = require("/home/demoadmin/.eris/apps/Dao/epm.json");
    this.DaoAddress = this.DaoData['Dao'];
    this.DaoAbi = JSON.parse(fs.readFileSync("/home/demoadmin/.eris/apps/Dao/abi/" + this.DaoAddress));
    this.DaoContract = this.contractMgr.newContractFactory(this.DaoAbi).at(this.DaoAddress);

    //verification contract (oraclizer)
    this.VerificationAddress = require('/home/demoadmin/.eris/apps/VerifyOraclizerEthereum/wallet2/epm.json').deployStorageK;
    this.VerificationAbi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/VerifyOraclizerEthereum/wallet2/abi/' + this.VerificationAddress, 'utf8'))
    this.VerificationContract = this.contractMgr.newContractFactory(this.VerificationAbi).at(this.VerificationAddress)
    this.ErisAddress = chainConfig[this.chain].address;

    //bigchain contract (oraclizer)
    this.bigchain_query_addr = require('/home/demoadmin/.eris/apps/BigchainOraclizer/epm.json').deployStorageK
    this.bigchain_abi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/BigchainOraclizer/abi/' + this.bigchain_query_addr, 'utf8'))
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

        var metadata = { "bigchainID": arguments[12], "bigchainHash": arguments[13] } || "";
        bigchainInput = JSON.stringify({ "data": bigchainInput, "metadata": metadata })
        console.log("In function bigchainIt, the input to be sent to bigchain is: " + bigchainInput)



        var bigchainEndpoint = 'addData/' + thePubkey + '/1'
        var theobj = { "method": "POST", "stringJsonData": bigchainInput, "endpoint": bigchainEndpoint }
        console.log("Bigchain Request: " + JSON.stringify(theobj))

        _this.bigchain_contract.BigChainQuery(JSON.stringify(theobj), function (error, result) {

            console.log("A million stars ***************************************************************************************")
            var theEvent;
            _this.bigchain_contract.CallbackReady(function (error, result) {
                theEvent = result;
            },
                function (error, result) {

                    if (thePubkey == result.args.addr) {

                        _this.bigchain_contract.myCallback(function (error, result) {

                            console.log("RESULT: " + result);
                            var bigchainID = JSON.parse(result).response;
                            console.log("Result.response: " + bigchainID)
                            bigchainID = JSON.parse(bigchainID).id;
                            var bigchainHash = keccak_256(JSON.parse(result).response);
                            console.log("************: " + JSON.parse(result).response);

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
            //console.log(result + " " + typeof (result));
            if (typeof (result) != 'object' && typeof (result.args) == 'null' && typeof (result.args) == 'undefined' && typeof (result.args.expiredProposalId) == 'null' && typeof (result.args.expiredProposalId) == 'undefined') {
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
            }
            else{
                console.log("problem with results: " + result);
                console.log("error: "+ error);
            }
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
            console.log("\nCaught gatekeeper contract event ResultReady....")
            console.log("Voting result is: " + votingResult);
            console.log("proposalID is: " + proposalId);
            console.log("resultMessage is: " + resultMessage);
            console.log("coidGKAddr is: " + coidGKAddr);
            console.log("coidAddr is: " + coidAddr);
            console.log("dimensionCtrlAddr is: " + dimensionCtrlAddr)
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
                            _this.bigchainIt(proposalId, formdataArray[index], coidGKAddr, coidAddr, dimensionCtrlAddr, blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, function (result, theId, theHash) {
                                // console.log(result);
                                console.log("THE TXN ID: " + theId)
                                console.log("THE HASH: " + theHash)
                                console.log("GK ADDR: " + coidGKAddr)
                                console.log("COID ADDR: " + coidAddr)
                                console.log("DIM_CTRL ADDR: " + dimensionCtrlAddr)

                                //theNotifier.notifyCoidCreation(formdataArray[index].pubKey, theId, theHash, coidGKAddr, coidAddr, dimensionCtrlAddr)
                                var form = formdataArray[index];
                                form.bigchainID = theId;
                                form.bigchainHash = theHash;
                                form.gatekeeperAddr = coidGKAddr;
                                form.coidAddr = coidAddr;
                                form.dimensionCtrlAddr = dimensionCtrlAddr;

                                writeAll(prepareForm(form), function(){});

                                //makes the core identity
                                CoidMaker(coidAddr, dimensionCtrlAddr, formdataArray[index])

                                //delete the proposal
                                //TODO- add this function back
                                //deleteProposal(proposalId);
                            })
                        })
                    },
                        5000);

                    // Delete the proposal from gatekeeper only if storing coid into bigchaindb is successful
                    // TODO: Call ballot removeSelectedValidators and removeProposal for the proposalID
                    //_this.gateKeeperContract.deleteProposal(proposalId, function (error, result)
                    //{
                    //    if (error)
                    //    {
                    //        console.log("error from Gatekeeper Contract function deleteProposal:" + error);
                    //    } else
                    //    {
                    //        console.log("result from Gatekeeper Contract function deleteProposal:" + result);
                    //    }
                    // });

                }
                else {
                    console.log("error finding form data--could not write acceptance to bigchaindb!")
                }
            }

        })

    var eventGatekeeperResultReadyUniqueId;

    _this.gateKeeperContract.resultReadyUniqueId(
        function (error, result) {
            eventGatekeeperResultReadyUniqueId = result;
        },
        function (error, result) {
            console.log("event result: "+JSON.stringify(result) +"\n");
            console.log("event args: "+JSON.stringify(result.args)+"\n");
            //grab parameters from the event
            var fileName = "MyCOID.json";
            var flag = 0;
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
            console.log("\nCaught gatekeeper contract event ResultReadyUniquID....")
            console.log("Voting result is: " + votingResult);
            console.log("proposalID is: " + proposalId);
            console.log("resultMessage is: " + resultMessage);
            console.log("coidGKAddr is: " + coidGKAddr);
            console.log("coidAddr is: " + coidAddr);
            console.log("dimensionCtrlAddr is: " + dimensionCtrlAddr)
            console.log("blockNumber is: " + blockNumber);
            console.log("blockHashVal is: " + blockHashVal);
            console.log("blockchainID is: " + blockchainID);
            console.log("timestamp is: " + timestamp);
            console.log("result.args: " + JSON.stringify(result.args));

            //implement logic if and only if votingResult is true:
            if (votingResult) {
                //find data given proposalId
                var index = -1;
                console.log("propIDARRAY: " + proposalIDArray);
                console.log("propID: "+ proposalId);
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
                            console.log("get asset: " + formdataArray[index].pubKey);
                            theNotifier.GetAsset(formdataArray[index].pubKey, fileName, flag, function (results) {
                                var myUniqueIdAttributes = formdataArray[index].uniqueIdAttributes.split(",");
                                //for(var j=0;j<myUniqueIdAttributes.length;j++){
                                    results.uniqueIdAttributes.push(myUniqueIdAttributes);
                                //}
                                console.log("get asset returns: "+ JSON.stringify(results) +"\n");
                            _this.bigchainIt(proposalId, results, results.gatekeeperAddr, results.coidAddr, results.dimensionCtrlAddr, blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, function (result, theId, theHash) {
                                // console.log(result);
                                console.log("THE TXN ID: " + theId)
                                console.log("THE HASH: " + theHash)
                                console.log("GK ADDR: " + coidGKAddr)
                                console.log("COID ADDR: " + coidAddr)
                                console.log("DIM_CTRL ADDR: " + dimensionCtrlAddr)
                                results.bigchainID = theId;
                                results.bigchainHash = theHash;
                                theNotifier.SetAsset(keccak_256(formdataArray[index].pubKey).toUpperCase(),fileName,flag,0,results,"","",function () {})

                                //makes the changes Unique ID attributes
                                UniqueAttributeChanger(results.coidAddr, results.dimensionCtrlAddr, results)

                                //delete the proposal
                                //TODO- add this function back
                                //deleteProposal(proposalId);
                            },results.bigchainID, results.bigchainHash)
                        })
                        })
                    },5000);

                    // Delete the proposal from gatekeeper only if storing coid into bigchaindb is successful
                    // TODO: Call ballot removeSelectedValidators and removeProposal for the proposalID
                    //_this.gateKeeperContract.deleteProposal(proposalId, function (error, result)
                    //{
                    //    if (error)
                    //    {
                    //        console.log("error from Gatekeeper Contract function deleteProposal:" + error);
                    //    } else
                    //    {
                    //        console.log("result from Gatekeeper Contract function deleteProposal:" + result);
                    //    }
                    // });

                }
                else {
                    console.log("error finding form data--could not write acceptance to bigchaindb!")
                }
            }

        })

    //
    // Listening of the resultIsReady event in the ballot:
    // When the event is ready, it calls the function in gatekeeper, result is ready
    // Note that after the function is called in gatekeeper, it triggers the gatekeeper resultReady event
    //
    var eventBallotResultIsReady;
    _this.ballotContract.resultIsReadyIDF
        (
        function (error, result) {
            eventBallotResultIsReady = result
        },
        function (error, result) {
            var proposalId = result.args.proposalId;
            var requestResult = result.args.requestResult;
            var chainID = keccak_256(_this.chain);

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
        )


    //added from gatekeeper_v8

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
            console.log(JSON.stringify(result) + "...is from isproposalexpired function in ballot")
            setTimeout(function () {
                //recursively check every 9 seconds. in the future make this a day.
                isExpired()
            }, 9000)
        })
    }

    //start the recursive checking

    //            setTimeout(function()
    //              {isExpired()
    //            },5000);


    //this is to delete the proposal in the ballot and gatekeeper, upon consensus (rejection and acceptance)
    function deleteProposal(proposalId) {
        _this.ballotContract.deleteProposal(proposalId, function (error, result) {
            console.log(proposalId + " is the proposalId. Error in delete proposal from ballot? " + error)
        })

        _this.gateKeeperContract.deleteProposal(proposalId, function (error, result) {
            console.log(proposalId + " is the proposalId. Error in delete proposal from gatekeepr? " + error)
        });
    }

    //end of addition gatekeeper_v8
    //******************************************************** */


}//end of eventListener




var listening = new eventListener();

app.post("/gatekeeper", function (req, res) {

    console.log("Just transacted a POST Request to endpoint: /gatekeeper")
    var formdata = req.body;
    console.log("Form data from gatekeeper ===> ", formdata);

/*    var formdata =
{ pubKey: '0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055',
  uniqueId: '1fc5423ba3d8efec282b89fbbe03fb9c0c7cbfc1e3a9f9cbf029bec1e3e2df7c',
  uniqueIdAttributes: 'ben21,312d9797c4a7f7026c066aa8007444b50821b1396ad5329ce7e86616cf9109cc,QmeisSzvczanjqPNXFAiZnBwRHpKrgwpjAC9Y4BLc3JgsY',
  ownershipId: '795aa43564a4bb68e8014a823a1698e361d85e2fbd92bb7f93fc256f2ac0a66a',
  ownerIdList: '795aa43564a4bb68e8014a823a1698e361d85e2fbd92bb7f93fc256f2ac0a66a',
  controlId: '5674453b04fe840851038e94bb45ecec7b88cac5a354bde6116e15f12295edfc',
  controlIdList: '0695566f5b5c3095e39e8f979ff39addd07507c38bf71daa2db75058cc7ff630,0695566f5b5c3095e39e8f979ff39addd07507c38bf71daa2db75058cc7ff630',
  ownershipTokenId: '6959b6456ec431bcf33b1538a98f1f80acc5871aea17ad8a7b2dcbd2b5561c2b',
  ownershipTokenAttributes: 'er',
  ownershipTokenQuantity: '0',
  controlTokenId: '70482ccbbd24866c7983f91f0e505e49b05c8a43b8255973bbe60444b4691060',
  controlTokenAttributes: 'gjk.',
  controlTokenQuantity: '0,0',
  identityRecoveryIdList: 'c275b05770cdee0cf3f234a0d8ad17b0a554cf637f8e0c8b2e45097f1f4716e4',
  recoveryCondition: '0',
  yesVotesRequiredToPass: '2',
  isHuman: 'true',
  timestamp: '',
  assetID: 'MyCOID',
  Type: 'non_cash',
  bigchainHash: '',
  bigchainID: '',
  coidAddr: '',
  gatekeeperAddr: '',
  dimensions: '',
  sig: '79e2bb1c1f60f6d300a6676a157c7078fd4e0001f1e06bd49313807c8db0a60327f260cb4cd7d0aff3add0bf654be68b22e18bffcf5e9692dfdfc05efaab1763',
  msg: '4d0f626621af134d41a7ce8c21ca78e56616e7cb5a149ab91d19fb3dd30a8720',
  txn_id: 'requestCOID',
  forUniqueId : 'true'
}*/

if(formdata.isHuman == 'true'){
    var gatekeeperApp = new gatekeeper();
    var isValid = gatekeeperApp.verifyIt(formdata);
    var isUnique = gatekeeperApp.checkUnique(formdata);

    console.log('before is valid check...')
    //console.log(req.body)

    console.log("isValid is: " + isValid);
    if (isValid) {
        // console.log("Is valid value: " + (isValid == true))
        if (isUnique) {

            gatekeeperApp.getProposalId(formdata, res, function (err, res) {
                if (err) {
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



app.listen(3000, function () {
    console.log("Connected to contract http://10.101.114.231:1337/rpc");
    console.log("Listening on port 3000");
});

