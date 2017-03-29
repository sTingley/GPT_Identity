'use strict';
var spawn = require('child_process').spawn,
	config = require('./TwinConfig.json'),
	cryptoCtr = require('./cryptoCtr.js'),
	crypto = require('crypto'),
	fs = require('fs'),
	http = require('http');

//DigitalTwin/tmp
var tmpPath = config.IPFS_CONFIG.ipfs_file_tmp_path;

//"/home/demoadmin/DigitalTwin/notifications/"
var JSONPath = config.notification_folder_path;

//for eris service it was "ipfs_file_read_url": "http://192.168.99.101:8080/ipfs/",
// ...
//now it is "ipfs_file_read_url": "http://10.100.98.218:8080/"
var IPFS_baseUrl = config.IPFS_CONFIG.ipfs_file_read_url;

var suffix = config.suffix.ipfs_file;

var IPFS = {

	documents: [],

	errors: [],

	filesLength: 0,

	incr: 0,

	pubKey: '',

	/*******************************************************************************************
	UPLOAD FILE:
		0) method is called with formdata including pubkey and files
		1) if the 'tmpPath' directoy doesn't exist, create it
		2) create fileName var, = JSONpath + pubkey + _files + .json
		3) if the $pubkey_files.json file doesnt exist, create it
		4) encrypt the data, then write the file (fs.writeFileSync)
		5) moveFileToIPFS method is called with callback (cb = IPFS.writeData)
		6) Inside moveFileToIPFS,
			- call fileNode.mv to move file from /tmp
			- spawn child process 1, ipfs = spawn('ipfs', ['add', file]);
				- ipfs.onClose, spawn child process 2, ipfs_cache = spawn('ipfs', ['pin', 'add', hash])
					- ipfs_cache.onClose will call getFileHash method (opens the file as a readable stream),
					- if successful then callback.apply,
					- if successful then fs.unlinkSync(file)
		6) when moveFileToIPFS method finishes, its callback IPFS.writeData is called

		Finally this method will return res -> Digital Twin -> Browser wallet
	******************************************************************************************/
	uploadFile: function (req, res) {

		console.log("uploadFile rq.body: " + JSON.stringify(req.body))
		//console.log("rq.files: " + JSON.stringify(req.files))
		//for (var key in req) {console.log("*" + key)}

		if (!req.files) {
			res.send('No files were uploaded.');
			return;
		}
		if (!req.body.user_pubkey) {
			res.send('Public key required to upload files.');
			return;
		}
		//checks that that tmpPath exists
		if (!fs.existsSync(tmpPath)) {
			//if it doesnt exist make the directory
			fs.mkdirSync(tmpPath);
		}

		IPFS.pubKey = req.body.user_pubkey;

		//This file will be an object of the form {"id": "","documents": []}
		var fileName = JSONPath + IPFS.pubKey + suffix + ".json";
		//check to see that $HOME/demoadmin/DigitalTwin/notifications/$pubkey_files.json exists
		if (!fs.existsSync(fileName)) {
			console.log("we are creating the file: " + fileName)
			var datastruct = {
				id: IPFS.pubKey,
				documents: []
			};

			//ST: added this to check the writeFileSync method
			// var check_file_data = fs.writeFileSync(fileName, JSON.stringify(datastruct), 'utf8', function(err) {
			// 	if(err) {
			// 		console.log("failed. file_data: " + check_file_data)
			// 	}
			// 	else console.log("all good. file_data: " + check_file_data)
			// })
			// console.log("check_file_data: " + check_file_data)

			//declaring a new reference, cryptoCtr, to use encryption methods in required file
			var cryptoEncr = new cryptoCtr({ pubKey: IPFS.pubKey });
			var cryptoData = cryptoEncr.encrypt(JSON.stringify(datastruct));
			//fs.writeFileSync(file, data[, options])
			fs.writeFileSync(fileName, cryptoData, 'utf8');
		}

		var allFiles = req.files;
		var fileArr = IPFS.objIntoArray(allFiles);
		IPFS.filesLength = fileArr.length;
		console.log(" 1a. IPFS.filesLength: " + IPFS.filesLength)
		for (var i = 0; i < IPFS.filesLength; i++) {
			if (fileArr[i]) {
				var fileNode = fileArr[i];
				//fileNode = req.files
				IPFS.moveFileToIPFS(fileNode, res, IPFS.writeData);
			}
		}
	},

	objIntoArray: function (allFiles) {
		var newArr = new Array();
		for (var key in allFiles) {
			newArr.push(allFiles[key]);
		}
		return newArr;
	},

	//this method is called inside writeData to inspect the _files.json file in the DT
	//Confirmed is returning correctly
	//allData is the parsed filecontent and data comes from the IPFS.writeData cb in IPFS.moveFileToIPFS, so it is passed as input
	checkIsExists: function (allData, data) {
		const docs = allData.documents;
		console.log("docs: " + JSON.stringify(docs) + "\n length: " + docs.length)
		if (docs.length > 0) {
			for (var i = 0; i < docs.length; i++) {
				let doc = docs[i];
				if (doc.hash == data.hash) {
					console.log("checkIsExists f'n: found match in docs at index " + i)
					return i;
					//break;
				}
			}
		}
		return -1;
	},

	/******************************************************************************************
	WRITEDATA:
		0) push data object into an array
		1) get the fileName, $pubkey_files.json
		2) decrypt the file with the pubkey
		3) check the .json file docs.hash matches data.hash (input)
		4) when we find the proper index in _files.json, write the file
		5) METHOD WILL RETURN RES -> moveFileToIPFS (the caller)
	******************************************************************************************/
	writeData: function (data, res) {
		console.log("inside writeData")
		var allDocs = [];
		allDocs.push({ 'filename': data.filename, 'hash': data.hash, 'file_hash': data.file_hash });
		var fileName = JSONPath + IPFS.pubKey + suffix + ".json";
		var cryptDec = new cryptoCtr({ pubKey: IPFS.pubKey });
		var fileContent = cryptDec.decrypt(fs.readFileSync(fileName, 'utf8'));
		var struct = JSON.parse(fileContent)
		//STRUCT WILL HAVE THE CONTENT in _files.json
		console.log("filecontent inside " + fileName + ": " + JSON.stringify(struct))
		var index = IPFS.checkIsExists(struct, data);

		if (index > -1) {
			struct.documents[index] = data;
		} else {
			console.log("unshift: " + struct.documents)
			//unshift add one or more elements to the beginning of an array and returns the new length
			struct.documents.unshift(data);
		}

		//write the encrypted data to /home/demoadmin/DigitalTwin/notifications/$pubkey_files.json 
		console.log("we will be writing to " + fileName)
		fs.writeFileSync(fileName, cryptDec.encrypt(JSON.stringify(struct)));
		console.log()
		if (allDocs.length > 0) {
			console.log("sent response back to wallet")
			//this response can be seen in the browser network console
			res.status(200).json({ "uploded": allDocs, "failed": IPFS.errors });
			return;
		}
	},

	/******************************************************************************************
	MoveFileToIPFS:
		In this method we are working with instances of the NodeJS ChildProcess class.
		Instances of the class are EventEmitters that represent spawned child processes.
			-In our method we have 2 child processes: ipfs and ipfs_cache
			-ipfsCache instance (process 2) is started by the close event of ipfs (process 1)

		Method will return RES -> uploadFile -> Browser/Wallet
	******************************************************************************************/
	moveFileToIPFS: function (fileNode, res, callback) {
		console.log("hit moveFileToIPFS")
		fileNode.mv(tmpPath + fileNode.name, (err) => {
			console.log("inside mv arrow function")
			if (!err) {
				const file = tmpPath + fileNode.name;
				console.log("Our file, (tmpPath+fileNode.name): " + file)
				//changed from ('eris',['files','put'file])

				//child_process.spawn(command[, args][, options]) returns ChildProcess
				const ipfs = spawn('ipfs', ['add', file]);
				//we are going to write to a buffer
				var buffer = [];
				//A Readable Stream that represents the child process's stdout (child.stdout)
				ipfs.stdout.on('data', (data) => {
					var splice = data.toString().split(" ")
					buffer.push(splice[1]);
					console.log("pushed stdout to buffer. buffer= " + buffer)
				});
				//A Readable Stream that represents the child process's stderr. (child.strerr)
				ipfs.stderr.on('data', (data) => {
					console.log(`stderr: ${data}`);
					//fs.unlinkSync(file);
				});
				ipfs.on('close', (code) => {
					console.log("close event childprocess1 (ipfs)")
					//event:'close' - code is the exit code if the child is exited on its own
					if (code > 0) {
						IPFS.errors.push(fileNode.name);
					} else {
						/* REGEX: this expression is removing whitespace on either end
							^: beginning of string, \s: whitespace	*/
						var hash = buffer[buffer.length - 1].replace(/^\s+|\s+$/g, '');
						if (hash.length > 0) {
							//var ipfsCache = spawn('ipfs', ['files', 'cache', hash]);
							var ipfsCache = spawn('ipfs', ['pin', 'add', hash])
							ipfsCache.on('close', (code) => {
								console.log("close event childprocess 2 (ipfs_cache)")

								IPFS.getFileHash(tmpPath + fileNode.name).then((fileHash) => {
									console.log("\n**filehash: " + fileHash)
									var fileData = {
										'filename': fileNode.name,
										'hash': hash,
										'file_hash': fileHash,
										'ipfs_url': IPFS_baseUrl + hash,
										'timestamp': Number(new Date()),
										'fileformat': fileNode.mimetype
									};
									console.log("getFileHash return: " + JSON.stringify(fileData))
									IPFS.incr++;
									//apply() method calls a function with a given this value and arguments provided as an array
									callback.apply(this, [fileData, res], function(err){
										if(err){console.log("callback.apply error: " + err)}
									});
									fs.unlinkSync(file); // Delete the file from temp path
								});

							}); //end close event of ipfsCache childProcess
						} else {
							IPFS.errors.push(fileNode.name);
						}
					}
				}); //end of close event of ipfs childProcess

			}//end !err
		}); //end of fileNode.mv
	},

	//*****************************************************************************************
	// THIS METHOD IS COMMENTED OUT BC WE HAVENT INTEGRATED IT YET,
	// NEEDS TO BE CALLED WHENEVER WE NEED TO VALIDATE FILES
	//*****************************************************************************************
	//called from DT endpoint /ipfs/validateFiles
	getHashFromIpfsFile(req, res) {
		// var param = req.body;
		// console.log("getHashFromIPFSFile req.body: " + req.body)
		// var file_hash = param.file_hash.split(",");
		// var ipfs_hash = param.ipfs_hash.split(",");
		// var final_result = [];
		// if (file_hash > 0 && ipfs_hash > 0) {
		// 	for (var i = 0; i < ipfs_hash.length; i++) {
		// 		var hash = ipfs_hash[i];
		// 		//const ipfs = spawn('eris', ['files', 'get', hash, tmpPath + "ipfs_hash"]);
		// 		const ipfs = spawn('ipfs', ['get', hash, tmpPath + "ipfs_hash"])
		// 		ipfs.on('close', (code) => {
		// 			IPFS.getFileHash(tmpPath + "ipfs_hash").then((data) => {
		// 				fs.unlinkSync(tmpPath + "ipfs_hash");
		// 				if (data != file_hash[i]) {
		// 					final_result.push(false);
		// 				} else final_result.push(true);
		// 			});
		// 		});
		// 	}
		// 	if (final_result.indexOf(false)) { res.send("false"); } else { res.send("true"); }
		// } else res.send("false");
	},

	/*****************************************************************************************
	Called inside of moveFileToIPFS and getHashFromIpfsFile
	/****************************************************************************************/
	getFileHash: function (filePath) {
		var promise = new Promise((resolve, reject) => {
			//this line opens the file as a readable stream
			var input = fs.createReadStream(filePath,[]);
			var hash = crypto.createHash('sha256');
			console.log("sha256 hash: " + JSON.stringify(hash))
			console.log("getFileHash, filePath: " + filePath)
			hash.setEncoding('hex');
			//changed from end
			input.on('end', () => {
				console.log("readStream on end")
				hash.end(function(err) {
					if (err) { //ST: Added callback for debugging
						console.log("hash.end error: " + err)
					}
				});
				resolve(hash.read(function(err){
					if(err){console.log("err: " + err)}
				}));
			});
			//This pipes the ReadStream to the response object (which goes to the client or caller)
			input.pipe(hash);
		});
		return promise;
	},

	/******************************************************************************************
	 * The componentDidMount() method in the uploadIpfsFile class (wallet) will fire this AJAX rq
	 * DT route: /ipfs/alldocs/:pubkey
	/*****************************************************************************************/
	getAllFiles: function (req, res) {
		console.log("hit getAllFiles, params: " + req.params)
		var param = req.params;
		var fileName = JSONPath + param.pubKey + suffix + ".json";
		var cryptoDecr = new cryptoCtr({ pubKey: param.pubKey });
		if (param.pubKey && fs.existsSync(fileName)) {
			fs.readFile(fileName, 'utf8', function (err, data) {
				if (err) res.status(400).json({ "Error": "Unable to read IPFS files" });
				res.json({ 'data': JSON.parse(cryptoDecr.decrypt(data)) });
			});
		} else {
			res.json({ 'data': 'Unable to read IPFS files' });
		}
	},

	/*****************************************************************************************
	 * DT route: /ipfs/getfile/:hash'
	/****************************************************************************************/
	getUrl: function (hash) {
		return IPFS_baseUrl + hash;
	}


}//end IPFS object

module.exports = IPFS;
