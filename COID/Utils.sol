contract Utils
{

uint index;
bool hasEmpty;

function AtoSubsetOfB(bytes32[10] arrayA, bytes32[10] arrayB) returns (bytes32[10] rayA, bytes32[10] rayB)
{
        bool testIt;
        for(uint i = 0; i < arrayA.length; i++)
        {
                testIt = false;
                for(uint k = 0; k < arrayB.length; k++)
                {
                        if(arrayB[k] == arrayA[i])
                        {
                                testIt = true;
                        }
                }
                if(!testIt)
                {

                        (index,hasEmpty) = firstEmptyIndex(arrayB);
                         if(hasEmpty && !arrayHas(arrayB,arrayA[i]))
                         {
                                arrayB[index] = arrayA[i];
                         }

                }
        }

        rayA = arrayA;
        rayB = arrayB;
}

function arrayHas(bytes32[10] ray, bytes32 val) returns (bool result)
{
        result = false;
        for(uint i = 0; i < ray.length; i++)
        {
                if(ray[i] == val)
                {
                        result = true;
                }
        }
}

function firstEmptyIndex(bytes32[10] myArray) returns (uint index, bool hasEmpty)
{
        bool stop = false;
        index = 0;
        for(uint i = 0; i < myArray.length; i++)
        {
            if(myArray[i] == 0 && stop == false)
            {
                stop = true;
                index = i;
            }

        }

    hasEmpty = stop;
}


}
