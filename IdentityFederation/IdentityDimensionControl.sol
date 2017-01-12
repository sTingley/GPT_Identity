
import "CoreIdentity.sol";
import "IdentityDimension.sol"
import "IdentityDimensionControlToken.sol"

contract IdentityDimensionControl
{
    
    CoreIdentity myCOID;
    IdentityDimensionControlToken tokenManagement;
    
    address[] dimensions; //addresses of the dimension contract at index i
    bytes32[] IDs; //IDs of the dimension contract at index i
    string[] dimensionType; //Descriptor of each dimension contract (example "financial history")
    
    
    //IMPORTANT: At instantiation, controllers here are (owners,controllers) in COID
    //This can diverge.
    //This works as a core identity control token contract
    function IdentityDimensionControl(address CoidAddr, bytes32[20] controllers, uint[20] amounts)
    {
        myCoid = CoreIdentity(CoidAddr);
        
        tokenManagement = new IdentityDimensionControlToken(controllers,amounts);
    }
    
    //TODO: add function isOwner to CoreIdentity
    //TODO: push IDs and Dimension Descriptors
    function CreateDimension(string pubKey, bytes32 uniqueID, string typeInput, string descriptorInput, uint flag) returns (bool success)
    {
        success = false;
        
        if(myCoid.isOwner(sha3(pubKey)))
        {
            IdentityDimension creation = new IdentityDimension(uniqueID,typeInput,descriptorInput,flag);
        
            //if there is an empty index, add it there:
            uint found = false;
            uint emptyIndex = 0;
            if(dimensions.length > 0)
            {
                for(uint i = 0; i < dimensions.length; i++)
                {
                    if(dimensions[i] == 0x0)
                    {
                        emptyIndex = i;
                    }
                }
            }
            if(found == false)
            {
                dimensions.push(address(creation));
                IDs.push(creation.getID());
                dimensionTypes.push(descriptorInput);
            }
            else
            {
                dimensions[i] = address(creation);
                IDs[i] = creation.getID();
                dimensionTypes[i] = descriptorInput;
            }
            success = true;
        }
    }
    
    
    //TODO: Threshold Consensus
    //Although this function requires both parameters, you only have to provide one, and can provide the other null
    function RemoveDimension(string caller, string descriptor, bytes32 ID) returns (bool result)
    {
        result = false;
        
        uint index = 0;
        bool found;
        
        if(myCOID.isOwner(caller))
        {
        
            //if it is not null descriptor, use this route to get the index
            if(descriptor != "")
            {
                (found,index) = findIndexOfType(descriptor);
                
                if(found)
                {
                    IdentityDimension current = IdentityDimension(dimensions[index]);
                    
                    current.kill();
                }
            }
            else
            {
                if(ID != 0x0)//if it is not null ID, we must use this route (unless both are null, they called the function wrong)
                {
                    (found,index) = findIndexOfID(ID);
                    
                    if(found)
                    {
                        IdentityDimension current = IdentityDimension(dimensions[index]);
                        
                        current.kill();
                    }
                }
            }
            
        }
        
    }
    
    //NOTE: One of Type or ID can be null. To make it easier for the user to call this function.
    //This function adds a (attribute/descriptor) entry to a dimension.
    //They must be an Owner or Controller to call this function.
    function addEntry(string pubKey, string type, bytes32 ID, string attribute, string descriptor, uint flag) returns (bool result)
    {
        result = false;    
        
        //params for accessing the relevant IdentityDimension Contract
        bool found = false;
        address addr = 0x0;
        
        
        if(myCOID.isOwner(sha3(pubKey)) || myCOID.isController(sha3(pubKey)))
        {
            
            (found,addr) = getDimensionAddress(type, ID);
            
            
            //were able to find the identity contract:
            if(found)
            {
                
                //get the identity contract:
                IdentityDimension current = IdentityDimension(addr);
                
                //add the entry to the identity contract:
                result = current.addEntry(attribute, descriptor, flag);
                
            }
        }

    }
    
    
    //NOTE: One of Type or ID can be null. To make it easier for the user to call this function.
    //This function removes an (attribute/descriptor) entry from a dimension.
    //They must be an Owner or Controller to call this function.
    function removeEntry(string pubKey, string type, bytes32 ID, string attribute) returns (bool result)
    {
        result = false;    
        
        //params for accessing the relevant IdentityDimension Contract
        bool found = false;
        address addr = 0x0;
        
        
        if(myCOID.isOwner(sha3(pubKey)) || myCOID.isController(sha3(pubKey)))
        {
            
            (found,addr) = getDimensionAddress(type, ID);
            
            
            //were able to find the identity contract:
            if(found)
            {
                
                //get the identity contract:
                IdentityDimension current = IdentityDimension(addr);
                
                //add the entry to the identity contract:
                result = current.deleteEntry(attribute);
                
            }
        }

    }
    
    
    //NOTE: One of Type or ID can be null. To make it easier for the user to call this function.
    //This function allows you to change the descriptor and/or flag of an entry.
    //IMPORTANT: If you do not wish to change the descriptor, make it null.
    //If you do not wish to change the flag, make it 2.
    //NOTE: If you wish to change the name of the attribute, you will have to delete it, then create it.
    function updateEntry(string pubKey, string type, bytes32 ID, string attribute, string descriptor) returns (bool result)
    {
        
        result = false;    
        
        //params for accessing the relevant IdentityDimension Contract
        bool found = false;
        address addr = 0x0;
        
        
        if(myCOID.isOwner(sha3(pubKey)) || myCOID.isController(sha3(pubKey)))
        {
            
            (found,addr) = getDimensionAddress(type, ID);
            
            
            //were able to find the identity contract:
            if(found)
            {
                
                //get the identity contract:
                IdentityDimension current = IdentityDimension(addr);
                
                //add the entry to the identity contract:
                result = current.update(attribute, descriptor);
                
            }
        }
    }
    
    //gives you the address of a dimension contract. It is okay if one of the two parameters are null.
    //This is itended to let the user access the contract either by knowing the type of the dimension
    //("ex. financial history") or by knowing the ID of the dimension.
    function getDimensionAddress(string type, bytes32 ID) returns (bool found, address addr)
    {
        found = false;
        addr = 0x0;
        
        uint index = 0;
        
        //if the type is non-null, use this route:
        if(type != "")
        {
            (index,found) = findIndexOfType(type);
        }
        else
        {
            if(ID != 0x0)
            {
                (index,found) = findIndexOfID(ID);
            }
        }
        
        if(found)
        {
            addr = dimensions[index];
        }
    }
    
    //Finds index by Descriptor. The index can be used by dimensions (an array) to find the address of the contract on the blockchain.
    function findIndexOfType(string type) returns (bool found, uint index)
    {
        found = false;
        index = 0;
        
        if(dimensionTypes.length > 0)
        {
            for(uint i = 0; i < dimensionTypes.length; i++)
            {
                if(dimensionTypes[i] == type)
                {
                    found = true;
                    index = i;
                }
            }
        }
    }
    
    //Finds index of ID. The index can be used by dimensions (an array) to find the address of the contract on the blockchain.
    function findIndexOfID(bytes32 ID) returns (bool found, uint index)
    {
        found = false;
        index = 0;
        
        if(IDs.length > 0)
        {
            for(uint i = 0; i < IDs.length; i++)
            {
                if(IDs[i] == ID)
                {
                    found = true;
                    index = i;
                }
            }
        }
    }
    
    //deletes the values at index i:
    function deleteDimensionIndex(uint index) returns (bool success)
    {
        dimensions[index] = 0x0;
        IDs[index] = 0x0;
        dimensionTypes[index] = 0x0;
    }


    //delegate tokens to a delegatee
    function delegate(bytes32 controller, bytes32 delegatee, uint amount, string dimension, uint timeFrame) returns (bool success)
    {
        success = tokenManagement.addDelegation(controller,delegatee,amount,dimension,timeFrame);
    }
    
    function controllerExists(bytes32 controllerHash) returns (bool exists, uint index)
    {
        (exists,index) = tokenManagement.controllerEixsts(controllerHash);
    }
    
    function addDelegation(bytes32 controller, bytes32 delegatee, uint amount, string dimension, uint timeFrame) returns (bool success)
    {
        success = tokenManagement.addDelegation(controller,delegatee,amount,dimension,timeFrame);
    }
    
    function revokeDelegation(bytes32 controller, bytes32 delegatee, uint amount, string dimension, bool all) returns (bool success)
    {
        success = tokenManagement.revokeDelegation(controller,delegatee,amount,dimension,all);
    }
        
    function removeController(bytes32 controller) returns (bool success)
    {
        success = tokenManagement.removeController(controller);
    }
    function addController(bytes32 controller) returns (bool success)
    {
        success = tokenManagement.addController(controller);
    }
        
    function spendTokens(bytes32 delegatee, uint amount, string identityDimension) returns (bool success)
    {
        success = tokenManagement.spendTokens(delegatee,amount,identityDimension);
    }
        
    function delegateeAmount(bytes32 delegatee, string dimension) returns (uint amount)
    {
        amount = tokenManagement.delegateeAmount(delegatee,dimension);
    }





}


