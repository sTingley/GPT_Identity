//TODO: ADD PERMISSIONS ON THE FUNCTIONS!
contract IdentityGraph
{
    string[] operations;
    string[] keys;
    string[] values;
    
    uint index;
    
    string state;
    
    bool mutex;
    
    
    //CONSTRUCTOR
    function IdentityGraph()
    {   
        mutex = true;
        state = "";
    }
    
    function operationsPending() returns (bool result)
    {
        result = (operations.length == 0);
    }
    
    function getCurrent() returns (string operation, string key, string value)
    {
        operation = "";
        key = "";
        value = "";
        
        if(operations.length > 0)
        {
            operation = operations[0];
            key = keys[0];
            value = values[0];
        }
    }
    
    function addOperation(string operation, string key, string value)
    {
        operations.push(operation);
        keys.push(key);
        values.push(value);
    }
    
    function removeFirst() returns (bool success)
    {
        success = false;
        
        if(operations.length > 0)
        {
            if(operations.length == 1)
            {
                //make size zero
                operations.length--;
            }
            else
            {
                for(uint i = 0; i < operations.length-1; i++)
                {
                    operations[i] = operations[i+1];
                    keys[i] = keys[i+1];
                    values[i] = values[i+1];
                }
            }
            
            success = true;
        }
    }
    
    function getMutex() returns (bool mutexVal)
    {
        mutexVal = mutex;
    }
    
    function setMutex(bool val)
    {
        mutex = val;
    }
    
    //TODO: considering returning more?
    function getState() returns (string bigchainID)
    {
        bigchainID = state;
    }
    
    function setState(string val) 
    {
        state = val;
    }
}
