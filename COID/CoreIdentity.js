var contracts = require('eris-contracts')
var fs = require('fs')
var http = require('http')


var keccak_256 = require('js-sha3').keccak_256


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
manager = contracts.newContractManagerDev(chainUrl, accounts.tuesday4_full_000)

// Instantiate the contract object using the ABI and the address.
contract = manager.newContractFactory(abi_COID).at(address_CoreIdentity)
console.log("addr: " + address_CoreIdentity);

//QUESTION--TO UPPER CASE?
var A1 = keccak_256("a1").toUpperCase();
var A2 = keccak_256("a2").toUpperCase();
var A3 = keccak_256("a3").toUpperCase();
var C1 = keccak_256("c1").toUpperCase();
var D1 = keccak_256("d1").toUpperCase();
console.log("A1 is: " + A1);
console.log("A2 is: " + A2);
console.log("A3 is: " + A3);
console.log("C1 is: " + C1);
//for testing
var theUniqueID = "1111";
var theUniqueIDAttributes = ["20","111","121"];
var theOwnershipTokenID = "1232321";
var theOwnerIDList = [A1,A2,A3];//START OFF WITH THREE OWNERS
var theOwnershipStakes = [3,3,3]; //START OFF WITH EACH ONE THIRD OWNERSHIP STAKE
var theControlTokenID = "32";
var theControlTokens = [5,5,5]; //START OFF WITH EACH HAVING 5 CONTROL TOKENS
var theControlIDList = [A1,A2,C1];//THIS IS FOR TESTING (INTENTIALLY NO "A3" TO SEE IF CONTRACT WILL ADD IT)
var theIdentityRecoveryList = [A1,A2,"0"];
var theRecoveryCondition = 1;
var isHumanValue = new Boolean("false");

//add remaining values to make array size 100
console.log(theOwnerIDList.length);
for(var i = theOwnerIDList.length; i < 10; i++)
{
        theUniqueIDAttributes[i] = "0";
        theOwnerIDList[i] = "0";
        theOwnershipStakes[i] = 0;
        theControlTokens[i] = 0;
        theControlIDList[i] = "0";
        theIdentityRecoveryList[i] = "0";
}
console.log(theOwnerIDList.length);

setTimeout(function(){
contract.setUniqueID(theUniqueID,theUniqueIDAttributes,isHumanValue, function(error)
{

contract.getIt(function(error,result)
{
console.log("setUniqueID: "+result);
contract.setOwnership(theOwnerIDList, theOwnershipStakes, function(error)
{
contract.getIt(function(error,result)
{
console.log("setOwnership: "+result);
contract.setControl(theControlTokens,theControlIDList, function(error){

contract.getIt(function(error,result)
{
console.log("setControl"+result);
contract.setRecovery(theIdentityRecoveryList,theRecoveryCondition,function(error,result)
{

contract.getIt(function(error,result)
{
console.log("setRecovery: "+result);

contract.StartCoid(function(error,result)
{
console.log("startCoid1: " + result);
contract.getIt(function(Error,result)
{
console.log("startCoid: " + result);

//now give a control token

contract.delegate(A1,D1,1,function(error,result)
{
	console.log("delegate: " + result);
	//contract.spendMyTokens(D1,1,function(error,result)
	//{
	//	console.log("spend token: " + result);
	//})
})


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
},3000)
