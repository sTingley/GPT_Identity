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
                                    break;
                                    found = true;
                                }
                                else { }
                            }
                            data.messages = dataArray;
                            console.log("After: " +JSON.stringify(data));
                            fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(data)));
                            var setIcaObj = {
                                "pubKey": params.ownerId,
                                "fileName": params.fileName,
                                "sig": params.sig,
                                "proposal_id": params.proposal_id
                            }
                            console.log("YOU MADE IT");
                            //if(found){
                              setAssetIca(setIcaObj, function (result) {
                                  console.log(result)
                                  res.json({ 'data': result });
                              })
                            //}
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
                    "txid":params.txid

                };
            };
            if (fs.existsSync(fileName)) {
                setTimeout(function () {
                    console.log("dataFormat");
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
                var fileName = PATH + keccak_256(pubKey).toUpperCase() + notify_suffix + ".json";
                var cryptoDecr = new Crypto({ pubKey: keccak_256(pubKey).toUpperCase() });
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
                        res.send("successfully deleted");
                    });
                }
            }
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