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

//bigchain contract
var bigchain_query_addr = require('/home/demoadmin/.eris/apps/SOLIDITY/BigchainOraclizer/epm.json').deployStorageK
var bigchain_abi = JSON.parse(fs.readFileSync('/home/demoadmin/.eris/apps/SOLIDITY/BigchainOraclizer/abi/' + bigchain_query_addr, 'utf8'))
var bigchain_contract = manager_full.newContractFactory(bigchain_abi).at(bigchain_query_addr)




//this is for verification
function verifyIt(msg,sig,pubKey, callback)
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

//to write what 
function bigchainIt(txnDesc, proposalID, signature, publicKey, msg)
{
    var thePubKey = accounts.new_chain_root_000 //public key
    
    var bigchainInput = {"Transaction Description": txnDesc, "Proposal ID": proposalID, "Signature": signature, "Public Key": publicKey, "Message": msg}

    var bigchainEndpoint = 'addData/' + thePubkey + '/1'

    var theobj = {"method": "POST", "stringJSONData": bigchainInput, "endpoint": bigchainEndpoint}

    bigchain_contract.BigChainQuery(JSON.stringify(theobj),function(error,result){
        bigchain_contract.CallbackReady.once(function(){
            bigchain_contract.myCallback(function(error,result){
                callback(result)

            })
        })

    })

}


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


var bigchainTransactions = [];
var ballot = newballotApp();
//This endpoint is for voting
//Input Fields (as JSON): msg, signature, publicKey, proposalID, vote
app.post("/vote", function(req,res)
{
    var msg = req.body.msg;
    var signature = req.body.signature;
    var publicKey = req.body.publicKey;
    var proposalID = req.body.proposalID;
    var vote = req.body.vote;
    var txnDesc = "Validator Vote"
    
    this.verifyIt(msg, signature, publicKey, function(result)
    {
        if(result == true)
        {
            //they are able to vote
            ballot.ballotContract.vote(txnDesc, proposalID,vote,publicKey,function(error,result)
            {
                //write into bigchainDB if they were able to vote:
                if(result == true)
                {
                    this.bigchainIt(proposalID, signature, publicKey, msg, function(error,result)
                    {
                        bigchainTransactions.push(result);
                    })
                }  
            })
        }
    })              
    
})


//This endpoint is for voting
//Input Fields (as JSON): msg, signature, publicKey, proposalID, vote
app.post("/delegate", function(req,res)
{
    var msg = req.body.msg;
    var signature = req.body.signature;
    var publicKey = req.body.publicKey;
    var proposalID = req.body.proposalID;
    var toDelegate = req.body.toDelegate;
    var txnDesc = "Validator Delegate";
    
    this.verifyIt(msg, signature, publicKey, function(result)
    {
        if(result == true)
        {
            //they are able to vote
            ballot.ballotContract.delegate(proposalID,toDelegate,publicKey,function(error,result)
            {
                //write into bigchainDB if they were able to vote:
                if(result == true)
                {
                    this.bigchainIt(txnDesc, proposalID, signature, publicKey, msg, function(error,result)
                    {
                        bigchainTransactions.push(result);
                    })
                }  
            })
        }
    })              
    
})




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
