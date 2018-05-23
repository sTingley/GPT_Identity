/*********************************************************************************************
This contract is used as a dependent token contract inmported in CoreIdentity.sol
It will never be accessed directly by an application but instead by a CoreIdentity contract

This contract deals mainly with controllers of a core identity but must also store the owners
as all owners have the rights of controllers plus more.
Owners of a coreidentity have no use themselves for ControlToken(s), but may delegate ControlTokens

The strategy for arrays in this contract: avoid looping when unnecessary to find first empty index
    -When you delete something, don't restructure the size; set the value(s) null.
    -When you add something, find the first null index.

Every single CoreIdentity.sol instance uses an instance of ControlToken.sol
*********************************************************************************************/

pragma solidity ^0.4.4;
contract ControlToken {

    //the Monax account which deployed this contract
    bytes32 chairperson;

    /*A delegation inside this contract represents delegated control
    The uint amount value is significant of the actual 'controlTokenQuantity'*/
    struct delegation {
        bytes32 owner; //owner of the identity
        bytes32 delegatee; //delegatee (receiver of the delegation)
        uint amount; //number of control tokens
        uint expiration; //control token expiration (if any)
    }

    uint controllerHashesIndexer; //incremented in 'addController'
    uint tokensOwnedIndexer; //incremented in 'addController

    //global delegation array
    delegation[] delegations;

    //hashed secp256k1 public keys of the CoreIdentity owners set in constructor
    bytes32[10] owners;
    //hashed secp256k1 public keys of the CoreIdentity controllers set in constructor
    bytes32[] public controllerHashes;
    //amount of tokens owned of each of the CoreIdentity controllers set in constructor
    uint[] public tokensOwned;

    modifier access(address addr) {
        //only this contract and the chairperson can call this contract
        if (sha3(addr) != chairperson && addr != address(this)) {
            throw;
        }
        _;
    }

    /*Constructor-
    ControlToken is initialized inside the CoreIdentity.sol method 'startCoid'
    We set the chairperson as the hash of the Monax account
    There are only ten owners as right now a core identity has maximum ten owners
    There are ten controllers as right now a core identity has ten controllers
    */
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
    }

    /*Returns the 10 Core Identity controllers-
    Called in CoreIdentity.sol methods 'addController', 'changeTokenController', 'offsetControllerTokenQuantity', 'removeController'
    */
    function getControllersList() returns (bytes32[10] list) {
        for (uint i = 0; i < controllerHashes.length; i++) {
            if (controllerHashes.length > 0 && i < 10) {
                list[i] = controllerHashes[i];
            }
        }
    }

    /*Returns the 10 Core Identity controllers ControlToken values-
    Called in CoreIdentity.sol methods 'addController', 'changeTokenController', 'offsetControllerTokenQuantity', 'removeController'
    */
    function getControllerVal() returns (uint[10] list) {
        for (uint i = 0; i < tokensOwned.length; i++) {
            if (tokensOwned.length > 0 && i < 10) {
                list[i] = tokensOwned[i];
            }
        }
    }

    /*This function adds a delegation to the delegation arrays-
    Before delegating Control Token(s), we check if the caller of this function, 'owner' is an owner or a controller-
    ~As per the Digital Identity protocol, owners need not use ControlTokens and can create infinite ControlToken delegations
    Controllers on the other hand can only delegate the Control Tokens in their possession~

    owner- the person adding the delegation (owner or controller of a Core Identity)
    delegatee- the person receiving delegated control
    amount- the amount of control tokens being delegated
    timeFrame- the expiration of the delegation (if it expires)
    */
    function delegate(bytes32 owner, bytes32 delegatee, uint amount, uint timeFrame) access(msg.sender) returns (bool success) {

        //check first if the 'owner' is an owner
        uint index = 0;
        bool isController = false;
        (success, index) = ownerExists(owner);

        //if 'owner' is not an owner i
        if (success == false) {
            (index, success) = findIndexOfController(owner);
            isController = true;
            //if controller does not have enough control tokens we cannot delegate
            if (tokensOwned[index]<amount) {
                success = false;
            }
        }

        if (success) {
            //create the delegation on the fly
            delegation memory toAdd;
            uint expiration = now + timeFrame;
            //set delegation with inputted params
            toAdd.owner = owner;
            toAdd.delegatee = delegatee;
            toAdd.amount = amount;
            toAdd.expiration = expiration;

            //this check is necessary to avoid an out of bounds error while looping
            if (delegations.length == 0) {

                //push to array
                delegations.push(toAdd);

                //this check is here because an owner will not have to subtract control tokens
                if (isController) { tokensOwned[index] -= amount; }

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
                    //add a new delegation to the global array
                    delegations.push(toAdd);
                    //this check is here because an owner will not have to subtract control tokens
                    if (isController) {
                        //subtract the control tokens from the caller of this function
                        tokensOwned[index] -= amount;
                    }
                }
            }
        }//if(success)
    }


    /*This function revokes ControlTokens (delegations) from a delegatee back-
    IMPORTANT: since presumably the tokens are given on some agreement/payment, perhaps this function should be implemented by a DAO court
    Called by CoreIdentity.sol 'revokeDelegation'
    -If the flag 'all' is set to true, then it revokes all Control Tokens from that delegatee to the owner; 'amount' can be set to 0 or null
    -If the flag 'all' is set to false, then it revokes the 'amount'
    -If 'amount' is > the number of control tokens a Core Identity controller actually delegated, all tokens will be revoked
    */
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

                uint index = 0;
                while (keepGoing) {
                    //first find index in delegations with closest expiration.
                    //uint index = 0;
                    //This correctly sets var index as the 1st available owner
                    for (uint n=0; n<delegations.length; n++) {
                        if (delegations[n].owner == owner) {
                            index = n;
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


    /*Spends the tokens specified by amount bearing in mind that we want to spend the ones closest to expiration first-
    ACTION REQUIRED: It does not make sense to spent more than one token at a time, or to have 'amount' > 1
    but currently this method will not stop the caller from spending all their tokens at once
    delegatee- individual with control tokens
    amount- amount of control tokens to be spent
    */
    function spendMyTokens(bytes32 delegatee, uint amount) access(msg.sender) returns (bool success) {

        success = false;
        /*this is the only place to clear expirations. it is accurate for the expiration,within
        abs[(block function was called) - (block after rest of code is executed in this function)]*/
        clearExpirations();

        //first make sure they have the relevant amount:
        uint actualAmount = myAmount(delegatee);

        if (actualAmount >= amount && amount > 0) {
            success = true;
            bool keepGoing = true;
            uint index=0;

            while (keepGoing) {
                //first find index in delegations with closest expiration.

                for (uint n=0;n<delegations.length;n++) {
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


    /*Helper function: tells you how many tokens a delegatee has for a given delegation-
    Called by CoreIdentity.sol 'myAmount'
    */
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


    /*Give a controller your ControlToken(s)-
    Called by CoreIdentity.sol 'changeTokenController'
    This function is meant to be called by a CoreIdentity controller who wants to give another controller their tokens
    There is nothing to stop an owner from calling this
    */
    function changeTokenController(bytes32 originalControllerHash, bytes32 newControllerHash, uint amount) access(msg.sender) returns (bool success) {

        if (amount <= 0) {
            throw;
        }

        success = false;

        uint indexOrigC; //index in array of original controller
        bool foundOrigC; //if original controller was found in the array

        uint indexNewC; //index in array of proposed new controller
        bool foundNewC; //if proposed new controller was found

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

    //Returns the amount of delegations delegated by inputted controller
    //This function should be made more useful, and could return more information about the delegations
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

    /*Add a new controller as well as their control token amount to the storage of this contract-
    This function is called in CoreIdentity.sol 'addController'
    */
    function addController(bytes32 controllerHash, uint amount) returns (bool success) {
        success = false;
        uint indexC;
        bool wasFoundC;

        //check if the controller already exists
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

    /*Remove a controller as well as their control token amount to the storage of this contract-
    This function will is called in CoreIdentity.sol 'removeController'
    */
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

    /*Give a current controller more ControlTokens-
    This function will is called in CoreIdentity.sol 'offsetControllerTokenQuantity'
    ACTION REQUIRED: What if the new token amount is lower than before, and controller has delegated ControlTokens
    */
    function offsetControllerTokenQuantity(bytes32 controllerHash, int val) access(msg.sender) returns (bool success) {
        
        success = false;
        uint index = 0;

        (index, success) = findIndexOfController(controllerHash);
        if (success) {
            int x = int(tokensOwned[index]);
            x += val;
            if (x<0) { x = 0; }
            tokensOwned[index] = uint(x);
        }
    }

    /*Returns Index of Controller in controllerHashes
    This function is called only within this contract
    */
    function findIndexOfController(bytes32 controllerHash) internal returns (uint index, bool wasFound) {
        wasFound = false;
        index = 0;

        for (uint i = 0; i < controllerHashes.length; i++) {
            if (wasFound == false && controllerHashes[i] == controllerHash) {
                wasFound = true;
                index = i;
            }
        }

    }

    /*Helper function which is called to check if an owner exists-
    Returns true and the index in the owner array if the owner exists, else returns
    This function is called by the 'delegate' method inside this contract so that we know whether or not
    the delegator has to use ControlTokens (coid controller) or if they can create them (coid owner)
    */
    function ownerExists(bytes32 ownerHash) returns (bool exists, uint index) {
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

    /*helper function that clears the delegation at the inputted index in the array-
    This function will give the tokens back to the owner if they are still a owner
    if they are no longer a owner, the tokens are lost
    This function is called inside 'revokeDelegation' and 'spendMyTokens'
    */
    function clearDelegation(uint index) internal {
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

    /*helper function that clears expired delegations-
    This function is called at the beginning of 'spendMyTokens' so that one cannot
    spend any ControlToken if the delegation has already expired
    */
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

    //testing purposes
    function getOwnersList() returns (bytes32[10] list) {
        list = owners;
    }

    /*Reset owners. This is never called*/
    // function resetOwners(bytes32[10] newOwners) access(msg.sender) {
    //     owners = newOwners;
    // }

}