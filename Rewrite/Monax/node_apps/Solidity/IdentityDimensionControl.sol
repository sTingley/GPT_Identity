import "CoreIdentity.sol";
import "IdentityDimension.sol";
import "IdentityDimensionControlToken.sol";

pragma solidity ^0.4.4;
contract IdentityDimensionControl {

    CoreIdentity myCOID;
    IdentityDimensionControlToken tokenManagement;

    address[] dimensions; //addresses of the dimension contract at index i
    bytes32[] IDs; //IDs of the dimension contract at index i
    string[] dimensionTypes; //Descriptor of each dimension contract (example "financial history")

    bytes32[] accessContracts; //ACCOUNTS THAT CAN ACCESS DIMENSIONS THRU THIS CONTRACT

    bytes bytesString;
    bytes resultBytes;

    bool mutex;//mutex for bytes32 to String

    bytes32 chairperson;

    enum States { Initialized, Active, Recovery }

    States state = States.Initialized;

    modifier atState(States _state) {
        if (_state != state) throw;
        _;
    }

    //This modifier calls nextState after the function is done.
    modifier transitionNext() {
        nextState();
        _;
    }

    function nextState() internal {
        state = States(uint(state) + 1);
    }

    modifier accessCheck(address caller) {
        if (sha3(caller) != chairperson) {
            throw;
        }
        _;
    }

    modifier accessContract(address caller) {
        if (!isPermissioned(caller) && sha3(caller) != chairperson) {
            throw;
        }
        _;
    }

    //ST: COME BACK TO THIS
    function isPermissioned(address caller) internal returns (bool result) {

        result = false;
        if (accessContracts.length > 0) {
            for (uint i = 0; i < accessContracts.length; i++) {

                if (result == false && sha3(msg.sender) == accessContracts[i]) {
                    result = true;
                }
            }
        }

    }

    /*/////////////////////////////////////////////////////
        "constructor": CAN ONLY BE CALLED ONCE!
            (force chairperson to be null when called)
    *//////////////////////////////////////////////////////
    function IdentityDimensionControlInstantiation(address CoidAddr, address tokenAddr)
    atState(States.Initialized) transitionNext() returns (bytes32[10] val) {

        if (chairperson == 0x0) {

            mutex = true;

            bytesString.length = 32;

            myCOID = CoreIdentity(CoidAddr);
            //bytes32[10] memory test;
            //test[0]= 0x6131;
            //test[1]= 0x6331;

            if (tokenAddr == 0x0){
                tokenManagement = new IdentityDimensionControlToken(myCOID.getOwners(),myCOID.getControllers());

            } else { //tokenAddr != 0x0
                tokenManagement = IdentityDimensionControlToken(tokenAddr);
                changeChairperson();
                resyncWithCoid();
            }

            //msg.sender will be the blockchain account
            chairperson = sha3(msg.sender);
            val = myCOID.getOwners();
        }

    }

    function changeChairperson() internal {
        tokenManagement.changeChairperson();
    }

    function getTokenAddr() returns(address) {
        return(tokenManagement);
    }

    function getDimensionLength() returns(uint) {
        return(dimensions.length);
    }

    function replaceTokenOwnerController(bytes32 oldOwner, bytes32 newOwner){
        tokenManagement.replaceOwnerController(oldOwner,newOwner);
    }

    function replaceTokenDelegatee(bytes32 oldDelegatee, bytes32 newDelegatee){
        tokenManagement.replaceDelegatee(oldDelegatee, newDelegatee);
    }

    function getGlobalsByIndex(uint index) returns(address, bytes32, string){
        return(dimensions[index],IDs[index],dimensionTypes[index]);
    }

    function setGlobalsByIndex(uint index, address addr, bytes32 id, string type1){
        dimensions.push(addr);
        IDs.push(id);
        dimensionTypes.push(type1);
        IdentityDimension dim = IdentityDimension(addr);
        dim.changeChairperson();
    }

    //notice it is the hash -- not the address
    function removePermission(bytes32 toRemove) accessCheck(msg.sender) returns (bool success)
    {
        success = false;

        //if(sha3(msg.sender) == chairperson)
        //{
        if (accessContracts.length > 0) {
            for (uint i = 0; i < accessContracts.length; i++) {

                if (accessContracts[i] == toRemove) {
                    accessContracts[i] = 0x0;
                    success = true;
                }
            }
        }
        //}
    }

    //notice it is the hash -- not the address
    function addPermission(address toAdd) accessCheck(msg.sender) returns (bool success) {

        success = false;

        //if(sha3(msg.sender) == chairperson) { ST: added modifier
            accessContracts.push(sha3(toAdd));
            success = true;
        //}
    }

    //STRING HELPER FUNCTION
    function bytes32ToString(bytes32 x) constant returns (string val) {

        val = "";
        if (mutex == true) {

            mutex = false;
            uint charCount = 0;
            resultBytes.length = 0;

            for(uint j = 0; j < 32; j++) {
                byte char = byte(bytes32(uint(x)*2**(8*j)));
                if (char != 0) {
                    bytesString[charCount] = char;
                    charCount++;
                }
            }

            for (j = 0; j < charCount; j++) {
                resultBytes.push(bytesString[j]);
            }

            val = string(resultBytes);
            mutex = true;
        }
    }

    function stringToBytes32(string memory source) internal returns (bytes32 result) {
        assembly {
            result := mload(add(source, 32))
        }
    }

    //TODO: add function isOwner to CoreIdentity
    function CreateDimension(bytes32 pubKey, bytes32 uniqueID, string typeInput, uint flag)
    accessContract(msg.sender) returns (bool success, bytes32 callerHash, address test, bytes32 theID) {

        //TODO:make typeInput be unique
        success = false;
        callerHash = pubKey;

        if(myCOID.isOwner(pubKey)) {
            //Create a new identity dimension contract:
            IdentityDimension creation = new IdentityDimension(uniqueID,stringToBytes32(typeInput),flag);
            test = address(creation);

            //if there is an empty index, add it there:
            bool found = false;
            uint emptyIndex = 0;
            if (dimensions.length > 0) {
                for (uint i = 0; i < dimensions.length; i++) {
                    if (dimensions[i] == 0x0) {
                        emptyIndex = i;
                        found = true;
                    }
                }
            }

            if (found == false) { //populate the identity dimension header
                dimensions.push(address(creation));
                theID = creation.getID();
                IDs.push(theID);
                dimensionTypes.push(typeInput);

            } else {
                dimensions[emptyIndex] = address(creation);
                theID = creation.getID();
                IDs[emptyIndex] = theID;
                dimensionTypes[emptyIndex] = typeInput;
            }

            success = true;
        }
    }


    //TODO: Threshold Consensus???
    //Although this function requires both parameters, you only have to provide one and can input the other null
    function RemoveDimension(string caller, string descriptor, bytes32 ID) accessContract(msg.sender) returns (bool result) {
        result = false;

        uint index = 0;
        bool found;

        if (myCOID.isOwner(caller)) {

            //if it is not null descriptor, use this route to get the index
            if (sha3(descriptor) != sha3("")) {
                (found,index) = findIndexOfType(descriptor);

                if (found) {
                    //get the contract by address
                    IdentityDimension current1 = IdentityDimension(dimensions[index]);
                    current1.kill();
                    deleteDimensionIndex(index);
                    result = true;
                }

            } else {

                //if it is not null ID, we must use this route (unless both are null, they called the function wrong)
                if (ID != 0x0) {
                    (found,index) = findIndexOfID(ID);

                    if (found) {
                        IdentityDimension current2 = IdentityDimension(dimensions[index]);

                        current2.kill();
                        result = true;
                        deleteDimensionIndex(index);

                    } //else { result = false; }

                }//result will still be false so we don't need an else
                //else { result = false; }
            }

        }//isOwner

    }
    //owner check in control contract
    function addController(bytes32 owner, bytes32 newController)accessContract(msg.sender) returns (bool success){
        //resyncWithCoid();
        if( myCOID.isOwner(newController) ) {
            success = false;
        } else {
            success = tokenManagement.addController(owner,newController);
        }
    }
    //owner check in control contract
    function removeController(bytes32 owner,bytes32 newController)accessContract(msg.sender) returns (bool success){
        //resyncWithCoid();
        success = tokenManagement.removeController(owner,newController);
    }

    //changes the descriptor
    function changeDescriptor(bytes32 pubKey1, bytes32 type1, bytes32 ID, bytes32 oldDescriptor, bytes32 newDescriptor) accessContract(msg.sender) returns (bool success) {
        success = false;
        //params for accessing the relevant IdentityDimension Contract
        bool found = false;
        address addr = 0x0;

       (found,addr) = getDimensionAddress(bytes32ToString(type1), ID);

        if (found) {
            IdentityDimension current = IdentityDimension(addr);
            success = current.changeDescriptor(oldDescriptor,newDescriptor);
        }
    }



    /*NOTE:
    Maximum of one param (Type or ID) can be null.
    This function adds a (attribute/descriptor) entry to a dimension.
    They must be an Owner or Controller to call this function.*/
    function addEntry(bytes32 pubKey1, bytes32 type1, bytes32 ID, bytes32 descriptor, bytes32 attribute, bytes32 attribute2, bytes32 attribute3, uint flag)
    accessContract(msg.sender) returns (bool result,string test) {

        //params for accessing the relevant IdentityDimension Contract
        result = false;
        bool found = false;
        address addr = 0x0;
test = bytes32ToString(type1);

        if(myCOID.isController(pubKey1) || myCOID.isOwner(pubKey1)) {

            (found,addr) = getDimensionAddress(bytes32ToString(type1), ID);

            //able to find the identity IdentityDimension contract:
            if (found) {
                //get the identity contract:
                IdentityDimension current = IdentityDimension(addr);
                //add the entry to the identity contract:
                result = current.addEntry(descriptor,attribute,attribute2,attribute3, flag);
            }
        }
    }

    /*NOTE:
    Maximum of one param (Type or ID) can be null.
    This function removes an (attribute/descriptor) entry from a dimension.
    They must be an Owner or Controller to call this function.*/
    function removeEntry(bytes32 pubKey, bytes32 type1, bytes32 ID, bytes32 descriptor) accessContract(msg.sender) returns (bool result) {

        //params for accessing the relevant IdentityDimension Contract
        result = false;
        bool found = false;
        address addr = 0x0;

        if( myCOID.isOwner(pubKey) || myCOID.isController(pubKey) ) {

            (found,addr) = getDimensionAddress(bytes32ToString(type1), ID);

            //able to find the identity contract:
            if (found) {
                //get the identity contract:
                IdentityDimension current = IdentityDimension(addr);
                //add the entry to the identity contract:
                result = current.removeEntry(descriptor);
            }
        }
    }

    /*Maximum of one param (Type or ID) can be null. This function allows you to change the attribute and/or flag of an entry.
    NOTE:
        If you do not wish to change the descriptor, make it 0x0
        If you do not wish to change the flag, make it 2.
        If you wish to change the name of the attribute, you will have to delete it and then add it.*/
    function updateEntry(bytes32 pubKey, bytes32 type1, bytes32 ID, bytes32 descriptor, bytes32 attribute, bytes32 attribute2, bytes32 attribute3, uint flag)
    accessContract(msg.sender) returns (bool result) {

        result = false;
        bool found = false;
        address addr = 0x0;

        if (myCOID.isOwner(pubKey) || myCOID.isController(pubKey)) {

            (found,addr) = getDimensionAddress(bytes32ToString(type1), ID);

            if (found) {
                //get the identity contract:
                IdentityDimension current = IdentityDimension(addr);
                //add the entry to the identity contract:
                result = current.update(descriptor,attribute,attribute2,attribute3,flag);
            }
        }
    }


    //type1 is the dimension name, ID is the dimension ID
    function readEntry(bytes32 pubKey, bytes32 type1, bytes32 ID, bytes32 descriptor)
    accessContract(msg.sender) returns (bytes32 toConvert, bytes32 toConvert2, bytes32 toConvert3, bool found) {

        //params for accessing the relevant IdentityDimension Contract
        found = false;
        address addr = 0x0;
        (found,addr) = getDimensionAddress(bytes32ToString(type1), ID);

        //were able to find the identity contract:
        if (found) {

            IdentityDimension current = IdentityDimension(addr);
            bool success = false;
            bool isPub = false;
            found = false;

            //read the entry from the identity contract:
            (toConvert,toConvert2,toConvert3,success,isPub) = current.readEntry(descriptor);

            //if it is public, just return the descriptor:
            if(isPub) {

                if(!success) { 
                    //not allowed to read, return dummy data
                    toConvert=0x44617461206e6f7420666f756e64;
                    toConvert2=0x0;
                    toConvert3=0x0;
                }

            } else {
                //private descriptor: return if they are an owner or controller **removed sha3 as we are sending in hased value
                if(myCOID.isOwner(pubKey) || myCOID.isController(pubKey) || tokenManagement.isController(pubKey) ) {

                    //we already set toConvert, toConvert2, toConvert3 when calling readEntry

                } else {

                    if (tokenManagement.spendTokens(pubKey,1,bytes32ToString(current.getName()), bytes32ToString(descriptor))) {
                        found = true;

                    } else {
                        toConvert=0x536f7272792c20796f7520646f6e2774206861766520616e79206f7220656e6;
                        toConvert2=0xf75676820746f6b656e7320666f72207468697320646174612e;
                        toConvert3=0x0;
                    }

                }
            }

        } else { //we did not find the entry by name or ID
            toConvert=0x436f6e7472616374206e6f7420666f756e642e0a0a;
            toConvert2=0x0;
            toConvert3=0x0;
        }

    }


    function getPublicDescriptors(bytes32 type1, bytes32 ID) accessContract(msg.sender) returns (bytes32[100] result) {

        //params for accessing the relevant IdentityDimension Contract
        bool found = false;
        address addr = 0x0;
        (found,addr) = getDimensionAddress(bytes32ToString(type1), ID);

        //was able to find the identity contract:
        if (found) {
            IdentityDimension current = IdentityDimension(addr);
            result = current.getPublicDescriptors();
        }
    }

    function getPrivateDescriptors(bytes32 type1, bytes32 ID) accessContract(msg.sender) returns (bytes32[100] result) {

        //params for accessing the relevant IdentityDimension Contract
        bool found = false;
        address addr = 0x0;
        (found,addr) = getDimensionAddress(bytes32ToString(type1), ID);

        //was able to find the identity contract:
        if (found) {
            IdentityDimension current = IdentityDimension(addr);
            result = current.getPrivateDescriptors();
        }
    }

    //gives you the address of a dimension contract. It is okay if one of the two parameters are null.
    //This is itended to let the user access the contract either by knowing the type of the dimension
    //("ex. financial history") or by knowing the ID of the dimension.
    function getDimensionAddress(string type1, bytes32 ID) internal returns (bool found, address addr) {

        found = false;
        addr = 0x0;
        uint index = 0;

        //if the type is non-null, use this route:
        if (sha3(type1) != sha3("")) {
            (found,index) = findIndexOfType(type1);

        } else {

            //if ID is not 0x0, use this route:
            if (ID != 0x0) {
                (found,index) = findIndexOfID(ID);
            }
        }

        if (found) { addr = dimensions[index]; }
    }

    //Finds index by Descriptor. The index can be used by dimensions (an array) to find the address of the contract on the blockchain.
    function findIndexOfType(string type1) internal returns (bool found, uint index) {

        found = false;
        index = 0;

        if (dimensionTypes.length > 0) {
//found = true;
            for (uint i = 0; i < dimensionTypes.length; i++) {
                if (sha3(dimensionTypes[i]) == sha3(type1)) {
                    found = true;
                    index = i;
                }
            }
        }
    }

function test(uint x) returns(address,string) {
return (dimensions[x],dimensionTypes[x]);
}
    //Finds index of ID. The index can be used by dimensions (an array) to find the address of the contract on the blockchain.
    function findIndexOfID(bytes32 ID) returns (bool found, uint index) {

        found = false;
        index = 0;

        if (IDs.length > 0) {

            for (uint i = 0; i < IDs.length; i++) {
                if (IDs[i] == ID) {
                    found = true;
                    index = i;
                }
            }
        }
    }

    //deletes the values at index i:
    function deleteDimensionIndex(uint index) internal returns (bool success) {
        dimensions[index] = 0x0;
        IDs[index] = 0x0;
        dimensionTypes[index] = "";
    }

    //helper function for synching IdentityDimensionControlToken reference
    function resyncWithCoid() internal {
        tokenManagement.resetOwners(myCOID.getOwners());
        tokenManagement.resetControllers(myCOID.getControllers());
    }

    //delegate tokens to a delegatee (we check if they are an owner or controller in IdentityDimensionControlToken)
    function delegate(bytes32 owner, bytes32 delegatee, uint amount, string dimension, uint timeFrame, string accessCategories) accessContract(msg.sender) returns (bool success) {
        //resyncWithCoid();
        if( myCOID.isOwner(delegatee) || myCOID.isController(delegatee) ){success = false;}
        else{
            success = tokenManagement.addDelegation(owner,delegatee,amount,dimension,timeFrame, accessCategories);
        }
    }

    //revoke delegation (we check if they are an owner or controller in IdentityDimensionControlToken)
    function revokeDelegation(bytes32 owner, bytes32 delegatee, uint amount, string dimension, bool all) accessContract(msg.sender) returns (bool success) {
        //resyncWithCoid();
        success = tokenManagement.revokeDelegation(owner,delegatee,amount,dimension,all);
    }

    function delegateeAmount(bytes32 delegatee, string dimension, string descriptor) accessContract(msg.sender) returns (uint amount) {
        amount = tokenManagement.delegateeAmount(delegatee,dimension, descriptor);
    }

    //kills the contract
    function kill() accessCheck(msg.sender) {
        selfdestruct(this);
    }

}