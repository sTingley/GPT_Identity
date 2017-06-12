contract Dao {

    uint i;
    bytes32[35] public validatorList; //JJ: changed adress[35] to byte32[35]
    // we are dealing with hashings of the pubkeys for the validator not address
    // this array stores the hashes of the pubkeys as validator list

    string[35] validatorListIP;

    uint indexer = 0;
    uint theIndexer;
    uint total;
    address owner = msg.sender;
    event validatorAddedNotification(string validator, string notification); //JJ: address -> bytes32



    // Get the list of validators on the list
    function getList() returns (bytes32[35] ret){ //JJ: address -> bytes32
        ret = validatorList;
    }




    // Addd a new validator to the list if the validator is not in the list yet
    function addValidator(string newValidator, string IP) returns (bool success)
    { // JJ: address -> bytes32, add the pubkey of the validator and hash it
        if (isExist(newValidator) == false)   // getTheIndexer function will take oldValidator as input and hash it
        {
            validatorList[indexer] = sha3(newValidator);
            validatorListIP[indexer] = IP;
            //notify the validator for being added in a white list
            validatorAddedNotification(newValidator, "You have been added to the white list");
            indexer++;
            success = true;
        }
        else {
            success = false;
        }
    }



    // Get the total number of validators on the list
    function totalValidator() returns (uint total)
    {
        total = indexer;
    }


    // Check if the validator is on the white list
    //INPUT: unhashed
    function isExist(string validatorInput) returns (bool result) //JJ: address -> bytes32
    {
        result = false;
        for (i = 0; i < indexer; i++) {
            if (validatorList[i] == sha3(validatorInput)) //JJ: compare the hash of validator input against the list
            {
                result = true;
            }
        }
    }


   //returns nothing if they don't exist
    function getIP_fromHash(bytes32 validatorAddress) returns (string IP)
    {
        bool found = false;
        for(uint i = 0; i < indexer; i++)
        {
            if(validatorList[i] == validatorAddress)
            {
                found = true;
                IP = validatorListIP[i];
            }
        }
        if(found == false)
        {
            throw;
        }

    }

    function getIP_fromString(string validatorAddress) returns (string IP)
    {
        uint index = getTheIndexer(validatorAddress);
        IP = validatorListIP[index];

    }


    // Find the indexer where is hash of pubkey stored in the list
    function getTheIndexer(string validatorInput) returns (uint theIndexer) //JJ: address -> bytes32
    {
        theIndexer = 0;
        if (isExist(validatorInput) == true) // isExist function will take oldValidator as input and hash it
        {
            for (i = 0; i < indexer; i++) {
                if (validatorList[i] == sha3(validatorInput)) {
                    theIndexer = i;
                }
            }


        }
    }


    //Remove a validator who is in the list
    function removeValidator(string oldValidator) //JJ: address -> bytes32
    {
        //since isExist takes the sha, and so does getTheIndexer, we shouldn't hash here
        if (isExist(oldValidator) == true) // isExist function will take oldValidator as input and hash it
        {
            theIndexer = getTheIndexer(oldValidator);// getTheIndexer function will take oldValidator as input and hash it
            validatorList[theIndexer] = 0x0;
            validatorListIP[theIndexer] = "";
            for (i = 0; i < indexer; i++) {
                if (i >= theIndexer && i < indexer) {
                    validatorList[i] = validatorList[i + 1];
                    validatorListIP[i] = validatorListIP[i + 1];
                }
            }
            indexer--;
        }
        else {
            throw;
        }
    }


    // when the contract is deployed, it only allows the creator to kill the contract
    function remove() {
        if (msg.sender == owner) {
            selfdestruct(owner);
        }
    }
}
