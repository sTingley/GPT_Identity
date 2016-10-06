var fs = require ('fs');
var Crypto = require('./cryptoCtr.js'),
	config = require('./config.json');

var PATH = config.env.notification_folder_path;
var notify_suffix = config.suffix.notifications_file;
var coid_suffix = config.suffix.coid_file;

var ballotCtrl = {

	// Just write notification 
	writeNotification: function(req, res){
		
		var params = req.body;
		if(!params.pubKey) res.status(400).json({"Error": "Invalid input parameters"});
		var fileName = PATH + params.pubKey + notify_suffix + ".json";
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
			var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
			var fileContent = JSON.parse(fileContent);
			fileContent.messages.unshift(dataFormat());
			fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
			res.json({"Msg":"Notification updated successfully"});
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
	
	fetchNotification: function(req, res){
		var param = req.params;
		var fileName = PATH + param.pubKey + notify_suffix + ".json";
		var cryptoDecr = new Crypto({pubKey: param.pubKey});
		if(param.pubKey && fs.existsSync(fileName)){
			fs.readFile(fileName, 'utf8', function(err, data){
				if(err) res.status(400).json({"Error": "Unable to read notifications"});
				res.json({'data': JSON.parse(cryptoDecr.decrypt(data))});
			});
		} else {
			res.json({'data': 'Notifications unavailable'});
		}
	},
	
	writeCoidData: function(req, res) {
		var params = req.body;
		if(!params.pubKey || !params.proposalID){
			res.status(400).json({"Error": "Invalid input parameters"});
			return;
		} 
		var fileName = PATH + params.pubKey + coid_suffix + ".json";
		var timestamp = Number(new Date());
		var cryptoEncr = new Crypto({pubKey: params.pubKey});
		var dataFormat = () => {
			return {
				proposalID: params.proposalID,
				vote_state: false,
				time: timestamp,
				coid: JSON.parse(params.coid)
			}
		};
		
		if (fs.existsSync(fileName)) {
			var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
			var fileContent = JSON.parse(fileContent);
			fileContent.data.unshift(dataFormat());
			fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
		} else {
			var msg = {
				id: params.pubKey,//public key
				data:[dataFormat()]
			}
			var cryptoData = cryptoEncr.encrypt(JSON.stringify(msg));
			fs.writeFile(fileName, cryptoData, (err) => {
				if(err){
					res.status(400).json({"Error": "Unable to write message in " + fileName});
				}
				res.json({"Msg":"Proposal updated successfully" });
			});
		}
		
	},
	
	fetchCoidData: function(req, res){
		var param = req.params;
		var fileName = PATH + param.pubKey + coid_suffix + ".json";
		if(param.pubKey && fs.existsSync(fileName)){
			var cryptoDecr = new Crypto({pubKey: param.pubKey});
			fs.readFile(fileName, 'utf8', function(err, data){
				if(err) res.status(400).json({"Error": "Unable to read notifications"});
				res.json({'data': JSON.parse(cryptoDecr.decrypt(data))});
			});
		} else {
			res.json({'data': 'Notifications unavailable'});
		}
	}
}
module.exports = ballotCtrl;