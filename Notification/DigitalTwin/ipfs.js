var spawn = require('child_process').spawn,
	Crypto = require('./cryptoCtr.js'),
	fs = require('fs'),
	http = require('http');
	
//var tmpPath = "D:/Source/GPT_Identity-master/Notification/DigitalTwin/tmp/";
var tmpPath = "/Users/arunkumar/Node/GPT_Identity/Notification/DigitalTwin/tmp/";
//var JSONPath = "D:/Source/GPT_Identity-master/Notification/DigitalTwin/notifications/";
var JSONPath = "/Users/arunkumar/Node/GPT_Identity/Notification/DigitalTwin/notifications/";
var IPFS_baseUrl = "http://192.168.99.101:8080/ipfs/";

var suffix = "_files";

// TODO : If the hash already exists in json that has to updated instead of new entry
function updateJSON(pubKey, fileData, res){
	var fileName = JSONPath + pubKey + suffix + ".json";
	var cryptoEncr = new Crypto({pubKey: pubKey});
	
	if (fs.existsSync(fileName)) {
		fs.readFile(fileName, (err, data) => {
			if(err) {
				res.status(400).json({"Error": "Unable to write JSON"});
				return;
			} 
			var decryptData = cryptoEncr.decrypt(data.toString());
			var allDocs = JSON.parse(decryptData);
			allDocs.documents.unshift(fileData);
			var cryptoData = cryptoEncr.encrypt(JSON.stringify(allDocs));
			fs.writeFile(fileName, cryptoData, (err) => {
				if(err){
					res.status(400).json({"Error": "Unable to create file under " + fileName});
					return;
				}
				res.json({"Msg":"Ok", "hash": fileData.hash });
			});
		});
	} else {
		var msg = {
			id: pubKey,//public key
			documents:[fileData]
		}
		var cryptoData = cryptoEncr.encrypt(JSON.stringify(msg));
		fs.writeFile(fileName, cryptoData, (err) => {
			if(err){
				res.status(400).json({"Error": "Unable to write message in " + fileName});
				return;
			}
			res.json({"Msg":"Ok", "hash": fileData.hash });
		});
	}
}

exports.uploadFile = function(req, res){
	var uploadedFile;
	if (!req.files) {
        res.send('No files were uploaded.');
        return;
    }
	uploadedFile = req.files.documents;
	var file = tmpPath + uploadedFile.name;
	uploadedFile.mv(file, function(err) {
        if (err) {
            res.status(500).send(err);
        }
        else {
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
					res.status(400).json({"Error": "Uploading File "+ uploadedFile.name +". Status code "+ code});
				} else {
					var hash = buffer[buffer.length - 1].replace(/^\s+|\s+$/g, '');
					//Calling cacheFile function to cache the uploaded file
					cacheFile(hash);
					if(hash.length > 0){
						var fileData = {
							filename: uploadedFile.name, 
							hash: hash, 
							ipfs_url: IPFS_baseUrl + hash,
							timestamp: Number(new Date()), 
							fileformat: uploadedFile.mimetype 
						};
						updateJSON(req.body.user_pubkey, fileData, res);
					} else {
						res.status(400).json({"Error": "Unable to create file under " + uploadedFile.name});
					}
				}
				fs.unlinkSync(file); // Delete the file from temp path
			});
        }
    });
}

exports.getAllFiles = function(req, res){
	var param = req.params;
	var fileName = JSONPath + param.pubKey + suffix + ".json";
	var cryptoDecr = new Crypto({pubKey: param.pubKey});
	if(param.pubKey && fs.existsSync(fileName)){
		fs.readFile(fileName, 'utf8', function(err, data){
			if(err) res.status(400).json({"Error": "Unable to read IPFS files"});
			res.json({'data': JSON.parse(cryptoDecr.decrypt(data))});
		});
	} else {
		res.json({'data': 'Unable to read IPFS files'});
	}
}

exports.getFile = function(req, res){
	var param = req.params;
	var hash = param.hash;
	var pubKey = param.pubKey;
	if(!hash || !pubKey) res.status(400).json({"Error": "IPFS hash and Public Key required to download file"});
	var fileName = JSONPath + pubKey + suffix + ".json";
	var cryptoDecr = new Crypto({pubKey: param.pubKey});
	if(param.pubKey && fs.existsSync(fileName)){
		fs.readFile(fileName, 'utf8', function(err, data){
			var filesData = JSON.parse(cryptoDecr.decrypt(data));
			var files = filesData.documents;
			if(files.length > 0){
				for(var i=0; i<files.length; i++){
					if(files[i].hash == hash){
						var file = fs.createWriteStream(files[i].filename);
						var request = http.get(files[i].ipfs_url, function(response) {
							var data = [];

							response.on('data', function(chunk) {
							  data.push(chunk);
							});

							response.on('end', function() {
							  data = Buffer.concat(data);
							  console.log('requested content length: ', response.headers['content-length']);
							  console.log('parsed content length: ', data.length);
							  res.writeHead(200, {
							    'Content-Type': files[i].fileformat,
							    'Content-Disposition': 'attachment; filename='+files[i].filename,
							    'Content-Length': data.length
							  });
							  res.end(data);
							});
						});

						request.end();

						break;
					}
				}
			}	
		});
	} else {
		res.json({'data': 'Unable to read IPFS files'});
	}

}

var tmpCachePath = "/Users/arunkumar/Node/GPT_Identity/Notification/DigitalTwin/tmpCache/";


exports.cacheFile = function(fileHash){
	const ipfs = spawn('eris',['files','cache',fileHash]);
	var buffer = [];
	ipfs.stdout.on('data', (data) => {
		buffer.push(data.toString());
	});
	ipfs.stderr.on('data', (data) => {
		console.log(`stderr: ${data}`);
	});
	ipfs.on('close', (code) => {
		if(code > 0){
			console.log({"Error": "Caching File "+ fileHash +". Status code "+ code});
		} else {
			//Calling cachedFile() to display the files which are cached.
			cachedFile();
			// if files are successfully cached then display the list of files which are cached
			/*const ipfsCached = spawn('eris',['files','cached']);
			var bufferCached = [];
			ipfs.stdout.on('data', (data) => {
				bufferCached.push(data.toString());
			});
			ipfs.stderr.on('data', (data) => {
				console.log(`stderr: ${data}`);
			});
			ipfsCached.on('close', (code) => {
				if(code > 0){
					console.log({"Error": "Didn't find the cached file "+ fileHash +". Status code "+ code});
				} else {
					var displayCachedFile = bufferCached[bufferCached.length - 1].replace(/^\s+|\s+$/g, '');
					// if not null read the file
					if(displayCachedFile.length > 0){
					// if null log the error while reading 
					} else {
						
					}
					
					
				}
			});
			
		} */
	});
}




// function for displaying cached files

exports.cachedFile = function(){
	const ipfsCached = spawn('eris',['files','cached']);
			var bufferCached = [];
			ipfs.stdout.on('data', (data) => {
				bufferCached.push(data.toString());
			});
			ipfs.stderr.on('data', (data) => {
				console.log(`stderr: ${data}`);
			});
			ipfsCached.on('close', (code) => {
				if(code > 0){
					console.log({"Error": "Didn't find the cached file. Status code "+ code});
				} else {
					var displayCachedFile = bufferCached[bufferCached.length - 1].replace(/^\s+|\s+$/g, '');
					// if not null read the file
					if(displayCachedFile.length > 0){
					// if null log the error while reading 
					} else {
						
					}
					
					
				}
			});
			
		}
}
