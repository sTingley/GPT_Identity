/*The same strategy used in CoreIdentity is used here for arrays:
When you delete something, don't restructure the size; set the value(s) null.
When you add something, find the first null index.

IMPORTANT: This contract deals only with owners of a core identity.*/

contract OwnershipToken {

    bytes32 public ownershipName; //tokenID
    uint public tokenVal; //0 for human, 1 for nonhuman
    uint[] ownershipVals; //owner vals
    bytes32[] ownershipHashes; //their public key hashes

    //temp arrays
    uint[] tempUint;
    bytes32[] tempBytes;


    function OwnershipToken(bool isHuman, bytes32 theOwnershipName) {
        ownershipName = theOwnershipName;

        if (isHuman) {
            tokenVal = 0;

        } else {
            tokenVal = 1;
        }
    }

    //This resets everything.
    function setOwnershipTokenVals(bytes32[10] theOwners, uint[10] theVals) {
        ownershipVals.length = 0;
        ownershipHashes.length = 0;

        //populate into ownershipVals and ownershipHashes
        for (uint i = 0; i < theOwners.length; i++) {
            //to be an owner, you MUST have some stake
            if (theVals[i] != 0) {
                ownershipVals.push(theVals[i]);
                ownershipHashes.push(theOwners[i]);
            }
        }
    }

    function getTokenVal() returns (uint val) {
        val = tokenVal;
    }

    function setOwnershipID(bytes32 theName) {
        ownershipName = theName;
    }

    function getOwnershipID() returns (bytes32 theID) {
        theID = ownershipName;
    }

    function getOwnershipVal(bytes32 addr) returns (uint val) {
        
        uint index;
        bool success;
        (index, success) = findOwner(addr);

        if (success) {
            val = ownershipVals[index];
        } else {val = 0;}
    }

    function updateOwnershipVal(bytes32 addr, uint val) returns (bool txnPassed) {

        uint index;
        bool success;
        (index, success) = findOwner(addr);
        txnPassed = success;//if owner found, txn is feasible

        if (success) {
            ownershipVals[index] = val;
        }
    }

    function addOwner(bytes32 addr, uint val) returns (bool txnPassed) {
        
        uint index;
        bool success;
        (index, success) = findOwner(addr);
        txnPassed = false;

        if (success == false) { //if you didn't find them, you can add them
            txnPassed = true;
        }
        if (!success) {
            ownershipVals.push(val);
            ownershipHashes.push(addr);
        }
    }

    function removeOwner(bytes32 addr) returns (bool txnPassed) {
        
        txnPassed = false;
        uint index;
        bool success;
        (index, success) = findOwner(addr);
        txnPassed = success;//only can remove them if they are found

        tempUint.length = 0;
        tempBytes.length = 0;

        for (uint i = 0; i < ownershipHashes.length; i++) {
            if (i != index) {
                tempUint.push(ownershipVals[i]);
                tempBytes.push(ownershipHashes[i]);
            }
        }
        // ownershipVals.length = tempUint.length;
        // ownershipHashes.length = tempBytes.length;
        // ownershipVals = tempUint;
        // ownershipHashes = tempBytes;
    }

    function isOwner(bytes32 addr) returns (bool isOwner) {
        uint index;
        (index, isOwner) = findOwner(addr);
    }

    //this function will not be made available in coid (internal function)
    function findOwner(bytes32 addr) internal returns (uint index, bool success) {
        index = 0;
        success = false;
        for (uint i = 0; i < ownershipHashes.length; i++) {
            if (ownershipHashes[i] == addr && success == false) {
                success = true;
                index = i;
            }
        }
    }

    function getOwnersList() returns (bytes32[10] list) {
        for (uint i = 0; i < ownershipHashes.length; i++) {
            if (ownershipHashes.length > 0 && i < 10) {
                list[i] = ownershipHashes[i];
            }
        }
    }

    function getOwnersVal() returns (uint[10] list) {
        for (uint i = 0; i < ownershipVals.length; i++) {
            if (ownershipVals.length > 0 && i < 10) {
                list[i] = ownershipVals[i];
            }
        }
    }

}