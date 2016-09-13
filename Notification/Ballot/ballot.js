/*
 *	TODO: Create Event listener for Ballot contract
 *	TODO: Test with real data (end to end notification flow)
 * 	TODO: Proposal expiary notification
 */
var app = require("express")();
var request = require("superagent");
var erisC = require('eris-contracts');
var erisContracts = require('eris-contracts')
var fs = require('fs')

//verification contract
var chainUrl = 'http://localhost:1337/rpc'
var requester_address = require('/home/demoadmin/.eris/apps/SOLIDITY/VerifyOraclizerEthereum/wallet2/epm.json').deployStorageK
var requester_abi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/SOLIDITY/VerifyOraclizerEthereum/wallet2/abi/' + requester_address, ‘utf8’))
var VerificationContract = manager_full.newContractFactory(requester_address).at(requester_abi)
var manager_full = contracts.newContractManagerDev(chainUrl,accounts.newchain_full_000)


//this is for verification
function verifyIt(string msg, string sig, string pubKey, callback)
{
    VerificationContract.VerificationQuery(msg,sig,pubKey, function(error,result)
    {
        VerificationContract.CallbackReady.once(function(error,result)
        {
            VerificationContract.myCallback(function(error,result)
            {
                callback(result);
            })//end myCallback
        })  //end CallbackReady.once   
    })//end VerificationQuery   
}

//this is a template for when the ballot functions are inserted:
this.verifyIt(input.msg,input.sig,input.pubKey,function(result)
{
    if(result == "true")
    {
        //contract logic here
    }
})

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
	
	this.twinUrl = "http://localhost:5050";
	var self = this;
	
	this.createNotification = function(inputs){
		request.post(this.twinUrl + "/ballot/writeNotify")
			.send(inputs)
			.set('Accept', 'application/json')
			.end((err,res) => {
				if(res.status == 200){
					// do something
				}
			});
	};
	
	this.createCoid = function(inputs){
		request.post(this.twinUrl + "/ballot/writeCoid")
			.send(inputs)
			.set('Accept', 'application/json')
			.end((err,res) => {
				if(res.status == 200){
					// do something
				}
			});
	}
}

/*
 * Example Usage
var ballot = new ballotApp();
var formData = {pubKey: '1dc99871943ad3a715f022273513a393564f9b060c4c047920fc1425b90b7740',
					proposalID: '1234567890',
					message: 'You are invited to vote for an proposal'
				};
var coidData = {
	pubKey: '1dc99871943ad3a715f022273513a393564f9b060c4c047920fc1425b90b7740',
	proposalID: '1234567890',
	coid: JSON.stringify({"name":"abc123","uniqueId":"123abcd","uniqueIdAttributes":["abc1","abc2"],"ownershipId":"addd1234","ownerIdList":["23456"],"controlId":"cc1234","controlIdList":["1755"],"ownershipTokenId":"03483677","ownershipTokenAttributes":["ba1","a2","a3"],"ownershipTokenQuantity":"5","controlTokenId":"24345","controlTokenAttributes":["a1", "b2","c3"],"controlTokenQuantity":"5","identityRecoveryIdList":["123456"],"recoveryCondition":"1"})
}			
	ballot.createNotification(formData);
	ballot.createCoid(coidData);
*/
app.listen(8082);
