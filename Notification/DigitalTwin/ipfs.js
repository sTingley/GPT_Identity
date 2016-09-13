var exec = require('child_process').exec;


var IPFS = function(){
	
	this.result = [];
	
	this.upload = function(req, res){
		var files = req.files.documents;
		console.log("comes here======================>",files.path);
		this.result = [];
		
		exec('ipfs add '+files.path+' -n', (err, stdout, stderr) => {
				if (err) {
					console.error(`exec error: ${err}`);
					return;
				  }
				_that.push(stdout);
				console.log(`stderr: ${stderr}`);
			});
		
		/*
		if(files.length > 0){
			console.log("comes here")
			for(var i=0; i<files.length; i++){
				console.log("current file", files[i]);
				IPFS.uploadAsync(files[i]);
			}
			console.log("End Output", IPFS.result);
		}
		*/
	};
	
	this.uploadAsync = function(file){
		
		
	}
	
}

module.exports = new IPFS();