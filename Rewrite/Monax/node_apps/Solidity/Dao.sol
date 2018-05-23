/*This contract's methods are called by Dao.js and IDFGateekeper.js when creating an identity proposal for a human

NOTES:
    -By the time we are using IDFGateekeeper we should have already added validators to the list
    -A string pubKey input implies an unhashed key as secp256k1 keys are 66 characters long*/

pragma solidity ^0.4.4;
contract Dao {

    //stored the hashed pubkeys of the validators in a list
    //Currently size 35 but should be changed to a mapping later
    bytes32[35] public validatorList;

    string[35] validatorListIP; //validator IPs. For PoCs we have not been checking these in any Node app

    uint validatorCount = 0; //even though validatorList is of size 35 we may not have 35 non-zero validators
    
    address chairperson; //Monax account which deployed the contract
    //NOTE: currently cannot be changed .. will be updated when using many Monax accounts

    //called inside addValidator and not currently caught by any app
    event validatorAddedNotification(string validator, string notification);

    //This modifier is used in every function to make sure it is being called by the proper Monax account.
    modifier onlyBy(address _account) {
        if (_account != chairperson) {throw;}
        _;
    }

    //Constructor
    function Dao() {
        chairperson = msg.sender;
    }

    /*/////////////////////////////////////////////////////
    Called by IDFgatekeeper.js so we use tx.origin
    *//////////////////////////////////////////////////////

    //Get the list of validators
    function getList() onlyBy(tx.origin) returns (bytes32[35] ret) {

        ret = validatorList;
    }

    //Get the total number of unique validators on the list
    function totalValidator() onlyBy(tx.origin) returns (uint total) {

        total = validatorCount;
    }

    //Add a validator to the list... here msg.sender == Monax account
    function addValidator(string newValidator, string IP) onlyBy(msg.sender) returns (bool success) {

        //if the validator is not in the list yet
        if (isExist(newValidator) == false) {

            validatorList[validatorCount] = keccak256(newValidator);
            validatorListIP[validatorCount] = IP;
            //notify the validator for being added in a white list
            validatorAddedNotification(newValidator, "You have been added to the white list");
            validatorCount++;
            success = true;

        } else {success = false;}
    }
    
    //Not currently called by any app. Returns all zeros if validator not found
    function getIPfromHash(bytes32 validatorAddress) onlyBy(tx.origin) returns (string IP) {
        
        for (uint i = 0; i < validatorCount; i++) {
            if (validatorList[i] == validatorAddress) {
                IP = validatorListIP[i];
            }
        }
    }

    //Not currently called by any app. Returns all zeros if validator not found
    function getIPfromString(string validatorAddress) onlyBy(tx.origin) returns (string IP) {
        
        uint index = getIndex(validatorAddress);
        IP = validatorListIP[index];
    }

    //Remove a validator who is in the list
    function removeValidator(string oldValidator) onlyBy(tx.origin) returns (bool success) {

        success = isExist(oldValidator);
        if (success) {
            uint theIndex = getIndex(oldValidator);
            validatorList[theIndex] = 0x0;
            validatorListIP[theIndex] = "";

            for (uint i = 0; i < validatorCount; i++) {
                if (i >= theIndex && i < validatorCount) {
                    validatorList[i] = validatorList[i + 1];
                    validatorListIP[i] = validatorListIP[i + 1];
                }
            }
            validatorCount--;
        }
    }

    //Find the index of the validator if they exist from entering the unhashed secp256k1 pubkey
    function getIndex(string pubKey) internal returns (uint theIndex) {

        if (isExist(pubKey) == true) {
            // isExist function will hash validatorInput
            for (uint i = 0; i < validatorCount; i++) {
                if (validatorList[i] == keccak256(pubKey)) {
                    theIndex = i;
                }
            }
        }
    }

    //Check if the unhashed secp256k1 pubkey matches any validator in the contract
    function isExist(string pubKey) internal returns (bool result) {

        result = false;
        for (uint i = 0; i < validatorCount; i++) {
            //compare the input pubKey against the hashed pubKey list
            if (validatorList[i] == keccak256(pubKey)) {
                result = true;
            }
        }
    }

    //When the contract is deployed, it only allows the creator to kill the contract
    function remove() onlyBy(tx.origin) {

        selfdestruct(chairperson);
    }

}
