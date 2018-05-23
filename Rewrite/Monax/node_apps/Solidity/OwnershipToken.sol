/*********************************************************************************************
This contract is used as a dependent token contract imported in CoreIdentity.sol
It will never be accessed directly by an application but instead by a CoreIdentity contract

This contract deals only with owners of a CoreIdentity

The strategy for arrays in this contract: avoid looping when unnecessary to find first empty index
    -When you delete something, don't restructure the size; set the value(s) null.
    -When you add something, find the first null index.

Every single CoreIdentity.sol instance uses an instance of OwnershipToken.sol
*********************************************************************************************/

pragma solidity ^0.4.4;
contract OwnershipToken {

    bytes32 public ownershipName; //set in the constructor
    uint public tokenVal; //0 for human, else 1 set in the constructor
    uint[] ownershipVals; //OwnershipToken values for owners set in 'setOwnershipTokenVals'
    bytes32[] ownershipHashes; //hashed secp256k1 public keys of CoreIdentity owners set in 'setOwnershipTokenVals'

    //ACTION REQUIRED: these are only used in 'removeOwner' ... should be declared there, not globally
    uint[] tempUint;
    bytes32[] tempBytes;


    /*OwnershipToken is initialized inside the CoreIdentity.sol method 'startCoid' which is called
    by both the IDFGatekeeper Node app (isHuman=true) and the MyGatekeeper Node app (isHuman=false)
    The 'isHuman' value and subsequently the tokenVal is significant in that humans cannot be owned
    */
    function OwnershipToken(bool isHuman, bytes32 theOwnershipName) {
        ownershipName = theOwnershipName;

        if (isHuman) {
            tokenVal = 0;
        } else {
            tokenVal = 1;
        }
    }

    /*This function is called inside the CoreIdentity.sol method 'startCoid' right
    after this contract is initialized/deployed
    ACTION REQUIRED: this logic could be moved inside the constructor thus reducing the # of function calls inside 'startCoid'
    */
    function setOwnershipTokenVals(bytes32[10] theOwners, uint[10] theVals) {
        ownershipVals.length = 0;
        ownershipHashes.length = 0;

        //populate into ownershipVals and ownershipHashes
        for (uint i = 0; i < theOwners.length; i++) {
            //to be an owner, you MUST have some stake
            if( (theVals[i] != 0 || tokenVal == 0) && theOwners[i] != 0x0 ) {
                ownershipVals.push(theVals[i]);
                ownershipHashes.push(theOwners[i]);
            }
        }
    }

    /*This function will return the ownership token quantity for inputted (hashed) pubkey-
    called inside the CoreIdentity method 'myTokenAmount'
    */
    function getOwnershipVal(bytes32 addr) returns (uint val) {

        uint index;
        bool success;
        (index, success) = findOwner(addr);

        if (success) {
            val = ownershipVals[index];
        } else {val = 0;}
    }

    /*This function will update the OwnershipToken value for an inputted owner
    This function is called *TWICE* inside the CoreIdentity.sol method 'giveTokens'
    so that each owner's OwnershipToken quantity is updated properly
    */
    function updateOwnershipVal(bytes32 addr, uint val) returns (bool txnPassed) {

        uint index;
        bool success;
        (index, success) = findOwner(addr);
        txnPassed = success;//if owner found, txn is feasible

        if (success) {
            ownershipVals[index] = val;
        }
    }
    
    /*This function will add an owner and his/her OwnershipToken quantity to the contract's storage-
    This function assumes that the caller is an owner as only an owner can add more owners
    This function assumes that human identities cannot add additional owners
    */
    function addOwner(bytes32 addr, uint val) returns (bool txnPassed) {

        if (tokenVal == 0) { //cannot add an owner to a 'human' CoreIdentity
            txnPassed = false;

        } else {
            uint index;
            bool success;
            (index, success) = findOwner(addr);
            txnPassed = false;

            if (!success) {
                txnPassed = true; //if you didn't find them, you can add them
                ownershipVals.push(val);
                ownershipHashes.push(addr);
            }
        }    
        
    }

    /*This function will remove an owner from the contract's storage
    ACTION REQUIRED: this function is incomplete. We need to decide when we can actually remove owners
    */
    function removeOwner(bytes32 addr) returns (bool txnPassed) {

        if (tokenVal == 0) {return false;}
        
        txnPassed = false;
        uint index;
        bool success;
        (index, success) = findOwner(addr);
        txnPassed = success; //only can remove them if they are found

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

    //This function will return a boolean vaue to CoreIdentity.sol-
    function isOwner(bytes32 addr) returns (bool isOwner) {
        uint index;
        (index, isOwner) = findOwner(addr);
    }

    //This function will be used internally to find the index of an inputted owner-
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

    /*This function will return the ownerList (hashed secp256k1 public keys) for the owners-
    Called in CoreIdentity.sol 'addOwner', 'removeOwner', 'giveTokens'
    */
    function getOwnersList() returns (bytes32[10] list) {
        for (uint i = 0; i < ownershipHashes.length; i++) {
            if (ownershipHashes.length > 0 && i < 10) {
                list[i] = ownershipHashes[i];
            }
        }
    }

    /*This function will return the OwnershipToken values for the owners-
    Called in CoreIdentity.sol 'addOwner', 'removeOwner', 'giveTokens'
    */
    function getOwnersVal() returns (uint[10] list) {
        for (uint i = 0; i < ownershipVals.length; i++) {
            if (ownershipVals.length > 0 && i < 10) {
                list[i] = ownershipVals[i];
            }
        }
    }

}