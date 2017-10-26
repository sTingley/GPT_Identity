'use strict'

//required libraries for post requests parsing
var app = require("express")();
var bodyParser = require('body-parser')
var fs = require('fs')
var keccak_256 = require('js-sha3').keccak_256
var ed25519 = require("ed25519")

//for secp256k1 verification
var secp256k1 = require('secp256k1')

//configuration of the chain
var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json')

//this is for sending a notification for superagent
var superAgent = require("superagent");

//required library for accessing the contract
var erisC = require('eris-contracts');


//This is used to correlate the post requests to the function calls in MyCOID
var MyCoidConfig = require('./MyCOIDConfig.json');


//this function is intended to send a notification
var TwinConnector = function () {
    //location of digital twin
    this.twinUrl = "http://10.100.98.218:5050";

    //for grabbing the appropriate scope
    var _this = this;

    //flag = 0 ==> owned
    //flag = 1 ==> controlled
    //flag = 2 ==> delegated

    //Get Asset data from the twin folder (owned, delegated, controlled)
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

    //Create an Asset in the twin folder (owned, delegated, controlled)
    this.CreateAsset = function (pubKey, fileName, flag, data) {
        superAgent.post(this.twinUrl + "/setAsset")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag,
                "data": data,
                "updateFlag": 0
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                // if(res.status == 200){
                // do something
                // }
            });
    }



    /*
    Update an Asset in the twin folder (owned, delegated, controlled).
    This function will be called everytime we change COID parameters
    */
    this.UpdateAsset = function (pubKey, fileName, flag, data, keys, values) {
        superAgent.post(this.twinUrl + "/setAsset")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag,
                "keys": keys,
                "values": values,
                "updateFlag": 1
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                // if(res.status == 200){
                // do something
                // }
            });
    }

    //Remove an Asset in the twin folder (owned, delegated, controlled)
    this.RemoveAsset = function (pubKey, fileName, flag) {
        superAgent.post(this.twinUrl + "/deleteAsset")
            .send({
                "pubKey": pubKey,
                "fileName": fileName,
                "flag": flag,
            })
            .set('Accept', 'application/json')
            .end((err, res) => {
                // if(res.status == 200){
                // do something
                // }
            });
    }

} //end TwinConnector



var theNotifier = new TwinConnector();


