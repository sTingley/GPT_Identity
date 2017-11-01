'use strict'
var fs = require ('fs');
var Crypto = require('./cryptoCtr.js'),
        keccak_256 = require('js-sha3').keccak_256,
        configuration = require('./NotificationCtrlConfig.json');

//TODO: PATH DEFINE
var PATH = configuration.path;

//TODO: DEFINE NOTIFY_SUFFIX
var notify_suffix = configuration.notifications_file;

//Functions inherited from BallotCtrl
//TODO: Change for folder structure
var NotificationCtrl =
{
        //INPUT MUST CONTAIN:
        //message
        //pubKey
        //proposalID
        // Just write notification (right after writes into bigchain)
        writeNotification: function(req, res)
        {
                //debugging
                console.log("you have reached writeNotification");

                //grab request
                var params = req.body;

                //debugging
                console.log(params);

                //grab message
                var message = params.message;

                //debugging
                console.log("Message is: " + message);
		console.log("pubkey is: "+params.pubKey);

                if(!params.pubKey) res.status(400).json({"Error": "Invalid input parameters"});

                var fileName = PATH + params.pubKey.toUpperCase() + notify_suffix + ".json";
		console.log("File name is: "+fileName);
                var timestamp = Number(new Date());
                var cryptoEncr = new Crypto({pubKey: params.pubKey});
                var dataFormat = () => {
                        return {
                                "type": 'proposal',
                                "proposal_id": params.proposalID,
                                "message": message,
                                "read_status": false,
                                "time": timestamp,
                                "gatekeeperAddr": params.gatekeeperAddr,
                                "isHuman": params.isHuman

                        };
                };
                if (fs.existsSync(fileName)) {
                       setTimeout(function(){
                        console.log("dataFormat");
                        console.log(dataFormat());
                        var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
                        var fileContent = JSON.parse(fileContent);
                        fileContent.messages.unshift(dataFormat());
                        fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
                        res.json({"Msg":"Notification updated successfully"});},5000)
                } else {
                        var msg = {
                                id: params.pubKey,//public key
                                messages:[dataFormat()]
                        }
                        var cryptoData = cryptoEncr.encrypt(JSON.stringify(msg));
                        fs.writeFile(fileName, cryptoData, (err) => {
                                if(err){
                                        res.status(400).json({"Error": "Unable to write message in " + fileName});
                                        return;
                                }
                                res.json({"Msg":"Notification updated successfully"});
                        });
                }
        },
        deleteNotification: function(req, res){
                var pid = req.params.pid,
                        pubKey = req.params.pubKey;
                if(pid && pubKey){
                        var fileName = PATH + keccak_256(pubKey).toUpperCase() + notify_suffix + ".json";
                        var cryptoDecr = new Crypto({pubKey: keccak_256(pubKey).toUpperCase()});
                        if(fs.existsSync(fileName)){
                                fs.readFile(fileName, 'utf8', function(err, data){
                                        var allNotifications = JSON.parse(cryptoDecr.decrypt(data)),
                                                msgs = allNotifications.messages;
                                        for(var i=0; i<msgs.length; i++){
                                                var msg = msgs[i];
                                                if(msg.proposal_id == pid){
                                                        msgs.splice(i,1);
                                                        fs.writeFileSync(fileName, cryptoDecr.encrypt(JSON.stringify(allNotifications)));
                                                        break;
                                                }
                                        }
                                        res.send("successfully deleted");
                                });
                        }
                }
        },
        fetchNotification: function(req, res){
                var param = req.params;
                console.log('pubKey: ' + param.pubKey)
               // console.log('hash of pubkey: ' + keccak_256(param.pubKey).toUpperCase())
                var fileName = PATH + param.pubKey.toUpperCase() + notify_suffix + ".json";
                var cryptoDecr = new Crypto({pubKey: param.pubKey});
		console.log(fs.existsSync(fileName)+" trying to read: " +fileName);
                if(param.pubKey && fs.existsSync(fileName)){
                console.log('inside if condition (file exists)')
                        fs.readFile(fileName, 'utf8', function(err, data){
                                if(err) res.status(400).json({"Error": "Unable to read notifications"});
					console.log("error is: " + err)
                                        //console.log(JSON.parse(cryptoDecr.decrypt(data)))
					console.log(JSON.stringify((data)))
                                        res.json({'data': (cryptoDecr.decrypt(data))});
                        });
                } else {
                        res.json({'data': 'Notifications unavailable'});
                }
        }
}
module.exports = NotificationCtrl;



'use strict'
var fs = require ('fs');
var Crypto = require('./cryptoCtr.js'),
        keccak_256 = require('js-sha3').keccak_256,
        configuration = require('./NotificationCtrlConfig.json');

//TODO: PATH DEFINE
var PATH = configuration.path;

//TODO: DEFINE NOTIFY_SUFFIX
var notify_suffix = configuration.notifications_file;

