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

//todo: remember list must be nonempty; check async!
function getContract(contractAddr)
{
        var returnMe;
        for(var i = 0; i < addrList.length;i++)
        {
                if(addr[i] == contractAddr)
                {
                        returnMe = contractList[i];
                }
        }
        return returnMe;
}
//todo: remember list must be nonempty; check async!
function getMutex(contractAddr)
{
        var returnMe;
        for(var i = 0; i < addrList.length;i++)
        {
                if(addr[i] == contractAddr)
                {
                        returnMe = mutexList[i];
                }
        }
        return returnMe;
}





function implementTransactions(contractAddress)
{
        //get the contract:
        var contract = 
            
        //FIRST: see if list is empty

}
