'use strict'
var contracts = require('eris-contracts')
var fs = require('fs')
var http = require('http')

//Set up addresses for deployed contracts
var address_CoreIdentity = require('./epm.json').CoreIdentity


var abi_COID = JSON.parse(fs.readFileSync('./abi/' + address_CoreIdentity, 'utf8'))

var accounts = require('./accounts.json')
var chainUrl
var manager
var contract
var server

var hostname = 'localhost';
var port = 8004;

chainUrl = 'http://localhost:1337/rpc'

// Instantiate the contract object manager using the chain URL and the account data.
manager = contracts.newContractManagerDev(chainUrl, accounts.chainbreaker_root_000)

// Instantiate the contract object using the ABI and the address.
contract = manager.newContractFactory(abi_COID).at(address_CoreIdentity)


//for testing
var theUniqueID = "1111";
var theUniqueIDAttributes = ["20", "111", "121"];
var theOwnershipTokenID = "1232321";
var theOwnerIDList = ["A1", "A2", "A3"];//START OFF WITH THREE OWNERS
var theOwnershipStakes = [3, 3, 3]; //START OFF WITH EACH ONE THIRD OWNERSHIP STAKE
var theControlTokenID = "32";
var theControlTokens = [5, 5, 5]; //START OFF WITH EACH HAVING 5 CONTROL TOKENS
var theControlIDList = ["A1", "A2", "C1"];//THIS IS FOR TESTING (INTENTIALLY NO "A3" TO SEE IF CONTRACT WILL ADD IT)
var theIdentityRecoveryList = ["A1", "C1", ""];
var theRecoveryCondition = 1;
var isHumanValue = new Boolean("false");

//add remaining values to make array size 100
console.log(theOwnerIDList.length);
for (var i = theOwnerIDList.length; i < 10; i++) {
	theUniqueIDAttributes[i] = "0";
	theOwnerIDList[i] = "0";
	theOwnershipStakes[i] = 0;
	theControlTokens[i] = 0;
	theControlIDList[i] = "0";
	theIdentityRecoveryList[i] = "0";
}
console.log(theOwnerIDList.length);


contract.setUniqueID(theUniqueID, theUniqueIDAttributes, isHumanValue, function (error) {

	contract.getIt(function (error, result) {
		console.log("" + result);
		contract.setOwnership(theOwnerIDList, theOwnershipStakes, function (error) {
			contract.getIt(function (error, result) {
				console.log("" + result);
				contract.setControl(theControlTokens, theControlIDList, function (error) {

					contract.getIt(function (error, result) {
						console.log("" + result);
						contract.setRecovery(theIdentityRecoveryList, theRecoveryCondition, function (error, result) {

							contract.getIt(function (error, result) {
								console.log("" + result);

								contract.StartCoid(function (error, result) {
									console.log(result);
									contract.getIt(function (Error, result) {
										console.log("" + result);

									})//end getIT

								})//end StartCoid

							})//end getIT

						})//end setRecovery

					})//end getIT

				})//end setControl

			})//end getIT

		})//end setOwnership

	})//end getIT

})//end setUniqueID


var addOwner = "A4";
var amount = 3;
contract.myTokenAmount(sha3(theOwnerIDList[0]), function (Error, result) {
	console.log("" + result);
	contract.addOwner(addOwner, amount, function (Error, result) {
		console.log("" + result);
		contract.giveTokens(theOwnerIDList[0], theOwnerIDList[1], theOwnershipStakes[0], function (Error, result) {
			console.log("" + result);
			contract.removeOwner(theOwnerIDList[0], function (Error, result) {
				console.log("" + result);
				contract.myTokenAmount(sha3(theOwnerIDList[0]), function (Error, result) {
					console.log("myTokenAmount after removing the controller shoud be zero : " + result);

					var addController = "A3";
					contract.myAmount(sha3(theControlIDList[0]), function (Error, result) {
						console.log("" + result);
						contract.addController(addController, function (Error, result) {
							console.log("" + result);
							contract.changeTokenController(theControlIDList[0], theControlIDList[1], theControlTokens[0], function (Error, result) {
								console.log("" + result);
								contract.removeController(theControlIDList[0], function (Error, result) {
									console.log("" + result);
									contract.myAmount(sha3(theControlIDList[0]), function (Error, result) {
										console.log("" + result);
									})
								})

							})
						})
					})

				})
			})
		})
	})
})

