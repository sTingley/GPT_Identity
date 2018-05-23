'use strict'
var fs = require('fs');
var secp256k1 = require('secp256k1')
var Crypto = require('./cryptoCtr.js'),
    keccak_256 = require('js-sha3').keccak_256;

//TODO: PATH DEFINE
var PATH = "/home/demoadmin/DigitalTwin/attestations/";
var AssetPATH = "/home/demoadmin/DigitalTwin/assets";
var OwnershipDirectory = "owned";

//TODO: DEFINE NOTIFY_SUFFIX
var notify_suffix = "_attest";


/*var getAsset = function (req, calllback) {
    //get public key
    var pubKey = req.body.pubKey;

    //call in case their folders have not been created:
    //var manager = new directoryManager(keccak_256(pubKey));

    //get flag
    var flag = req.body.flag;

    //get fileName
    var fileName = req.body.fileName;

    //get the directory
    var directory = AssetPATH + "/" + keccak_256(pubKey).toUpperCase() + "/";
    directory = directory + OwnershipDirectory + "/" + fileName;

    var cryptoEncr = new Crypto({ pubKey: keccak_256(pubKey).toUpperCase() });

    //debugging
    var fileName = directory;
    console.log("FILE NAME: " + directory)

    if (fs.existsSync(fileName)) {
        console.log("File exists")
        console.log(fs.existsSync(fileName))
        var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));

        console.log("debugging...file content is: " + fileContent)

        fileContent = JSON.parse(fileContent)

        callback(fileContent)

    }
    else {
        callback("not found")
    }
}*/


// function needs owner's hashed pubkey, filename, signature to be added, proposal id
var setAssetIca = function (req, callback) {


    //get ***HASHED*** public key
    var pubKey = req.pubKey;

    //call in case their folders have not been created:
    //var manager = new directoryManager(pubKey);

    //get fileName
    var fileName = req.fileName;

    //debugging functions
    console.log("pubKey is: " + pubKey);
    console.log("filename is: " + fileName);

    //get the directory
    var directory = AssetPATH + "/" + pubKey.toUpperCase() + "/";
    directory = directory + OwnershipDirectory + "/" + fileName;

    var cryptoEncr = new Crypto({ pubKey: pubKey.toUpperCase() });

    //debugging
    var fileName = directory;
    console.log("FILE NAME: " + directory)

    console.log("***********: " + fs.existsSync(fileName))

    //this is an update
    if (fs.existsSync(fileName)) {

        //debugging
        console.log("File exists: " + fs.existsSync(fileName))

        var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
        fileContent = JSON.parse(fileContent);

        //debugging
        console.log("Testing, File Pulled up: " + JSON.stringify(fileContent));

        var name = "RevocationSignatures";
        var val = [];
        if (fileContent.SignatureRevocations) {
            val = fileContent.SignatureRevocations;
            val.push(req.sig)
        }
        else { val.push(req.sig) }

        fileContent[name] = val;
	var chain = 'primaryAccount';
        var blockchainID = keccak_256(chain);

        bigchainIt(req.proposalId, fileContent, fileContent.gatekeeperAddr, fileContent.coidAddr, fileContent.dimensionCtrlAddr, fileContent.blockNumber, fileContent.blockHashVal, blockchainID, fileContent.timestamp, fileContent.validatorSigs, fileContent.GKSig, function (result, theId, theHash) {
            fileContent.bigchainID = theId;
            fileContent.bigchainHash = theHash;
            fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
            callback("Set Asset ICA Complete")
        })

    }
    else //this is a creation
    { callback("Asset not Found") }

}

function verifyIcaSig(msg, signature, pubKey) {
    //INPUT msg: This is a hex string of the message hash from wallet
    //INPUT signature: This is a hex string of the signature from wallet
    //INPUT pubKey: This is a hex string of the public key from wallet

    //convert all to buffers:
    msg = new Buffer(msg, "hex");
    signature = new Buffer(signature, "hex");
    pubKey = new Buffer(pubKey, "hex");
    var verified = secp256k1.verify(msg, signature, pubKey)
    return verified;

}