//myCoid object
//To be used in post requests
//NOTE: The ABI can be obtained from the contractAddress because the location of the abi is known
//The location will always be where gatekeeper deployed it.
var MyCOID = function (contractAddress) {

    //debugging:
    console.log("You made a MyCOID object");

    //get the contract:
    this.chain = 'primaryAccount'
    this.erisdburl = chainConfig.chainURL
    this.contractData = require('./epm.json')
    var contractAddr = contractAddress
    console.log("contract addr: " + contractAddr)
    this.contractAbiAddress = this.contractData['CoreIdentity'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/" + this.contractAbiAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisC.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
    this.contract = this.contractMgr.newContractFactory(this.erisAbi).at(contractAddress);

    //bigchain contract (oraclizer)
    this.bigchain_query_addr = require('/home/demoadmin/.eris/apps/BigchainOraclizer/epm.json').deployStorageK
    this.bigchain_abi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/BigchainOraclizer/abi/' + this.bigchain_query_addr, 'utf8'))
    this.bigchain_contract = this.contractMgr.newContractFactory(this.bigchain_abi).at(this.bigchain_query_addr)
    this.ErisAddress = chainConfig[this.chain].address;

    //coid functions:
    var self = this;
    var _this = this;

    //ONE TIME INSTANTIATION
    //THIS FUNCTION IS INTENDED TO BE CALLED AT THE VERY BEGINNING
    //WHEN THEY MAKE THEIR TWIN
    //IT POPULATES THE ASSET SCREENS OF OTHER OWNERS, CONTROLLERS, DELEGATES
    this.updateTwin = function (creatorPubkey, callback) {
        //1. see if there are any other owners, if so,
    }


    this.verify = function SECPVerify(msg, signature, pubKey) {
        msg = new Buffer(msg, "hex");
        signature = new Buffer(signature, "hex");
        pubKey = new Buffer(pubKey, "hex");

        var verified = secp256k1.verify(msg, signature, pubKey)
        console.log("\n\n\n\n\n\n\n\n\n\n\n" + verified + "\n\n\n\n\n\n\n\n\n\n");
        return verified;
    }

    this.clearExpirations = function (formdata, callback) {
        var currentDate = new Date();
        currentDate = parseInt(currentDate.getTime()) / 1000;
        var spliceArr = [];
        console.log("CLEAR EXPIR: " + JSON.stringify(formdata));
        //first check to avoid an out-of-bounds error
        if (formdata.delegations.length > 0) {
            for (var i = 0; i < formdata.delegations.length; i++) {
                var check = (currentDate > Number(formdata.delegations[i].expiration));
                console.log(check);
                if (check) {
                    console.log(formdata.delegations[i].delegatee);
                    spliceArr.push(i);
                    console.log(currentDate + "  token cleared " + i);
                    var ctrlIndex = formdata.controlIdList.indexOf(formdata.delegations[i].owner);
                    if (ctrlIndex >= 0) {
                        formdata.controlTokenQuantity[ctrlIndex] += Number(formdata.delegations[i].amount);
                    }
                }
            }
            if (spliceArr.length > 0) {
                for (var i = spliceArr.length - 1; i >= 0; i--) { formdata.delegations.splice(spliceArr[i], 1); console.log("spliced " + spliceArr[i]); }
            }
            callback();
        }
        else { callback(); }
    }

    this.bigchainIt = function (formdata, callback) {

        //get public key
        var thePubkey = this.ErisAddress;
        //var thePubkey = _this.ErisAddress;
        console.log("In function bigchainIt, pubKey of eris account is: " + thePubkey)

        var description = "Core Identity"

        //NOTE: signatures inputted to this object should include msg hash, signature and public key
        //NOTE: Coid_Data should include uniqueID and the signature of the one requesting a core identity
        /*var bigchainInput = {
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
        };*/
        var metadata = { "bigchainID": formdata.bigchainID, "bigchainHash": formdata.bigchainHash } || "";
        delete formdata.bigchainID;
        delete formdata.bigchainHash;

        var bigchainInput = JSON.stringify({ "data": formdata, "metadata": metadata })
        console.log("In function bigchainIt, the input to be sent to bigchain is: " + bigchainInput)


        var bigchainEndpoint = 'addData/' + thePubkey + '/1'
        var theobj = { "method": "POST", "stringJsonData": bigchainInput, "endpoint": bigchainEndpoint }
        console.log("Bigchain Request: " + JSON.stringify(theobj))

        _this.bigchain_contract.BigChainQuery(JSON.stringify(theobj), function (error, result) {

            console.log("A million stars ***************************************************************************************")
            var theEvent;
            _this.bigchain_contract.CallbackReady(function (error, result) {
                theEvent = result;
                console.log("callback ready");
                console.log("callback result: " + JSON.stringify(result))
                if (error) { console.log("error: " + error) }
            },
                function (error, result) {
                    if (error) { console.log("error2: " + error) }
                    console.log("callback ready 2");
                    if (thePubkey == result.args.addr) {

                        _this.bigchain_contract.myCallback(function (error, result) {
                            console.log("mycallback");
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
    }//end bigchainit


    this.writeAll = function (formdata, callback) {
        if (typeof (formdata.delegations) == 'object' && formdata.delegations[0] == "") {
            formdata.delegations.splice(0, 1);
            //formdata.delegateeTokenQuantity.splice(0, 1);
            console.log("empty delegatee removed from results: " + formdata);
        }

        if (typeof (formdata.delegations) != 'object') {
            formdata.delegations = [];
            formdata.delegateeTokenQuantity = [];
        }

        var max = Math.max(formdata.ownerIdList.length, formdata.controlIdList.length);
        var max = Math.max(max, formdata.delegations.length);

        var fileName = formdata.assetID + ".json";
        var owners = formdata.ownerIdList;
        var controllers = formdata.controlIdList;
        //var delegatees = formdata.delegateeIdList;
        //max = Math.max(formdata.dimension.delegations.length, max);
        console.log("\n*****THE MIGHTY WRITEALL*****\n");
        console.log(JSON.stringify(formdata));
        console.log("MAX :" + max);
        var k = 0;
        var o = 0;
        var c = 0;
        var d = 0;
        var delegateeLog;
        var total = owners.length + controllers.length + formdata.delegations.length;
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
            if (typeof (formdata.delegations[i]) != 'undefined' && typeof (formdata.delegations[i]) != 'null' && formdata.delegations[i] != "" && formdata.delegations[i].owner != "") {
                var delegatee = formdata.delegations[i].delegatee;
                delegateeLog = JSON.parse(JSON.stringify(formdata));
                delegateeLog.pubKey = "";
                delegateeLog.coidAddr = "";
                delegateeLog.uniqueId = "";
                delegateeLog.controlIdList = "";
                delegateeLog.ownerIdList = "";

                for (var n = 0; n < delegateeLog.delegations.length; n++) {
                    if (delegateeLog.delegations[n].delegatee != delegatee) {
                        delegateeLog.delegations.splice(n, 1);
                    }
                }

                theNotifier.SetAsset(String(formdata.delegations[i].delegatee), String(fileName), 2, 0, delegateeLog, "", "", function () {
                    k++;
                    console.log("Writing to Delegatee: " + formdata.delegations[d].delegatee + " K: " + k);
                    d++;
                    if (k == total) { callback() }
                })
            }
        }//end for loop
    }//end writeAll


    // -> -> -> START CONTROL FUNCTIONS -> -> ->

    /*
        -getControllerTokens
        -getControllerList
        -revokeControlDelegation
        -spendMyTokens (as a delegatee)
        -myAmount (get delegatee tokens)
        -delegate
        -changeTokenController (must call addController first)
        -amountDelegated
        -addController
        -removeController
        -offsetControllerTokenQuantity
    */

    //GET CONTROLLER VALUES (from list)
    this.getControllerTokens = function (formdata, callback) {
        var pubKey = formdata.pubKey;
        var msg = formdata.msg;
        var sig = formdata.sig;

        self.contract.getList(function (error, result) {
            console.log("got controller tokens (inside function)")
            callback(error, result)
        })
    }


    //GET CONTROLLER LIST
    this.getControllerList = function (formdata, callback) {
        var pubKey = formdata.pubKey;
        var msg = formdata.msg;
        var sig = formdata.sig;

        self.contract.getControllers(function (error, result) {
            console.log("get controller list...")
            callback(error, result)
        })
    }


    //REVOKE DELEGATION TO A DELEGATEE AS A CONTROLLER
    this.revokeControlDelegation = function (formdata, callback) {
        var controller = formdata.pubKey;
        var delegatee = formdata.delegatee;
        var amount = Number(formdata.amount);
        var msg = formdata.msg;
        var sig = formdata.sig;
        var pubKey = formdata.pubKey;
        var fileName = formdata.filename;
        var flag = formdata.flag;
        var all = Boolean(formdata.all.toLowerCase() == 'true');//boolean - true or false;
        var spliceArr = [];
        var isCtrl = false;
        //TODO:
        var controllerHash = keccak_256(controller).toUpperCase()
        var owner = controllerHash;
        var delegateeHash = keccak_256(delegatee).toUpperCase()

        theNotifier.GetAsset(pubKey, fileName, flag, function (results) {
            self.contract.revokeDelegation(controllerHash, delegateeHash, amount, all, function (error, result) {
                if (result) {
                    var ctrlIndex = results.controlIdList.indexOf(controllerHash);
                    if (ctrlIndex >= 0) {
                        isCtrl = true;
                    }
                    var log = results;
                    if (all)//if the flag is true, just revoke everything from the owner
                    {
                        if (log.delegations.length > 0) {

                            for (var j = 0; j < log.delegations.length; j++) {
                                if (log.delegations[j].owner == owner && log.delegations[j].delegatee == delegateeHash) {
                                    spliceArr.push(j);
                                    if (isCtrl) {
                                        results.controlTokenQuantity[ctrlIndex] = Number(results.controlTokenQuantity[ctrlIndex]) + Number(log.delegations[j].amount);
                                    }
                                    if (j == (log.delegations.length - 1)) {
                                        if (spliceArr.length > 0) {
                                            for (var i = spliceArr.length - 1; i >= 0; i--) { log.delegations.splice(spliceArr[i], 1); console.log("spliced " + spliceArr[i]); }
                                        }

                                    }
                                }
                            }
                        }

                    }
                    else {
                        //logic below is similar to the function spendTokens

                        //first make sure they have the amount FROM that owner:
                        var actualAmount = 0;

                        if (log.delegations.length > 0) {
                            for (var z = 0; z < log.delegations.length; z++) {
                                if (log.delegations[z].delegatee == delegateeHash && log.delegations[z].owner == owner) {
                                    actualAmount = actualAmount + log.delegations[z].amount;
                                }
                            }
                        }

                        //if they have less than the owner wants to remove, just remove how much they have
                        if (actualAmount < amount) {
                            amount = actualAmount;
                        }

                        if (amount > 0) {

                            var keepGoing = true;

                            var index = 0;
                            while (keepGoing) {
                                //first find index in delegations with closest expiration.
                                //uint index = 0;
                                //This correctly sets var index as the 1st available owner
                                for (var n = 0; n < log.delegations.length; n++) {
                                    if (log.delegations[n].owner == owner) {
                                        index = n;
                                        break;
                                    }
                                }

                                //size of delegations must be greater than zero because actualAmount != 0
                                //could probably initialize k=index to save cycles later
                                for (var k = 0; k < log.delegations.length; k++) {
                                    if (log.delegations[k].owner == owner) {
                                        if (log.delegations[k].expiration <= log.delegations[index].expiration) {
                                            index = k;
                                        }
                                    }
                                }

                                //now spend the amount
                                if (amount >= log.delegations[index].amount) {
                                    amount = amount - log.delegations[index].amount;
                                    if (isCtrl) {
                                        results.controlTokenQuantity[ctrlIndex] += Number(log.delegations[index].amount);
                                    }
                                    log.delegations.splice(index, 1);//this function clears and returns coins back to owner
                                }
                                else {
                                    //no need to give tokens back to owner--they are infinite and created on the fly

                                    //just subtract remaining amount from the current delegation amount
                                    log.delegations[index].amount = log.delegations[index].amount - amount;
                                    if (isCtrl) {
                                        results.controlTokenQuantity[ctrlIndex] = Number(results.controlTokenQuantity[ctrlIndex]) + amount;
                                    }
                                    //now set amount = 0 since we are done
                                    amount = 0;

                                }

                                if (amount == 0) {
                                    keepGoing = false;
                                }

                            }//end while(keepgoing)

                        }// end if amount>0
                    }//end else

                    console.log("\n\nREVOKE LOG: " + JSON.stringify(log) + "\n\n");
                    self.bigchainIt(results, function (res, bigchainID, bigchainHash) {
                        results.bigchainID = bigchainID;
                        results.bigchainHash = bigchainHash;
                        self.writeAll(results, function () { callback(error, result) })
                    });


                }
                else { callback(error, result); }

            })
        })
    }

    //SPEND MY TOKENS AS A DELEGATEE
    this.spendMyTokens = function (formdata, callback) {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var delegatee = formdata.delegatee;
        var amount = formdata.amount;
        var pubKey = formdata.pubKey;
        var fileName = formdata.filename;
        var flag = formdata.flag;
        var index = 0;
        var keepGoing = true;
        var isCtrl = false;
        var ctrlIndex = -1;

        //TODO:
        var delegateeHash = keccak_256(delegatee).toUpperCase()
        theNotifier.GetAsset(pubKey, fileName, flag, function (results) {
            self.contract.spendMyTokens(delegateeHash, amount, function (error, result) {
                if (result) {
                    self.clearExpirations(results, function () {
                        while (keepGoing) {
                            //first find index in delegations with closest expiration.
                            // uint index = 0;

                            for (var n = 0; n < results.delegations.length; n++) {
                                if (results.delegations[n].delegatee == delegateeHash) {
                                    index = n;
                                    break;
                                }
                            }

                            //size of delegations must be greater than zero because actualAmount != 0
                            for (var k = 0; k < results.delegations.length; k++) {
                                if (results.delegations[k].expiration <= results.delegations[index].expiration && results.delegations[k].delegatee == delegateeHash && results.delegations[k].amount > 0) {
                                    index = k;
                                }
                            }

                            //now spend the amount
                            if (amount >= results.delegations[index].amount) {
                                amount = amount - results.delegations[index].amount;
                                ctrlIndex = results.controlIdList.indexOf(results.delegations[index].owner);
                                if (ctrlIndex >= 0) {
                                    results.controlTokenQuantity[ctrlIndex] += Number(results.delegations[index].amount);
                                }
                                results.delegations.splice(index, 1);
                            }
                            else {
                                //just subtract remaining amount from the current delegation amount
                                results.delegations[index].amount = results.delegations[index].amount - amount;
                                ctrlIndex = results.controlIdList.indexOf(results.delegations[index].owner);
                                if (ctrlIndex >= 0) {
                                    results.controlTokenQuantity[ctrlIndex] += amount;
                                }
                                //now set amount = 0 since we are done
                                amount = 0;

                            }

                            if (amount == 0) {
                                keepGoing = false;
                                self.bigchainIt(results, function (res, bigchainID, bigchainHash) {
                                    results.bigchainID = bigchainID;
                                    results.bigchainHash = bigchainHash;
                                    self.writeAll(results, function () { callback(error, result) })
                                });
                            }

                        }
                    })
                }
                else {
                    console.log("Error occurred while spending: " + error);
                    if (result == 'false' || result === false) {
                        self.clearExpirations(results, function () {
                            self.bigchainIt(results, function (res, bigchainID, bigchainHash) {
                                results.bigchainID = bigchainID;
                                results.bigchainHash = bigchainHash;
                                self.writeAll(results, function () { callback(error, result) })
                            });
                        })
                    }
                    else {
                        callback(error, result);
                    }
                }
            })
        })
    }


    //GET YOUR AMOUNT AS A DELEGATEE
    this.myAmount = function (formdata, callback) {
        var delegatee = formdata.delegatee;
        var msg = formdata.msg;
        var sig = formdata.sig;

        //TODO:
        var delegateeHash = keccak_256(delegatee).toUpperCase()

        self.contract.myAmount(delegateeHash, function (error, result) {
            callback(error, result)
        })
    }


    //DELEGATE TOKENS AS A CONTROLLER TO A DELEGATEE
    this.delegate = function (formdata, callback) {
        console.log(JSON.stringify(formdata));
        var delegatee = formdata.delegatee;
        var controller = formdata.pubKey;
        var amount = Number(formdata.amount);
        var pubKey = formdata.pubKey;
        var fileName = formdata.filename;
        var flag = formdata.flag;
        var isOwner = true;
        var timeFrame = Number(formdata.timeFrame) || 5000;
        var currentDate = new Date();
        currentDate = currentDate.getTime() / 1000;

        //TODO:
        var controllerHash = keccak_256(controller).toUpperCase()
        var delegateeHash = keccak_256(delegatee).toUpperCase()

        console.log("pubkey: " + pubKey + " filename: " + fileName + " flag: " + flag + "\n")
        theNotifier.GetAsset(pubKey, fileName, flag, function (results) {
            self.contract.delegate(controllerHash, delegateeHash, amount, timeFrame, function (error, result) {
                if (result) {
                    if (typeof (results.delegations) == 'undefined' || typeof (results.delegations) == 'null') {
                        results.delegations = [];
                    }
                    console.log("Contract call complete");
                    var entry = {
                        "owner": controllerHash,
                        "delegatee": delegateeHash,
                        "amount": formdata.amount,
                        "expiration": String(currentDate + timeFrame)
                    };
                    results.delegations.push(entry);
                    var ctrlIndex = results.controlIdList.indexOf(controllerHash);
                    if (ctrlIndex >= 0) {
                        results.controlTokenQuantity[ctrlIndex] -= amount;
                    }
                    //j++;
                    //if (j == (formdata.length)) {
                    self.bigchainIt(results, function (res, bigchainID, bigchainHash) {
                        results.bigchainID = bigchainID;
                        results.bigchainHash = bigchainHash;
                        self.writeAll(results, function () { callback(error, result) })
                    });
                    //}
                }
                else {
                    callback(error, result);
                    i = formdata.length;
                    console.log("Error occurred while delegating: " + error);
                }
            })
        })
    }

    //CHANGE TOKEN CONTROLLER
    //ALLOWS A CONTROLLER TO GIVE TOKENS TO ANOTHER CONTROLLER
    //YOU MUST ADD A CONTROLLER BEFORE CALLING THIS FUNCTION
    this.changeTokenController = function (formdata, callback) {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var originalController = formdata.originalController;
        var newController = formdata.newController;
        var amount = formdata.amount;
        var oldIndex;
        var newIndex;
        var fileName = formdata.filename;

        //TODO:
        var originalControllerHash = keccak_256(originalController).toUpperCase()
        var newControllerHash = keccak_256(newController).toUpperCase()
        theNotifier.GetAsset(pubKey, fileName, flag, function (results) {
            self.contract.changeTokenController(originalControllerHash, newControllerHash, amount, function (error, result) {
                if (error) { callback(error, result) }
                else {
                    for (var j = 0; j < results.control_id.length; j++) {
                        if (results.control_id[j] == originalControllerHash) { oldIndex = j; }
                        if (results.control_id[j] == newControllerHash) { newIndex = j; }
                    }
                    if (amount > results.control_token_quantity[oldIndex]) {
                        amount = results.control_token_quantity[oldIndex];
                        results.control_id.splice(oldIndex, 1);
                        results.control_token_quantity.splice(oldIndex, 1);
                    }
                    else {
                        results.control_token_quantity[oldIndex] = results.control_token_quantity[oldIndex] - amount;
                    }
                    results.control_token_quantity[newIndex] = results.control_token_quantity[newIndex] + amount;
                    self.bigchainIt(results, function (res, bigchainID, bigchainHash) {
                        results.bigchainID = bigchainID;
                        results.bigchainHash = bigchainHash;
                        self.writeAll(results, function () { callback(error, result) })
                    });
                }

            })
        })
    }


    //GIVES A CONTROLLER HOW MANY TOKENS THEY HAVE DELEGATED
    this.amountDelegated = function (formdata, callback) {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var controller = formdata.controller;

        //TODO:
        var controllerHash = keccak_256(controller).toUpperCase()

        self.contract.amountDelegated(controllerHash, function (error, result) {
            callback(error, result)
        })
    }


    //ADD A CONTROLLER
    this.addController = function (formdata, callback) {
        console.log("formdata: \n" + JSON.stringify(formdata) + "\n");
        var msg = formdata.msg;
        var sig = formdata.sig;
        var pubKey = formdata.pubKey;
        var controller = formdata.controllers.split(",");
        var amount = formdata.token_quantity.split(",");
        var flag = 0;
        var fileName = formdata.filename;
        var flag = 0;
        var k = 0;
        // var verified = self.verify(msg, sig, pubKey);
        //TODO:
        //var controllerHash = keccak_256(controller).toUpperCase()
        //var controllerHash = keccak_256(controller)

        console.log("----------Add Controller--------------");
        console.log("PUBKEY :" + pubKey);
        console.log("CONTROLLERS :" + controller);
        console.log("AMOUNTS :" + amount);

        if (true) {//change back to if verified
            console.log("\n-----VERIFIED-----\n");
            theNotifier.GetAsset(pubKey, fileName, flag, function (results) {
                for (var i = 0; i < controller.length; i++) {

                    console.log("lenght: " + controller.length);
                    var controllerHash = keccak_256(controller[i]).toUpperCase();
                    console.log("get complete : " + controllerHash);

                    self.contract.addController(keccak_256(pubKey), controllerHash, amount[i], function (error, result) {
                        console.log("contract complete");
                        if (result[0]) {

                            results.controlIdList.push(controllerHash);
                            results.controlTokenQuantity.push(Number(amount[k]));
                            console.log("data added: " + controllerHash + " " + amount[k])
                            k++;
                            console.log("result: " + result)
                            if (k == (controller.length)) {
                                console.log("addController write");
                                self.bigchainIt(results, function (res, bigchainID, bigchainHash) {
                                    results.bigchainID = bigchainID;
                                    results.bigchainHash = bigchainHash;
                                    self.writeAll(results, function () { callback(error, result) })
                                });
                                //self.writeAll(results,function () {callback(error, result)});
                            }
                        }
                        else {
                            console.log("error: " + error)
                            callback(error, result);
                            i = controller.length;
                            //k = formdata.data.length;
                            console.log("Error occurred while adding entry " + error);
                        }
                    })// end contract call
                }// end for loop
            })// end getasset
        }// end verified
        else {
            result = "Verification Failed";
            callback(error, result)
        }
    }// end addcontroller



    //REMOVE A CONTROLLER
    this.removeController = function (formdata, callback) {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var pubKey = formdata.pubKey
        var controller = formdata.controller;
        var fileName = formdata.filename;
        var flag = formdata.flag;
        // var verified = self.verify(msg, sig, pubKey);

        //TODO:
        var controllerHash = keccak_256(controller).toUpperCase()
        if (true) { // if verified
            console.log("\n-----VERIFIED-----\n");
            theNotifier.GetAsset(pubKey, fileName, flag, function (results) {
                self.contract.removeController(keccak_256(pubKey), controllerHash, function (error, result) {
                    if (result[0]) {
                        console.log("contract complete");
                        for (var j = 0; j < results.controlIdList.length; j++) {
                            console.log("j: " + j);
                            console.log("CH: " + controllerHash + "res: " + results.controlIdList[j]);
                            if (results.controlIdList[j].toUpperCase() == controllerHash) {
                                for (var x = results.delegations.length - 1; x >= 0; x--) {
                                    console.log("x: " + x);
                                    if (results.delegations[x].owner == controllerHash) {
                                        results.delegations.splice(x, 1);
                                        console.log("spliced " + x);
                                    }
                                }
                                results.controlIdList.splice(j, 1);
                                results.controlTokenQuantity.splice(j, 1);
                                self.bigchainIt(results, function (res, bigchainID, bigchainHash) {
                                    results.bigchainID = bigchainID;
                                    results.bigchainHash = bigchainHash;
                                    self.writeAll(results, function () { callback(error, result) })
                                });
                                break;
                            }
                        }
                    }
                    else {
                        console.log("Error while removeing controller" + error);
                        callback(error, result)
                    }

                })
            })
        }
    }

    this.offsetControllerTokenQuantity = function (formdata, callback) {
        console.log("formdata: \n" + JSON.stringify(formdata) + "\n");
        var msg = formdata.msg;
        var sig = formdata.sig;
        var pubKey = formdata.pubKey;
        var owner = keccak_256(pubKey);
        var controller = formdata.controllers;
        var amount = Number(formdata.token_quantity);
        var flag = formdata.flag;
        var fileName = formdata.filename;
        var controllerHash = keccak_256(controller).toUpperCase()

        theNotifier.GetAsset(pubKey, fileName, flag, function (results) {
            self.contract.offsetControllerTokenQuantity(owner, controllerHash, function (error, result) {
                if (result) {
                    var ctrlIndex = results.controlIdList.indexOf(controllerHash);
                    results.controlTokenQuantity[ctrlIndex] += Number(amount);
                    if (results.controlTokenQuantity[ctrlIndex] < 0) {
                        results.controlTokenQuantity[ctrlIndex] = 0;
                    }
                    self.bigchainIt(results, function (res, bigchainID, bigchainHash) {
                        results.bigchainID = bigchainID;
                        results.bigchainHash = bigchainHash;
                        self.writeAll(results, function () { callback(error, result) })
                    });
                }
                else {
                    console.log("Error while adding tokens to controller" + error);
                    callback(error, result)
                }
            })
        })
    }
    //
    // <- <- <- END CONTROL FUNCTIONS <- <- <-






    // -> -> -> START OWNERSHIP FUNCTIONS -> -> ->
    //
    //

    //Tells an owner how many tokens they have.
    this.myTokenAmount = function (formdata, callback) {
        console.log("DEBUGGING: YOU HIT MYTOKENAMOUNT");

        var msg = formdata.msg;
        var sig = formdata.sig;
        var owner = formdata.owner;
        console.log("owner: " + owner);
        //TODO:
        var ownershipHash = keccak_256(owner).toUpperCase()

        self.contract.myTokenAmount(ownershipHash, function (error, result) {
            console.log("DEBUGGING...RESULT,ERROR: " + ("" + result) + "..." + error)
            callback(error, "" + result)
        })
    }

    //Adds an owner
    this.addOwner = function (formdata, callback) {
        console.log(formdata);
        var msg = formdata.msg;
        var sig = formdata.sig;
        var pubKey = formdata.pubKey;
        var flag = 0;
        var k = 0;
        //var fileName = "MyCOID.json";
        var fileName = formdata.filename;
        var owner = formdata.owners.split(",");
        var amount = formdata.token_quantity.split(",");
        var verified = self.verify(msg, sig, pubKey);
        //console.log("INFO: "+owner[0] + "\n"+amount[0]);
        //TODO:
        //newOwner = keccak_256(newOwner).toUpperCase()
        if (verified) {
            console.log("\n-----VERIFIED-----\n");
            theNotifier.GetAsset(pubKey, fileName, flag, function (results) {
                for (var i = 0; i < owner.length; i++) {
                    console.log("INFO: " + owner[0] + "\n" + amount[0]);
                    var newOwner = keccak_256(owner[i]).toUpperCase();
                    self.contract.addOwner(keccak_256(pubKey), newOwner, amount[i], function (error, result) {
                        if (result) {
                            results.ownerIdList.push(owner[k]);
                            results.ownershipTokenQuantity.push(amount[k]);
                            k++;
                            console.log("res: " + result)
                            if (k == (owner.length)) {
                                console.log("addOwner write");
                                self.bigchainIt(results, function (res, bigchainID, bigchainHash) {
                                    results.bigchainID = bigchainID;
                                    results.bigchainHash = bigchainHash;
                                    self.writeAll(results, function () { callback(error, result) })
                                });
                            }
                        }
                        else {
                            console.log("error: " + error)
                            callback(error, result);
                            i = owner.length;
                            //k = formdata.data.length;
                            console.log("Error occurred while adding entry " + error);
                        }
                    })
                }
            })
        }
    }

    //Removes an owner
    this.removeOwner = function (formdata, callback) {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var pubKey = formdata.pubKey;
        var owner = formdata.owner.split(",");
        //var fileName = "MyCOID.json";
        var fileName = formdata.fileName;
        var verified = self.verify(msg, sig, pubKey);

        //TODO:
        owner = keccak_256(owner).toUpperCase()
        if (verified) {
            console.log("\n-----VERIFIED-----\n");
            theNotifier.GetAsset(pubKey, fileName, flag, function (result) {
                self.contract.removeOwner(keccak_256(pubKey), owner, function (error, result) {
                    if (result) {
                        for (var j = 0; j < results.ownerIdList.length; j++) {
                            if (results.ownerIdList[j] == owner) {
                                results.ownerIdList.splice(j, 1);
                                results.ownershipTokenQuantity.splice(j, 1);
                                self.bigchainIt(results, function (res, bigchainID, bigchainHash) {
                                    results.bigchainID = bigchainID;
                                    results.bigchainHash = bigchainHash;
                                    self.writeAll(results, function () { callback(error, result) })
                                });
                            }
                        }
                    }
                    else {
                        console.log("Error while removing owner " + error);
                        callback(error, result)
                    }
                })
            })
        }
    }


    //Allows an owner to give tokens to another owner (they must already be an owner!)
    this.giveTokens = function (formdata, callback) {
        var msg = formdata.msg;
        var sig = formdata.sig;
        var originalOwner = formdata.originalOwner;
        var newOwner = formdata.newOwner;
        var amount = formdata.amount
        var fileName = "MyCOID.json";
        //var fileName = formdata.fileName;

        //TODO:
        originalOwner = keccak_256(originalOwner).toUpperCase()
        newOwner = keccak_256(newOwner).toUpperCase()
        theNotifier.GetAsset(pubKey, fileName, flag, function (result) {
            self.contract.giveTokens(originalOwner, newOwner, amount, function (error, result) {
                if (error) { callback(error, result) }
                else {
                    for (var j = 0; j < results.owner_id.length; j++) {
                        if (results.owner_id[j] == originalOwner) { oldIndex = j; }
                        if (results.owner_id[j] == newOwner) { newIndex = j; }
                    }
                    if (amount > results.owner_token_quantity[oldIndex]) {
                        amount = results.owner_token_quantity[oldIndex];
                        results.owner_id.splice(oldIndex, 1);
                        results.owner_token_quantity.splice(oldIndex, 1);
                    }
                    else {
                        results.owner_token_quantity[oldIndex] = results.owner_token_quantity[oldIndex] - amount;
                    }
                    results.owner_token_quantity[newIndex] = results.owner_token_quantity[newIndex] + amount;
                    self.bigchainIt(results, function (res, bigchainID, bigchainHash) {
                        results.bigchainID = bigchainID;
                        results.bigchainHash = bigchainHash;
                        self.writeAll(results, function () { callback(error, result) })
                    });
                }
            })
        })
    }

    // <- <- <- END OWNERSHIP FUNCTIONS <- <- <-

    // -> -> -> START RECOVERY FUNCTIONS -> -> ->

    this.addRecoveryID = function (formdata, callback) {
        console.log(formdata);
        var sig = formdata.sig;
        var pubKey = formdata.pubKey;
        var msg = formdata.msg;
        var recoveryID = formdata.recoveryID.split(",");
        var recoveryCondition = formdata.recoveryCondition || "";
        //TODO:
        //var recoveryIDHash = keccak_256(recoveryID).toUpperCase()
        //TODO
        //var fileName = "MyCOID.json";
        var fileName = formdata.filename;
        var flag = 0;
        var k = 0;
        var verified = self.verify(msg, sig, pubKey);

        if (verified) {
            console.log("\n-----VERIFIED-----\n");
            //1. Get Current Recovery keys
            theNotifier.GetAsset(pubKey, fileName, flag, function (results) {

                var obj = results;
                for (var i = 0; i < recoveryID.length; i++) {
                    self.contract.addRecovery(keccak_256(pubKey), recoveryID[i], recoveryCondition, function (error, result) {
                        //callback(error, result)
                        var recoveryIDHash = keccak_256(recoveryID[k])
                        if (error) { callback(error, result) }
                        // var condition = obj.recoveryCondition
                        // if (condition != null) { }
                        else {
                            /*console.log("INSIDE ADD RECOVERY ID: " + JSON.stringify(obj))
                            var recovery_list = obj.identityRecoveryIdList;
    
                            console.log("RECOVERY KEYS: " + recovery_list);
    
                            //2. Modify Array
                            recovery_list.push(recoveryIDHash)
                            console.log("WITH ADDED RECOVERY ID HASH: " + recovery_list);
                            var keys = ["identityRecoveryIdList"]
                            var values = []
                            values.push(recovery_list);
                            console.log("Array of arrays: " + values)*/


                            obj.identityRecoveryIdList.push(recoveryIDHash);
                            if (recoveryCondition != "") {
                                obj.recoveryCondition = recoveryCondition;
                            }
                            k++;

                            //3. Update
                            //theNotifier.UpdateAsset(pubKey, fileName, flag, "", keys, values)
                            if (k == recoveryID.length) {
                                self.bigchainIt(obj, function (res, bigchainID, bigchainHash) {
                                    obj.bigchainID = bigchainID;
                                    obj.bigchainHash = bigchainHash;
                                    self.writeAll(obj, function () { callback(error, result) })
                                });
                            }
                        }

                    })
                }
            })
        }

    }

    //ST: UPDATE FILE in DT!!!!! Currently hardcoded MyCOID.json
    this.removeRecoveryID = function (formdata, callback) {
        var sig = formdata.sig;
        var pubKey = formdata.pubKey;
        var msg = formdata.msg;
        var recoveryID = formdata.recoveryID
        var recoveryCondition = formdata.recoveryCondition
        //TODO:
        //var recoveryIDHash = keccak_256(recoveryID).toUpperCase()
        var recoveryIDHash = keccak_256(recoveryID)
        //TODO
        var fileName = "MyCOID.json";
        //var fileName = formdata.fileName;
        var flag = 0;
        var verified = self.verify(msg, sig, pubKey);

        if (verified) {
            console.log("\n-----VERIFIED-----\n");
            //1. Get Current Recovery keys
            theNotifier.GetAsset(pubKey, fileName, flag, function (results) {
                self.contract.removeRecovery(keccak_256(pubKey), recoveryID, recoveryCondition, function (error, result) {
                    if (result) {
                        for (var j = 0; j < 10; j++) {
                            if (results.identityRecoveryIdList[j] == recoveryID) {
                                results.identityRecoveryIdList.splice(j, 1);
                                self.bigchainIt(results, function (res, bigchainID, bigchainHash) {
                                    results.bigchainID = bigchainID;
                                    results.bigchainHash = bigchainHash;
                                    self.writeAll(results, function () { callback(error, result) })
                                });
                            }
                        }
                    }
                })
            })
        }
    }

    this.getUniqueAttributes = function (formdata, callback) {

        //this is one of the functions called by the ballot app when validator needs to see data
        self.contract.getUniqueID(function (error, result) {
            if (error) { callback(error, result) }
            else {
                console.log("UniqueID: " + result[0]);
                console.log("Attributes: " + result[1]);
                console.log("isHuman: " + result[2]);
                callback(error, result);
            }
        })
    }

    //ST: /addOfficialIDs endpoint goes to the IDF_GK for 'MyCOID'
    //THIS NEEDS TO BE COMPLETED FOR MYGK assets and we therefore need gk address (?) and fileName!!!!!!!
    //ALSO OF COURSE CHECK THAT THEY ARE AN OWNER
    this.addUniqueAttributes = function (formdata, callback) {
        var theUniqueID;
        var theUniqueIDAttributes;
        var isHumanValue;
        var AoA;
        //var fileName = "MyCOID.json";
        //var fileName = formdata.fileName;


        self.contract.getUniqueID(function (error, result) {
            if (error) { callback(error, result) }
            else {

                result = "hey, this is good only for adding to assets created with your gatekeeper.. finish this code!!"
                callback(error,result);

                //ST: COMMENT THIS BACK IN LATER !!!!! 
                // theUniqueID = result[0];
                // AoA = JSON.parse(result[1]);
                // isHumanValue = Boolean(result[2]);
                // console.log("Attributes: " + result[1]);
                // console.log("Parsed Attribute: " + AoA[0]);

                // for (var j = 0; j < theUniqueIDAttributes.length; j++) {
                //     AoA.push(theUniqueIDAttributes[j]);
                // }

                // AoA.concat(Array(10 - AoA.length).fill("0"));

                // self.contract.setUniqueID(theUniqueID, AoA, isHumanValue);
                // callback(error, result);

            }
        })
    }


    // this.changeRecoveryCondition(function (formdata, callback) {

    // })

    // <- <- <- END RECOVERY FUNCTIONS <- <- <-


}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//This does all the endpoint listening:
//The variable endpoint references all keys in the json object.
for (let endpoint in MyCoidConfig) {
    //this is the function to call
    var functionCall = MyCoidConfig[endpoint];
    console.log(functionCall)
    console.log(endpoint)
    app.post('/' + endpoint, function (req, res) {

        console.log("\n POSTED ENDPOINT: " + endpoint);

        //their contract address
        var contractAddress = req.body.address;
        console.log("contract address: " + contractAddress)
        //instantiate a MyCOID object
        var myCoid = new MyCOID(contractAddress)

        //function input
        var formdata = req.body;
        console.log("function call is: " + functionCall)

        // res.json({'Status':'hi','Result':'hello'})

        //formulate the string of code for the function call
        var toExecute = "myCoid." + MyCoidConfig[endpoint] + "(formdata,function(error,result)"
        toExecute = toExecute + "{"
        toExecute = toExecute + "res.json({'Status':error,'Result':(''+result)});"
        toExecute = toExecute + "console.log(result + '');"
        toExecute = toExecute + "console.log('result is: ' + result);"
        toExecute = toExecute + "})"

        //for debugging
        console.log("\n" + toExecute);

        //evaulate the given function
        eval(toExecute);
    })
}

app.listen(3012)
console.log("running at port 3012")
