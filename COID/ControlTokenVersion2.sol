contract ControlToken
{
    //helper arrays
    bytes32[] public controllerHashes;
    bytes32[] public delegateeHashes;
    uint[] public tokensOwned;

    //avoid looping to find first empty index when unnecessary in arrays
    uint controllerHashesIndexer;
    uint delegateeHashesIndexer;
    uint tokensOwnedIndexer;


    //all helper arrays
    uint[][] public temp;
    uint[] public temp2;
    bytes32[] public tempBytes;
    uint[] public indexList;

    //the delegatee relationship array
    uint[][] public relations;
    //Dimension one is the controller hash
    //Dimension two is the delegatee hash
    //The value (uint) is the amount of tokens they have been delegated



    //CONSTRUCTOR
    function ControlToken(bytes32[10] theControllerHashes, uint[10] theTokensOwned)
    {
        controllerHashesIndexer = 0;
        delegateeHashesIndexer = 0;
        tokensOwnedIndexer = 0;

        //push values into array
        //set the indexer to the first empty value in the arrays:
        //QUESTION: is "" the null bytes32?

        //set indexer for controllerHashes:
        for(uint i = 0; i < theControllerHashes.length; i++)
        {
            if(theControllerHashes[i] != "")
            {
                controllerHashes.push(theControllerHashes[i]);
                controllerHashesIndexer++;
            }
        }

        //set indexer for tokensOwned:
        for(uint j = 0; j < theTokensOwned.length; j++)
        {
            if(theTokensOwned[j] != 0)
            {
                tokensOwned.push(theTokensOwned[j]);
                tokensOwnedIndexer++;
            }
        }
    }

    function getControllersList() returns (bytes32[10] list)
    {
        for(uint i = 0; i < controllerHashes.length; i++)
        {
            if(controllerHashes.length > 0 && i < 10)
            {
                list[i] = controllerHashes[i];
            }
        }
    }
    function getControllerVal() returns (uint[10] list)
    {
        for(uint i = 0; i < tokensOwned.length; i++)
        {
            if(tokensOwned.length > 0 && i < 10)
            {
                list[i] = tokensOwned[i];
            }
        }
    }


    //Revoke a Delegation
    function revokeDelegation(bytes32 controllerHash, bytes32 delegateeHash, uint amount) returns (bool success)
    {

        success = false;

        if(amount < 0)
        {
            throw;
        }

        uint indexC; //index of controller
        bool wasFoundC; //if the controller was found

        uint indexD; //index of delegatee
        bool wasFoundD; //if the delegatee was found

        (indexC,wasFoundC) = findIndexOfController(controllerHash);
        (indexD,wasFoundD) = findIndexOfDelegatee(delegateeHash);

         if(wasFoundD && wasFoundC)
         {
            success = true;

            uint currentAmount = relations[indexC][indexD];
            if(amount >= currentAmount)
            {
                relations[indexC][indexD] = 0;
            }
            else
            {
                relations[indexC][indexD] = relations[indexC][indexD] - amount;
            }
         }

         clearUnusedDelegatees();

    }

    function spendMyTokens(bytes32 delegateeHash, uint amount)
    {

        uint indexD; //index of delegatee
        bool wasFoundD; //if the delegatee was found
        (indexD,wasFoundD) = findIndexOfDelegatee(delegateeHash);

        if(wasFoundD)
        {
            if(myAmount(delegateeHash) >= amount)
            {
                //spend the tokens (i.e. take away delegations from controllers)
                bool stop = false;
                uint indexer = 0;
                uint amountLeftToSpend = amount;
                while(stop == false)
                {
                    if(relations[indexer][indexD] > amountLeftToSpend)
                    {
                        relations[indexer][indexD] = relations[indexer][indexD] - amountLeftToSpend;

                        stop = true;
                    }
                    else
                    {
                        uint val = relations[indexer][indexD];

                        amountLeftToSpend = amountLeftToSpend - val;
                        relations[indexer][indexD] = 0;

                    }
                    indexer++;
                }
            }
        }

        clearUnusedDelegatees();
    }



    //Get how many tokens a delegatee has
    function myAmount(bytes32 delegateeHash) returns (uint amount)
    {
        uint indexD; //index of delegatee
        bool wasFoundD; //if the delegatee was found
        (indexD,wasFoundD) = findIndexOfDelegatee(delegateeHash);

        amount = 0;

        if(wasFoundD)
        {
            for(uint i = 0; i < controllerHashesIndexer; i++)
            {
                amount = amount + relations[i][0];
            }
        }
    }




    //Delegation of a Token to a User
    function delegate(bytes32 controllerHash, bytes32 delegateeHash, uint amount) returns (bool success)
    {

        if(amount <= 0)
        {
            throw;
        }

        bool isController = true;

        uint indexC; //index of controller
        bool wasFoundC; //if the controller was found

        uint indexD; //index of delegatee
        bool wasFoundD; //if the delegatee was found

        (indexC, wasFoundC) = findIndexOfController(controllerHash);

        if(!wasFoundC)
        {
            //controller does not exist
            isController = false;
        }

        (indexD,wasFoundD) = findIndexOfDelegatee(delegateeHash);

        if(!wasFoundD)
        {


            //update relations list
            temp.length = 0;
            for(uint p = 0; p < controllerHashes.length; p++)
            {
              temp2.length = 0;
              for(uint z = 0; z < delegateeHashes.length; z++)
              {
                    if(delegateeHashes.length*controllerHashes.length > 0)//make sure they have something
                    {
                        temp2.push(relations[p][z]);
                    }
              }

              temp2.push(0);

              temp.push(temp2);
            }
            relations = temp;


            //add them to the list only after
            delegateeHashes.push(delegateeHash);
            indexD = delegateeHashes.length-1;
            delegateeHashesIndexer++;

        }

        if(!isController)
        {
            //deny delegation--you must be a controller to delegate
            success = false;
        }
        else
        {
            //check amount they have left to delegate
            uint availableAmount = tokensOwned[indexC] - amountDelegated(controllerHash);

            if(availableAmount < amount)
            {
                //deny delegation -- they do not have enough funds
                success = false;
            }
            else
            {
                success = true;

                //set added amount in relationship array
                relations[indexC][indexD] = relations[indexC][indexD] + amount;

            }

        }

        //clearUnusedDelegatees();

    }



    //Give a controller your token:
    function changeTokenController(bytes32 originalControllerHash, bytes32 newControllerHash, uint amount) returns (bool success)
    {

        if(amount <= 0)
        {
            throw;
        }

        success = false;

        uint indexOrigC; //index in array of original controller
        bool foundOrigC; //if original controller was found in the array

        uint indexNewC; //index in array of proposed new owner
        bool foundNewC; //if proposed new owner was found

        (indexOrigC,foundOrigC) = findIndexOfController(originalControllerHash);
        (indexNewC,foundNewC) = findIndexOfController(newControllerHash);

        //only proceed if they are both controllers
        if(foundOrigC && foundNewC)
        {
            //make sure original controller possesses amount he wants to give
            if(tokensOwned[indexOrigC] >= amount)
            {
                success = true;

                tokensOwned[indexOrigC] = tokensOwned[indexOrigC] - amount;
                tokensOwned[indexNewC] = tokensOwned[indexNewC] + amount;

                //redistribute amount delegated control tokens
                //if they

                //find a path in the relationship array that sums to amount
                bool stop = false;
                uint indexer = 0;
                uint amountLeft = amount;
                while(stop && indexer < delegateeHashes.length-1)
                {
                    if(relations[indexOrigC][indexer] > 0)
                    {
                        if(relations[indexOrigC][indexer] > amountLeft)
                        {
                            //just switch the amount left and we are done
                            relations[indexOrigC][indexer] = relations[indexOrigC][indexer] - amountLeft;
                            relations[indexNewC][indexer] = relations[indexNewC][indexer] + amountLeft;

                            stop = true;
                        }
                        else
                        {
                            //current posession is less than or equal to the amount left
                            uint currentPosession = relations[indexOrigC][indexer];
                            amountLeft = amountLeft - currentPosession;

                            //balance transfer
                            relations[indexOrigC][indexer] = 0;
                            relations[indexNewC][indexer] = amountLeft;
                        }
                    }
                    indexer++;
                }

            }
        }
    }

    //Returns Amount Delegated by Controller
    function amountDelegated(bytes32 controllerHash) returns (uint val)
    {
            //calculate how many they have delegated

            val = 0;

            uint indexC; //index of controller
            bool foundC; //if the controller was found

            (indexC, foundC) = findIndexOfController(controllerHash);

            if(foundC)
            {
                //loop through all the delegations:

                for(uint i = 0; i < relations[indexC].length; i++)
                {
                    val = val + relations[indexC][i];
                }
            }
    }

    function addController(bytes32 controllerHash) returns (bool success)
    {
        success = true;

        //are they actually a controller? check:

        uint indexC;
        bool wasFoundC;

        (indexC,wasFoundC)=findIndexOfController(controllerHash);

        if(!wasFoundC)
        {
            //add them to controller hashes:
            controllerHashes.push(controllerHash);
            controllerHashesIndexer++;

            //start them off with zero coins (later, someone can delegate them):
            tokensOwned.push(0);
            tokensOwnedIndexer++;


            //first create zero delegations:
            temp2.length = 0;
            for(uint i = 0; i < delegateeHashes.length; i++)
            {
                temp2.push(0);
            }

            //now put this in the array:
            relations.push(temp2);

        }

    }

    function removeController(bytes32 controllerHash) returns (bool success)
    {
        success = true;

        uint indexC;
        bool wasFoundC;

        (indexC, wasFoundC) = findIndexOfController(controllerHash);

        if(!wasFoundC)
        {
            //controller wasn't found
            success = false;
        }
        else
        {
            //find controller with least amount of tokens
            if(controllerHashes.length > 1)
            {
                uint minIndex;
                if(indexC == 0)
                {
                    minIndex = 1;
                }
                else
                {
                    minIndex = 0;
                }

                for(uint i = 0; i < controllerHashes.length; i++)
                {

                    if(i != indexC && (tokensOwned[minIndex] < tokensOwned[i]))
                    {
                        minIndex = i;
                    }
                }

                tokensOwned[minIndex] = tokensOwned[minIndex] + tokensOwned[indexC];
                tokensOwned[indexC] = 0;

                for(uint j = 0; j < delegateeHashes.length; j++)
                {
                    if(delegateeHashes.length > 0)
                    {
                        //give the tokens from indexC to minIndex:
                        relations[minIndex][j] += relations[indexC][j];
                        relations[indexC][j] = 0;
                    }
                }


            }
            else
            {
                //there was only one controller
                for(uint k = 0; k < delegateeHashes.length;k++)
                {
                    if(delegateeHashes.length > 0)
                    {
                        relations[indexC][k] = 0;
                    }
                }


            }

            //remove from relations, tokensOwned, controllerHashes:

            //update relations:
            temp.length = 0;
            for(uint r = 0; r <  controllerHashes.length; r++)
            {
                    if(r != indexC)
                    {
                        temp2.length = 0;
                        for(uint p = 0; p < delegateeHashes.length; p++)
                        {
                            if(delegateeHashes.length*controllerHashes.length > 0)//both nonzero
                            {
                                temp2.push(relations[r][p]);
                            }
                        }

                        if(temp2.length > 0)
                        {
                            temp.push(temp2);
                        }
                     }
            }
            relations = temp;

            removeIndexFromTokensArray(indexC);
            removeIndexFromControllerArray(indexC);

        }

    }

    //Returns Index of Controller in controllerHashes (which references relations array)
    function findIndexOfController(bytes32 controllerHash) returns (uint index, bool wasFound)
    {
        wasFound = false;
        index = 0;

        for(uint i = 0; i < controllerHashes.length; i++)
        {
            if(wasFound == false && controllerHashes[i] == controllerHash)
            {
                wasFound = true;
                index = i;
            }
        }

    }

    //Returns Index of Delegatee in delegateeHashes (which references relations array)
    function findIndexOfDelegatee(bytes32 delegateeHash) returns (uint index, bool wasFound)
    {
        wasFound = false;
        index = 0;

        for(uint i = 0; i < delegateeHashes.length; i++)
        {
            if(delegateeHashes.length > 0)
            {
                if(!wasFound && delegateeHashes[i] == delegateeHash)
                {
                    wasFound = true;
                    index = i;
                }
            }
        }

    }

    function removeIndexFromControllerArray(uint index)
    {
        tempBytes.length = 0;
        for(uint i = 0; i < controllerHashes.length; i++)
        {
            if(i != index)
            {
                tempBytes.push(controllerHashes[i]);
            }
        }
        controllerHashes = tempBytes;
        controllerHashesIndexer--;
    }

    function removeIndexFromTokensArray(uint index)
    {
        temp2.length = 0;
        for(uint i = 0; i < tokensOwned.length; i++)
        {
            if(i != index)
            {
                temp2.push(tokensOwned[i]);
            }
        }
        tokensOwned = temp2;
        tokensOwnedIndexer--;
    }

    function removeIndexFromDelegateesArray(uint index)
    {
        tempBytes.length = 0;
        for(uint i = 0; i < delegateeHashes.length; i++)
        {
            if(i != index)
            {
                tempBytes.push(delegateeHashes[i]);
            }
        }
        delegateeHashes = tempBytes;
        //delegateeHashesIndexer--; DONT DO THIS HERE
    }


    //Clears delegatees who are not delegated anything from memory
    function clearUnusedDelegatees()
    {
        // indexList.length = 0;//these represent indecies of delegates with 0 tokens

        // if(delegateeHashes.length*controllerHashes.length > 0)//i.e. they both are nonzero
        // {
        //     for(uint m = 0; m < delegateeHashes.length; m++)
        //     {
        //         //find in relations
        //         if(myAmount(delegateeHashes[m]) == 0)
        //         {
        //             indexList.push(m);

        //         }
        //     }

        //     uint subtracter = 0;
        //     for(uint z = 0; z < indexList.length; z++)
        //     {
        //         removeIndexFromDelegateesArray(z - subtracter);
        //         subtracter = subtracter + 1;
        //         delegateeHashesIndexer = delegateeHashesIndexer - 1;
        //     }

        //     //now update relations
        //     temp.length = 0;
        //     for(uint k = 0; k < controllerHashes.length; k++)
        //     {
        //         temp2.length = 0; //delegatees
        //         for(uint i = 0; i < delegateeHashes.length; i++)
        //         {
        //             bool isInIndexList = false;
        //             for(uint r = 0; r < indexList.length; r++)
        //             {
        //                 if(r == i)
        //                 {
        //                     isInIndexList = true;
        //                 }
        //             }

        //             if(isInIndexList == false)
        //             {
        //                 temp2.push(temp[k][i]);
        //             }
        //         }

        //         temp.push(temp2);
        //     }
        // }

    }


}
