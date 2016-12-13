var fs = require('fs');
var Crypto = require('./cryptoCtr.js'),
	keccak_256 = require('js-sha3').keccak_256,
	config = require('./config.json');

var PATH = config.env.notification_folder_path;
var notify_suffix = config.suffix.notifications_file;
var coid_suffix = config.suffix.coid_file;

var ballotCtrl = {

	coidGKCreation: function (req, res) {

		console.log("hi");
		var params = req.body;

		var pubKey = params.pubKey;
		var txnID = params.txnID;
		var txnHash = params.txnHash;
		var gkAddr = params.gkAddr;
		var coidAddr = params.coidAddr;

		console.log("txn id: " + txnID)
		console.log("gkAddr: " + gkAddr)
		console.log("coidAddr: " + coidAddr)

		var notify_suffix = "_coid";
		var PATH = "/home/demoadmin/DigitalTwin/notifications/";

		var timestamp = Number(new Date());
		var cryptoEncr = new Crypto({ pubKey: params.pubKey });


		var fileName = PATH + keccak_256(pubKey).toUpperCase() + "_myGK" + ".json";

		if (fs.existsSync(fileName)) {
			console.log("Inside: " + fileName)
			console.log("...." + fs.readFileSync(fileName, 'utf8'))
			fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
			console.log("file content is: " + fileContent)
			console.log(fileContent)

			fileContent = JSON.parse(fileContent);

			fileContent.coidAddr = coidAddr;
			fileContent.gatekeeperAddr = gkAddr;
			fileContent.bigchainHash = txnHash;
			fileContent.bigchainID = txnID;


			console.log("To be wrriten: " + JSON.stringify(fileContent))
			fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
		}
		else {
			console.log(PATH + "...doesn't exist!")
		}
	},

	//comes from idf_gatekeeper (gatekeeper_v7.js)
	coidCreation: function (req, res) {

		console.log("hi");
		var params = req.body;

		var pubKey = params.pubKey;
		var txnID = params.txnID;
		var txnHash = params.txnHash;
		var gkAddr = params.gkAddr;
		var coidAddr = params.coidAddr;

		console.log("txn id: " + txnID)
		console.log("gkAddr: " + gkAddr)
		console.log("coidAddr: " + coidAddr)

		var notify_suffix = "_coid";
		var PATH = "/home/demoadmin/DigitalTwin/notifications/";

		var timestamp = Number(new Date());
		var cryptoEncr = new Crypto({ pubKey: params.pubKey });

		var fileName = PATH + keccak_256(pubKey).toUpperCase() + notify_suffix + ".json";

		if (fs.existsSync(fileName)) {
			console.log("Inside: " + fileName)
			console.log("...." + fs.readFileSync(fileName, 'utf8'))
			fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
			console.log("file content is: " + fileContent)

			fileContent = JSON.parse(fileContent);

			fileContent.coidAddr = coidAddr;
			fileContent.gatekeeperAddr = gkAddr;
			fileContent.bigchainHash = txnHash;
			fileContent.bigchainID = txnID;

			console.log("To be wrriten: " + JSON.stringify(fileContent))
			fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
		}
		else {
			console.log(PATH + "...doesn't exist!")
		}
	},



	// Just write notification (right after writes into bigchain)
	// In index.js, url is '/ballot/writeNotify'
	writeNotification: function (req, res) {
		console.log("you have reached writeNotification");
		var params = req.body;
		console.log("request body: " + JSON.stringify(params));
		console.log("")
		var message = params.message;
		console.log("Message is: " + message);
		if (!params.pubKey) res.status(400).json({ "Error": "Invalid input parameters" });
		var fileName = PATH + params.pubKey.toUpperCase() + notify_suffix + ".json";
		var timestamp = Number(new Date());
		var cryptoEncr = new Crypto({ pubKey: params.pubKey });
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
			setTimeout(function () {
				console.log("dataFormat");
				console.log(dataFormat());
				var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
				var fileContent = JSON.parse(fileContent);
				fileContent.messages.unshift(dataFormat());
				fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
				res.json({ "Msg": "Notification updated successfully" });
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
				res.json({ "Msg": "Notification updated successfully" });
			});
		}
	},

	deleteNotification: function (req, res) {
		var pid = req.params.pid,
			pubKey = req.params.pubKey;
		if (pid && pubKey) {
			var fileName = PATH + keccak_256(pubKey).toUpperCase() + notify_suffix + ".json";
			var cryptoDecr = new Crypto({ pubKey: keccak_256(pubKey).toUpperCase() });
			if (fs.existsSync(fileName)) {
				fs.readFile(fileName, 'utf8', function (err, data) {
					var allNotifications = JSON.parse(cryptoDecr.decrypt(data)),
						msgs = allNotifications.messages;
					for (var i = 0; i < msgs.length; i++) {
						var msg = msgs[i];
						if (msg.proposal_id == pid) {
							msgs.splice(i, 1);
							fs.writeFileSync(fileName, cryptoDecr.encrypt(JSON.stringify(allNotifications)));
							break;
						}
					}
					res.send("successfully deleted");
				});
			}
		}
	},

	// Called by index.js when user logs in (upload.jsx) and also when user clicks vote tab (ToVote.jsx)
	// In index.js, the url is '/ballot/readNotify/:pubKey'
	fetchNotification: function (req, res) {
		var param = req.params;
		console.log('pubKey: ' + param.pubKey)
		console.log('hash of pubkey: ' + keccak_256(param.pubKey).toUpperCase())
		var fileName = PATH + keccak_256(param.pubKey).toUpperCase() + notify_suffix + ".json";
		var cryptoDecr = new Crypto({ pubKey: keccak_256(param.pubKey).toUpperCase() });
		if (param.pubKey && fs.existsSync(fileName)) {
			console.log('inside if condition (file exists)')

			fs.readFile(fileName, 'utf8', function (err, data) {
				if (err) res.status(400).json({ "Error": "Unable to read notifications" });
				console.log(JSON.parse(cryptoDecr.decrypt(data)))
				res.json({ 'data': JSON.parse(cryptoDecr.decrypt(data)) });
			});
		} else {
			res.json({ 'data': 'Notifications unavailable' });
		}
	},


	//INPUT
	//list of keys to update (updateKeys)
	//list of values to be updated
	//format for update {keys: [] , values:[] , flag: 1 }
	//if exists and flag = 0, is for rewrite

	writeCoidData: function (req, res) {
		console.log("inside writeCoidData")

		var params = req.body;
		var flag = req.body.flag;

		var fileName = PATH + keccak_256(params.pubKey).toUpperCase() + coid_suffix + ".json";
		console.log(fileName)
		var timestamp = Number(new Date());
		var cryptoEncr = new Crypto({ pubKey: params.pubKey });

		console.log("params: ")
		console.log(params)

		//TODO: Test Update functionality
		//TODO: coidCreation can just call as an update
		if (fs.existsSync(fileName) && flag == 1) {

			//file exists, so this is an update
			var keys = params.keys;
			var values = params.values;

			console.log(fs.existsSync(fileName))

			var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
			fileContent = JSON.parse(fileContent);

			//console.log("Testing, File Pulled up: " + JSON.stringify(fileContent));

			for (var i = 0; i < keys.length; i++) {
				var name = keys[i];
				var val = values[i];

				fileContent[name] = val;
			}


			fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
		} else {

			var msg = params; //json input
			var cryptoData = cryptoEncr.encrypt(JSON.stringify(msg));
			fs.writeFile(fileName, cryptoData, (err) => {
				if (err) {
					res.status(400).json({ "Error": "Unable to write message in " + fileName });
				}
				res.json({ "Msg": "Proposal updated successfully" });
			});
		}

	},


	writeCoidData_myGK: function (req, res) {
		console.log("inside writeCoidData")

		var params = req.body;
		var flag = req.body.flag;

		var fileName = PATH + keccak_256(params.pubKey).toUpperCase() + "_myGK" + ".json";
		console.log(fileName)
		var timestamp = Number(new Date());
		var cryptoEncr = new Crypto({ pubKey: params.pubKey });

		console.log("params: ")
		console.log(params)

		//TODO: Test Update functionality
		//TODO: coidCreation can just call as an update
		if (fs.existsSync(fileName) && flag == 1) {

			//file exists, so this is an update
			var keys = params.keys;
			var values = params.values;

			console.log(fs.existsSync(fileName))

			var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
			fileContent = JSON.parse(fileContent);

			console.log("Testing, File Pulled up: " + JSON.stringify(fileContent));

			for (var i = 0; i < keys.length; i++) {
				var name = keys[i];
				var val = values[i];

				fileContent[name] = val;
			}


			fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
		} else {

			var msg = params; //json input
			var cryptoData = cryptoEncr.encrypt(JSON.stringify(msg));
			fs.writeFile(fileName, cryptoData, (err) => {
				if (err) {
					res.status(400).json({ "Error": "Unable to write message in " + fileName });
				}
				res.json({ "Msg": "Proposal updated successfully" });
			});
		}

	},


	//request format: {pubKey: , }
	pullCoidData: function (req, res) {
		console.log("inside pullCoidData")

		var pubKey = req.body.pubKey;
		console.log(pubKey)


		var fileName = PATH + keccak_256(pubKey).toUpperCase() + coid_suffix + ".json";

		var cryptoEncr = new Crypto({ pubKey: pubKey });

		if (fs.existsSync(fileName)) {
			console.log("File exists")
			console.log(fs.existsSync(fileName))
			var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
			fileContent = JSON.parse(fileContent)

			res.json(fileContent)

		} else {
			res.json({ "Msg": "No COID Data for this public key." })
		}

	},

	fetchCoidData: function (req, res) {
		var param = req.params;
		var fileName = PATH + keccak_256(param.pubKey).toUpperCase() + coid_suffix + ".json";
		if (param.pubKey && fs.existsSync(fileName)) {
			var cryptoDecr = new Crypto({ pubKey: param.pubKey });
			fs.readFile(fileName, 'utf8', function (err, data) {
				if (err) res.status(400).json({ "Error": "Unable to read notifications" });
				res.json({ 'data': JSON.parse(cryptoDecr.decrypt(data)) });
			});
		} else {
			res.json({ 'data': 'Notifications unavailable' });
		}
	}
} //end ballotCtrl
module.exports = ballotCtrl;