//Functions inherited from BallotCtrl
//TODO: Change for folder structure
var NotificationCtrl =
{
        //INPUT MUST CONTAIN:
        //message
        //pubKey
        //proposalID
        // Just write notification (right after writes into bigchain)
        writeNotification: function(req, res)
        {
                //debugging
                console.log("you have reached writeNotification");

                //grab request
                var params = req.body;

                //debugging
                console.log(params);

                //grab message
                var message = params.message;

                //debugging
                console.log("Message is: " + message);
		console.log("pubkey is: "+params.pubKey);

                if(!params.pubKey) res.status(400).json({"Error": "Invalid input parameters"});

                var fileName = PATH + params.pubKey.toUpperCase() + notify_suffix + ".json";
		console.log("File name is: "+fileName);
                var timestamp = Number(new Date());
                var cryptoEncr = new Crypto({pubKey: params.pubKey});
                var dataFormat = () => {
                        return {
                                "type": 'proposal',
                                "proposal_id": params.proposalID,
                                "message": message,
                                "read_status": false,
                                "time": timestamp,
                                "gatekeeperAddr": params.gatekeeperAddr,
                                "isHuman": params.isHuman

                        };
                };
                if (fs.existsSync(fileName)) {
                       setTimeout(function(){
                        console.log("dataFormat");
                        console.log(dataFormat());
                        var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
                        var fileContent = JSON.parse(fileContent);
                        fileContent.messages.unshift(dataFormat());
                        fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
                        res.json({"Msg":"Notification updated successfully"});},5000)
                } else {
                        var msg = {
                                id: params.pubKey,//public key
                                messages:[dataFormat()]
                        }
                        var cryptoData = cryptoEncr.encrypt(JSON.stringify(msg));
                        fs.writeFile(fileName, cryptoData, (err) => {
                                if(err){
                                        res.status(400).json({"Error": "Unable to write message in " + fileName});
                                        return;
                                }
                                res.json({"Msg":"Notification updated successfully"});
                        });
                }
        },
        deleteNotification: function(req, res){
                var pid = req.params.pid,
                        pubKey = req.params.pubKey;
                if(pid && pubKey){
                        var fileName = PATH + keccak_256(pubKey).toUpperCase() + notify_suffix + ".json";
                        var cryptoDecr = new Crypto({pubKey: keccak_256(pubKey).toUpperCase()});
                        if(fs.existsSync(fileName)){
                                fs.readFile(fileName, 'utf8', function(err, data){
                                        var allNotifications = JSON.parse(cryptoDecr.decrypt(data)),
                                                msgs = allNotifications.messages;
                                        for(var i=0; i<msgs.length; i++){
                                                var msg = msgs[i];
                                                if(msg.proposal_id == pid){
                                                        msgs.splice(i,1);
                                                        fs.writeFileSync(fileName, cryptoDecr.encrypt(JSON.stringify(allNotifications)));
                                                        break;
                                                }
                                        }
                                        res.send("successfully deleted");
                                });
                        }
                }
        },
        fetchNotification: function(req, res){
                var param = req.params;
                console.log('pubKey: ' + param.pubKey)
               // console.log('hash of pubkey: ' + keccak_256(param.pubKey).toUpperCase())
                var fileName = PATH + param.pubKey.toUpperCase() + notify_suffix + ".json";
                var cryptoDecr = new Crypto({pubKey: param.pubKey});
		console.log(fs.existsSync(fileName)+" trying to read: " +fileName);
                if(param.pubKey && fs.existsSync(fileName)){
                console.log('inside if condition (file exists)')
                        fs.readFile(fileName, 'utf8', function(err, data){
                                if(err) res.status(400).json({"Error": "Unable to read notifications"});
					console.log("error is: " + err)
                                        //console.log(JSON.parse(cryptoDecr.decrypt(data)))
					console.log(JSON.stringify((data)))
                                        res.json({'data': (cryptoDecr.decrypt(data))});
                        });
                } else {
                        res.json({'data': 'Notifications unavailable'});
                }
        }
}

module.exports = NotificationCtrl;


// writeExpiredProposalNotification: function(req, res){
        
// 	var params = req.body;
// 	if(!params.pubKey) res.status(400).json({"Error": "Invalid input parameters"});
// 	var fileName = PATH + params.pubKey + expiredProposal_suffix + ".json";
// 	var timestamp = Number(new Date()); 
// 	var cryptoEncr = new Crypto({pubKey: params.pubKey});
// 	var dataFormat = () => {
// 		return {
// 			type: 'proposal',
// 			proposal_id: params.proposalID,
// 			message: params.message,
// 			read_status: false,
// 			time: timestamp
// 		};
// 	};
        
// 	if (fs.existsSync(fileName)) {
// 		fs.readFile(fileName, (err, data) => {
// 			if(err) {
// 				res.status(400).json({"Error": "Unable to read notifications"});
// 				return;
// 			} 
// 			var notifications = JSON.parse(data.toString());
// 			notifications.messages.unshift(dataFormat());
// 			var cryptoData = cryptoEncr.encrypt(JSON.stringify(notifications));
// 			fs.writeFile(fileName, cryptoData, (err) => {
// 				if(err){
// 					res.status(400).json({"Error": "Unable to create file under " + fileName});
// 					return;
// 				}
// 				res.json({"Msg":"Notification updated successfully"});
// 			});
// 		});
// 	} else {
// 		var msg = {
// 			id: params.pubKey,//public key
// 			messages:[dataFormat()]
// 		}
// 		var cryptoData = cryptoEncr.encrypt(JSON.stringify(msg));
// 		fs.writeFile(fileName, cryptoData, (err) => {
// 			if(err){
// 				res.status(400).json({"Error": "Unable to write message in " + fileName});
// 				return;
// 			}
// 			res.json({"Msg":"Notification updated successfully"});
// 		});
// 	}
// }


// fetchExpiredProposalNotification: function(req, res){
//         var param = req.params;
//         var fileName = PATH + param.pubKey + expiredProposal_suffix + ".json";
//         var cryptoDecr = new Crypto({pubKey: param.pubKey});
//         if(param.pubKey && fs.existsSync(fileName)){
//                 fs.readFile(fileName, 'utf8', function(err, data){
//                         if(err) res.status(400).json({"Error": "Unable to read notifications"});
//                         res.json({'data': JSON.parse(cryptoDecr.decrypt(data))});
//                 });
//         } else {
//                 res.json({'data': 'Notifications unavailable'});
//         }
// }


