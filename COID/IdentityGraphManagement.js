//REMEMBER TO ADD PROOF OF CORRECT EXECUTION



var addrList = [];
var contractList = [];
var mutexList = [];

function createContract(contractAddress, callback)
{
        //TODO: consider making some of the below global
        //get the contract:
        var chain = 'primaryAccount'
        var erisdburl = chainConfig.chainURL
        var contractData = require('./epm.json')
        var contractAddr = contractAddress
        console.log("contract addr: " + contractAddr)
        var contractAbiAddress = this.contractData['CoreIdentity'];
        var erisAbi = JSON.parse(fs.readFileSync("./abi/"+this.contractAbiAddress));
        var accountData = require("./accounts.json");
        var contractMgr = erisC.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
        var contract = this.contractMgr.newContractFactory(this.erisAbi).at(contractAddress);

        //add the contract 
        contractList.push(contract);
        mutexList.push(true);
        addrList.push(contractAddress);

        callback(); // to allow synchronous calling of this function
}








function implementTransactions(contractAddress)
{
        //get the contract:
        this.chain = 'primaryAccount'
        this.erisdburl = chainConfig.chainURL
        this.contractData = require('./epm.json')
        var contractAddr = contractAddress
        console.log("contract addr: " + contractAddr)
        this.contractAbiAddress = this.contractData['CoreIdentity'];
        this.erisAbi = JSON.parse(fs.readFileSync("./abi/"+this.contractAbiAddress));
        this.accountData = require("./accounts.json");
        this.contractMgr = erisC.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
        this.contract = this.contractMgr.newContractFactory(this.erisAbi).at(contractAddress);

        var reference = this;

        //FIRST: see if list is empty

}