var clearIcaExpirations = function (formdata, callback) {

    var currentDate = new Date();
    formdata = JSON.parse(formdata);
    var found = false;
    currentDate = parseInt(currentDate.getTime()) / 1000;
    console.log("formdata: "+JSON.stringify(formdata));
    console.log("clearExpire: "+JSON.stringify(formdata.messages))
    var dataArray = formdata.messages;
console.log("length: "+ dataArray.length)
    for (var i = dataArray.length-1; i+1 > 0; i--) {
console.log("i: "+i);
        if (dataArray[i].sigExpire < currentDate) {
            dataArray.splice(i, 1);
	    found = true;
	    console.log("Expiration Found");
        }
       // if(found == false && i<=0){
	//	console.log("No Expirations Found");
	//	callback();
	//}
	if(i<=0){
		console.log("clear expirations callback");
		formdata.coid = dataArray;
		callback(formdata);
	}
    }
    
}

var bigchainIt = function (proposalID, coidData, coidGKAddress, coidAddr, dimensionCtrlAddr, blockNumber, blockHash, blockchainID, timestamp, validatorSigs, gatekeeperSig, callback) {

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
}//end bigchainIt

//needs owner hashed pubkey, validator hashed pubkey, proposal ID, asset filename
var IcaSigCtrl =
    {
        revokeIca: function (req, res) {

            //grab request
            var params = req.body;
	    var found = false;
            var cryptoEncr = new Crypto({ pubKey: params.pubKey.toUpperCase() });
            var fileName = PATH + params.pubKey.toUpperCase() + notify_suffix + ".json";
            console.log(fs.existsSync(fileName) + " trying to read: " + fileName);
            if (params.pubKey && fs.existsSync(fileName)) {
                console.log('inside if condition (file exists)')
                fs.readFile(fileName, 'utf8', function (err, data) {
                    if (err) {
                        res.status(400).json({ "Error": "Unable to read Attestations" });
                        console.log("error is: " + err)
                    }
                    else {
			data = cryptoEncr.decrypt(data);
                        clearIcaExpirations(data, function (data) {
		     	    //var dataArray = JSON.parse(data);
                            console.log("Before: "+ JSON.stringify(data))
                            var dataArray = data.messages;
                            for (var i = dataArray.length-1; i+1 >= 0; i--) {
				console.log("PropId1 "+dataArray[i].proposal_id);
                                console.log("PropId2 "+params.proposal_id);
                                if (dataArray[i].proposal_id == params.proposal_id) {
                                    dataArray.splice(i, 1)
				    found = true;
				    console.log("spliced: "+dataArray[i].proposalId);
				    break;
                                }
                                else { }
                            }
                            data.messages = dataArray;
			    console.log("After: " +JSON.stringify(data));
                            fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(data)));
                            /*var setIcaObj = {
                                "pubKey": params.ownerId,
                                "fileName": params.fileName,
                                "sig": params.sig,
                                "proposal_id": params.proposal_id
                            }*/
			    console.log("YOU MADE IT");
			    if(found){
                              //setAssetIca(setIcaObj, function (result) {
                              //    console.log(result)
                              //    res.json({ 'data': result });
                              //})
				res.json({ 'data': 'Revocation Complete' });
			    }
			    else{res.json({ 'data': 'Proposal Not Found' });}
                        })//end clearIcaExpirations

                    }//end else
                });
            } else {
                res.json({ 'data': 'Attestations file not found' });
            }




        },

        //INPUT MUST CONTAIN: message pubKey proposalID
        // Just write notification (right after writes into bigchain)
        writeAttestation: function (req, res) {
            //debugging
            console.log("you have reached writeAttestation");

            //grab request
            var params = req.body;

            //debugging
            console.log(params);

            //grab message
            var message = params.message;

            //debugging
            console.log("Message is: " + message);
            console.log("pubkey is: " + params.pubKey);

            if (!params.pubKey) res.status(400).json({ "Error": "Invalid input parameters" });

            var fileName = PATH + params.pubKey.toUpperCase() + notify_suffix + ".json";
            console.log("File name is: " + fileName);
            var timestamp = Number(new Date());
            var cryptoEncr = new Crypto({ pubKey: params.pubKey.toUpperCase() });
            var dataFormat = () => {
                return {
                    "type": 'Sig',
                    "proposal_id": params.proposalID,
                    "message": message,
                    "read_status": false,
                    "time": timestamp,
                    "gatekeeperAddr": params.gatekeeperAddr,
                    "isHuman": params.isHuman,
                    "sigExpire": params.sigExpire,
		    "txid": params.txid,
		    "assetId": params.assetId,
		    "owner":params.owner
                };
            };
            if (fs.existsSync(fileName)) {
                setTimeout(function () {
                    console.log("dataFormatICA1");
                    console.log(dataFormat());
                    var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
                    var fileContent = JSON.parse(fileContent);
                    fileContent.messages.unshift(dataFormat());
                    fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
                    res.json({ "Msg": "Attestation updated successfully" });
                }, 5000)
            } else {
                var msg = {
                    id: params.pubKey,//public key
                    messages: [dataFormat()]
                }
		console.log("dataFormatICA2");
                console.log(dataFormat());
                var cryptoData = cryptoEncr.encrypt(JSON.stringify(msg));
                fs.writeFile(fileName, cryptoData, (err) => {
                    if (err) {
                        res.status(400).json({ "Error": "Unable to write message in " + fileName });
                        return;
                    }
                    res.json({ "Msg": "Attestation written successfully" });
                });
            }
        },
        deleteAttestation: function (req, res) {
            var pid = req.params.pid,
                pubKey = req.params.pubKey;
            if (pid && pubKey) {
                var fileName = PATH + pubKey.toUpperCase() + notify_suffix + ".json";
                var cryptoDecr = new Crypto({ pubKey: pubKey.toUpperCase() });
                if (fs.existsSync(fileName)) {
                    fs.readFile(fileName, 'utf8', function (err, data) {
                        var allAttestations = JSON.parse(cryptoDecr.decrypt(data)),
                            msgs = allAttestations.messages;
                        for (var i = 0; i < msgs.length; i++) {
                            var msg = msgs[i];
                            if (msg.proposal_id == pid) {
                                msgs.splice(i, 1);
                                fs.writeFileSync(fileName, cryptoDecr.encrypt(JSON.stringify(allAttestations)));
                                break;
                            }
                        }
                        res.send("true");
                    });
                }else{res.send("false");}
            }else{res.send("false");}
        },
        fetchAttestation: function (req, res) {
            var param = req.params;
            console.log('pubKey: ' + param.pubKey)
            // console.log('hash of pubkey: ' + keccak_256(param.pubKey).toUpperCase())
            var fileName = PATH + param.pubKey.toUpperCase() + notify_suffix + ".json";
            var cryptoDecr = new Crypto({ pubKey: param.pubKey.toUpperCase() });

            console.log(fs.existsSync(fileName) + " trying to read: " + fileName);
            if (param.pubKey && fs.existsSync(fileName)) {
                console.log('inside if condition (file exists)')
                fs.readFile(fileName, 'utf8', function (err, data) {
                    if (err) {
                        res.status(400).json({ "Error": "Unable to read Attestations" });
                        console.log("error is: " + err)
                    }
                    //console.log(JSON.parse(cryptoDecr.decrypt(data)))
                    else {
			data = cryptoDecr.decrypt(data);
			console.log("data: "+data);
                        clearIcaExpirations(data, function (data) {
                            console.log("data after clear expire: "+JSON.stringify((data)))
                            res.json({ 'data': ((data)) });
                        })// end clearIcaExpirations
                    }
                });
            } else {
                res.json({ 'data': 'Attestations unavailable' });
            }


        }//end fetchAttestation
    }
module.exports = IcaSigCtrl;

