var spawn = require('child_process').spawn,
	crypt = require('./cryptoCtr.js'),
	crypto = require('crypto'),
	fs = require('fs'),
	config = require('./config.json'),
	http = require('http');
	

var tmpPath = config.env.ipfs_file_tmp_path;
var JSONPath = config.env.notification_folder_path;
var IPFS_baseUrl = config.env.ipfs_file_read_url;
var suffix = config.suffix.ipfs_file;

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
	
	checkIsExists: function(allData, data){
		const docs = allData.documents;
		if(docs.length > 0){
			for(var i=0; i<docs.length; i++){
				let doc = docs[i];
				if(doc.hash == data.hash){
					return i;
					break;
				}
			}
		}
		return -1;
	},
	
	writeData: function(data, res){
		var allDocs = [];
		allDocs.push({'filename':data.filename, 'hash': data.hash, 'file_hash': data.file_hash});
		var fileName = JSONPath + IPFS.pubKey + suffix + ".json";
		var cryptDec = new crypt({pubKey: IPFS.pubKey});
		var fileContent = cryptDec.decrypt(fs.readFileSync(fileName, 'utf8'));
		var struct = JSON.parse(fileContent),
			index = IPFS.checkIsExists(struct, data);
		if(index > -1){
			struct.documents[index] = data;
		} else {
			struct.documents.unshift(data);
		}
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
				const ipfs = spawn('eris',['files','put',file]);
				var buffer = [];
				ipfs.stdout.on('data', (data) => {
					buffer.push(data.toString());
				});
				ipfs.stderr.on('data', (data) => {
					console.log(`stderr: ${data}`);
					fs.unlinkSync(file); // Delete the file from temp path
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

	getHashFromIpfsFile(req, res) {
		var param = req.body;
		var file_hash = param.file_hash.split(",");
		var ipfs_hash = param.ipfs_hash.split(",");
		var final_result = [];
		if(file_hash > 0 && ipfs_hash > 0){
			for(var i=0; i<ipfs_hash.length; i++){
				var hash = ipfs_hash[i];
				const ipfs = spawn('eris',['files','get', hash, tmpPath+"ipfs_hash"]);
				ipfs.on('close', (code) => {
					IPFS.getFileHash(tmpPath+"ipfs_hash").then((data) => {
						fs.unlinkSync(tmpPath+"ipfs_hash");
						if(data != file_hash[i]){
							final_result.push(false);
						} else final_result.push(true);
					});
				});
			}
			if(final_result.indexOf(false)){ res.send("false"); } else { res.send("true"); }
		} else res.send("false");
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
