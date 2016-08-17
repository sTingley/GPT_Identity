var fs = require ('fs');

var ballotCtrl = {
	
	// notification COID data JSON file path
	PATH: "/Users/arunkumar/GPT_Identity/Notification/DigitalTwin/notifications/",
	
	saveNotification: function(req, res) {

		var params = req.body;
		if(!params.pubKey) return false;

		var folderpath = this.PATH;
		var filename = folderpath + params.pubKey + ".json";
		var error = false;
		
		var timestamp = Number(new Date()); 
		var _this = this;
		if (fs.existsSync(filename)) {
			fs.readFile(filename, function(err, data){
				if(err) error = true;
				var notifications = JSON.parse(data.toString());
				var msg = {
					msg: saveMsg.proposal,
					read_status: false,
					time: timestamp
				}
				notifications.messages.unshift(msg);
				fs.writeFile(filename, JSON.stringify(notifications), callback);
			});
		} 
		else {
			var message = {
				id: pubKey,
				messages: [{
					msg: saveMsg.proposal,
					read_status: false,
					time: timestamp
				}]
			};
			fs.writeFile(filename, JSON.stringify(message),callback);
		}
	},

	FetchCoidData: function(req, res){
		var returnMsg = "{}";
		var param = req.params;
		var filename = this.PATH + param.pubKey + ".json";
		var _this = this;
		if(pubKey && fs.existsSync(filename)){
			fs.readFile(filename, function(err, data){
				_this.writeResponse(data.toString(), res);
			});
		}
		else {
			_this.writeResponse(returnMsg, res);
		}
	}
}
module.exports = ballotCtrl;

