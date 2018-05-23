
contract PMTrie
{
    //PROOF OF CORRECT EXECUTION: 
    //hash of code, etc.
    
    string currentReference;
    
    bytes32[] allowedAccess;//hash of addresses allowed access to contract
    
    string[] txnList;
    
    function PMTrie()
    {
        
    }
    
    function isUpdated() returns (bool result)
    {
        result = (txnList.length == 0);
    }
    
    //**DOES this make sense?
    function delete(uint index) returns (bool success)
    {
        success = false;
        
        if(txnList.length > 0 && txnList.length > index)
        {
            for(uint i = index; i < txnList.length; i++)
            {
                txnList[i] = txnList[i+1];
            }
            
            txnList.length--;
        }
    }
    
    function getState() returns (string bigchainID)
    {
        if(isAllowed(msg.sender))
        {
            return currentReference;
        }
    }
    
    function setState(string bigchainID) returns (bool success)
    {
        if(isAllowed(msg.sender))
        {
            currentReference = bigchainID;
        }
    }
    
    function isAllowed(address addr) returns (bool success)
    {
        success = false;
        
        if(allowedAccess.length > 0)
        {
            for(uint i = 0; i < allowedAccess.length;i++)
            {
                if(allowedAccess[i] = sha3(addr))
                {
                    success = true;
                }
            }
        }
    }
}
