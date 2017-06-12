
//The same strategy used in IdentityDimension is used here for arrays:
//When you delete something, don't restructure the size; set the value(s) null.
//When you add something, find the first null index.

//README: This contract is intended to be used as a token contract in IdentityDimensionControl, which manages IdentityDimension contracts
//for a CoreIdentity. (IdentityDimensionControl also manages access to IdentityDimension contracts)

//IMPORTANT: This contract deals only with owners of a core identity.
//This is because owners of a core identity are the only ones who can delegate tokens for identity dimensions.

contract IdentityDimensionControlToken
{

    //No need to keep track of giving the owners tokens
    //Tokens are infinite and created on the fly

    bytes32 chairperson;

    struct delegation
    {
        bytes32 owner;
        bytes32 delegatee;
        uint amount;
        string dimension;
        uint expiration;
        string accessCategories;//if it is null, then the delegation is for all dimensions
                                //else, it is a list with delimiter comma
    }

    delegation[] delegations;


    bytes32[10] owners;

    //CONSTRUCTOR:
    //*There are only ten owners, because a core identity has maximum ten owners.
    function IdentityDimensionControlToken(bytes32[10] owners_initial)
    {
        owners = owners_initial;
        chairperson = sha3(msg.sender);
    }


    modifier access(address addr)
    {
        //only this contract and the chairperson can call this contract
        if(sha3(addr) != chairperson && addr != address(this))
        {
            throw;
        }
        _
    }

    //This resyncs the owner list
    //IdentityDimensionControl to get owners from coid and set it here
    function resetOwners(bytes32[10] newOwners) access(msg.sender)
    {
        owners = newOwners;
    }


    //Helper function. Tells if the owner exists. The index returned is their position in the array, and is relevant if exists = true.
    //INPUT: ownerHash.
    function ownerExists(bytes32 ownerHash) access(msg.sender) returns (bool exists, uint index)
    {
        exists = false;
        index = 0;

        for(uint i = 0; i < owners.length; i++)
        {
            //checking exists == false below saves lookups because:
            //the way the compiler works is if the first condition in an "and" statement is false,
            //it won't check the second
            if(exists == false && owners[i] == ownerHash)
            {
                exists = true;
                index = i;
            }
        }
    }

    //This function adds a delegation to our delegation arrays.
    function addDelegation(bytes32 owner, bytes32 delegatee, uint amount, string dimension, uint timeFrame, string accessCategories) access(msg.sender) returns (bool success)
    {

        //only allow the delegation if the owner has tokens and exists:
        uint index = 0;
        (success,index) = this.ownerExists(owner);

        if(success)
        {

            //create the delegation on the fly
            //now do the delegation
            delegation memory toAdd;

            uint expiration = now + timeFrame;

            //set params
            toAdd.owner = owner;
            toAdd.delegatee = delegatee;
            toAdd.amount = amount;
            toAdd.dimension = dimension;
            toAdd.expiration = expiration;
            toAdd.accessCategories = accessCategories;

            //this check necessary to avoid out of bounds error in looping:
            if(delegations.length == 0)
            {
                //push to array:
                delegations.push(toAdd);
            }
            else
            {
                //find the first empty index in the array (if it exists)
                bool emptyIndex = false;
                uint Index = 0;

                for(uint i = 0; i < delegations.length; i++)
                {
                    //checking emptyIndex first saves unnecessary lookups if something is already found
                    if(emptyIndex && (delegations[i].amount == 0 || delegations[i].expiration >= now))
                    {
                        emptyIndex = true;
                        Index = i;
                    }
                }

                if(emptyIndex)
                {
                    delegations[Index] = toAdd;
                }
                else
                {
                    delegations.push(toAdd);
                }
            }
        }
    }


    //This function revokes delegations from a owner to a delegatee.
    //If the flag all is set to true, then it revokes through all dimensions, all tokens from that delegatee to the owner
    //In that case, the caller of the function can set amount and dimension null.
    //If the flag all is set to false, then it revokes the amount in the specified dimension.
    //IMPORTANT: since presumably the tokens are given on some agreement/payment, perhaps this function should be implemented by a DAO court
    function revokeDelegation(bytes32 owner, bytes32 delegatee, uint amount, string dimension, bool all) access(msg.sender) returns (bool success)
    {
        success = false;

        if(all)//if the flag is true, just revoke everything from the owner
        {
            if(delegations.length > 0)
            {
                for(uint i = 0; i < delegations.length; i++)
                {
                    if(delegations[i].owner == owner && delegations[i].delegatee == delegatee)
                    {
                        clearDelegation(i); //this function returns the tokens to the owner
                    }
                }
            }

        }
        else
        {
            //logic below is similar to the function spendTokens

            //first make sure they have the amount FROM that owner:
            uint actualAmount = 0;

            if(delegations.length > 0)
            {
                for(uint z = 0; z < delegations.length; z++)
                {
                    if(delegations[z].delegatee == delegatee && delegations[z].owner == owner && sha3(delegations[z].dimension) == sha3(dimension))
                    {
                        actualAmount = actualAmount + delegations[z].amount;
                    }
                }
            }

            //if they have less than the owner wants to remove, just remove how much they have
            if(actualAmount < amount)
            {
                amount = actualAmount;
            }

            if(amount > 0)
            {

                bool keepGoing = true;

                uint index=0;
                while(keepGoing)
                {
                    //first find index in delegations with closest expiration.
                    //uint index = 0;
                    //This correctly sets var index as the 1st available owner
                    for(uint n=0;n<delegations.length;n++){
                        if(delegations[n].owner == owner){
                                index=n;
                                break;
                        }
                    }

                    //size of delegations must be greater than zero because actualAmount != 0
                    //could probably initialize k=index to save cycles later
                    for(uint k = 0; k < delegations.length; k++)
                    {
                        if(delegations[k].owner == owner)
                        {
                            if(delegations[k].expiration <= delegations[index].expiration && sha3(delegations[index].dimension) == sha3(dimension))
                            {
                                index = k;
                            }
                        }
                    }

                    //now spend the amount
                    if(amount >= delegations[index].amount)
                    {
                        amount = amount - delegations[index].amount;
                        clearDelegation(index);//this function clears and returns coins back to owner
                    }
                    else
                    {
                        //no need to give tokens back to owner--they are infinite and created on the fly

                        //just subtract remaining amount from the current delegation amount
                        delegations[index].amount = delegations[index].amount - amount;

                        //now set amount = 0 since we are done
                        amount = 0;

                    }

                    if(amount == 0)
                    {
                        keepGoing = false;
                    }

                }

            }
        }

        success = true;
    }




    //spends the tokens specified by amount, Bearing in mind
    //that we want to spend the ones closest to expiration first.
    function spendTokens(bytes32 delegatee, uint amount, string identityDimension, string descriptor) access(msg.sender) returns (bool success)
    {
        //this is the only place to clear expirations.
        //it is accurate for the expiration within abs[(block function was called) - (block after rest of code is executed in this function)]
        clearExpirations();

        success = false;

        //first make sure they have the relevant amount:
        uint actualAmount = delegateeAmount(delegatee,identityDimension,descriptor);

        if(actualAmount >= amount && amount > 0)
        {
            success = true;
            bool keepGoing = true;
            uint index=0;

            while(keepGoing)
            {

                for(uint n=0;n<delegations.length;n++){
                        if(sha3(delegations[n].dimension) == sha3(identityDimension)){
                                index=n;
                                break;
                        }
                    }

                //first find index in delegations with closest expiration.
               // uint index = 0;

                //size of delegations must be greater than zero because actualAmount != 0
                for(uint k = 0; k < delegations.length; k++)
                {
                    if(delegations[k].expiration <= delegations[index].expiration && sha3(delegations[k].dimension) == sha3(identityDimension)&& allowsDescriptor(k,descriptor) )
                    {
                        index = k;
                    }
                }

                //now spend the amount
                if(amount >= delegations[index].amount)
                {
                    amount = amount - delegations[index].amount;
                    clearDelegation(index);//this function clears and returns coins back to owner
                }
                else
                {
                    //just subtract remaining amount from the current delegation amount
                    delegations[index].amount = delegations[index].amount - amount;

                    //now set amount = 0 since we are done
                    amount = 0;

                }

                if(amount == 0)
                {
                    keepGoing = false;
                }

            }

        }
    }


    //helper function: tells you how many tokens a delegatee has for a given identityDimension
    //in order to access a specific descriptor
    function delegateeAmount(bytes32 delegatee, string dimension,string descriptor) access(msg.sender) returns (uint amount)
    {

        amount = 0;

        //check size to avoid an out-of-bounds error
        if(delegations.length > 0)
        {
            for(uint i = 0; i < delegations.length; i++)
            {
                if(delegations[i].delegatee == delegatee && sha3(delegations[i].dimension) == sha3(dimension) && allowsDescriptor(i,descriptor))
                {
                    amount = amount + delegations[i].amount;
                }
            }
        }
    }

    //helper function, assumes the delegation array has a non-expired delegation at index k
    //helper function, assumes the delegation array has a non-expired delegation at index k
    //tells you if a delegation at index k allows access to a descriptor
    function allowsDescriptor(uint k, string descriptor) returns(bool allowed) {


        allowed = false;
        uint x = 0;
        //delegations[k].accessCategories;
        if (sha3(delegations[k].accessCategories) == sha3("")) {
            //if it is empty, then it allows access to every descriptor
            allowed = true;
        } else {
            //delimiter is a comma
            bytes _wholeString = bytes(delegations[k].accessCategories);
            bytes memory _toFind = bytes(descriptor);
            bytes memory temp  =  _wholeString;
            for (x = 0; x < temp.length; x++) {
                            delete temp[x];
                        }
            // for string length test
            uint begin = 0;
            uint end = 0;
            uint index = 0;
            uint commaOffset = 0;
            // 0123456789
            // test,hi,te,col,ye
            if (_wholeString.length > 1) {
                //loop through to find matches
                for (uint i = 0; i < _wholeString.length; i++) {

                    if (_wholeString[i] == "," || i == _wholeString.length - 1) {
                        if (i == _wholeString.length - 1) {
                            temp[index] = (_wholeString[i]);
                        }

                        begin = end;
                        if (begin == 0 || i == _wholeString.length - 1) { commaOffset = 0; }
                        else { commaOffset = 1; }
                        end = i;
                        if (begin == 0 && i == _wholeString.length - 1) { end++; }
                        index = 0;
                        if (_toFind.length == end - begin - commaOffset) {
                            uint j = 0;
                            for ( x = 0; x < _toFind.length; x++) {
                                if (_toFind[x] == temp[x]) {
                                    j++;
                                }
                                if (j == _toFind.length) {
                                    allowed = true;
                                }
                            }
                        }

                        for (x = 0; x < temp.length; x++) {
                            delete temp[x];
                        }
                    } else {
                        if (!allowed) {
                            temp[index] = (_wholeString[i]);
                            index++;
                        }
                    }
                }
            } else {
                //since _wholeString cannot be null, length is 1
                allowed = (sha3(descriptor) == sha3(delegations[k].accessCategories));
            }
        }
    }



/*    function allowsDescriptor(uint k, string descriptor) internal returns (bool allowed)
    {
        allowed = false;

        string accessCategories = delegations[k].accessCategories;

        if(sha3(accessCategories) == sha3(""))
        {
            //if it is empty, then it allows access to every descriptor
            allowed = true;
        }
        else
        {

            //delimiter is a comma
            bytes memory _wholeString = bytes(accessCategories);
            bytes memory _toFind = bytes(descriptor);
            bool wasFound = true;
            bool keepGoing = true;
            uint indexer = 0;
            uint numInDescriptor = _toFind.length;

            if(_wholeString.length > 1)
            {

                //loop through to find matches
                for(uint i = 0; i < _wholeString.length; i++)
                {
                    if(keepGoing)
                    {
                        if(_wholeString[i] == ",")
                        {
                            if(wasFound)
                            {
                                keepGoing = false;
                            }
                            //reset indexer for count
                            indexer = 0;
                        }
                        else
                        {
                            if(indexer + 1 <= _toFind.length)
                            {
                                if(wasFound == true && _toFind[indexer] == _wholeString[i])
                                {
                                    wasFound = true;
                                }
                                else
                                {
                                    wasFound = false;
                                }
                            }
                            else
                            {
                                wasFound = false;
                            }
                        }
                    }
                }

                allowed = wasFound;
            }
            else
            {
                //since _wholeString cannot be null, length is 1
                allowed = (sha3(descriptor) == sha3(accessCategories));
            }

        }
    }*/


    //helper function: clears the delegation at the index in the array
    //also gives the tokens back to the owner if they are still a owner
    //if they are no longer a owner, the tokens are lost.
    function clearDelegation(uint index) internal
    {
        //grab the owner and their amount before you clear them:
        bytes32 owner = delegations[index].owner;
        uint amount = delegations[index].amount;

        delegations[index].owner = 0x0;
        delegations[index].delegatee = 0x0;
        delegations[index].amount = 0;
        delegations[index].dimension = "";
        delegations[index].expiration = 0;
        delegations[index].accessCategories = "";
    }

    //helper function: clears expirations.
    function clearExpirations() internal
    {
        //first check to avoid an out-of-bounds error
        if(delegations.length > 0)
        {
            for(uint i = 0; i < delegations.length; i++)
            {
                if(now > delegations[i].expiration)
                {
                    //recall clearDelegation gives the tokens back to the owner,
                    //so no need to do that here.
                    clearDelegation(i);
                }
            }
        }
    }
}

