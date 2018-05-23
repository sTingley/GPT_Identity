'use strict'
var contracts = require('eris-contracts')
var fs = require('fs')
var http = require('http')
var express = require('express')
var bodyParser = require('body-parser');
var app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//Set up addresses for deployed contracts
var address_TXcheck = require('./epm.json').TXcheck
var abi_TXcheck = JSON.parse(fs.readFileSync('./abi/' + address_TXcheck, 'utf8'))

var accounts = require('./accounts.json')
var chainUrl
var manager
var contract
var server

var hostname = 'localhost';
var port = 8004;

chainUrl = 'http://localhost:1337/rpc'

// Instantiate the contract object manager using the chain URL and the account data.
manager = contracts.newContractManagerDev(chainUrl, accounts.newchain4_root_000)

// Instantiate the contract object using the ABI and the address.
contract = manager.newContractFactory(abi_TXcheck).at(address_TXcheck)

// for testing
var txn_type = "CreateCOID";
var txn_element = "UniqueID";
var txn_value = "";




/*
function addblock(string txnType, string element, string rule, string value)

{CreateCOID, UniqueID, isnot, ""},
        {CreateCOID, name, isnot, ""},
        {CreateCOID, UniqueIDAttrs, isnot, "0x0"},*/

contract.addblock("CreateCOID", "UniqueID", "isnot", "", function(error, result){
	if(error){
		console.log("error is 1: "+error);
	}else{		
		console.log("result is 1: "+result);
		contract.addblock("CreateCOID", "name", "isnot", "", function(error, result){
			if(error){
				console.log("error is 2 : "+error);
			}else{		
				console.log("result is 2 : "+result);
				contract.validateTransactionElement(txn_type, txn_element, txn_value, function(error,result) {
					if(error) {
						console.log("error is 3: "+error);
					}else{		
						console.log("result is 3: "+result);
						contract.returnTime(function(error, result){
							if(error){
								console.log("error is 4: "+ error);
							}else{
								console.log("result is 4: "+result);
							}
						})
					}
				})
			}
		})
	}
})

// Tell the server to listen to incoming requests on the port specified in the
// environment.
app.listen(port, function () {
console.log("Connected to contract http://localhost:1337/rpc");
console.log("Listening on port:" +port);
});
