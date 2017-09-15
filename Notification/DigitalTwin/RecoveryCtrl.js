'use strict'
var fs = require('fs-extra');
var secp256k1 = require('secp256k1')
var Crypto = require('./cryptoCtr.js'),
    keccak_256 = require('js-sha3').keccak_256;

//TODO: PATH DEFINE
var PATH = "/home/demoadmin/DigitalTwin/recoveries/";

//TODO: DEFINE NOTIFY_SUFFIX
var notify_suffix = "_recover";

//needs owner hashed pubkey, validator hashed pubkey, proposal ID, asset filename
var RecoveryCtrl =
    {

        //INPUT MUST CONTAIN: message pubKey proposalID
        // Just write notification (right after writes into bigchain)
        writeRecovery: function (req, res) {
            //debugging
            console.log("you have reached writeRecovery");

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
                    "type": 'recov',
                    "proposal_id": params.proposalID,
                    "message": message,
                    "read_status": false,
                    "time": timestamp,
                    "gatekeeperAddr": params.gatekeeperAddr,
                    "coidAddr":params.coidAddr,
                    "dimensionCtrlAddr":params.dimensionCtrlAddr,
                    "trieAddr":params.trieAddr,
		    "recoveryAddr":params.recoveryAddr,
                    "isHuman": params.isHuman,
                    "txid": params.txid,
                    "assetId": params.assetId,
                    "owner":params.owner,
                    "uniqueId":params.uniqueId
                };
            };
            if (fs.existsSync(fileName)) {
                setTimeout(function () {
                    console.log("dataFormatRecovery1");
                    console.log(dataFormat());
                    var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
                    var fileContent = JSON.parse(fileContent);
                    fileContent.messages.unshift(dataFormat());
                    fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
                    res.json({ "Msg": "Recovery updated successfully" });
                }, 5000)
            } else {
                var msg = {
                    id: params.pubKey,//public key
                    messages: [dataFormat()]
                }
                console.log("dataFormatRecovery2");
                console.log(dataFormat());
                var cryptoData = cryptoEncr.encrypt(JSON.stringify(msg));
                fs.writeFile(fileName, cryptoData, (err) => {
                    if (err) {
                        res.status(400).json({ "Error": "Unable to write message in " + fileName });
                        return;
                    }
                    res.json({ "Msg": "Recovery written successfully" });
                });
            }
        },
        deleteRecovery: function (req, res) {
            var pid = req.body.pid,
            pubKey = req.body.pubKey;
	    console.log("delete command recieved pid: "+ pid +" pubkey: "+pubKey);
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
        fetchRecovery: function (req, res) {
            var param = req.params;
            console.log('pubKey: ' + param.pubKey)
            // console.log('hash of pubkey: ' + keccak_256(param.pubKey).toUpperCase())
            var fileName = PATH + req.params.pubKey.toUpperCase() + notify_suffix + ".json";
            var cryptoDecr = new Crypto({ pubKey: param.pubKey.toUpperCase() });

            console.log(fs.existsSync(fileName) + " trying to read: " + fileName);
            if (param.pubKey && fs.existsSync(fileName)) {
                console.log('inside if condition (file exists)')
                fs.readFile(fileName, 'utf8', function (err, data) {
                    if (err) {
                        res.status(400).json({ "Error": "Unable to read Recovery" });
                        console.log("error is: " + err)
                    }
                    //console.log(JSON.parse(cryptoDecr.decrypt(data)))
                    else {
                        data = cryptoDecr.decrypt(data);
                        console.log("data: "+data);
                        res.json({ 'data': ((data)) });
                    }
                });
            } else {
                res.json({ 'data': 'Recovery unavailable' });
            }


        },//end fetchRecovery

        cleanMyTwin:function (req, res) {
            var param = req.params;
            console.log('pubKey: ' + param.pubKey);
	    console.log("cleaning twin");
	    var assetPath = "/home/demoadmin/DigitalTwin/assets/";
            var dimensionPath = "/home/demoadmin/DigitalTwin/dimensions/";
	    var recoveryPath = "/home/demoadmin/DigitalTwin/recoveries/";
	    var notificationPath = "/home/demoadmin/DigitalTwin/notifications/";
	    var attestationPath = "/home/demoadmin/DigitalTwin/attestations/";

            fs.remove(assetPath + param.pubKey);
            fs.remove(dimensionPath + param.pubKey);
	    fs.remove(recoveryPath + param.pubKey + "_recover.json");
	    fs.remove(notificationPath + param.pubKey + "_notify.json");
	    fs.remove(notificationPath + param.pubKey + "_vote.json");
	    fs.remove(attestationPath + param.pubKey + "_attest.json");
	    res.json({ 'data': 'Digital Twin Cleaned' });

	},//end cleantwin
        transferRecovery: function (req, res) {
            var param = req.body;
            console.log('from pubKey: ' + param.fromPubKey);
            console.log('to pubKey: ' + param.toPubKey);
            var recoveryPath = "/home/demoadmin/DigitalTwin/recoveries/";
            var fromPath = recoveryPath + param.fromPubKey + "_recover.json";
            var toPath = recoveryPath + param.toPubKey + "_recover.json";

	    var cryptoEncr = new Crypto({ pubKey: param.fromPubKey.toUpperCase() });
	    var cryptoEncr2 = new Crypto({ pubKey: param.toPubKey.toUpperCase() });
	    var fileContent = cryptoEncr.decrypt(fs.readFileSync(fromPath, 'utf8'));
            var fileContent = JSON.parse(fileContent);
            fs.writeFileSync(toPath, cryptoEncr2.encrypt(JSON.stringify(fileContent)));
	    res.send('true');
          
        }//end transferRecovery

    }//end recoveryCtrl
module.exports = RecoveryCtrl;


