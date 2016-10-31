'use strict'

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
var twinUrl = "http://localhost:5050";

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
    this.twinUrl = "http://localhost:5050";

    //for grabbing the appropriate scope
    var _this = this;


    //function to send a notification:
    //TODO: CHANGE THE ENDPOINT:

    //NOTE: THE DIGITAL TWIN will reject it without pubKey
    this.notifyCoidCreation = function (pubKey, txnID, txnHash, gkAddr, coidAddr) {
        superAgent.post(this.twinUrl + "/coidCreation")
            .send({
                "pubKey": pubKey,
                "txnID": txnID,
                "txnHash": txnHash,
                "gkAddr": gkAddr,
                "coidAddr": coidAddr
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                // if(res.status == 200){
                // do something
                // }
            });
    };


    this.createProposalPendingNotification = function (requester, proposalId) {


        superAgent.post(this.twinUrl + "/ballot/writeNotify")
            .send({
                "notificationType": "proposalPending",
                "pubKey": requester,
                "proposalID": proposalId,
                "message": "Your proposal is pending for validation"
        	   })
            .set('Accept', 'application/json')
            .end((err, res) => {
                //if(res.status == 200){
                //    console.log("proposalPending message sent successfully");
                // }
            });
    };



}


var theNotifier = new notifier();

//Below for testing
//theNotifier.notifyCoidCreation("03683536757fdb821c10810b51caa51a84fc1dfab5c17edbf5246f9713ffe31adf","hii","hiii","hihi","hihihi");

//Below for testing
//theNotifier.createProposalPendingNotification("Requester","ImaproposalId")

