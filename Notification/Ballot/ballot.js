var http = require ('http');
var erisC = require('eris-contracts');

var ballotApp = function(){
	
	// eris:chain id with full privilages
    this.chain = 'mychain_full_000';
    // Change eris:db url
    this.erisdburl = "http://10.100.99.100:1337/rpc";
	
    this.contractData = require("./epm.json");
    this.contractAddress = this.contractData['Ballot'];
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/"+this.contractAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisC.newContractManagerDev(this.erisdburl, this.accountData[this.chain]);
    this.ballotContract = this.contractMgr.newContractFactory(this.erisAbi).at(this.contractAddress);
	
	var self = this;
	
	this.dataReady = function(postData){
		if(!postData.pubKey && !postData.proposalID) return false;	// Nothing to do without public key and proposal id
		postData = JSON.stringify(postData);
		var req = this.sendProposal(this.onResponse);
		req.write(postData);
		req.end();
	};
	
	this.sendProposal = function(callback){
		return http.request({
			method: 'POST',
			host: 'localhost',
			port: 5050,
			path: "/ballot/notify",
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}, callback);
	};
	
	this.onResponse = function(res){
		res.on('data',function(post_data){	console.log("Received post data", post_data);	});
		console.log(response);
	};
}

var ballot = new ballotApp();
ballot.dataReady({
			"pubKey": "1dc99871943ad3a715f022273513a393564f9b060c4c047920fc1425b90b7740",
			"proposalID": "0987654321",				
			"coidData": JSON.stringify({"name":"abc123","uniqueId":"123abcd","uniqueIdAttributes":["abc1","abc2"],"ownershipId":"addd1234","ownerIdList":["23456"],"controlId":"cc1234","controlIdList":["1755"],"ownershipTokenId":"03483677","ownershipTokenAttributes":["ba1","a2","a3"],"ownershipTokenQuantity":"5","controlTokenId":"24345","controlTokenAttributes":["a1", "b2","c3"],"controlTokenQuantity":"5","identityRecoveryIdList":["123456"],"recoveryCondition":"1"})});


			
			
const server = http.createServer();				 
console.log("ballot app server running @ 8082");
server.listen(8082);			