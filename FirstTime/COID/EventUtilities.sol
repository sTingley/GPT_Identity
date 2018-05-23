contract EventUtilities
{
    
    bytes32 chairperson;
    bytes32[] accessContracts; //array of hashes of addresses with access to this contract
                               //otherwise anyone can clog up the event log
    
    event triggered(address contractCaller);
    
    //CONSTRUCTOR
    function EventUtilities()
    {
        chairperson = sha3(msg.sender);
    }
    
    function triggerEvent() returns (bool success)
    {
        success = false;
        
        if(accessContracts.length > 0)
        {
            for(uint i = 0; i < accessContracts.length; i++)
            {
                if(success == false && sha3(msg.sender) == accessContracts[i])
                {
                    triggered(msg.sender);
                    success = true;
                }
            }
        }
    }
    
    function isPermissioned(address caller) returns (bool result)
    {
        result = false;
        
        if(sha3(msg.sender) == chairperson)
        {
            if(accessContracts.length > 0)
            {
                for(uint i = 0; i < accessContracts.length; i++)
                {
                    if(success == false && sha3(msg.sender) == accessContracts[i])
                    {
                        triggered(msg.sender);
                        success = true;
                    }
                }
            }
        }
    }
    
    //***Question: Should this take in an address or a hash?
    function removePermission(address caller) returns (bool success)
    {
        success = false;
        
        if(sha3(msg.sender) == chairperson)
        {
            if(accessContracts.length > 0)
            {
                for(uint i = 0; i < accessContracts.length; i++)
                {
                    if(accessContracts[i] = sha3(caller))
                    {
                        accessContracts[i] = 0x0;
                        success = true;
                    }
                }
            }
        }
    }
    
    function addPermission(address caller) returns (bool success)
    {
        success = false;
        
        if(sha3(msg.sender) == chairperson)
        {
            accessContracts.push(sha3(caller));
        
            success = true;
        }
    }
    
    
}
