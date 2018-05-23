'use strict'

var contracts = require('eris-contracts')
var fs = require('fs')
var http = require('http')
var address = require('./epm.json').deployStorageK
var abi = JSON.parse(fs.readFileSync('./abi/' + address, 'utf8'))
var accounts = require('./accounts.json')
var chainUrl
var manager
var contract
var server

chainUrl = 'http://localhost:1337/rpc'

// Instantiate the contract object manager using the chain URL and the account
// data.
manager = contracts.newContractManagerDev(chainUrl,
  accounts.newchain3_root_000)

// Instantiate the contract object using the ABI and the address.
contract = manager.newContractFactory(abi).at(address)

var requestInfo = '{"endpoint": "getKeys", "stringJsonData": "", "method": "GET"}'
var response = "";
console.log("test")
contract.BigChainQuery(requestInfo, (function (error, result) {
	console.log("test2")        
	//if (error) {console.log(error)} 
	//else {}


	//contract.myCallback(function (error, result) {
      //  if (error)
     //   {
    //            console.log("error: " + error)
   //     }
  //      else {
 //       response = result
//	console.log("result" + response)
 //       }
//	})//end myCallBack

}))//end BigchainQuery
