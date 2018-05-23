contract Dao {
    
    uint i;
    bytes32[35] public validatorList; //hashes of the pubkeys
    string[35] validatorListIP;
    uint indexer = 0;
    uint theIndexer;
    uint total;
    address chairperson;

    event validatorAddedNotification(string validator, string notification);

    modifier onlyBy(address _account) {
        if (_account != chairperson) throw;
        _
    }

    //blockchain acct will deploy this contract
    function Dao() {
        chairperson = msg.sender;
    }

    /*/////////////////////////////////////////////////////
    Called by IDFgatekeeper.js so we use tx.origin
    *//////////////////////////////////////////////////////

    // Get the list of validators
    function getList() onlyBy(tx.origin) returns (bytes32[35] ret) {
        ret = validatorList;
    }

    // Get the total number of validators on the list
    function totalValidator() onlyBy(tx.origin) returns (uint total) {
        total = indexer;
    }
    
    // Addd a new validator to the list if the validator is not in the list yet
    function addValidator(string newValidator, string IP) onlyBy(msg.sender) returns (bool success) {
        
        if (isExist(newValidator) == false) {
            validatorList[indexer] = sha3(newValidator);
            validatorListIP[indexer] = IP;
            //notify the validator for being added in a white list
            validatorAddedNotification(newValidator, "You have been added to the white list");
            indexer++;
            success = true;

        } else {success = false;}
    }
    
   //returns nothing if they don't exist
    function getIP_fromHash(bytes32 validatorAddress) onlyBy(tx.origin) returns (string IP) {
        bool found = false;
        for (uint i = 0; i < indexer; i++) {
            if (validatorList[i] == validatorAddress) {
                found = true;
                IP = validatorListIP[i];
            }
        }

        if (found == false) {throw;}
        
    }
    
    function getIP_fromString(string validatorAddress) onlyBy(tx.origin) returns (string IP) {
        uint index = getTheIndexer(validatorAddress);
        IP = validatorListIP[index];
    }
    
    //Remove a validator who is in the list
    function removeValidator(string oldValidator) onlyBy(msg.sender) {

        if (isExist(oldValidator) == true) {
            theIndexer = getTheIndexer(oldValidator);
            validatorList[theIndexer] = 0x0;
            validatorListIP[theIndexer] = "";

            for (i = 0; i < indexer; i++) {
                if (i >= theIndexer && i < indexer) {
                    validatorList[i] = validatorList[i + 1];
                    validatorListIP[i] = validatorListIP[i + 1];
                }
            }
            indexer--;

        } else {throw;}
    }

    // Find the index where is hash of pubkey stored in the list
    function getTheIndexer(string validatorInput) internal returns (uint theIndexer) {
        
        theIndexer = 0;
        if (isExist(validatorInput) == true) {
            // isExist function will hash validatorInput
            for (i = 0; i < indexer; i++) {
                if (validatorList[i] == sha3(validatorInput)) {
                    theIndexer = i;
                }
            }

        }
    }

    // Check if the validator is on the white list
    function isExist(string validatorInput) internal returns (bool result) {
        //JJ: address -> bytes32
        result = false;
        for (i = 0; i < indexer; i++) {

            //compare the hash of validator input against the list
            if (validatorList[i] == sha3(validatorInput)) {
                result = true;
            }
        }
    }
    
    // when the contract is deployed, it only allows the creator to kill the contract
    function remove() onlyBy(tx.origin) {
        selfdestruct(chairperson);
    }

}
