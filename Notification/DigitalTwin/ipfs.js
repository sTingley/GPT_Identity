var spawn = require('child_process').spawn,
	crypt = require('./cryptoCtr.js'),
	crypto = require('crypto'),
	fs = require('fs'),
	http = require('http');
	
//var tmpPath = "D:/Source/GPT_Identity-master/Notification/DigitalTwin/tmp/";
var tmpPath = "/Users/arunkumar/Node/GPT_Identity/Notification/DigitalTwin/tmp/";
//var JSONPath = "D:/Source/GPT_Identity-master/Notification/DigitalTwin/notifications/";
var JSONPath = "/Users/arunkumar/Node/GPT_Identity/Notification/DigitalTwin/notifications/";
var IPFS_baseUrl = "http://192.168.99.101:8080/ipfs/";

var suffix = "_files";


var IPFS = {
	
	documents: [],
	
	errors:[],
	
	filesLength: 0, 
	
	incr: 0,
	
	pubKey:'',
	
	uploadFile: function(req, res){
		if(!req.files){
			res.send('No files were uploaded.');
			return;
		}
		
		if(!req.body.user_pubkey){
			res.send('Public key required to upload files.');
			return;
		}
		
		if (!fs.existsSync(tmpPath)){
			fs.mkdirSync(tmpPath);
		}
		
		IPFS.pubKey = req.body.user_pubkey;
		var fileName = JSONPath + IPFS.pubKey + suffix + ".json";
		
		if (!fs.existsSync(fileName)) {
			var datastruct = {
				id:IPFS.pubKey,
				documents:[]
			};
			var cryptoEncr = new crypt({pubKey: IPFS.pubKey});
			var cryptoData = cryptoEncr.encrypt(JSON.stringify(datastruct));
			fs.writeFileSync(fileName, cryptoData, 'utf8');
		}

		var allFiles = req.files;
		var fileArr = IPFS.objIntoArray(allFiles);
		IPFS.filesLength = fileArr.length;
		for(var i=0; i<IPFS.filesLength; i++){
			if(fileArr[i]){
				var fileNode = fileArr[i];
				IPFS.moveFileToIPFS(fileNode, res, IPFS.writeData);
			}
		}
	},
	
	objIntoArray: function(allFiles){
		var newArr = new Array();
		for(var key in allFiles){
			newArr.push(allFiles[key]);
		}
		return newArr;
	},
	
	writeData: function(data, res){
		var allDocs = [];
		allDocs.push({'filename':data.filename, 'hash': data.hash, 'file_hash': data.file_hash});
		var fileName = JSONPath + IPFS.pubKey + suffix + ".json";
		var cryptDec = new crypt({pubKey: IPFS.pubKey});
		var fileContent = cryptDec.decrypt(fs.readFileSync(fileName, 'utf8'));
		var struct = JSON.parse(fileContent);
		struct.documents.unshift(data);
		fs.writeFileSync(fileName, cryptDec.encrypt(JSON.stringify(struct)));
		if(allDocs.length > 0){
			res.status(200).json({"uploded": allDocs, "failed": IPFS.errors});
			return;
		}
	},
	
	moveFileToIPFS: function(fileNode, res, callback){
		fileNode.mv(tmpPath + fileNode.name, (err) => {
			if(!err){
				const file = tmpPath + fileNode.name;
				console.log(file);
				const ipfs = spawn('eris',['files','put',file]);
				var buffer = [];
				ipfs.stdout.on('data', (data) => {
					buffer.push(data.toString());
				});
				ipfs.stderr.on('data', (data) => {
					console.log(`stderr: ${data}`);
				});
				ipfs.on('close', (code) => {
					if(code > 0){
						IPFS.erros.push(fileNode.name);
					} else {
						var hash = buffer[buffer.length - 1].replace(/^\s+|\s+$/g, '');
						if(hash.length > 0){
							var ipfsCache = spawn('eris',['files','cache', hash]);
							ipfsCache.on('close', (code) => {
								IPFS.getFileHash(tmpPath + fileNode.name).then((fileHash) => {
									
									var fileData = {
										'filename': fileNode.name, 
										'hash': hash,
										'file_hash': fileHash, 
										'ipfs_url': IPFS_baseUrl + hash,
										'timestamp': Number(new Date()), 
										'fileformat': fileNode.mimetype
									};
									IPFS.incr++;
									callback.apply(this, [fileData, res]);
									fs.unlinkSync(file); // Delete the file from temp path
								});
							});
						} else {
							IPFS.erros.push(fileNode.name);
						}
					}
				});
			}
		});
	},
	
	getFileHash: function(filePath){
		var promise = new Promise((resolve, reject) => {
			var input = fs.createReadStream(filePath);
			var hash = crypto.createHash('sha256');
			hash.setEncoding('hex');
			input.on('end', () => {
				hash.end();
				resolve(hash.read());
			});
			input.pipe(hash);
		});
		return promise;
	},
	
	getAllFiles: function(req, res){
		var param = req.params;
		var fileName = JSONPath + param.pubKey + suffix + ".json";
		var cryptoDecr = new crypt({pubKey: param.pubKey});
		if(param.pubKey && fs.existsSync(fileName)){
			fs.readFile(fileName, 'utf8', function(err, data){
				if(err) res.status(400).json({"Error": "Unable to read IPFS files"});
				res.json({'data': JSON.parse(cryptoDecr.decrypt(data))});
			});
		} else {
			res.json({'data': 'Unable to read IPFS files'});
		}
	},
	
	getUrl: function(hash){
		return IPFS_baseUrl + hash;
	}
}

module.exports = IPFS;