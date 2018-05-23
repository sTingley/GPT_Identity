'use strict'

//required libraries for post requests parsing
var app = require("express")();
var bodyParser = require('body-parser')
var fs = require('fs')
var keccak_256 = require('js-sha3').keccak_256
var Web3 = require('web3')
var web3 = new Web3();
var ed25519 = require("ed25519")

//configuration of the chain
var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json')
var IdentityConfig = require('./IdentityDimensionConfig.json')
//this is for sending a notification for superagent
var superAgent = require("superagent");

//required library for accessing the contract
var erisC = require('eris-contracts');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


function string2Bin(str) {
    return str.split("").map(function (val) {
        return val.charCodeAt(0);
    });
}

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
                    callback();
                    //return res.body;
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

var connector = new TwinConnector();

var IdentityDimensionControl = function (contractAddress) {

    //get the contract:
    this.chain = 'primaryAccount'
    this.erisdburl = chainConfig.chainURL
    this.contractData = require('./epm.json')
    var contractAddr = contractAddress
    console.log("contract addr: " + contractAddr)
    this.contractAbiAddress = this.contractData['IdentityDimensionControl'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/" + this.contractAbiAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisC.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
    this.contract = this.contractMgr.newContractFactory(this.erisAbi).at(contractAddress);

    //bigchain contract (oraclizer)
    this.bigchain_query_addr = require('/home/demoadmin/.eris/apps/BigchainOraclizer/epm.json').deployStorageK
    this.bigchain_abi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/BigchainOraclizer/abi/' + this.bigchain_query_addr, 'utf8'))
    this.bigchain_contract = this.contractMgr.newContractFactory(this.bigchain_abi).at(this.bigchain_query_addr)
this.ErisAddress = chainConfig[this.chain].address;

    var self = this;
var _this = this;
    this.testing = function (valA, valB, valC, valD, valE, valF, callback) {
        self.contract.testing(valA, valB, valC, valD, valE, valF, function (error, result) {
            callback(error, result);
        })
    }

    //first function:
    this.Instantiation = function (formdata, callback) {

        var pubKey = formdata.pubKey;
        var coidAddr = formdata.coidAddr;
        console.log("SHA3 of PUBKEY: " + keccak_256(pubKey));
        console.log("COID ADDRESS: " + coidAddr);

        self.contract.IdentityDimensionControlInstantiation(coidAddr, function (error, result) {
            callback(error, result);
        })
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

	var metadata = {"bigchainID" : formdata.bigchainID, "bigchainHash" : formdata.bigchainHash } || "";
	console.log("metadata: "+metadata+" "+ typeof(metadata));
	if(metadata == ""){var bigchainInput = JSON.stringify({ "data": formdata })}
        else{var bigchainInput = JSON.stringify({ "data": formdata , "metadata": metadata})}
        console.log("In function bigchainIt, the input to be sent to bigchain is: " + bigchainInput)



        var bigchainEndpoint = 'addData/' + thePubkey + '/1'
        var theobj = { "method": "POST", "stringJsonData": bigchainInput, "endpoint": bigchainEndpoint, "metadata": "test" }
        console.log("Bigchain Request: " + JSON.stringify(theobj))

        _this.bigchain_contract.BigChainQuery(JSON.stringify(theobj), function (error, result) {

            console.log("A million stars ***************************************************************************************")
            var theEvent;
            _this.bigchain_contract.CallbackReady(function (error, result) {
                theEvent = result;
            },
                function (error, result) {
console.log("Hello there");
                    if (thePubkey == result.args.addr) {
console.log("pubkey eal result addr");
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
    }//end bigchainit


    this.writeAll = function (formdata, callback) {
        var max = Math.max(formdata.dimension.controllers.length, formdata.dimension.owners.length);
        max = Math.max(formdata.dimension.delegations.length, max);
	console.log("\n*****THE MIGHTY WRITEALL*****\n");
console.log(JSON.stringify(formdata));
        console.log("MAX :" + max);
        var k = 0;
	var o = 0;
	var c = 0;
	var d = 0;
	var i = 0;
        //var delegateeLog;
	var sync;
        var total = formdata.dimension.controllers.length + formdata.dimension.owners.length + formdata.dimension.delegations.length;
	//formdata.dimension.delegations = JSON.parse(formdata.dimension.delegations);
	console.log("total calls: "+ total);
        for (var i = 0; i < max; i++) {
	sync=true;console.log("I: "+i);console.log("dele: "+typeof (formdata.dimension.delegations[1]) + "  " +JSON.stringify(formdata.dimension.delegations[1]) + " " );
	//while(k<total){
            if (typeof (formdata.dimension.owners[i]) != 'undefined' && typeof (formdata.dimension.owners[i]) != 'null' && formdata.dimension.owners != "") {console.log("I: "+i);
                connector.SetDimension(String(formdata.dimension.owners[i]), String(formdata.dimension.dimensionName) + ".json", 0, 0, formdata, "", "", function () {
                    k++;
                    console.log("Writing to Owner: " + formdata.dimension.owners[o] + " K: " + k);
		    o++;
                    if (k == total) {console.log("owner callback "); callback() }
                })
            }
            if (typeof (formdata.dimension.controllers[i]) != 'undefined' && typeof (formdata.dimension.controllers[i]) != 'null' && formdata.dimension.controllers != "") {console.log("I: "+i);
                connector.SetDimension(String(formdata.dimension.controllers[i]), String(formdata.dimension.dimensionName) + ".json", 1, 0, formdata, "", "", function () {
                    k++;
                    console.log("Writing to Controller: " + formdata.dimension.controllers[c] + " K: " + k);
		    c++;
                    if (k == total) {console.log("controller callback"); callback() }
                })
            }console.log("I: "+i);
            if (typeof (formdata.dimension.delegations[i]) != 'undefined' && typeof (formdata.dimension.delegations[i]) != 'null' && formdata.dimension.delegations[i] != "" ) {
                var delegatee = formdata.dimension.delegations[i].delegatee;
                var accessCategories = formdata.dimension.delegations[i].accessCategories;
		console.log("I: "+i);
                var delegateeLog = JSON.parse(JSON.stringify(formdata));
                delegateeLog.dimension.pubKey = "";
                delegateeLog.dimension.coidAddr = "";
                delegateeLog.dimension.uniqueId = "";
                delegateeLog.dimension.uniqueID = "";
                // delegateeLog.dimension.data=[""];
		console.log("here");

                for (var n = 0; n < delegateeLog.dimension.delegations.length; n++) {
                    if (delegateeLog.dimension.delegations[n].delegatee != delegatee) {
                        delegateeLog.dimension.delegations.splice(n, 1);console.log("here2");
                    }
                }
                //for(var j=0;j<results.dimension.delegations.length;j++){
                if (accessCategories == "") {console.log("here3");
                    console.log("setting categories");
                    delegateeLog.dimension.data = formdata.dimension.data;
                    // break;
                }
                else {
                    var keys = accessCategories.split(",");console.log("here4");
                    delegateeLog.dimension.data = [""];
                    for (var j = 0; j < formdata.dimension.data.length; j++) {
                        if (keys.indexOf(formdata.dimension.data[j].descriptor)) {
                            delegateeLog.dimension.data.push(formdata.dimension.data[j]);
                        }
                    }
                }

                connector.SetDimension(String(formdata.dimension.delegations[i].delegatee), String(formdata.dimension.dimensionName) + ".json", 2, 0, delegateeLog, "", "", function () {
                    k++;console.log("here5");
                    console.log("Writing to Delegatee: " + formdata.dimension.delegations[d].delegatee + " K: " + k);
		    d++;
			sync=false;
                    if (k == total) {console.log("delegatee callback"); callback() }
                })
            }
	    else{sync=false;}
console.log("here6");
	while (sync) { require('deasync').sleep(1000); }
        }//end for loop
    }//end writeAll


    this.CreateDimension = function (formdata, callback) {

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
                    "owners": [""],
                    "controllers": [""],
                    "delegations": [],
                    "data": []
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
        if(typeof(formdata.controllers)=="string"){
            controllers[0]=formdata.controllers;
        }
        else{
            controllers = formdata.controllers;
        }
        if(typeof(formdata.owners)=="string"){
            owners[0]=formdata.owners;
        }
        else{
            owners = formdata.owners;
        }
        var pubKey = owners[0];
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
console.log("DATA :" + typeof(data));
console.log("DATA :" + (data[0].descriptor));
console.log("DATA :" + JSON.stringify(data));
//var d=Object(JSON.parse(data));
//console.log("DATA WORK PLEASE"+JSON.stringify(d));
//console.log("length"+d.length);
//console.log("print 1st entry"+JSON.stringify(d[0]));


//console.log("NOTDATA: " + JSON.stringify(formdata.notDATA))


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
                log.dimension.delegations = delegations;
               //log.dimension.data = data;

                console.log("dimension JSON to be created: \n" + JSON.stringify(log))

                //change contract using calls

                function createWrite(callback) {
                    var max = Math.max(controllers.length, owners.length);
                    console.log("MAX :" + max);
                    var k = 0;
                    //var j = 0;
                    for (var i = 0; i < max; i++) {
                        if (typeof (owners[i]) != 'undefined' && typeof (owners[i]) != 'null') { connector.SetDimension(owners[i], typeInput + ".json", 0, 0, log, "", "", function () {
                                k++;
                                console.log("WOo "+max + " K: "+k);
                                if(k==owners.length){callback()}
                        }) }
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
                createWrite(function(){
                var addPayload = { "pubKey": pubKey, "dimensionName": typeInput, "ID":ID, "data": data };
                console.log("addpayload: " + JSON.stringify(addPayload))
                if (data.length > 0 && data[0].descriptor != "" && delegations.length > 0 && delegations[0].owner != "") {
                    console.log("line 213 trying to add entry...")
                    self.addEntry(addPayload, function (error, result) {
                        if (error) { console.log("error: " + error) }
                        if(result){
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

//***********************************************************************************************

//result is boolean success from the contract
this.RemoveDimension = function (formdata, callback) {

    var caller = formdata.caller;
    var descriptor = formdata.descriptor;
    var ID = formdata.ID;

    self.contract.RemoveDimension(caller, descriptor, ID, function (error, result) {
        if (result) {
            connector.deleteDimension(formdata.caller, formdata.descriptor + ".json", 0, function (results) { callback(error, result) })
        }
        else { callback(error, result); }
    })
}

//result is boolean success from the contract
this.changeDescriptor = function (formdata, callback) {
    // get json

    var pubKey = web3.toHex(String(formdata.pubKey));
    var type = web3.toHex(String(formdata.type));
    var ID = web3.toHex(String(formdata.ID));
    var oldDescriptor = web3.toHex(String(formdata.oldDescriptor));
    var newDescriptor = web3.toHex(String(formdata.newDescriptor));

    self.contract.changeDescriptor(pubKey, type, ID, oldDescriptor, newDescriptor, function (error, result) {
        if (result) {
            connector.GetDimension(formdata.pubKey, String(formdata.type) + ".json", 0, function (results) {
                for (var i = 0; i < results.dimension.data.length; i++) {
                    if (results.dimension.data[i].descriptor == oldDescriptor) {
                        results.dimension.data[i].descriptor = newDescriptor;
                        break;
                    }
                }
                //send json
                connector.SetDimension(formdata.pubKey, formdata.type + ".json", 0, 0, results, "", "", function () { callback(error, result) });
            })
        }
        //callback(error,result);
    })
}

//result is the boolean success from the contract
this.addEntry = function (formdata, callback) {

    var pubKey = formdata.pubKey;
    var type = formdata.dimensionName;
    console.log("FDLength" + formdata.data.length)
    var ID = formdata.ID;
    var k = 0;
	

    connector.GetDimension(pubKey, type + ".json", 0, function (results) {

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
            var attribute3 = attribute.substr(132);
            var attribute2 = attribute.substr(66,66);
            var attribute = attribute.substr(0,66);

            /*var entry= {
                        "descriptor":descriptor,
                        "attribute": attribute,
                        "flag": flag
            }*/

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
			self.writeAll(results,function () {callback(error, result)});
                    }
                }
                else {
                    callback(error, result);
                    i = formdata.length;
                    //k = formdata.data.length;
                    console.log("Error occurred while adding entry");
                }
            })//end contract call
        }//end for loop
    })// end getdimension
}//end addentry


//result is the boolean success from the contract
this.removeEntry = function (formdata, callback) {
    //TODO get json
    var pubKey = web3.toHex(String(formdata.pubKey));
    var type = web3.toHex(String(formdata.type));
    var ID = web3.toHex(String(formdata.ID));
    var descriptor = web3.toHex(String(formdata.descriptor));
    //var myFunction = new Function();
    //console.log(typeof(myFunction));
    //connector.GetDimension("a2","FINANCE.json",0,myFunction,"overloading")

    self.contract.removeEntry(pubKey, type, ID, descriptor, function (error, result) {
        if (result) {
            connector.GetDimension("a1", formdata.type+".json", 0, function (results) {
                console.log("ENTERED RE GDJ" + JSON.stringify(results));
                if (results.dimension.data.length > 0) {
                    for (var i = 0; i < results.dimension.data.length; i++) {
                        if (results.dimension.data[i].descriptor == formdata.descriptor) {
                            results.dimension.data.splice(i, 1);
                            connector.SetDimension(formdata.pubKey, String(formdata.type) + ".json", 0, 0, results, "", "", function () { callback(error, result) });
                            console.log("\n\nLOG: " + JSON.stringify(results) + "\n\n");
                            break;
                        }
                    }
                }
            })
        }
        //callback(error,result);
    })
}


//result is the boolean success from the contract
this.updateEntry = function (formdata, callback) {
    //TODO get json
    //make var log local
    var pubKey = web3.toHex(String(formdata.pubKey));
    var type = web3.toHex(String(formdata.type));
    var ID = web3.toHex(String(formdata.ID));
    var descriptor = web3.toHex(String(formdata.descriptor));
    var attribute = web3.toHex(String(formdata.attribute));
    var flag = formdata.flag;
	var attribute3 = attribute.substr(132) || 0x0;
        var attribute2 = attribute.substr(66,66) || 0x0;
        var attribute = attribute.substr(0,66);
console.log("calling update entry" + descriptor + " " + typeof(attribute));
    self.contract.updateEntry(pubKey, type, "0x0", descriptor, attribute, attribute2, attribute3 , Number(flag), function (error, result) {       
 if (result) {
console.log("result");
            connector.GetDimension(formdata.pubKey, String(formdata.type) + ".json", 0, function (results) {
console.log("json");
                for (var i = 0; i < results.dimension.data.length; i++) {
                    if (results.dimension.data[i].descriptor == formdata.descriptor) {
                        results.dimension.data[i].attribute = formdata.attribute;
                        if (flag == 2 || flag == "2") { }
                        else { results.dimension.data[i].flag = flag; }
                        connector.SetDimension(formdata.pubKey, String(formdata.type) + ".json", 0, 0, results, "", "", function () {console.log("callback"); callback(error, result) });
                        console.log("\n\nUPDATE LOG: " + JSON.stringify(results) + "\n\n");
                        //break;
                    }
                }

            })
        }//console.log("\n\nLOG: "+JSON.stringify(log) + "\n\n");
        //callback(error,result);
	console.log("res "+result+"  error "+error);
    })
}

//result is a string which is the attribute of the entry
this.readEntry = function (formdata, callback) {

        var pubKey = formdata.pubKey;
        var type = web3.toHex(formdata.type);
        var ID = web3.toHex(formdata.ID);
        var descriptor = web3.toHex(formdata.descriptor);

	console.log(pubKey);
	console.log(type);
console.log(ID);
console.log(descriptor);

        self.contract.readEntry(pubKey, type,"0x0" , descriptor, function (error, result) {
console.log("error: "+error);
            if (result) {
		var attribute=result[0]+result[1]+result[2];
                attribute = web3.toAscii(attribute.replace("/0/g",""));
                console.log("\nATTRIBUTE\n" + attribute);
		result=attribute;
                //consider adding a bool return to readEntry in contract
               //callback(error, result);
		connector.GetDimension(formdata.pubKey, String(formdata.type) + ".json", 0, function (results) {
                    var index = 0;
                    var keepGoing = true;
                    for (var i = 0; i < results.dimension.data.length; i++) {
console.log("here1");
                        if (results.dimension.data[i].descriptor == formdata.descriptor && results.dimension.data[i].flag == 1 && results.dimension.delegations.length>0 && results.dimension.delegations[0].owner != "") {
                            console.log("here2");
			    while (keepGoing) { console.log("here3");
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
                                    results.dimension.delegations[index].amount = results.dimension.delegations[index].amount - 1;
                                    keepGoing = false; console.log("here6");
					console.log("RW ALL");
                                    self.writeAll(results,function () {callback(error, result)});
                                }
                            }//end while
                        }
                    }//end for
		callback(error, result)
                })
               
            }
            else{
                callback(error, result);
            }
        })
    }


//result is bytes32[100] of public descriptors -- TODO: MUST CONVERT TO STRING!
this.getPublicDescriptors = function (formdata, callback) {
    var type = web3.toHex(String(formdata.type));
    var ID = web3.toHex(String(formdata.ID));
    console.log("TYPE: " + type);

    self.contract.getPublicDescriptors(type, ID, function (error, result) {
        callback(error, result);
    })
}

//result is bytes32[100] of private descriptors -- TODO: MUST CONVERT TO STRING!
this.getPrivateDescriptors = function (formdata, callback) {
    var type = web3.toHex(String(formdata.type));
    var ID = web3.toHex(String(formdata.ID));

    self.contract.getPrivateDescriptors(type, ID, function (error, result) {
        callback(error, result);
    })
}


//result is the bool success
this.delegate = function (formdata, callback) {
    console.log("hit delegate")
    console.log("formdata: \n" + JSON.stringify(formdata))
    //didnt want to edit the same log
    var delegateeLog;
    var sync;

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
                        "expiration": formdata[j].timeFrame,
                        "accessCategories": formdata[j].accessCategories
                    };
                    results.dimension.delegations.push(entry);
                    //connector.SetDimension(formdata[i].owner, formdata[i].dimension + ".json", 0, 0, results, "", "", "");
                    j++;
                    delegateeLog = results;
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
                        var keys = accessCategories.split(",");
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

                        console.log("about to write JSON");
                        for (i = 0; i < formdata.length; i++) {
                            connector.SetDimension(String(formdata[i].owner), formdata[i].dimension + ".json", 0, 0, results, "", "", function () {
                                l++;
                                console.log("Owner " + l);
                                if (l == formdata.length * 2) { console.log("Owner"); callback(error, result) }
                            });
                            connector.SetDimension(String(formdata[i].delegatee), formdata[i].dimension + ".json", 2, 0, delegateeLog, "", "", function () {
                                l++;
                                console.log("Delegatee " + l);
                                if (l == formdata.length * 2) { console.log("Delegatee"); callback(error, result) }
                            });
                        }
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
this.revokeDelegation = function (formdata, callback) {

    var log;
    var owner = web3.toHex(String(formdata.controller));
    var delegatee = web3.toHex(String(formdata.delegatee));
    var amount = formdata.amount;
    var dimension = String(formdata.dimension);
    var all = Boolean(formdata.all.toLowerCase() == 'true');//boolean - true or false
    console.log("BOOLEAN ALL: " + all);
    //connector.GetDimension(formdata.owner,String(formdata.dimension)+".json",0,function(results){
    //      log=results;
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
                                log.dimension.delegations.splice(j, 1);
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

                        }

                    }
                }

                console.log("\n\nREVOKE LOG: " + JSON.stringify(log) + "\n\n");
                connector.SetDimension(formdata.controller, String(formdata.dimension) + ".json", 0, 0, log, "", "", function () { callback(error, result) });
            })//end get json
        }
        //callback(error,result);
    })
}

//returns amount
this.delegateeAmount = function (formdata, callback) {
    var delegatee = web3.toHex(String(formdata.delegatee)); console.log("DELEGATEE JS: " + delegatee);
    var dimension = formdata.dimension;
    var descriptor = formdata.descriptor;

    self.contract.delegateeAmount(delegatee, dimension, descriptor, function (error, result) {
        callback(error, result);
    })
}


}


//TESTING:

var contractAddress = require('./epm.json').IdentityDimensionControl;
var coidAddress = require('./epm.json').CoreIdentity;
console.log("dimension control address: " + contractAddress);
console.log("coid address: " + coidAddress);

var dimension = new IdentityDimensionControl(contractAddress)

var InstantiationData = { "coidAddr": coidAddress, "pubKey": "a1" }

//dimension.testing("a1","a2","a3","a4","a5",3,function(error,result)
//{
//        console.log("result from testing: " + result);
//})
/*
dimension.Instantiation(InstantiationData, function(error,result)
{

//var newDim1 = {"pubKey": "a1", "uniqueID": "ABA", "typeInput": "FINANCE", "flag": 0}
dimension.CreateDimension(newDim1, function(error,result)
{

console.log("RESULT FROM CREATE FINANCE DIMENSION: " + result);
var firstEntry = {"pubKey": "a1", "type": "FINANCE", "ID": "", "attribute": "MonAttribute", "descriptor": "Monday", flag: 0}

dimension.addEntry(firstEntry, function(error,result)
{
console.log("ADD FIRST ENTRY: " + result)







})
})
})*/




    //1. INSTANTIATE THE DIMENSION
    dimension.Instantiation(InstantiationData, function (error, result) {
        console.log("RESULT FROM INSTANTIATE: " + result);
        //var str = web3.fromAscii('MonAttribute',32);
        //console.log("\n\nWEB3 STUFF : "+str);
        //console.log("BYTES : "+ string2Bin("MonAttribute"));
        //2. CREATE DIMENSION FINANCE

        var newDim1 ={
"dimensionName":"dimensionA",
"pubKey":"0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055",
"address":"",
"flag":"0",
"ID":"0",
"coidAddr":"034446D6B757C60B77160AE9D491A34428D8B75E",
"dimensionCtrlAddr":"9727FF7ECFE69AA7C610139C3B02E8A248A40393",
"uniqueId":"01547929f9184f362e1ab0126a15013087f4d1ab25d11ea971e8ffb159546d94",
"owners":"8b44edd090224a5c2350c1b2f3f57ee2d3443744462bb7c3c970c337e570eac4",
"controllers":"aae858de3899d2ff096ddb5384365c6a86ce7964f1c4f1f22878944d39bd943a",
"delegations":"[{\"dimension\":\"dimensionA\",\"owner\":[\"8b44edd090224a5c2350c1b2f3f57ee2d3443744462bb7c3c970c337e570eac4\"],\"delegatee\":\"aae858de3899d2ff096ddb5384365c6a86ce7964f1c4f1f22878944d39bd943a\",\"amount\":\"2\",\"accessCategories\":\"\",\"timeFrame\":1490368019551},{\"dimension\":\"dimensionA\",\"owner\":[\"8b44edd090224a5c2350c1b2f3f57ee2d3443744462bb7c3c970c337e570eac4\"],\"delegatee\":\"46b6f98e9e34caf4b66cfa6d2bcf3ed743c1accadfc3787f95dfe47adda7a661\",\"amount\":\"4\",\"accessCategories\":\"\",\"timeFrame\":1490368019551}]",
"data":"[{\"descriptor\":\"college\",\"attribute\":\"QmTLY8y6isHoMvSz25p287c6BWD7op23BsgdhMzv2nsbMy\",\"flag\":1}]",
"txn_id":"/CreateDimension"
};

	dimension.bigchainIt(newDim1, function (error, result) {
            console.log("RESULT BIGCHAIN: " + result);
		for (var i = 0; i < arguments.length; i++) {
                        console.log("Argument "+i+":\n"+String(arguments[i])+"\n");
                    }
})

        //var newDim1 = {"pubKey": "a1", "uniqueID": "ABA", "typeInput": "FINANCE", "flag": 0}
        //dimension.CreateDimension(newDim1, function (error, result) {
        //    console.log("RESULT FROM CREATE DIMENSION: " + result);
        //    var entryR1 = { "pubKey": "8b44edd090224a5c2350c1b2f3f57ee2d3443744462bb7c3c970c337e570eac4", "type": "dimensionA", "ID": "", "descriptor": "college" }
	//    var entryU1 = { "pubKey": "a1", "type": "taco", "ID": "", "attribute": "TacoTuesday", "descriptor": "college", flag: 0 }
	 //   var entryR2 = { "pubKey": "a1", "type": "taco", "ID": "", "descriptor": "college" }
	   // dimension.updateEntry(entryU1, function (error, result) {
	//	console.log("\nRESULT FROM UPDATE ENTRY: " + result);
		
           // 	dimension.readEntry(entryR1, function (error, result) {
            //    	console.log("\nRESULT FROM READ ENTRY: " + result);
           // 	})
	   
	//})
    //});
            //newDim1 = {"pubKey": "a1", "uniqueID": "ABC", "typeInput": "HEALTH", "flag": 0}

            //dimension.CreateDimension(newDim1, function(error,result)
            //{
            //console.log("RESULT FROM CREATE HEALTH DIMENSION: " + result);

/*
            //3. POPULATE DIMENSION FINANCE
            var firstEntry = { "pubKey": "a1", "type": "FINANCE", "ID": "", "attribute": "MonAttribute", "descriptor": "Monday", flag: 0 }
            setTimeout(function () {
                dimension.addEntry(firstEntry, function (error, result) {
                    console.log("ADD FIRST ENTRY: " + result)
                    var secondEntry = { "pubKey": "a1", "type": "FINANCE", "ID": "", "attribute": "TuesAttribute", "descriptor": "Tuesday", flag: 1 }
                    dimension.addEntry(secondEntry, function (error, result) {
                        console.log("ADD SECOND ENTRY: " + result)
                        var thirdEntry = { "pubKey": "a1", "type": "FINANCE", "ID": "", "attribute": "WedAttribute", "descriptor": "Wednesday", flag: 1 }
                        dimension.addEntry(thirdEntry, function (error, result) {
                            console.log("ADD THIRD ENTRY: " + result)

                            //4. CHECK PUBLIC AND PRIVATE DESCRIPTORS
                            var getDescriptors = { "type": "FINANCE", "ID": "" }
                            dimension.getPublicDescriptors(getDescriptors, function (error, result) {

                                console.log("RESULT FROM GET PUBLIC DESCRIPTORS AFTER POPULATION: " + result);
                                var entryR1 = { "pubKey": "a1", "type": "FINANCE", "ID": "", "descriptor": "Tuesday" }
                                dimension.getPrivateDescriptors(getDescriptors, function (error, result) {

                                    console.log("\nRESULT FROM GET PRIVATE DESCRIPTORS AFTER POPULATION: " + result);

                                    dimension.readEntry(entryR1, function (error, result) {

                                        console.log("\nRESULT FROM READ ENTRY: " + result);
                                        var entryU1 = { "pubKey": "a1", "type": "FINANCE", "ID": "", "attribute": "TacoTuesday", "descriptor": "Tuesday", flag: 0 }
                                        setTimeout(function () {

                                            //CHANGE AN ENTRY
                                            dimension.updateEntry(entryU1, function (error, result) {

                                                console.log("\nRESULT FROM UPDATE ENTRY: " + result);
                                                var entryR2 = { "pubKey": "a1", "type": "FINANCE", "ID": "", "descriptor": "Monday" }

                                                dimension.readEntry(entryR1, function (error, result) {

                                                    console.log("\nRESULT FROM READ AFTER UPDATE ENTRY: " + result);

                                                    dimension.getPublicDescriptors(getDescriptors, function (error, result) {
                                                        console.log("RESULT FROM GET PUBLIC DESCRIPTORS AFTER UPDATE: " + result);

                                                        dimension.getPrivateDescriptors(getDescriptors, function (error, result) {

                                                            console.log("\nRESULT FROM GET PRIVATE DESCRIPTORS AFTER UPDATE: " + result);

                                                            var entryR2 = { "pubKey": "a1", "type": "FINANCE", "ID": "", "descriptor": "Monday" }
                                                            //REMOVE AN ENTRY
                                                            dimension.removeEntry(entryR2, function (error, result) {
                                                                console.log("\nRESULT FROM READ AFTER REMOVE ENTRY: " + result);

                                                                dimension.readEntry(entryR2, function (error, result) {
                                                                    console.log("\nRESULT FROM READ AFTER REMOVE ENTRY: " + result);
                                                                    var entryR3 = { "pubKey": "a1", "type": "FINANCE", "ID": "", "descriptor": "Tacos" }
                                                                    var entryCD = { "pubKey": "a1", "type": "FINANCE", "ID": "", "oldDescriptor": "Tuesday", "newDescriptor": "Tacos" }


                                                                    //CHANGE AN EXISTING DESCRIPTOR
                                                                    dimension.changeDescriptor(entryCD, function (error, result) {
                                                                        console.log("\nRESULT FROM CHANGE DESCRIPTOR: " + result);

                                                                        dimension.readEntry(entryR3, function (error, result) {
                                                                            console.log("\nRESULT FROM READ AFTER CHANGE DESCRIPTOR: " + result);

                                                                            dimension.getPublicDescriptors(getDescriptors, function (error, result) {
                                                                                console.log("RESULT FROM GET PUBLIC DESCRIPTORS CAHNGE DESCRIPTOR: " + result);

                                                                                //DELEGATION OF TOKENS
                                                                                var delegate = { "owner": "a1", "delegatee": "b1", "amount": 4, "dimension": "FINANCE", "timeFrame": 50000, "accessCategories": "" }
                                                                                var delegate2 = { "owner": "a1", "delegatee": "b1", "amount": 4, "dimension": "HEALTH", "timeFrame": 50000, "accessCategories": "" }

                                                                                dimension.delegate(delegate, function (error, result) {
                                                                                    console.log("RESULT FROM DELEGATE: " + result);
                                                                                    var delegateR = { "delegatee": "b1", "dimension": "FINANCE", "descriptor": "Tacos" }
                                                                                    var Rdelegate = { "controller": "a1", "delegatee": "b1", "amount": 2, "dimension": "FINANCE", "all": "false" }

                                                                                    //dimension.delegate(delegate2,function(error,result)
                                                                                    //{
                                                                                    //console.log("RESULT FROM DELEGATE2: " + result);

                                                                                    dimension.revokeDelegation(Rdelegate, function (error, result) {
                                                                                        console.log("RESULT FROM REVOKE DELEGATE: " + result);

                                                                                        dimension.delegateeAmount(delegateR, function (error, result) {
                                                                                            console.log("RESULT FROM DELEGATEE AMOUNT: " + result);
                                                                                            var delegateR2 = { "delegatee": "b1", "dimension": "HEALTH", "descriptor": "Wednesday" }
                                                                                            dimension.delegateeAmount(delegateR2, function (error, result) {
                                                                                                console.log("RESULT FROM DELEGATEE2 AMOUNT: " + result);

                                                                                                //REMOVE DIMENSION
                                                                                                var dim = { "caller": "a1", "ID": "", "descriptor": "FINANCE" }
                                                                                                dimension.RemoveDimension(dim, function (error, result) {
                                                                                                    console.log("RESULT FROM REMOVE DIMENSION: " + result);

                                                                                                    dimension.readEntry(entryR3, function (error, result) {
                                                                                                        console.log("\nRESULT FROM READ AFTER REMOVE DIMENSION: " + result);

                                                                                                        dimension.getPublicDescriptors(getDescriptors, function (error, result) {
                                                                                                            console.log("RESULT FROM GET PUBLIC DESCRIPTORS AFTER REMOVE DIMENSION: " + result);
                                                                                                            entryR3 = { "pubKey": "b1", "type": "HEALTH", "ID": "", "descriptor": "Wednesday" }

                                                                                                            dimension.readEntry(entryR3, function (error, result) {
                                                                                                                console.log("\nRESULT FROM READ DIMENSION2: " + result);
                                                                                                                getDescriptors = { "type": "HEALTH", "ID": "" }

                                                                                                                dimension.getPublicDescriptors(getDescriptors, function (error, result) {
                                                                                                                    console.log("RESULT FROM GET PUBLIC DESCRIPTORS DIMENSION2: " + result);

                                                                                                                    dimension.getPrivateDescriptors(getDescriptors, function (error, result) {
                                                                                                                        console.log("RESULT FROM GET PUBLIC DESCRIPTORS DIMENSION2: " + result);
                                                                                                                        setTimeout(function () {

                                                                                                                            dimension.delegateeAmount(delegateR2, function (error, result) {
                                                                                                                                console.log("RESULT FROM DELEGATEE2 AMOUNT: " + result);


                                                                                                                            })
                                                                                                                        }, 6000)
                                                                                                                    })
                                                                                                                })
                                                                                                            })
                                                                                                        })//end 4th getpubdes
                                                                                                    })//end 5th readentry
                                                                                                })//end remove dimension
                                                                                            })
                                                                                        })//end delegatee amount
                                                                                    })//end revoke delegation
                                                                                    //})//end delegeate2
                                                                                })//end delegate
                                                                            })//end 3rd getpubdes
                                                                        })//end 4th readEntry
                                                                    })//end changeDescriptor
                                                                })//end 3rd readEntry
                                                            })//end removeEntry
                                                        })//end 2nd getprivdes
                                                    })//end 2nd getpubdes
                                                })// end 2nd readEntry
                                            }) //end updateEntry
                                        }, 3000)
                                    })//END readEntry
                                })
                            })//END 4.

                        })
                    })
                })//END 3.
            }, 3000)
            //})//end createDimension2
        })//END 2.

    })//END 1.
*/
})