//Instantiate one of these
var gatekeeper = function () {

    //Debugging Comment:
    console.log("A gatekeeper object has just been instantiated")


    this.chain = 'newchain4_full_000';
    this.erisdburl = "http://10.100.98.218:1337/rpc";
    this.contractData = require("./epm.json");
    this.contractAddress = this.contractData['GateKeeper'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/" + this.contractAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisContracts.newContractManagerDev(this.erisdburl, this.accountData[this.chain]);
    this.gateKeeperContract = this.contractMgr.newContractFactory(this.erisAbi).at(this.contractAddress);


    //ballot contract
    this.ballotAddress = this.contractData['ballot'];
    // console.log("this is the ballot address: " + this.ballotAddress);
    this.ballotAbi = JSON.parse(fs.readFileSync("./abi/" + this.ballotAddress));
    this.ballotContract = this.contractMgr.newContractFactory(this.ballotAbi).at(this.ballotAddress);

    //dao contract
    this.DaoData = require("/home/demoadmin/Migration_from_Eris/Dao/epm.json");
    this.DaoAddress = this.DaoData['Dao'];
    this.DaoAbi = JSON.parse(fs.readFileSync("/home/demoadmin/Migration_from_Eris/Dao/abi/" + this.DaoAddress));
    this.DaoContract = this.contractMgr.newContractFactory(this.DaoAbi).at(this.DaoAddress);

    //verification contract (oraclizer)
    this.VerificationAddress = require('/home/demoadmin/Migration_from_Eris/VerifyOraclizerEthereum/wallet2/epm.json').deployStorageK;
    this.VerificationAbi = JSON.parse(fs.readFileSync('/home/demoadmin/Migration_from_Eris/VerifyOraclizerEthereum/wallet2/abi/' + this.VerificationAddress, 'utf8'))
    this.VerificationContract = this.contractMgr.newContractFactory(this.VerificationAbi).at(this.VerificationAddress)
    this.ErisAddress = this.accountData[this.chain].address;

    //bigchain contract (oraclizer)
    this.bigchain_query_addr = require('/home/demoadmin/Migration_from_Eris/BigchainOraclizer/epm.json').deployStorageK
    this.bigchain_abi = JSON.parse(fs.readFileSync('/home/demoadmin/Migration_from_Eris/BigchainOraclizer/abi/' + this.bigchain_query_addr, 'utf8'))
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
                console.log(err);

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

        var ballotContractAddr = this.ballotAddress;
        var DaoContractAddr = this.DaoAddress;
        var yesVotesRequiredToPass = formdata.yesVotesRequiredToPass;
        var isHuman = formdata.isHuman;


        try {
            this.setCoidRequester(requester, proposalId, sig, msg);
            this.setisHuman(proposalId, isHuman);
            this.setmyUniqueID(requester, proposalId, myUniqueId, myUniqueIdAttributes);
            this.setmyOwnershipID(requester, proposalId, myOwnershipId, myOwnerIdList);
            this.setmyControlID(requester, proposalId, myControlId, myControlIdList);
            this.setmyOwnershipTokenID(requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes, myOwnershipTokenQuantity);
            this.setmyControlTokenID(requester, proposalId, myControlTokenId, myControlTokenAttributes, myControlTokenQuantity);
            this.setmyIdentityRecoveryIdList(requester, proposalId, myIdentityRecoveryIdList, myRecoveryCondition);
            this.selectValidators(proposalId, DaoContractAddr, ballotContractAddr);

            this.initiateCoidProposalSubmission(ballotContractAddr, proposalId, yesVotesRequiredToPass);
            // this.selectValidators(proposalId, DaoContractAddr, ballotContractAddr);
            theNotifier.createProposalPendingNotification(requester, proposalId);

            callback(false, res);
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

        this.setcoidData(proposalId, formdata, res, callback);
        console.log("right after set coid data....");
        console.log("formdata: " + formdata);
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

        //while (sync) { require('deasync').sleep(100); }
    };





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

        while (sync) { require('deasync').sleep(100); }
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

        while (sync) { require('deasync').sleep(100); }

    }; //end of function



    this.setmyOwnershipTokenID = function (requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes, myOwnershipTokenQuantity) {

        var sync = true;
        var len = myOwnershipTokenAttributes.length;

        if (myOwnershipTokenAttributes.length < 10) {
            for (var i = len; i < 10; i++) {
                myOwnershipTokenAttributes[i] = "0";
            }
        }

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
        var len = myControlTokenAttributes.length;

        if (myControlTokenAttributes.length < 10) {
            for (var i = len; i < 10; i++) {
                myControlTokenAttributes[i] = "0";
            }
        }


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




    this.initiateCoidProposalSubmission = function (ballotAddress, proposalId, yesVotesRequiredToPass) {
        var sync = true;
        _this.gateKeeperContract.initiateCoidProposalSubmission(ballotAddress, proposalId, yesVotesRequiredToPass, function (err, res) {

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


    this.chain = 'newchain4_full_000';
    this.erisdburl = "http://10.100.98.218:1337/rpc";
    this.contractData = require("./epm.json");
    this.contractAddress = this.contractData['GateKeeper'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/" + this.contractAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisContracts.newContractManagerDev(this.erisdburl, this.accountData[this.chain]);
    this.gateKeeperContract = this.contractMgr.newContractFactory(this.erisAbi).at(this.contractAddress);


    //ballot contract
    this.ballotAddress = this.contractData['ballot'];
    // console.log("this is the ballot address: " + this.ballotAddress);
    this.ballotAbi = JSON.parse(fs.readFileSync("./abi/" + this.ballotAddress));
    this.ballotContract = this.contractMgr.newContractFactory(this.ballotAbi).at(this.ballotAddress);

    //dao contract
    this.DaoData = require("/home/demoadmin/Migration_from_Eris/Dao/epm.json");
    this.DaoAddress = this.DaoData['Dao'];
    this.DaoAbi = JSON.parse(fs.readFileSync("/home/demoadmin/Migration_from_Eris/Dao/abi/" + this.DaoAddress));
    this.DaoContract = this.contractMgr.newContractFactory(this.DaoAbi).at(this.DaoAddress);

    //verification contract (oraclizer)
    this.VerificationAddress = require('/home/demoadmin/Migration_from_Eris/VerifyOraclizerEthereum/wallet2/epm.json').deployStorageK;
    this.VerificationAbi = JSON.parse(fs.readFileSync('/home/demoadmin/Migration_from_Eris/VerifyOraclizerEthereum/wallet2/abi/' + this.VerificationAddress, 'utf8'))
    this.VerificationContract = this.contractMgr.newContractFactory(this.VerificationAbi).at(this.VerificationAddress)
    this.ErisAddress = this.accountData[this.chain].address;

    //bigchain contract (oraclizer)
    this.bigchain_query_addr = require('/home/demoadmin/Migration_from_Eris/BigchainOraclizer/epm.json').deployStorageK
    this.bigchain_abi = JSON.parse(fs.readFileSync('/home/demoadmin/Migration_from_Eris/BigchainOraclizer/abi/' + this.bigchain_query_addr, 'utf8'))
    this.bigchain_contract = this.contractMgr.newContractFactory(this.bigchain_abi).at(this.bigchain_query_addr)



    //use this to have the gatekeeper scope inside functions
    var _this = this;


    //This is for signature generation:
    this.createSignature = function (nonHashedMessage, callback) {
        //make message hash
        var hash = crypto.createHash('sha256').update(nonHashedMessage).digest('hex')

        var pubKey = _this.accountData.newchain4_full_000.pubKey;
        var privKey = _this.accountData.newchain4_full_000.privKey;

        var keyPair = { "publicKey": new Buffer(pubKey, "hex"), "privateKey": new Buffer(privKey, "hex") }

        var signature = ed25519.Sign(new Buffer(hash), keyPair)

        signature = signature.toString('hex')

        var result = { "signature": signature, "pubKey": pubKey, "msg": hash }

        callback(signature, pubKey, hash)
    }


    //this is for bigchain writing
    //see the note (above var bigchainInput) for how to input data in this function
    this.bigchainIt = function (proposalID, coidData, coidGKAddress, coidAddr, blockNumber, blockHash, blockchainID, timestamp, validatorSigs, gatekeeperSig, callback) {

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
            "blockNumber": blockNumber,
            "blockHash": blockHash,
            "blockchainID": blockchainID,
            "blockchain_timestamp": timestamp,
            "validator_signatures": validatorSigs,
            "GateKeeper_signature": gatekeeperSig
        };//end json struct


        bigchainInput = JSON.stringify(bigchainInput)
        console.log("In function bigchainIt, the input to be sent to bigchain is: " + bigchainInput)



        var bigchainEndpoint = 'addData/' + thePubkey + '/1'
        var theobj = { "method": "POST", "stringJsonData": bigchainInput, "endpoint": bigchainEndpoint }
        console.log("Bigchain Request: " + JSON.stringify(theobj))

        _this.bigchain_contract.BigChainQuery(JSON.stringify(theobj), function (error, result) {

            // console.log("A million stars ***************************************************************************************")
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
            console.log("blockNumber is: " + blockNumber);
            console.log("blockHashVal is: " + blockHashVal);
            console.log("blockchainID is: " + blockchainID);
            console.log("timestamp is: " + timestamp);
            console.log(JSON.stringify(result.args));

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
                            _this.bigchainIt(proposalId, formdataArray[index], coidGKAddr, coidAddr, blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, function (result, theId, theHash) {
                                // console.log(result);
                                console.log("THE TXN ID: " + theId)
                                console.log("THE HASH: " + theHash)
                                console.log("GK ADDR: " + coidGKAddr)
                                console.log("COID ADDR: " + coidAddr)
                                theNotifier.notifyCoidCreation(formdataArray[index].pubKey, theId, theHash, coidGKAddr, coidAddr)
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




    //
    // Listening of the resultIsReady event in the ballot:
    // When the event is ready, it calls the function in gatekeeper, result is ready
    // Note that after the function is called in gatekeeper, it triggers the gatekeeper resultReady event
    //
    var eventBallotResultIsReady;
    _this.ballotContract.resultIsReady
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
}





var listening = new eventListener();



app.post("/gatekeeper", function (req, res) {

    console.log("Just transacted a POST Request to endpoint: /gatekeeper")
    var formdata = req.body;
    console.log("Form data from gatekeeper ===> ", formdata);

    /*var formdata =
        {
            "pubKey": "0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055",
            "sig": "7051442bbf18bb2c86cbc8951a07e27ec6ba05ac3fa427e4c6b948e3dcf91a94046b048edf52445fb22cc776a94b87c3f55426f993458ec744f61f09fb46eeaa",
            "msg": "8836a77b68579d1d8d4427c0cda24960f6c123f17ccf751328cc621d6237da22",
            "uniqueId": "BCB1AACA1BD191C781C3102DBFCCCADAB3511BB1DBA1CCD1A61AE6CCDD",
            "uniqueIdAttributes": "AB12321AA,313113A32,EF313131,133131F,311313A,31223F,12321,12222222,11341",
            "ownershipId": "83D31E3ED952FACB78606B08CBFDFE6DAF53E9B5BC3C3E85F95C399B28C66",
            "ownerIdList": "4A56E33E9D718571CED220A7347B96FE43DF4E51,A7576C8A328EEE4BF69589DDB71099250316FF19",
            "controlId": "83D31E3ED952FACB78606B08CBFDFE6DAF53E9B5BC3C3E85F95C314F99B28C66",
            "controlIdList": "4A56E33E9D718571CED220A7347B96FE43DF4E51,A7576C8A328EEE4BF69589DDB71099250316FF19",
            "ownershipTokenId": "83D31E3ED952FACB78606B08CBFDFE6DAF53E9B5BC3C3E85F95C314F99B28C66",
            "ownershipTokenAttributes": "83D31E3ED952FACB78606B08CBFDFE6DAF53E9B5BC3C3E85F95C314F99B28C65,83D31E3ED952FACB78606B08CBFDFE6DAF53E9B5BC3C3E85F95C314F99B28C61",
            "ownershipTokenQuantity": "3,2",
            "controlTokenId": "83D31E3ED952FACB78606B08CBFDFE6DAF53E9B5BC3C3E85F95C314F99B28C66",
            "controlTokenAttributes": "83D31E3ED952FACB78606B08CBFDFE6DAF53E9B5BC3C3E85F95C314F99B28C65,83D31E3ED952FACB78606B08CBFDFE6DAF53E9B5BC3C3E85F95C314F99B28C61",
            "controlTokenQuantity": "5,5",
            "identityRecoveryIdList": "4A56E33E9D718571CED220A7347B96FE43DF4E51,A7576C8A328EEE4BF69589DDB71099250316FF19",
            "recoveryCondition": 2,
            "yesVotesRequiredToPass": 2
        }*/


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

});



app.listen(3000, function () {
    console.log("Connected to contract http://10.101.114.231:1337/rpc");
    console.log("Listening on port 3000");
});
