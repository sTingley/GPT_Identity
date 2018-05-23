/*The same strategy used in IdentityDimension is used here for arrays:
When you delete something, don't restructure the size; set the value(s) null.
When you add something, find the first null index.

README: This contract is intended to be used as a token contract in CoreIdentity

IMPORTANT: This contract deals only with controllers of a core identity.*/

contract ControlToken {

    bytes32 chairperson;

    struct delegation {
        bytes32 owner;
        bytes32 delegatee;
        uint amount;
        uint expiration;
    }

    //avoid looping to find first empty index when unnecessary in arrays
    uint controllerHashesIndexer;
    uint tokensOwnedIndexer;

    delegation[] delegations;
    bytes32[10] owners;
    bytes32[] public controllerHashes;
    uint[] public tokensOwned;
    bytes32[] public tempBytes;

    modifier access(address addr) {
        //only this contract and the chairperson can call this contract
        if (sha3(addr) != chairperson && addr != address(this)) {
            throw;
        }
        _
    }

    //*There are only ten owners, because a core identity has maximum ten owners.
    function ControlToken(bytes32[10] theOwnersHash, bytes32[10] theControllerHashes, uint[10] theTokensOwned) {
        
        owners = theOwnersHash;
        chairperson = sha3(msg.sender);

        controllerHashesIndexer = 0;
        tokensOwnedIndexer = 0;

        //set indexer for controllerHashes:
        for (uint i = 0; i < theControllerHashes.length; i++) {
            if (theControllerHashes[i] != "") {
                controllerHashes.push(theControllerHashes[i]);
                controllerHashesIndexer++;
            }
        }

        //set indexer for tokensOwned:
        for (uint j = 0; j < theControllerHashes.length; j++) {
            if (tokensOwnedIndexer < controllerHashesIndexer) {
                tokensOwned.push(theTokensOwned[j]);
                tokensOwnedIndexer++;
            }
        }

    }//constructor

    //testing purposes
    function getOwnersList() returns (bytes32[10] list) {
        list = owners;
    }

    function getControllersList() returns (bytes32[10] list) {
        for (uint i = 0; i < controllerHashes.length; i++) {
            if (controllerHashes.length > 0 && i < 10) {
                list[i] = controllerHashes[i];
            }
        }
    }
    function getControllerVal() returns (uint[10] list) {
        for (uint i = 0; i < tokensOwned.length; i++) {
            if (tokensOwned.length > 0 && i < 10) {
                list[i] = tokensOwned[i];
            }
        }
    }

    //This resyncs the owner list
    //IdentityDimensionControl to get owners from coid and set it here
    function resetOwners(bytes32[10] newOwners) access(msg.sender) {
        owners = newOwners;
    }


    //Helper function. Tells if the owner exists. The index returned is their position in the array, and is relevant if exists = true.
    function ownerExists(bytes32 ownerHash) access(msg.sender) returns (bool exists, uint index) {
        exists = false;
        index = 0;

        for (uint i = 0; i < owners.length; i++) {
            /*checking exists == false below saves lookups because:
            the way the compiler works is if the first condition in an "and" statement is false,
            it won't check the second*/
            if (exists == false && owners[i] == ownerHash) {
                exists = true;
                index = i;
            }
        }
    }

    //This function adds a delegation to our delegation arrays.
    function delegate(bytes32 owner, bytes32 delegatee, uint amount, uint timeFrame) access(msg.sender) returns (bool success) {

        //only allow the delegation if the owner has tokens and exists:
        uint index = 0;
        bool isController = false;
        (success, index) = this.ownerExists(owner);

        if (success == false) {
            (index, success) = this.findIndexOfController(owner);
            isController = true;
            if (tokensOwned[index]<amount) {
                success = false;
            }
        }

        if (success) {
            //create the delegation on the fly
            delegation memory toAdd;
            uint expiration = now + timeFrame;
            //set params
            toAdd.owner = owner;
            toAdd.delegatee = delegatee;
            toAdd.amount = amount;         
            toAdd.expiration = expiration;

            //this check necessary to avoid out of bounds error in looping:
            if (delegations.length == 0) {
                //push to array:
                delegations.push(toAdd);
                if (isController) {
                    tokensOwned[index] -= amount;
                }

            } else {
                //find the first empty index in the array (if it exists)
                bool emptyIndex = false;
                uint Index = 0;

                for (uint i = 0; i < delegations.length; i++) {
                    //checking emptyIndex first saves unnecessary lookups if something is already found
                    if (emptyIndex && (delegations[i].amount == 0 || delegations[i].expiration >= now)) {
                        emptyIndex = true;
                        Index = i;
                    }
                }

                if (emptyIndex) {
                    delegations[Index] = toAdd;

                } else {
                    delegations.push(toAdd);
                    if (isController) {
                        tokensOwned[index] -= amount;
                    }
                }
            }
        }//if(success)
    }


    //This function revokes delegations from a owner to a delegatee.
    //If the flag all is set to true, then it revokes through all dimensions, all tokens from that delegatee to the owner
    //In that case, the caller of the function can set amount and dimension null.
    //If the flag all is set to false, then it revokes the amount in the specified dimension.
    //IMPORTANT: since presumably the tokens are given on some agreement/payment, perhaps this function should be implemented by a DAO court
    function revokeDelegation(bytes32 owner, bytes32 delegatee, uint amount, bool all) access(msg.sender) returns (bool success) {
        success = false;

        if (all) { //if the flag is true, just revoke everything from the owner
            if (delegations.length > 0) {
                for (uint i = 0; i < delegations.length; i++) {
                    if (delegations[i].owner == owner && delegations[i].delegatee == delegatee) {
                        clearDelegation(i); //this function returns the tokens to the owner
                    }
                }
            }

        } else {

            //logic below is similar to the function spendTokens
            //first make sure they have the amount FROM that owner:
            uint actualAmount = 0;

            if (delegations.length > 0) {
                for (uint z = 0; z < delegations.length; z++) {
                    if (delegations[z].delegatee == delegatee && delegations[z].owner == owner) {
                        actualAmount = actualAmount + delegations[z].amount;
                    }
                }
            }

            //if they have less than the owner wants to remove, just remove how much they have
            if (actualAmount < amount) {
                amount = actualAmount;
            }

            if (amount > 0) {

                bool keepGoing = true;

                uint index=0;
                while (keepGoing) {
                    //first find index in delegations with closest expiration.
                    //uint index = 0;
                    //This correctly sets var index as the 1st available owner
                    for (uint n=0;n<delegations.length;n++) {
                        if (delegations[n].owner == owner) {
                            index=n;
                            break;
                        }
                    }

                    //size of delegations must be greater than zero because actualAmount != 0
                    //could probably initialize k=index to save cycles later
                    for (uint k = 0; k < delegations.length; k++) {
                        if (delegations[k].owner == owner) {
                            if (delegations[k].expiration <= delegations[index].expiration) {
                                index = k;
                            }
                        }
                    }

                    //now spend the amount
                    if (amount >= delegations[index].amount) {
                        amount = amount - delegations[index].amount;
                        clearDelegation(index);//this function clears and returns coins back to owner

                    } else {
                        //no need to give tokens back to owner--they are infinite and created on the fly
                        //just subtract remaining amount from the current delegation amount
                        delegations[index].amount = delegations[index].amount - amount;
                        //set amount = 0 since we are done
                        amount = 0;

                    }

                    if (amount == 0) {
                        keepGoing = false;
                    }

                }//while
            }//(amount > 0)

        }//else

        success = true;
    }


    //spends the tokens specified by amount, Bearing in mind
    //that we want to spend the ones closest to expiration first.
    function spendMyTokens(bytes32 delegatee, uint amount) access(msg.sender) returns (bool success) {
        //this is the only place to clear expirations.
        //it is accurate for the expiration within abs[(block function was called) - (block after rest of code is executed in this function)]
        clearExpirations();
        success = false;

        //first make sure they have the relevant amount:
        uint actualAmount = myAmount(delegatee);

        if (actualAmount >= amount && amount > 0) {
            success = true;
            bool keepGoing = true;
            uint index=0;

            while (keepGoing) {
                //first find index in delegations with closest expiration.
               // uint index = 0;

		        for (uint n=0;n<delegations.length;n++){
                    if (delegations[n].delegatee == delegatee) {
                            index=n;
                            break;
                    }
                }

                //size of delegations must be greater than zero because actualAmount != 0
                for (uint k = 0; k < delegations.length; k++) {
                    if (delegations[k].expiration <= delegations[index].expiration && delegations[k].delegatee == delegatee && delegations[k].amount > 0) {
                        index = k;
                    }
                }

                //now spend the amount
                if(amount >= delegations[index].amount) {
                    amount = amount - delegations[index].amount;
                    clearDelegation(index);//this function clears and returns coins back to owner

                } else {
                    //just subtract remaining amount from the current delegation amount
                    delegations[index].amount = delegations[index].amount - amount;
                    //now set amount = 0 since we are done
                    amount = 0;
                }

                if (amount == 0) {
                    keepGoing = false;
                }

            }//while

        }
    }


    //helper function: tells you how many tokens a delegatee has for a given identityDimension
    //in order to access a specific descriptor
    function myAmount(bytes32 delegatee) access(msg.sender) returns (uint amount) {

        amount = 0;
        //check size to avoid an out-of-bounds error
        if(delegations.length > 0) {
            for (uint i = 0; i < delegations.length; i++) {
                if (delegations[i].delegatee == delegatee ) {
                    amount = amount + delegations[i].amount;
                }
            }
        }
    }


    //Give a controller your token:
    function changeTokenController(bytes32 originalControllerHash, bytes32 newControllerHash, uint amount) returns (bool success) {
        
        if (amount <= 0) {
            throw;
        }

        success = false;

        uint indexOrigC; //index in array of original controller
        bool foundOrigC; //if original controller was found in the array

        uint indexNewC; //index in array of proposed new owner
        bool foundNewC; //if proposed new owner was found

        (indexOrigC, foundOrigC) = findIndexOfController(originalControllerHash);
        (indexNewC, foundNewC) = findIndexOfController(newControllerHash);

        //only proceed if they are both controllers
        if (foundOrigC && foundNewC) {
            //success = true;
            //make sure original controller possesses amount he wants to give
            if (tokensOwned[indexOrigC] >= amount) {
                success = true;
                tokensOwned[indexOrigC] = tokensOwned[indexOrigC] - amount;
                tokensOwned[indexNewC] = tokensOwned[indexNewC] + amount;
            }
        }
    }

    //Returns Amount Delegated by Controller
    function amountDelegated(bytes32 controllerHash) returns (uint amount) {

        amount=0;
        //check size to avoid an out-of-bounds error
        if (delegations.length > 0) {
            for (uint i = 0; i < delegations.length; i++) {
                if (delegations[i].owner == controllerHash ) {
                    amount = amount + delegations[i].amount;
                }
            }
        }
    }

    function addController(bytes32 controllerHash, uint amount) returns (bool success) {
        success = false;
        uint indexC;
        bool wasFoundC;

        (indexC, wasFoundC) = findIndexOfController(controllerHash);

        if (!wasFoundC) {
            //add them to controller hashes:
            controllerHashes.push(controllerHash);
            controllerHashesIndexer++;

            //start them off with zero coins (later, someone can delegate them):
            tokensOwned.push(amount);
            tokensOwnedIndexer++;

            success = true;
        }
    }

    function removeController(bytes32 controllerHash) returns (bool success, uint minIndex) {
        success = true;
        uint indexC;
        bool wasFoundC;

        (indexC, wasFoundC) = findIndexOfController(controllerHash);

        if (!wasFoundC) {
            //controller wasn't found
            success = false;

        } else {
            tokensOwned[indexC] = 0;
            controllerHashes[indexC] = 0;
            //check size to avoid an out-of-bounds error
            if (delegations.length > 0) {
                for (uint i = 0; i < delegations.length; i++) {
                    if (delegations[i].owner == controllerHash ) {
                        delegations[i].owner = 0x0;
                        delegations[i].delegatee = 0x0;
                        delegations[i].amount = 0;
                        delegations[i].expiration = 0;
                    }
                }
            }

        }
    }

    function offsetControllerTokenQuantity(bytes32 controllerHash, int val)returns (bool success){
        success = false;
        uint index = 0;
        //uint y = 0;
    
        (index, success) = findIndexOfController(controllerHash);
        if (success){
            int x = int(tokensOwned[index]);
            x += val;
            if (x<0) {
                x = 0;
            }

            tokensOwned[index] = uint(x);
        }
    }

    //Returns Index of Controller in controllerHashes (which references relations array)
    function findIndexOfController(bytes32 controllerHash) returns (uint index, bool wasFound) {
        wasFound = false;
        index = 0;

        for (uint i = 0; i < controllerHashes.length; i++) {
            if (wasFound == false && controllerHashes[i] == controllerHash) {
                wasFound = true;
                index = i;
            }
        }

    }

    //helper function: clears the delegation at the index in the array
    //also gives the tokens back to the owner if they are still a owner
    //if they are no longer a owner, the tokens are lost.
    function clearDelegation(uint index) internal 
    {
        bool found = false;
        uint ctrlIndex = 0;
        //grab the owner and their amount before you clear them:
        bytes32 owner = delegations[index].owner;
        uint amount = delegations[index].amount;
        (ctrlIndex, found) = findIndexOfController(owner);
        if (found) {
            tokensOwned[ctrlIndex] = tokensOwned[ctrlIndex] + amount;
        }

        delegations[index].owner = 0x0;
        delegations[index].delegatee = 0x0;
        delegations[index].amount = 0;
        delegations[index].expiration = 0;       
    }

    //helper function: clears expirations.
    function clearExpirations() internal {
        //first check to avoid an out-of-bounds error
        if (delegations.length > 0) {
            for (uint i = 0; i < delegations.length; i++) {
                if (now > delegations[i].expiration) {
                    //recall clearDelegation gives the tokens back to the owner,
                    //so no need to do that here.
                    clearDelegation(i);
                }
            }
        }
    }
    
}

