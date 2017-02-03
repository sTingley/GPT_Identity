import "CoreIdentity.sol";
import "IdentityDimension.sol";
import "IdentityDimensionControlToken.sol";

contract IdentityDimensionControl
{

    CoreIdentity myCOID;
    IdentityDimensionControlToken tokenManagement;

    address[] dimensions; //addresses of the dimension contract at index i
    bytes32[] IDs; //IDs of the dimension contract at index i
    string[] dimensionTypes; //Descriptor of each dimension contract (example "financial history")


    bytes32 chairperson;
    bytes32[] accessContracts;

    bytes bytesString;
    bytes resultBytes;

    bool mutex;//mutex for bytes32 to String

    //CAN ONLY BE CALLED ONCE. Does this by forcing chairperson to be null.
    function IdentityDimensionControlInstantiation(address CoidAddr) returns (bytes32[10] val)
    {
        if(chairperson == 0x0)
        {

                mutex = true;

                bytesString.length = 32;

                myCOID = CoreIdentity(CoidAddr);

                tokenManagement = new IdentityDimensionControlToken(myCOID.getOwners());

                chairperson = sha3(msg.sender);

                val = myCOID.getOwners();
        }
    }

    modifier accessContract(address caller)
    {
        if(!isPermissioned(caller) && sha3(caller) != chairperson)
        {
            throw;
        }
        _
    }


    function isPermissioned(address caller) internal returns (bool result)
    {
        result = false;

        if(accessContracts.length > 0)
        {
                for(uint i = 0; i < accessContracts.length; i++)
                {
                    if(result == false && sha3(msg.sender) == accessContracts[i])
                    {
                        result = true;
                    }
                }
         }
    }

    //notice it is the hash -- not the address
    function removePermission(bytes32 toRemove) returns (bool success)
    {
        success = false;

        if(sha3(msg.sender) == chairperson)
        {
            if(accessContracts.length > 0)
            {
                for(uint i = 0; i < accessContracts.length; i++)
                {
                    if(accessContracts[i] == toRemove)
                    {
                        accessContracts[i] = 0x0;
                        success = true;
                    }
                }
            }
        }
    }



    function addPermission(address toAdd) returns (bool success)
    {
        success = false;

        if(sha3(msg.sender) == chairperson)
        {
            accessContracts.push(sha3(toAdd));

            success = true;
        }
    }

    //START STRING HELPER FUNCTIONS
    function testing(bytes32 x) constant returns (string val)
    {
        val = "";
        if(mutex == true)
        {

                mutex = false;

                uint charCount = 0;

                resultBytes.length = 0;

                for(uint j = 0; j < 32; j++)
                {
                        byte char = byte(bytes32(uint(x)*2**(8*j)));
                        if(char != 0)
                        {
                                bytesString[charCount] = char;
                                charCount++;
                        }
                }

                for(j = 0; j < charCount; j++)
                {
                        resultBytes.push(bytesString[j]);
                }
                val = string(resultBytes);

                mutex = true;
        }

    }

    function bytes32ToString(bytes32 x) returns (string val)
    {
        val = "";
    }

    function stringToBytes32(string memory source) internal returns (bytes32 result)
    {
        assembly
        {
            result := mload(add(source, 32))
        }
    }
    //END STRING HELPER FUNCTIONS



    //TODO: add function isOwner to CoreIdentity
    function CreateDimension(string pubKey, bytes32 uniqueID, string typeInput, uint flag) accessContract(msg.sender) returns (bool success, bytes32 callerHash)
    {
        success = false;
        callerHash = sha3(pubKey);
        if(myCOID.isOwner(sha3(pubKey)))
        {
            //Create a new identity dimension contract:
            IdentityDimension creation = new IdentityDimension(uniqueID,stringToBytes32(typeInput),flag);

            //if there is an empty index, add it there:
            bool found = false;
            uint emptyIndex = 0;
            if(dimensions.length > 0)
            {
                for(uint i = 0; i < dimensions.length; i++)
                {
                    if(dimensions[i] == 0x0)
                    {
                        emptyIndex = i;
                        found = true;
                    }
                }
            }
            if(found == false)//populate the identity dimension header
            {
                dimensions.push(address(creation));
                IDs.push(creation.getID());
                dimensionTypes.push(typeInput);
            }
            else
            {
                dimensions[emptyIndex] = address(creation);
                IDs[emptyIndex] = creation.getID();
                dimensionTypes[emptyIndex] = typeInput;
            }
            success = true;
        }
    }


    //TODO: Threshold Consensus
    //Although this function requires both parameters, you only have to provide one, and can provide the other null
    function RemoveDimension(string caller, string descriptor, bytes32 ID) accessContract(msg.sender) returns (bool result)
    {
        result = false;

        uint index = 0;
        bool found;

        if(myCOID.isOwner(sha3(caller)))
        {

            //if it is not null descriptor, use this route to get the index
            if(sha3(descriptor) != sha3(""))
            {
                (found,index) = findIndexOfType(descriptor);

                if(found)
                {
                    //get the contract by address
                    IdentityDimension current1 = IdentityDimension(dimensions[index]);

                    current1.kill();
                    result = true;
                }
            }
            else
            {
                if(ID != 0x0)//if it is not null ID, we must use this route (unless both are null, they called the function wrong)
                {
                    (found,index) = findIndexOfID(ID);

                    if(found)
                    {
                        IdentityDimension current2 = IdentityDimension(dimensions[index]);

                        current2.kill();
                        result = true;
                    }
                    else
                    {
                        result = false;
                    }
                }
                else
                {
                    result = false;
                }
            }
        }
    }

    //changes the descriptor
    function changeDescriptor(string pubKey, string type1, bytes32 ID, string oldDescriptor, string newDescriptor) accessContract(msg.sender) returns (bool success)
    {
        success = false;

        //params for accessing the relevant IdentityDimension Contract
        bool found = false;
        address addr = 0x0;

       (found,addr) = getDimensionAddress(type1, ID);

        if(found)
        {
            IdentityDimension current = IdentityDimension(addr);
            success = current.changeDescriptor(stringToBytes32(oldDescriptor),stringToBytes32(newDescriptor));
        }
    }


    //NOTE: One of Type or ID can be null. To make it easier for the user to call this function.
    //This function adds a (attribute/descriptor) entry to a dimension.
    //They must be an Owner or Controller to call this function.
    function addEntry(string pubKey, string type1, bytes32 ID, string attribute, string descriptor, uint flag) accessContract(msg.sender) returns (bool result)
    {
        result = false;

        //params for accessing the relevant IdentityDimension Contract
        bool found = false;
        address addr = 0x0;


        if(myCOID.isOwner(sha3(pubKey)) || myCOID.isController(sha3(pubKey)))
        {

            (found,addr) = getDimensionAddress(type1, ID);


            //were able to find the identity contract:
            if(found)
            {

                //get the identity contract:
                IdentityDimension current = IdentityDimension(addr);

                //add the entry to the identity contract:
                result = current.addEntry(stringToBytes32(descriptor),stringToBytes32(attribute), flag);

            }
        }

    }


    //NOTE: One of Type or ID can be null. To make it easier for the user to call this function.
    //This function removes an (attribute/descriptor) entry from a dimension.
    //They must be an Owner or Controller to call this function.
    function removeEntry(string pubKey, string type1, bytes32 ID, string descriptor) accessContract(msg.sender) returns (bool result)
    {
        result = false;

        //params for accessing the relevant IdentityDimension Contract
        bool found = false;
        address addr = 0x0;


        if(myCOID.isOwner(sha3(pubKey)) || myCOID.isController(sha3(pubKey)))
        {

            (found,addr) = getDimensionAddress(type1, ID);

            //were able to find the identity contract:
            if(found)
            {

                //get the identity contract:
                IdentityDimension current = IdentityDimension(addr);

                //add the entry to the identity contract:
                result = current.removeEntry(stringToBytes32(descriptor));

            }
        }

    }


    //NOTE: One of Type or ID can be null. To make it easier for the user to call this function.
    //This function allows you to change the descriptor and/or flag of an entry.
    //IMPORTANT: If you do not wish to change the descriptor, make it null.
    //If you do not wish to change the flag, make it 2.
    //NOTE: If you wish to change the name of the attribute, you will have to delete it, then create it.
    function updateEntry(string pubKey, string type1, bytes32 ID, string descriptor, string attribute, uint flag) accessContract(msg.sender) returns (bool result)
    {

        result = false;

        //params for accessing the relevant IdentityDimension Contract
        bool found = false;
        address addr = 0x0;


        if(myCOID.isOwner(sha3(pubKey)) || myCOID.isController(sha3(pubKey)))
        {

            (found,addr) = getDimensionAddress(type1, ID);


            //were able to find the identity contract:
            if(found)
            {

                //get the identity contract:
                IdentityDimension current = IdentityDimension(addr);

                //add the entry to the identity contract:
                result = current.update(stringToBytes32(descriptor),stringToBytes32(attribute),flag);

            }
        }
    }



    //Type is the dimension name
    //ID is the dimension ID
    //can be referred by either...one of them can be null
    function readEntry(string pubKey, string type1, bytes32 ID, string descriptor) accessContract(msg.sender) returns (string result)
    {
        result = "";

        //params for accessing the relevant IdentityDimension Contract
        bool found = false;
        address addr = 0x0;


        (found,addr) = getDimensionAddress(type1, ID);


        //were able to find the identity contract:
        if(found)
        {

            //get the identity contract:
            IdentityDimension current = IdentityDimension(addr);

            bytes32 toConvert;
            bool success = false;
            bool isPub = false;

            //read the entry from the identity contract:
            (toConvert,success,isPub) = current.readEntry(stringToBytes32(descriptor));

            string memory attribute = bytes32ToString(toConvert);

            //if it is public, just return the descriptor:
            if(isPub)
            {
                result = attribute;
            }
            else
            {
                //return descriptor if they are an owner or controller
                if(myCOID.isOwner(sha3(pubKey)) || myCOID.isController(sha3(pubKey)))
                {
                    result = attribute;
                }
                else
                {
                    if(tokenManagement.spendTokens(sha3(pubKey),1,bytes32ToString(current.getName()),descriptor))
                    {
                        result = descriptor;
                    }
                    else
                    {
                        result = "Sorry, you don't have any or enough tokens for this data.";
                    }
                }
            }

        }
        else
        {
            result = "Data not found.";
        }
    }


    function getPublicDescriptors(string type1, bytes32 ID) accessContract(msg.sender) returns (bytes32[100] result)
    {
        //params for accessing the relevant IdentityDimension Contract
        bool found = false;
        address addr = 0x0;


        (found,addr) = getDimensionAddress(type1, ID);


        //was able to find the identity contract:
        if(found)
        {
            //get the identity contract:
            IdentityDimension current = IdentityDimension(addr);

            result = current.getPublicDescriptors();
        }

    }

    function getPrivateDescriptors(string type1, bytes32 ID) accessContract(msg.sender) returns (bytes32[100] result)
    {
        //params for accessing the relevant IdentityDimension Contract
        bool found = false;
        address addr = 0x0;


        (found,addr) = getDimensionAddress(type1, ID);


        //was able to find the identity contract:
        if(found)
        {
            //get the identity contract:
            IdentityDimension current = IdentityDimension(addr);

            result = current.getPrivateDescriptors();
        }

    }

    //gives you the address of a dimension contract. It is okay if one of the two parameters are null.
    //This is itended to let the user access the contract either by knowing the type of the dimension
    //("ex. financial history") or by knowing the ID of the dimension.
    function getDimensionAddress(string type1, bytes32 ID) internal returns (bool found, address addr)
    {
        found = false;
        addr = 0x0;

        uint index = 0;

        //if the type is non-null, use this route:
        if(sha3(type1) != sha3(""))
        {
            (found,index) = findIndexOfType(type1);
        }
        else
        {
            if(ID != 0x0)
            {
                (found,index) = findIndexOfID(ID);
            }
        }

        if(found)
        {
            addr = dimensions[index];
        }
    }

    //Finds index by Descriptor. The index can be used by dimensions (an array) to find the address of the contract on the blockchain.
    function findIndexOfType(string type1) internal returns (bool found, uint index)
    {
        found = false;
        index = 0;

        if(dimensionTypes.length > 0)
        {
            for(uint i = 0; i < dimensionTypes.length; i++)
            {
                if(sha3(dimensionTypes[i]) == sha3(type1))
                {
                    found = true;
                    index = i;
                }
            }
        }
    }

    //Finds index of ID. The index can be used by dimensions (an array) to find the address of the contract on the blockchain.
    function findIndexOfID(bytes32 ID) internal returns (bool found, uint index)
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
    function deleteDimensionIndex(uint index) internal returns (bool success)
    {
        dimensions[index] = 0x0;
        IDs[index] = 0x0;
        dimensionTypes[index] = "";
    }



    //helper function for token functions
    function resyncWithCoid() internal
    {
        tokenManagement.resetOwners(myCOID.getOwners());
    }


    //delegate tokens to a delegatee
    function delegate(bytes32 owner, bytes32 delegatee, uint amount, string dimension, uint timeFrame, string accessCategories) accessContract(msg.sender) returns (bool success)
    {
        resyncWithCoid();
        success = tokenManagement.addDelegation(owner,delegatee,amount,dimension,timeFrame, accessCategories);
    }


    function revokeDelegation(bytes32 owner, bytes32 delegatee, uint amount, string dimension, bool all) accessContract(msg.sender) returns (bool success)
    {
        resyncWithCoid();
        success = tokenManagement.revokeDelegation(owner,delegatee,amount,dimension,all);
    }

    function delegateeAmount(bytes32 delegatee, string dimension, string descriptor) accessContract(msg.sender) returns (uint amount)
    {
        amount = tokenManagement.delegateeAmount(delegatee,dimension, descriptor);
    }
}
