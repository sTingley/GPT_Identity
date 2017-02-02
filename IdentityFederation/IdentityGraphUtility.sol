import "IdentityGraph.sol";

contract IdentityGraphUtility
{
    //chairperson is the deployer of this utility contract
    //strictly intended to 
    address chairperson;
    
    function IdentityGraphUtility()
    {
        chairperson = msg.sender;
    }
    
    function operationsPending(address contract) returns (bool result)
    {
        IdentityGraph theGraph = IdentityGraph(contract);
        result = theGraph.operationsPending();
    }
    
    
    function getCurrent(address contract) returns (string operation, string key, string value)
    {
        IdentityGraph theGraph = IdentityGraph(contract);
        (operation,key,value) = theGraph.getCurrent();
    }
    
    function addOperation(address contractAddr, string operation, string key, string value)
    {
        IdentityGraph theGraph = IdentityGraph(contractAddr);
        theGraph.addOperation(operation,key,value);
    }
    
    function removeFirst(address contractAddr) returns (bool success)
    {
        IdentityGraph theGraph = IdentityGraph(contractAddr);
        success = theGraph.removeFirst();
    }
    
    function getMutex(address contractAddr) returns (bool mutexVal)
    {
        IdentityGraph theGraph = IdentityGraph(contractAddr);
        mutexVal = theGraph.getMutex();
    }
    
    function setMutex(address contract, bool val)
    {
        IdentityGraph theGraph = IdentityGraph(contractAddr);
        theGraph.setMutex(val);
    }
    
    //TODO: considering returning more?
    function getState(address contractAddr) returns (string bigchainID)
    {
        IdentityGraph theGraph = IdentityGraph(contractAddr);
        bigchainID = theGraph.getState();
    }
    
    function setState(address contractAddr, string val) 
    {
        IdentityGraph theGraph = IdentityGraph(contractAddr);    
        theGraph.setState(val);
    }
    
    
}
