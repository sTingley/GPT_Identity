var fs = require ('fs');
var Crypto = require('./cryptoCtr.js');

var PATH = "D:/Source/GPT_Identity-master/Notification/DigitalTwin/notifications/";
var expiredProposal_suffix =  "_expiredProposal";

var expiredNotification = {

	// Just write notification 
	writeExpiredProposalNotification: function(req, res){
		
		var params = req.body;
		if(!params.pubKey) res.status(400).json({"Error": "Invalid input parameters"});
		var fileName = PATH + params.pubKey + expiredProposal_suffix + ".json";
		var timestamp = Number(new Date()); 
		var cryptoEncr = new Crypto({pubKey: params.pubKey});
		var dataFormat = () => {
			return {
				type: 'proposal',
				proposal_id: params.proposalID,
				message: params.message,
				read_status: false,
				time: timestamp
			};
		};
		
		if (fs.existsSync(fileName)) {
			fs.readFile(fileName, (err, data) => {
				if(err) {
					res.status(400).json({"Error": "Unable to read notifications"});
					return;
				} 
				var notifications = JSON.parse(data.toString());
				notifications.messages.unshift(dataFormat());
				var cryptoData = cryptoEncr.encrypt(JSON.stringify(notifications));
				fs.writeFile(fileName, cryptoData, (err) => {
					if(err){
						res.status(400).json({"Error": "Unable to create file under " + fileName});
						return;
					}
					res.json({"Msg":"Notification updated successfully"});
				});
			});
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
	
	fetchExpiredProposalNotification: function(req, res){
		var param = req.params;
		var fileName = PATH + param.pubKey + expiredProposal_suffix + ".json";
		var cryptoDecr = new Crypto({pubKey: param.pubKey});
		if(param.pubKey && fs.existsSync(fileName)){
			fs.readFile(fileName, 'utf8', function(err, data){
				if(err) res.status(400).json({"Error": "Unable to read notifications"});
				res.json({'data': JSON.parse(cryptoDecr.decrypt(data))});
			});
		} else {
			res.json({'data': 'Notifications unavailable'});
		}
	}
	
}
module.exports = expiredNotification;