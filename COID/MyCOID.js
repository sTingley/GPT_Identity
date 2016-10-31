'use strict'

//required libraries for post requests parsing
var app = require("express")();
var bodyParser = require('body-parser')
var fs = require('fs')

//required library for accessing the contract
var erisC = require('eris-contracts');


//myCoid object
//To be used in post requests
//NOTE: The ABI can be obtained from the contractAddress because the location of the abi is known
//The location will always be where gatekeeper deployed it.
var MyCOID = function(contractAddress)
{
    //get the contract:
    this.chain = 'newchain4_full_000'
    this.erisdburl = 'http://10.100.98.218:1337/rpc'
    this.contractData = require('./epm.json')
    var contractAddr = contractAddress
    console.log("contract addr: " + contractAddr)
    this.erisAbi = JSON.parse(fs.readFileSync("./abi/"+contractAddress));
    this.accountData = require("./accounts.json");
    this.contractMgr = erisC.newContractManagerDev(this.erisdburl, this.accountData[this.chain]);
    this.contract = this.contractMgr.newContractFactory(this.erisAbi).at(contractAddress);
    
    //coid functions:
    //for iteration one, we are only testing one function.
    var self = this;
    
    //for an owner
    //returns uint in solidity
    this.myTokenAmount = function(ownershipHash,callback)
    {
        self.contract.myTokenAmount(ownershipHash,function(error,result)
        {
            callback(error,result)
        })
    }
    
    
}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.post('/myTokenAmount',function(req,res)
{
 
    //var msg = req.body.msg;
    //var signature = req.body.signature;
    var publicKey = req.body.publicKey
    var contractAddress = req.body.address;
    
    //compute hash of publicKey
    
    //instantiate their coid
    var myCoid = new MyCOID(contractAddress);
    
    //call function for token amount
    myCoid.myTokenAmount(publicKey,function(error,result)
    {
        res.json({"Status":error,
                  "Result":(""+result)})
	console.log("" + result)
    })
    
})



app.listen(8083)
console.log("running at port 8083")
