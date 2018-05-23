'use strict'
//required libraries for post requests parsing
var app = require("express")();
var bodyParser = require('body-parser')
var fs = require('fs')
var keccak_256 = require('js-sha3').keccak_256
var DataFetcher = require('./DataFetcher.js')
//configuration of the chain
var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json')
var IdentityConfig = require('./IdentityDimensionConfig.json')
//this is for sending a notification for superagent
var superAgent = require("superagent");
//required library for accessing the contract
var erisC = require('eris-contracts');
//for secp256k1 verification
var secp256k1 = require('secp256k1')
//for hex conversion
var Web3 = require('web3')
var web3 = new Web3();

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
                    for (var i = 0; i < arguments.length; i++) {
                        console.log(String(arguments[i]));
                    }
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

} //end var notifier

//********************************************* */

var connector = new TwinConnector();

//********************************************* */

//NOTE: Other js files seem to recieve owners and controllers as large strings and not arrays, if this happens here then the split(',') command must be used
// in order to parse the request properly.
var IdentityDimensionControl = function (iDimensionCtrlContractAddress) {
    this.chain = 'primaryAccount'
    this.erisdburl = chainConfig.chainURL
    this.contractData = require('./epm.json')
    var iDimensionCtrlContractAddress = iDimensionCtrlContractAddress
    this.contractAbiAddress = this.contractData['IdentityDimensionControl'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/" + this.contractAbiAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisC.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
    this.contract = this.contractMgr.newContractFactory(this.erisAbi).at(iDimensionCtrlContractAddress);
    var self = this;

    //NOTE: contract is identityDimensionControl contract that is passed as input

    this.testing = function (valA, valB, valC, valD, valE, valF, callback) {
        self.contract.testing(valA, valB, valC, valD, valE, valF, function (error, result) {
            callback(error, result);
        })
    }
    //***********************************************************************************************
    //MUST BE CALLED FIRST!!!!
    //THIS FUNCTION IS CALLED BY GATEKEEPER app(s) when setting new COID contract data
    this.Instantiation = function (formdata, callback) {

        console.log("formdata inside Instantiation: " + JSON.stringify(formdata))
        var pubKey = formdata.pubKey;
        var coidAddr = formdata.coidAddr;
        console.log("SHA3 of PUBKEY: " + keccak_256(pubKey));

        self.contract.IdentityDimensionControlInstantiation(coidAddr, function (error, result) {
            callback(error, result);
        })
    }
    //***********************************************************************************************


    this.verify = function SECPVerify(msg, signature, pubKey) {
        console.log("reached verify function");
        msg = new Buffer(msg, "hex");
        signature = new Buffer(signature, "hex");
        pubKey = new Buffer(pubKey, "hex");

        var verified = secp256k1.verify(msg, signature, pubKey)
        return verified;
    }

    this.clearExpirations = function (formdata, callback) {
        var currentDate = new Date();
        currentDate = parseInt(currentDate.getTime()) / 1000;
        var spliceArr = [];
        console.log("CLEAR EXPIR: " + JSON.stringify(formdata));
        //first check to avoid an out-of-bounds error
        if (formdata.dimension.delegations.length > 0) {
            for (var i = 0; i < formdata.dimension.delegations.length; i++) {
                var check = (currentDate > Number(formdata.dimension.delegations[i].expiration));
                console.log(check);
                if (check) {
                    console.log(formdata.dimension.delegations[i].delegatee);
                    //formdata.dimension.delegations.splice(i,1);
                    spliceArr.push(i);
                    console.log(currentDate + "  token cleared " + i);
                }
            }
            if (spliceArr.length > 0) {
                for (var i = spliceArr.length - 1; i >= 0; i--) { formdata.dimension.delegations.splice(spliceArr[i], 1); console.log("spliced " + spliceArr[i]); }
            }
            callback();
        }
        else { callback(); }
    }

    this.writeAll = function (formdata, callback) {
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
        if (formdata.dimension.controllers[0] == "") { formdata.dimension.controllers.splice(0) }
        var total = formdata.dimension.controllers.length + formdata.dimension.owners.length + formdata.dimension.delegations.length + formdata.dimension.dim_controllers_keys.length;
        console.log("total calls: " + total);
        for (var i = 0; i < max; i++) {
            if (typeof (formdata.dimension.owners[i]) != 'undefined' && typeof (formdata.dimension.owners[i]) != 'null' && formdata.dimension.owners != "") {
                connector.SetDimension(String(formdata.dimension.owners[i]), String(formdata.dimension.dimensionName) + ".json", 0, 0, formdata, "", "", function () {
                    k++;
                    console.log("Writing to Owner: " + formdata.dimension.owners[o] + " K: " + k);
                    o++;
                    if (k == total) { console.log("owner callback "); callback() }
                })
            }
            if (typeof (formdata.dimension.controllers[i]) != 'undefined' && typeof (formdata.dimension.controllers[i]) != 'null' && formdata.dimension.controllers != "") {
                connector.SetDimension(String(formdata.dimension.controllers[i]), String(formdata.dimension.dimensionName) + ".json", 1, 0, formdata, "", "", function () {
                    k++;
                    console.log("Writing to Controller: " + formdata.dimension.controllers[c] + " K: " + k);
                    c++;
                    if (k == total) { console.log("controller callback"); callback() }
                })
            }
            if (typeof (formdata.dimension.dim_controllers_keys[i]) != 'undefined' && typeof (formdata.dimension.dim_controllers_keys[i]) != 'null' && formdata.dimension.dim_controllers_keys != "") {
                connector.SetDimension(String(formdata.dimension.dim_controllers_keys[i]), String(formdata.dimension.dimensionName) + ".json", 1, 0, formdata, "", "", function () {
                    k++;
                    console.log("Writing to Controller: " + formdata.dimension.dim_controllers_keys[e] + " K: " + k);
                    e++;
                    if (k == total) { console.log("dim_controllers_keys callback"); callback() }
                })
            }
            if (typeof (formdata.dimension.delegations[i]) != 'undefined' && typeof (formdata.dimension.delegations[i]) != 'null' && formdata.dimension.delegations[i] != "" && formdata.dimension.delegations[i].owner != "") {
                var delegatee = formdata.dimension.delegations[i].delegatee;
                var accessCategories = formdata.dimension.delegations[i].accessCategories;
                delegateeLog = JSON.parse(JSON.stringify(formdata));
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

                connector.SetDimension(String(formdata.dimension.delegations[i].delegatee), String(formdata.dimension.dimensionName) + ".json", 2, 0, delegateeLog, "", "", function () {
                    k++;
                    console.log("Writing to Delegatee: " + formdata.dimension.delegations[d].delegatee + " K: " + k);
                    d++;
                    if (k == total) { callback() }
                })
            }
        }//end for loop
    }//end writeAll



    //Contract returns, (bool success, bytes32 callerHash, address test)
    this.CreateDimension = function (formdata, callback) {
        console.log(formdata)
        //create a json
        var log = {
            "dimension": {
                "dimensionName": "",
                "pubKey": "",
                "address": "",
                "flag": "",
                "ID": "",
                "coidAddr": "",
                "dimensionCtrlAddr": "",
                "uniqueId": "",
                "owners": [],
                "controllers": [],
                "delegations": [],
                "data": [],
                "propType": "",
                "dim_controllers_keys": []
            }
        }
        var coidAddr = formdata.coidAddr;
        var ID = formdata.ID;
        var dimensionCtrlAddr = formdata.dimensionCtrlAddr
        var pubKey = formdata.pubKey;
        var uniqueID = formdata.uniqueId;
        var typeInput = formdata.dimensionName;
        var flag = formdata.flag;
        //ADDRESS IS SET WITH THE ADDRESS OF THE DIMENSION
        var address;
        var controllers = [""];
        var owners = [""];
        var dim_controllers_keys = [];

        if (typeof (formdata.dim_controllers_keys) == "string") {
            dim_controllers_keys = formdata.dim_controllers_keys.split(",");
        }
        else {
            dim_controllers_keys = formdata.dim_controllers_keys;
        }

        if (typeof (formdata.controllers) == "string") {
            controllers = formdata.controllers.split(",");
        }
        else {
            controllers = formdata.controllers || [];
        }

        if (typeof (formdata.owners) == "string") {
            owners = formdata.owners.split(",");
        }
        else {
            owners = formdata.owners;
        }

        var pubKey = (owners[0]);
        var delegations = Object(JSON.parse(formdata.delegations));
        var data = Object(JSON.parse(formdata.data));
        //var data = log.dimension.data;
        console.log("address is undefined until we set it with return of the contract: " + address)
        console.log("CONTROLLER" + controllers);
        console.log("OWNERS: " + owners);
        console.log("PUBKEY :" + pubKey);
        //console.log("delegations: " + JSON.stringify(delegations))
        //        console.log("delegations: " + typeof((delegations)))
        //console.log("delegations: " + ((delegations[0].dimension)))
        console.log("TYPE :" + typeInput);
        console.log("ID :" + uniqueID);
        console.log("DATA :" + typeof (data));
        console.log("DATA :" + (data[0].descriptor));
        console.log("DATA :" + JSON.stringify(data));
        //var d=Object(JSON.parse(data));
        //console.log("DATA WORK PLEASE"+JSON.stringify(d));
        //console.log("length"+d.length);
        //console.log("print 1st entry"+JSON.stringify(d[0]));
        var msg = formdata.msg;
        var sig = formdata.sig;
        var verified = self.verify(msg, sig, formdata.pubKey);

        if (verified) {
            console.log("\n-----VERIFIED-----\n");
            self.contract.CreateDimension(pubKey, uniqueID, typeInput, flag, function (error, result) {
                if (result[0]) {
                    console.log("made it create");
                    log.dimension.dimensionName = typeInput;
                    log.dimension.address = result[2];
                    log.dimension.uniqueID = uniqueID;
                    //log.dimension.publicKey = pubKey;
                    log.dimension.controllers = controllers;
                    log.dimension.owners = owners;
                    log.dimension.flag = flag;
                    log.dimension.dimensionCtrlAddr = dimensionCtrlAddr;
                    log.dimension.propType = formdata.propType;
                    //log.dimension.delegations = delegations;
                    //log.dimension.data = data;

                    console.log("dimension JSON to be created: \n" + JSON.stringify(log))

                    //change contract using calls

                    function createWrite(callback) {
                        var max = Math.max(controllers.length, owners.length);
                        console.log("MAX :" + max);
                        var k = 0;
                        //var j = 0;
                        for (var i = 0; i < max; i++) {
                            if (typeof (owners[i]) != 'undefined' && typeof (owners[i]) != 'null') {
                                connector.SetDimension(owners[i], typeInput + ".json", 0, 0, log, "", "", function () {
                                    k++;
                                    console.log("WOo " + max + " K: " + k);
                                    if (k == owners.length) { callback() }
                                })
                            }
                            if (typeof (controllers[i]) != 'undefined' && typeof (controllers[i]) != 'null') { connector.SetDimension(controllers[i], typeInput + ".json", 1, 0, log, "", "", function () { }) }
                            // if (i == (max - 1)) { callback(error, result); }
                            console.log("OWNERS :" + owners[i])
                            console.log("CONTROLLER :" + typeof (controllers[i]))
                            //if(i == max-1){callback(1);console.log("----------CREATEWRITE CALLBACK----------");}
                        }
                    }

                    // the reason they are nested is because the other functions also read/write the json. Due to the async nature of js you want to make sure
                    // that the file being pulled is the latest.
                    //var test = JSON.stringify(data);
                    //var addPayload = { "pubKey": pubKey, "dimensionName": typeInput, "data": test };
                    createWrite(function () {
                        var addPayload = { "pubKey": pubKey, "dimensionName": typeInput, "ID": ID, "data": JSON.stringify(data), "flag": 0 };
                        console.log("addpayload: " + JSON.stringify(addPayload))
                        if (data.length > 0 && data[0].descriptor != "" && delegations.length > 0 && delegations[0].owner != "") {
                            console.log("line 213 trying to add entry...")
                            self.addEntry(addPayload, function (error, result) {
                                if (error) { console.log("error: " + error) }
                                if (result) {
                                    console.log("about to call delegate line 194")
                                    self.delegate(delegations, function (error, result) {
                                        //createWrite();
                                        callback(error, result)
                                    })
                                }
                            })
                        }
                        else if (data.length > 0 && data[0].descriptor != "") {
                            self.addEntry(addPayload, function (error, result) {
                                callback(error, result)
                            })
                        }
                        else if (delegations.length > 0 && delegations[0].owner != "") {
                            self.delegate(delegations, function (error, result) {
                                callback(error, result)
                            })
                        }
                        else {
                            callback(error, result)
                        }

                        //log.dimension.data[0].flag=flag;
                        //send json
                        /*var max=Math.max(controller.length,owners.length);
                        console.log("MAX :"+max);
                        for(var i=0;i<max;i++){
                            if(typeof(owners[i])!='undefined' && typeof(owners[i])!='null'){connector.SetDimension(owners[i],typeInput+".json",0,0,log,"","",function(){})}
                            if(typeof(controller[i])!='undefined' && typeof(controller[i])!='null'){connector.SetDimension(controller[i],typeInput+".json",1,0,log,"","",function(){})}
                            if(i==(max-1)){callback(error,result);}
                            console.log("OWNERs :"+typeof(owners[i]))
                            console.log("CONTROLLER :"+typeof(controller[i]))
                        }*/
                        //connector.SetDimension(pubKey,typeInput+".json",0,0,log,"","",function(){callback(error,result)})
                    })

                }
                else {
                    callback(error, result)
                    if (error) { console.log("callback error: " + error) }
                    if (result) { console.log("callback result: " + result) }
                }

                //console.log("\n\calling final callback (end of createdimension).. \n" );
                //callback(error, result);

            })//end createDimension
        }
    }
    //***********************************************************************************************

    //result is boolean success from the contract
    this.RemoveDimension = function (formdata, callback) {

        var caller = formdata.caller;
        var descriptor = formdata.descriptor;
        var ID = formdata.ID;
        var verified = self.verify(msg, sig, pubKey);

        if (verified) {
            console.log("\n-----VERIFIED-----\n");
            self.contract.RemoveDimension(caller, descriptor, ID, function (error, result) {
                if (result) {
                    connector.deleteDimension(formdata.caller, formdata.descriptor + ".json", 0, function (results) { callback(error, result) })
                }
                else { callback(error, result); }
            })
        }
    }

    //result is boolean success from the contract
    this.changeDescriptor = function (formdata, callback) {

        var pubKey = formdata.pubKey;
        var type = formdata.type;
        var ID = formdata.ID;
        var oldDescriptor = formdata.oldDescriptor;
        var newDescriptor = formdata.newDescriptor;
        console.log("----------CHANGE DESCRIPTOR--------------");
        console.log("PUBKEY :" + pubKey);
        console.log("TYPE :" + type);
        console.log("ID :" + ID);
        console.log("oldDESCRIPTOR :" + oldDescriptor);
        console.log("newDESCRIPTOR :" + newDescriptor);

        self.contract.changeDescriptor(pubKey, web3.toHex(type), web3.toHex(ID), web3.toHex(oldDescriptor), web3.toHex(newDescriptor), function (error, result) {
            if (result) {
                connector.GetDimension(formdata.pubKey, formdata.type + ".json", 0, function (results) {
                    for (var i = 0; i < results.dimension.data.length; i++) {
                        if (results.dimension.data[i].descriptor == oldDescriptor) {
                            results.dimension.data[i].descriptor = newDescriptor;
                            break;
                        }
                    }
                    //send json
                    //connector.SetDimension(formdata.pubKey, formdata.type + ".json", 0, 0, results, "", "", function () { callback(error, result) });
                    self.writeAll(results, function () { callback(error, result) });
                })
            }
            else { callback(error, result); }
        })
    }


    this.addEntry = function (formdata, callback) {
        //formdata = JSON.parse(formdata);
        console.log("FD: " + JSON.stringify(formdata));
        console.log("FD2: " + formdata);
        var pubKey = formdata.pubKey;
        var type = formdata.dimensionName;
        console.log("FDLength" + formdata.data.length)
        var ID = formdata.ID;
        var k = 0;
        console.log("formdata.data: " + formdata.data);
        formdata.data = JSON.parse(formdata.data);
        console.log("formdata.data2: " + formdata.data);
        console.log("FDLength2" + formdata.data.length);
        var flag = Number(formdata.flag) || 0;
        connector.GetDimension(pubKey, type + ".json", flag, function (results) {

            for (var i = 0; i < formdata.data.length; i++) {

                console.log("ADD ENTRY ********************  " + JSON.stringify(formdata));

                var attribute = web3.toHex(formdata.data[i].attribute);
                var descriptor = formdata.data[i].descriptor;
                var flag = formdata.data[i].flag;
                console.log("----------ADD ENTRY--------------");
                console.log("PUBKEY :" + pubKey);
                console.log("TYPE :" + type);
                console.log("ID :" + ID);
                console.log("DESCRIPTOR :" + descriptor);
                console.log("ATTRIBUTE :" + attribute);

                /*var entry= {
                            "descriptor":descriptor,
                            "attribute": attribute,
                            "flag": flag
                }*/

                var attribute3 = attribute.substr(132) || 0x0;
                var attribute2 = attribute.substr(66, 66) || 0x0;
                var attribute = attribute.substr(0, 66);
                console.log("ATTRIBUTE :" + attribute);
                console.log("ATTRIBUTE2 :" + attribute2);
                console.log("ATTRIBUTE3 :" + attribute3);

                self.contract.addEntry(pubKey, web3.toHex(type), web3.toHex(ID), web3.toHex(descriptor), attribute, attribute2, attribute3, flag, function (error, result) {
                    if (result) {
                        console.log("\n\nBefore ADD ENTRY LOG: " + JSON.stringify(results) + "\n\n");
                        var entry = {
                            "descriptor": formdata.data[k].descriptor,
                            "attribute": formdata.data[k].attribute,
                            "flag": formdata.data[k].flag
                        }
                        results.dimension.data.push(entry);
                        k++;
                        // push all changes, write once will remove race condition
                        console.log("\n\nAFTER ADD ENTRY LOG: " + JSON.stringify(results) + "\n\n");
                        //add counter to ensure all entries succeeded b4 write
                        if (k == (formdata.data.length)) {
                            console.log("AddData Write");
                            //connector.SetDimension(pubKey, type + ".json", 0, 0, results, "", "", function () { callback(error, result) });
                            self.writeAll(results, function () { callback(error, result) });
                        }
                    }
                    else {
                        callback(error, result);
                        i = formdata.length;
                        //k = formdata.data.length;
                        console.log("Error occurred while adding entry: " + error + "result: " + result);
                    }
                })//end contract call
            }//end for loop
        })// end getdimension
    }//end addentry




    //result is the boolean success from the contract
    this.removeEntry = function (formdata, callback) {

        var pubKey = formdata.pubKey;
        var type = formdata.type;
        var ID = formdata.ID;
        var descriptor = formdata.descriptor;
        console.log("----------REMOVE ENTRY--------------");
        console.log("PUBKEY :" + pubKey);
        console.log("TYPE :" + type);
        console.log("ID :" + ID);
        console.log("DESCRIPTOR :" + descriptor);

        self.contract.removeEntry(pubKey, web3.toHex(type), web3.toHex(ID), web3.toHex(descriptor), function (error, result) {
            if (result) {
                connector.GetDimension(formdata.pubKey, formadata.type + ".json", 0, function (results) {
                    console.log("ENTERED RE GDJ" + results);
                    if (results.dimension.data.length > 0) {
                        for (var i = 0; i < results.dimension.data.length; i++) {
                            if (results.dimension.data[i].descriptor == descriptor) {
                                results.dimension.data.splice(i, 1);
                                //connector.SetDimension(formdata.pubKey, formdata.type + ".json", 0, 0, results, "", "", function () { callback(error, result) });
                                self.writeAll(results, function () { callback(error, result) });
                                console.log("\n\nLOG: " + JSON.stringify(results) + "\n\n");
                                break;
                            }
                        }
                    }
                })
            }
            else { callback(error, result); }
        })
    }

    //result is the boolean success from the contract
    //updateAttribute
    this.updateEntry = function (formdata, callback) {

        var pubKey = formdata.pubKey;
        var type = formdata.type;
        var ID = formdata.ID;
        var descriptor = formdata.descriptor;
        var attribute = web3.toHex(formdata.attribute);
        var flag = formdata.flag;
        console.log("----------UPDATE ENTRY--------------");
        console.log("PUBKEY :" + pubKey);
        console.log("TYPE :" + type);
        console.log("ID :" + ID);
        console.log("DESCRIPTOR :" + descriptor);
        console.log("ATTRIBUTE :" + attribute);
        var attribute3 = attribute.substr(132);
        var attribute2 = attribute.substr(66, 66);
        var attribute = attribute.substr(0, 66);

        self.contract.updateEntry(pubKey, web3.toHex(type), web3.toHex(ID), web3.toHex(descriptor), attribute, attribute2, attribute3, flag, function (error, result) {
            if (result) {
                connector.GetDimension(formdata.pubKey, String(formdata.type) + ".json", 0, function (results) {
                    for (var i = 0; i < results.dimension.data.length; i++) {
                        if (results.dimension.data[i].descriptor == descriptor) {
                            results.dimension.data[i].attribute = formdata.attribute;
                            if (flag == 2 || flag == "2") { }
                            else { results.dimension.data[i].flag = flag; }
                            //connector.SetDimension(pubKey, type + ".json", 0, 0, results, "", "", function () { callback(error, result) });
                            self.writeAll(results, function () { callback(error, result) });
                            console.log("\n\nUPDATE LOG: " + JSON.stringify(results) + "\n\n");
                            break;
                        }
                    }

                })
            }
            else { callback(error, result); }
        })
    }
    //result is a string which is the attribute of the entry
    this.readEntry = function (formdata, callback) {

        var pubKey = formdata.pubKey;
        var owners = [""];
        var type = web3.toHex(formdata.dimensionName);
        var ID = web3.toHex(formdata.ID);
        var descriptor = web3.toHex(formdata.descriptor);
        var msg = formdata.msg;
        var sig = formdata.sig;
        //var verified = self.verify(msg, sig, pubKey);
        if (typeof (formdata.owners) == "string") {
            owners[0] = formdata.owners;
        }
        else {
            owners = formdata.owners;
        }

        console.log(owners + "  owners  " + formdata.owners);
        //if(verified){console.log("\n-----VERIFIED-----\n");
        self.contract.readEntry(pubKey, type, ID, descriptor, function (error, result) {
            if (result) {
                var attribute = result[0] + result[1] + result[2];
                var test = result[0] + result[1] + result[2];
                console.log("byte return: " + test);
                attribute = web3.toAscii(attribute.replace("/0/g", "")).replace(/\u0000/g, '');
                console.log("\nATTRIBUTE\n" + attribute + " " + attribute.length);
                result = [];
                result = attribute;
                callback(error, result);
                /*
                                if (Boolean(result[3])) {
                                    connector.GetDimension(owners[0], String(formdata.dimensionName) + ".json", 0, function (results) {
                                        //self.clearExpirations(results, function () {
                                        var index = 0;
                                        var keepGoing = true;
                console.log("\nRESULTS: "+JSON.stringify(results));
                                        for (var i = 0; i < results.dimension.data.length; i++) {
                                            console.log("here1");
                                            if (results.dimension.data[i].descriptor == formdata.descriptor && results.dimension.data[i].flag == 1 && results.dimension.delegations.length > 0 && results.dimension.delegations[0].owner != "") {
                                                console.log("here2");
                                                while (keepGoing) {
                                                    console.log("here3");
                                                    for (var k = 0; k < results.dimension.delegations.length; k++) {
                                                        var keys = results.dimension.delegations[k].accessCategories.split(",");
                                                        if (results.dimension.delegations[k].expiration <= results.dimension.delegations[index].expiration && results.dimension.delegations[k].delegateee == pubKey && (keys.includes(formadata.descriptor) || results.dimension.delegations.accessCategories == "")) {
                                                            index = k; console.log("here4");
                                                        }
                                                    }
                                                    if (results.dimension.delegations[index].amount == 0) {
                                                        results.dimension.delegations.splice(index, 1); console.log("here5");
                                                    }
                                                    else {
                                                        //just subtract remaining amount from the current delegation amount
                                                        results.dimension.delegations[index].amount = String(Number(results.dimension.delegations[index].amount) - 1);
                                                        console.log(results.dimension.delegations[index].delegatee+" AMOUNT: "+results.dimension.delegations[index].amount);
                                                        keepGoing = false; console.log("here6");
                                                        console.log("RW ALL");
                
                                                            //console.log(JSON.stringify(results));
                                                            self.writeAll(results, function () { console.log("Read CALLBACK");callback(error, result) });
                
                
                                                    }
                                                }//end while
                                            }
                                        }//end for
                                        //callback(error, result)
                                   // })// end clearexp
                                    })// get json
                                }
                                if(test == "0536F7272792C20796F7520646F6E2774206861766520616E79206F7220656E60000000000000F75676820746F6B656E7320666F72207468697320646174612E0000000000000000000000000000000000000000000000000000000000000000") {
                                    //result = "Sorry, you don't have any or enough tokens for this data.";
                            //self.clearExpirations(results, function () {
                                    //    self.writeAll(results, function () { console.log("Read CALLBACK");callback(error, result) });
                                    //})
                                }
                
                
                
                         */
            }
            else {
                callback(error, result);
            }
        })
        //}
    }

    //QUESTION******** SHOULD THIS BE PUBLIC
    //result is the bool found from the contract, as well as address of the dimension
    this.getDimensionAddress = function (formdata, callback) {

        var type = formdata.type;
        var ID = formdata.ID;

        self.contract.getDimensionAddress(type, ID, function (error, result) {
            callback(error, result);
        })
    }

    //result is bytes32[100] of public descriptors -- TODO: MUST CONVERT TO STRING!
    this.getPublicDescriptors = function (formdata, callback) {

        var type = web3.toHex(formdata.type);
        var ID = web3.toHex(formdata.ID);

        self.contract.getPublicDescriptors(type, ID, function (error, result) {
            callback(error, result);
        })
    }
    //result is bytes32[100] of private descriptors -- TODO: MUST CONVERT TO STRING!
    this.getPrivateDescriptors = function (formdata, callback) {

        var type = web3.toHex(formdata.type);
        var ID = web3.toHex(formdata.ID);

        self.contract.getPrivateDescriptors(type, ID, function (error, result) {
            callback(error, result);
        })
    }

    //result is the bool success
    this.delegate = function (formdata, callback) {
        console.log("hit delegate")
        console.log("formdata: \n" + JSON.stringify(formdata))
        if (formdata.delegations) {
            formdata = Object(JSON.parse(formdata.delegations));
        }
        //didnt want to edit the same log
        var delegateeLog;
        var sync;
        var currentDate = new Date();
        currentDate = currentDate.getTime();

        connector.GetDimension(formdata[0].owner[0], formdata[0].dimension + ".json", 0, function (results) {
            var j = 0;
            var l = 0;
            for (var i = 0; i < formdata.length; i++) {

                sync = true;
                var owner = formdata[0].owner[0];
                var delegatee = formdata[i].delegatee;
                var amount = formdata[i].amount;
                var dimension = formdata[i].dimension;
                var timeFrame = formdata[i].timeFrame;
                var accessCategories = formdata[i].accessCategories;
                //var entry={"owner":owner,"delegatee":delegatee,"amount":amount,"dimension":dimension,"expiration":timeFrame,"accessCategories":accessCategories};
                console.log("----------Delegate Tokens--------------");
                console.log("Owner :" + owner);
                console.log("Delegatee :" + delegatee);
                console.log("Amount :" + amount);
                console.log("Dimension :" + dimension);
                console.log("Time Frame :" + timeFrame);
                console.log("Access Categories :" + typeof (accessCategories));
                console.log("FDL: " + formdata.length);


                self.contract.delegate(owner, delegatee, Number(amount), dimension, Number(timeFrame), accessCategories, function (error, result) {
                    if (result) {

                        console.log("Results came back");
                        var entry = {
                            "owner": owner,
                            "delegatee": formdata[j].delegatee,
                            "amount": formdata[j].amount,
                            "dimension": formdata[j].dimension,
                            "expiration": String(currentDate + formdata[j].timeFrame),
                            "accessCategories": formdata[j].accessCategories
                        };
                        results.dimension.delegations.push(entry);
                        //connector.SetDimension(formdata[i].owner, formdata[i].dimension + ".json", 0, 0, results, "", "", "");
                        j++;
                        var delegateeLog = JSON.parse(JSON.stringify(results));//to get a copy of object, not a reference of object
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
                            delegateeLog.dimension.data = results.dimension.data;
                            // break;
                        }
                        else {
                            var keys = split(accessCategories);
                            delegateeLog.dimension.data = [""];
                            for (var k = 0; k < results.dimension.data.length; k++) {
                                if (keys.indexOf(results.dimension.data[k].descriptor)) {
                                    delegateeLog.dimension.data.push(results.dimension.data[k]);
                                }
                            }
                        }
                        //}

                        //connector.SetDimension(formdata[i].delegatee, formdata[i].dimension + ".json", 2, 0, delegateeLog, "", "", "");
                        console.log("\n\nDELEGATE LOG: " + JSON.stringify(results) + "\n\n");

                        if (j == (formdata.length)) {
                            self.writeAll(results, function () { callback(error, result) });
                            /*	console.log("about to write JSON");
                                                for(i=0;i<formdata.length;i++){
                                                    connector.SetDimension(String(formdata[i].owner), formdata[i].dimension + ".json", 0, 0, results, "", "", function () { 
                                                        l++;
                                    console.log("Owner "+l);
                                                        if(l==formdata.length*2){console.log("Owner");callback(error, result)} 
                                                    });
                                                    connector.SetDimension(String(formdata[i].delegatee), formdata[i].dimension + ".json", 2, 0, delegateeLog, "", "", function () {
                                                        l++;
                                    console.log("Delegatee "+l);
                                                        if(l==formdata.length*2){console.log("Delegatee");callback(error, result)}
                                                    });
                                                }*/
                        } sync = false;

                    }
                    else {
                        callback(error, result);
                        i = formdata.length;
                        console.log("Error occurred while delegating: " + error);
                    }
                })// end contract call
                while (sync) { require('deasync').sleep(1000); }
            }//end for loop
        })//end get json

        //callback(error, result);
    }//end delegate


    //the result is the bool success
    this.revokeDelegation = function (fromdata, callback) {
        //didnt want to edit the same log
        var delegateeLog;

        var owner = formdata.controller;
        var delegatee = formdata.delegatee;
        var amount = formdata.amount;
        var dimension = formdata.dimension;
        var all = Boolean(formdata.all.toLowerCase() == 'true');//boolean - true or false
        var spliceArr = [];
        //put info inside for how to remove asset
        //connector.RemoveAsset();

        self.contract.revokeDelegation(owner, delegatee, amount, dimension, all, function (error, result) {
            console.log("REVOKE RESULT: " + result);
            if (result) {
                connector.GetDimension(formdata.controller, String(formdata.dimension) + ".json", 0, function (results) {
                    log = results;
                    if (all)//if the flag is true, just revoke everything from the owner
                    {
                        if (log.dimension.delegations.length > 0) {

                            for (j = 0; j < log.dimension.delegations.length; j++) {
                                if (log.dimension.delegations[j].owner == owner && log.dimension.delegations[j].delegatee == delegatee) {
                                    spliceArr.push(j);
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

                        if (log.dimension.delegations.length > 0) {
                            for (var z = 0; z < log.dimension.delegations.length; z++) {
                                if (log.dimension.delegations[z].delegatee == delegatee && log.dimension.delegations[z].owner == owner && log.dimension.delegations[z].dimension == dimension) {
                                    actualAmount = actualAmount + log.dimension.delegations[z].amount;
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
                                for (var n = 0; n < log.dimension.delegations.length; n++) {
                                    if (log.dimension.delegations[n].owner == owner && log.dimension.delegations[index].dimension == dimension) {
                                        index = n;
                                        break;
                                    }
                                }

                                //size of delegations must be greater than zero because actualAmount != 0
                                //could probably initialize k=index to save cycles later
                                for (var k = 0; k < log.dimension.delegations.length; k++) {
                                    if (log.dimension.delegations[k].owner == owner) {
                                        if (log.dimension.delegations[k].expiration <= log.dimension.delegations[index].expiration && log.dimension.delegations[index].dimension == dimension) {
                                            index = k;
                                        }
                                    }
                                }

                                //now spend the amount
                                if (amount >= log.dimension.delegations[index].amount) {
                                    amount = amount - log.dimension.delegations[index].amount;
                                    log.dimension.delegations.splice(index, 1);//this function clears and returns coins back to owner
                                }
                                else {
                                    //no need to give tokens back to owner--they are infinite and created on the fly

                                    //just subtract remaining amount from the current delegation amount
                                    log.dimension.delegations[index].amount = log.dimension.delegations[index].amount - amount;

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
                    self.writeAll(results, function () { callback(error, result) });
                    /* connector.SetDimension(formdata.controller, String(formdata.dimension) + ".json", 0, 0, log, "", "", function () { callback(error, result) });
                     delegateeLog=log;
                     delegateeLog.dimension.pubKey="";
                     delegateeLog.dimension.coidAddr="";
                     delegateeLog.dimension.uniqueId="";
                     connector.SetDimension(formdata[i].delegatee, formdata[i].dimension + ".json", 2, 0, delegateeLog, "", "", "");*/
                })//end get json
            }
            else { callback(error, result); }
        })
    }
    //returns amount
    this.delegateeAmount = function (formdata, callback) {

        var delegatee = formdata.delegatee;
        var dimension = formdata.dimension;
        var descriptor = formdata.descriptor;

        self.contract.delegateeAmount(delegatee, dimension, descriptor, function (error, result) {
            callback(error, result);
        })
    }

    //  ST: COMMENTED THIS OUT BECAUSE idimCtrlToken has this method. it is called internally by delegate (see above)

    // //the result is the bool success
    // this.addDelegation = function(formdata,callback)
    // {
    //     var owner = formdata.owner;
    //     var delegatee = formdata.delegatee;
    //     var amount = formdata.amount;
    //     var dimension = formdata.dimension;
    //     var timeFrame = formdata.timeFrame;
    //     var accessCategories = formdata.accessCategories;
    //     self.contract.addDelegation(owner,delegatee,amount,dimension,timeFrame,accessCategories,function(error,result)
    //     {
    //         callback(error,result);
    //     })
    // }

    //************************************************************************************ */

    this.removeDimController = function (formdata, callback) {
        var controller = formdata.controller;
        var owner = formdata.pubKey;

        self.contract.removeController(owner, controller, function (error, result) {
            if (result) {
                connector.GetDimension(owner, String(formdata.type) + ".json", 0, function (results) {
                    for (var i = 0; i < results.dimension.dim_controllers_keys.length; i++) {
                        if (results.dimension.dim_controllers_keys[i] == controller) {
                            results.dimension.dim_controllers_keys.splice(i, 1);
                        }
                    }
                })
            }
            else { callback(error, result); }
        })
    }
    //SHOULD THIS FUNCTION EVEN BE HERE:?
    //result is the bool exists, and uint index -- shouldn't we make that private
    this.controllerExists = function (formdata, callback) {
        var controllerHash = formdata.controllerHash;

        self.contract.controllerExists(controllerHash, function (error, result) {
            callback(error, result);
        })
    }
    //add dimension controller
    this.addDimController = function (formdata, callback) {
        var owner = formdata.owners.split(",");
        var controller = formdata.dim_controllers_keys.split(",");
        var j = 0;
        connector.GetDimension(owner[0], String(formdata.typeInput) + ".json", 0, function (results) {
            for (var i = 0; i < controller.length; i++) {
                console.log("controller: " + controller[i]);
                console.log("owner: " + owner[0])
                console.log("i: " + i)
                console.log("controllers length: " + controller.length)
                self.contract.addController(owner[0], controller[i], function (error, result) {
                    if (result) {
                        results.dimension.dim_controllers_keys.push(controller[j]);
                        if (j == controller.length - 1) {
                            self.writeAll(results, function () { callback(error, result) });
                        }
                        j++;
                    }
                    else { callback(error, result); }
                })
            }//for loop
        })//get
    }//end addDimController



    /*    this.addDimController = function (formdata, callback) {
            var owner = formdata.owners.split(",");
            var controller = formdata.dim_controllers_keys.split(",");
    
    console.log("controller: "+controller[0]);
    console.log("owner: "+owner[0])
            self.contract.addController(owner[0],controller[0], function (error, result) {
                if (result) {
                    connector.GetDimension(owner[0], String(formdata.typeInput) + ".json", 0, function (results) {
                        results.dimension.dim_controllers_keys.push(controller[0]);
                        self.writeAll(results, function () { callback(error, result) });
                    })
                }
                else { callback(error, result); }
            })
        }*/
    //*********************************************************************************** */

}//end IdentityDimensionControl



/*SPEND TOKENS IS A TOKEN CONTROL FUNCTION THAT is called internally inside identityDimensionControl.sol
//  !!!!!!!!!!! (Called inside readEntry)
this.spendTokens = function(formdata,callback)
{
    var delegatee = formdata.delegatee;
    var amount = formdata.amount;
    var identityDimension = formdata.identityDimension;
    self.contract.spendTokens(delegatee,amount,identityDimension,function(error,result)
    {
        callback(error,result);
    })
}*/

//TODO: what will instantiate their contract???
/*app.post('readEntry', function (req, res) {
    var formdata = req.body;
    //Instantiate dimension object
    var dimension = new IdentityDimensionControl(formdata.contractAddress)
    //1. call readEntry
    dimension.readEntry(formdata, function (error, result) {
        //TODO: double check null string in contract represents no access or entry not found
        if (result != "") {
            //2. get data
            //TODO: double check you are using this correctly:
            DataFetcher.getData(result, function (result) {
                //TODO: see if the result sends directly to the wallet
                //If it does not, we will be forced to have to talk to the digital twin
                res.json({ "Data": JSON.parse(result) })
            })
        }
        else {
            response.json({ "response": "Error. You either don't have enough tokens or the descriptor does not exist." })
        }
    })
})*/


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//This does all the endpoint listening:
//The variable endpoint references all keys in the json object.
for (let endpoint in IdentityConfig) {
    //this is the function to call
    var functionCall = IdentityConfig[endpoint];
    console.log("functionCall: " + functionCall)
    console.log("endpoint: " + endpoint)
    app.post('/' + endpoint, function (req, res) {

        console.log("\nPOSTED ENDPOINT: " + endpoint);
        console.log("req: " + JSON.stringify(req.body))

        var formdata = req.body
        //console.log("\nformdata :\n" + formdata+"\n");

        //their contract address
        var contractAddress = formdata.dimensionCtrlAddr;
        console.log("\ndimensionCtrl address: " + contractAddress)
        //instantiate their IdentityDimensionControl
        var dimension = new IdentityDimensionControl(contractAddress)

        // res.json({'Status':'hi','Result':'hello'})

        //formulate the string of code for the function call
        var toExecute = "dimension." + IdentityConfig[endpoint] + "(formdata,function(error,result)"
        toExecute = toExecute + "{"
        toExecute = toExecute + "res.json({'Status':error,'Result':(''+result)});"
        toExecute = toExecute + "console.log(result + '');"
        toExecute = toExecute + "console.log('result is: ' + result);"
        toExecute = toExecute + "})"

        //for debugging
        console.log("\ncalling eval on: " + toExecute + "\n");

        //evaulate the given function
        eval(toExecute, function (err, res) {
            console.log("inside eval function")
            if (err) { console.log("error: " + err) }
            console.log("res from eval: " + res)
        });
    })
}

app.listen(8001, function () {
    console.log("Connected to contract http://10.101.114.231:1337/rpc");
    console.log("Listening on port 8001");
});
