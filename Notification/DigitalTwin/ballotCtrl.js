var fs = require ('fs');

// var PATH = "/Users/arunkumar/GPT_Identity/Notification/DigitalTwin/notifications/";

var PATH = "D:/Source/GPT_Identity-master/Notification/DigitalTwin/notifications/";

var notify_suffix =  "_notify";

var coid_suffix =  "_coid";

var ballotCtrl = {

	// Just write notification 
	writeNotification: function(req, res){
		
		var params = req.body;
		if(!params.pubKey) res.status(400).json({"Error": "Invalid input parameters"});
		var fileName = PATH + params.pubKey + notify_suffix + ".json";
		var timestamp = Number(new Date()); 
		
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
				if(err) res.status(400).json({"Error": "Unable to read notifications"});
				var notifications = JSON.parse(data.toString());
				notifications.messages.unshift(dataFormat());
				fs.writeFile(fileName, JSON.stringify(notifications), (err) => {
					if(err){
						res.status(400).json({"Error": "Unable to create file under " + fileName});
					}
					res.json({"Msg":"Notification updated successfully"});
				});
			});
		} else {
			var msg = {
				id: params.pubKey,//public key
				messages:[dataFormat()]
			}
			fs.writeFile(fileName, JSON.stringify(msg), (err) => {
				if(err){
					res.status(400).json({"Error": "Unable to write message in " + fileName});
				}
				res.json({"Msg":"Notification updated successfully"});
			});
		}
	},
	
	fetchNotification: function(req, res){
		var param = req.params;
		var fileName = PATH + param.pubKey + notify_suffix + ".json";
		if(param.pubKey && fs.existsSync(fileName)){
			fs.readFile(fileName, 'utf8', function(err, data){
				if(err) res.status(400).json({"Error": "Unable to read notifications"});
				res.json({'data': JSON.parse(data)});
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
		
		var dataFormat = () => {
			return {
				proposalID: params.proposalID,
				vote_state: false,
				time: timestamp,
				coid: JSON.parse(params.coid)
			}
		};
		
		if (fs.existsSync(fileName)) {
			fs.readFile(fileName, (err, data) => {
				if(err) res.status(400).json({"Error": "Unable to read notifications"});
				var notifications = JSON.parse(data.toString());
				notifications.data.unshift(dataFormat());
				fs.writeFile(fileName, JSON.stringify(notifications), (err) => {
					if(err){
						res.status(400).json({"Error": "Unable to create file under " + fileName});
					}
					res.json({"Msg":"Proposal updated successfully"});
				});
			});
		} else {
			var msg = {
				id: params.pubKey,//public key
				data:[dataFormat()]
			}
			fs.writeFile(fileName, JSON.stringify(msg), (err) => {
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
			fs.readFile(fileName, 'utf8', function(err, data){
				if(err) res.status(400).json({"Error": "Unable to read notifications"});
				res.json({'data': JSON.parse(data)});
			});
		} else {
			res.json({'data': 'Notifications unavailable'});
		}
	}
}
module.exports = ballotCtrl;