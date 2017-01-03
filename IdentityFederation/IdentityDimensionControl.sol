
import "CoreIdentity.sol";
import "IdentityDimension.sol"

contract IdentityDimensionControl
{
    
    CoreIdentity myCOID;
    
    address[] dimensions; //addresses of the dimension contract at index i
    bytes32[] IDs; //IDs of the dimension contract at index i
    string[] dimensionDescriptors; //Descriptor of each dimension contract (example "financial history")
    
    struct delegation
    {
        
        
        bytes32 accessGranter; //sha3 of COID owner/controller to grant access
        bytes32 controller; //sha3 pubkey of delegate controller
        uint quantity;
        uint expiration;
    }
    
    mapping(bytes32 => delegation) delegations;
    
    
    //This works as a core identity control token contract
    function IdentityDimensionControl(address CoidAddr)
    {
        myCoid = CoreIdentity(CoidAddr);
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
            }
            else
            {
                dimensions[i] = address(creation);
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
                (found,index) = findIndexOfDescriptor(descriptor);
                
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
    
    //all through myCOID
    
    function delegate
    
    
    //helper functions:
    //Finds index by Descriptor. The index can be used by dimensions (an array) to find the address of the contract on the blockchain.
    function findIndexOfDescriptor(string descriptor) returns (bool found, uint index)
    {
        found = false;
        index = 0;
        
        if(dimensionDescriptors.length > 0)
        {
            for(uint i = 0; i < dimensionDescriptors.length; i++)
            {
                if(dimensionDescriptors[i] == descriptor)
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
        dimensions[i] = 0x0;
        IDs[i] = 0x0;
        dimensionDescriptors[i] = 0x0;
    }



}

