    contract Ballot{

    // Notify selected validator to vote based on the proposalId
    //AF: If we have multiple proposals that might be completed at the same time we have to make the proposalID
    //in the event searchable through "indexed" ... so bytes32 indexed proposalIdToVote
    event notifyValidator(bytes32 proposalIdToVote, bytes32 validator);

    // Notify selected validator or coid requester  that the proposal is expired
    //AF: Same as above, need indexed for expiredProposalID
    event proposalExpired(bytes32 expiredProposalId, bool isExpired);


    //if isReady is true, 2/3 consensus vote has been achieved, requesterResult tells if the coidRequest is been accepted or rejected
    // 1 -> rejected , 2-> accepted
    //AF: Same as above, need indexed for proposalID
    event resultIsReady(bytes32 proposalId, bool requestResult);// true if 2/3 of validators have been voted



 //Global variables
  uint i = 0;
 // mapping (bytes32 => bytes32[3]) selectedValidatorList;//This list will be the hashes of the validators

   uint nonce = 0;

    // It will represent a single voter.
    struct Voter {

        bytes32 voter;
        uint weight; // weight is accumulated by delegation
        bool voted;  // if true, that person already voted
        bytes32 delegate; // person delegated vote to
        uint vote;   //  if vote = 1, they voted no, if vote = 2, they voted yes
        string msg;
        string pubKey;
        string sig;
    }

    address gatekeeper; // global variable to check if the function called is made by gatekeeper contract




    //Struct for the COID proposal to be voted on by the selected validators
    //AF: Struct is missing the expiration time unless we hardcoded it somewhere
    struct Proposal
    {

        uint time;  //timestamp for specific proposalId
        uint NumOfVoters; // number of voters for proposal
        uint votersFalse; // total # of votes on "no"
        uint votersTrue;  // total # of votes on "yes"
        uint yesVotesRequiredToPass; //total # votes required to pass
      //  bytes32[3] selectedValidatorList; // validator list from gatekeeper contract
                                       //This list will be the hashes of the validators
        Voter[3] selectedValidatorList;


    }

    //map struct proposal with a unique proposalId
    mapping (bytes32 => Proposal) myProposal;

address public ballot;

// constructor for ballot contract, sets the msg.sender to be the Eris Account
//which delpoyed the ballot contractw
//AF: SECURITY ALERT!!!! that function can only be called one time and should be called after Ballot is deployed.
//We need a mutex for the function which makes it inaccessible ... or we just use modifier which references an
//external permisisons contract
function Ballot()
{

    ballot = msg.sender;
}

// Called by gatekeeper contract to set proposal
function setMyProposalID(bytes32 proposalId, uint numOfVoters, uint yesVotesRequiredToPass)

{
    if(isproposalIdValid(proposalId) == true)
    {
    myProposal[proposalId].NumOfVoters = numOfVoters;
    myProposal[proposalId].votersTrue = 0;
    myProposal[proposalId].votersFalse = 0;
    myProposal[proposalId].yesVotesRequiredToPass = yesVotesRequiredToPass;

    myProposal[proposalId].time = now; //JJ set proposal time to current block timestamp (in milliseconds)
    }

    else
    {
        throw;
    }

}



// Check if validator present among selected validators
// The input validator is validator's pubkey, the function will check the hash of the validator's pubkey against
// the hashes of stored selected validators
function isValidatorPresent(bytes32 proposalId, bytes32 validator) returns (bool result)
{

    result = false;

    for(uint i=0; i < myProposal[proposalId].NumOfVoters; i++)
    {
        if (myProposal[proposalId].selectedValidatorList[i].voter== validator)
        {
            result = true;
        }
    }

    return result;
}

    // Give `voter` the right to vote on this ballot. done through the gatekeeper conteact based on DAO validator list
function giveRightToVote(bytes32 proposalId, bytes32 validator) returns (bool result) {

        uint index;
        result = false;
      for (uint i = 0; i < 3; i++)
      {
          if(validator == myProposal[proposalId].selectedValidatorList[i].voter)
          {
                index = i;
                result = true;
          }
      }


        myProposal[proposalId].selectedValidatorList[index].weight = 1;


        return result;
        //store the validator into the ballot contract
    }


    function getForTest(bytes32 proposalId) returns (uint num)
    {
        num = myProposal[proposalId].NumOfVoters;
    }


    // Called by function giveRightToVote() and stored the selected validators as an array
    function addSelectedValidator(bytes32 proposalId, bytes32[3] validator) returns (bool isSet) {


    if(tx.origin== ballot) // internal function call, only can be called by the owner of ballot contract
      {


          // if ( //i <= myProposal[proposalId].NumOfVoters)
         for(uint i = 0; i < 3; i++)
         {
                myProposal[proposalId].selectedValidatorList[i].voter = validator[i];
                myProposal[proposalId].selectedValidatorList[i].vote = 0;
                myProposal[proposalId].selectedValidatorList[i].voted = false;

                giveRightToVote(proposalId,validator[i]);
                notifyValidator(proposalId,validator[i]);
         }
         isSet = true;

      }
      else
        {
                isSet = false;
        }




        return isSet;
    }



    // After the coid proposal has been accpeted/ rejected or expired, remove the validator list from the proposal
    function removeSelectedValidators(bytes32 proposalId) returns (bool isValidatorListDeleted)
    {

      if(msg.sender == ballot)
        {
         delete myProposal[proposalId].selectedValidatorList;
         isValidatorListDeleted = true;
        }

      else
        {
          isValidatorListDeleted = false;

        }

         return isValidatorListDeleted;
    }


    /// Delegate your vote to the voter `to`.
    function delegate(bytes32 proposalId, string to1, string from1, string fromSig, string fromMsg) returns (bool result) {       //ST: Changed to bytes32
        // assigns reference
        bytes32 from = sha3(from1);
        bytes32 to = sha3(to1);



        if (isValidatorPresent(proposalId, from) != true)
           result = false;
        else
           result = true;

           uint index_from;
           uint index_to;

          for (uint i = 0; i < myProposal[proposalId].NumOfVoters; i++)
          {
              if(from == myProposal[proposalId].selectedValidatorList[i].voter)
              index_from = i;

              if(to == myProposal[proposalId].selectedValidatorList[i].voter)
              index_to = i;
          }
        if ( myProposal[proposalId].selectedValidatorList[index_from].voted == true)
            result = false;
        else
            result = true;


        while (
            myProposal[proposalId].selectedValidatorList[index_to].delegate != 0x0 &&
            myProposal[proposalId].selectedValidatorList[index_to].delegate != from &&
            isValidatorPresent(proposalId, to) == true //the person who recives the delegation must be in the selected list

        ) {
            to = myProposal[proposalId].selectedValidatorList[index_to].delegate;
        }
        // We found a loop in the delegation, not allowed.
        if (to == from) {
            result = false;
        }

        else
            result = true;
        // Since `sender` is a reference, this
        // modifies `voters[msg.sender].voted`
        myProposal[proposalId].selectedValidatorList[index_from].voted = true;
        myProposal[proposalId].selectedValidatorList[index_from].delegate = to;
        myProposal[proposalId].selectedValidatorList[index_from].msg = fromMsg;
        myProposal[proposalId].selectedValidatorList[index_from].pubKey = from1;
        myProposal[proposalId].selectedValidatorList[index_from].sig = fromSig;

        if (myProposal[proposalId].selectedValidatorList[index_to].voted == true) {
            // If the delegate already voted,
            // directly add to the number of votes
            if(myProposal[proposalId].selectedValidatorList[index_to].vote == 1)
            {
                 myProposal[proposalId].votersFalse += myProposal[proposalId].selectedValidatorList[index_from].weight;
            }
            else//vote = 2
            {
                 myProposal[proposalId].votersTrue += myProposal[proposalId].selectedValidatorList[index_from].weight;
            }

        }
        else {
            // If the delegate did not vote yet,
            // add to her weight.
            myProposal[proposalId].selectedValidatorList[index_to].weight += myProposal[proposalId].selectedValidatorList[index_from].weight;
        }
    }



    //by putting index, since you know the number of validators, you save look ups in getting validator pub key if that was a parameter
    function getValidatorSignature_byIndex(bytes32 proposalId, uint index) returns (string msg1, string sig1, string pubkey1)
    {
           msg1 = myProposal[proposalId].selectedValidatorList[index].msg;
           sig1 = myProposal[proposalId].selectedValidatorList[index].sig;
           pubkey1 = myProposal[proposalId].selectedValidatorList[index].pubKey;
    }

    //get by pubkey, since you know the number of validators, you save look ups in getting validator pub key if that was a parameter
    function getValidatorSignature_byPubKey(bytes32 proposalId, bytes32 voter) returns (string sig1, string msg1, string pubkey1)
    {

       if (isValidatorPresent(proposalId, voter) != true)
       {
            sig1 = "";
            msg1 = "";
            pubkey1 = "";
       }
       else
       {
           uint index = 0;

           for (uint i = 0; i < myProposal[proposalId].NumOfVoters; i++)
           {
               if(voter == myProposal[proposalId].selectedValidatorList[i].voter)
               {
                    index = i;
               }
           }

           msg1 = myProposal[proposalId].selectedValidatorList[index].msg;
           sig1 = myProposal[proposalId].selectedValidatorList[index].sig;
           pubkey1 = myProposal[proposalId].selectedValidatorList[index].pubKey;
       }
    }





    // Give your vote (including votes delegated to you)
    // to proposal `proposals[proposal].name`.
    // if vote = 1, they voted no
    // if vote = 2, they voted yes
    function vote(bytes32 proposalId, uint voteVal, string voter1, string msg1, string sig1) returns (bool result, string debugging)
    {

        // string debugging;


       bytes32 voter = sha3(voter1);
       result = true;
       if (isValidatorPresent(proposalId, voter) != true)
       {
           result = false;
           debugging = "they are not present";
       }
       else
       {

                   //for now set to true
                   result = true;
                   uint index;

                   //find index of voter
                   for (uint i = 0; i < myProposal[proposalId].NumOfVoters; i++)
                   {
                                if(voter == myProposal[proposalId].selectedValidatorList[i].voter)
                                {
                                        index = i;
                                }
                   }

                   //if they have voted, do not let them vote
                   if (myProposal[proposalId].selectedValidatorList[index].voted == true && myProposal[proposalId].selectedValidatorList[index].weight == 0)
                   {
                                result = false;
                                debugging = "They have already voted, so they are not allowed to voted...";
                   }
                   else
                   {

                                //add their signature, msg, pubkey
                                myProposal[proposalId].selectedValidatorList[index].msg = msg1;
                                myProposal[proposalId].selectedValidatorList[index].sig = sig1;
                                myProposal[proposalId].selectedValidatorList[index].pubKey = voter1;


                                //note that result is kept as true

                                //capture their vote
                                myProposal[proposalId].selectedValidatorList[index].voted = true;
                                myProposal[proposalId].selectedValidatorList[index].vote = voteVal;

                                if(myProposal[proposalId].selectedValidatorList[index].vote == 1) //if vote = 1, they voted no
                                {
                                        myProposal[proposalId].votersFalse = myProposal[proposalId].votersFalse + myProposal[proposalId].selectedValidatorList[index].weight;
                                }
                                else //they voted yes
                                {
                                        myProposal[proposalId].votersTrue = myProposal[proposalId].votersTrue + myProposal[proposalId].selectedValidatorList[index].weight;
                                }

                                //set the weight to zero
                                myProposal[proposalId].selectedValidatorList[index].weight = 0;

                                if(myProposal[proposalId].votersTrue >= myProposal[proposalId].yesVotesRequiredToPass)
                                {
                                        resultIsReady(proposalId,true); // trigger the event, can be caught by js, same as isReady = true

                                }
                                if(myProposal[proposalId].votersFalse > (myProposal[proposalId].NumOfVoters - myProposal[proposalId].yesVotesRequiredToPass))
                                {
                                        resultIsReady(proposalId,false);
                                }

                        }
                }
    }


    // Will be called by ballot.jsevery timeInterval
    // If true -> The proposal is expired, and execute deleteProposal() then delete proposal
    // in gatekeeper contract
    // If false -> Then do nothing
    function IsProposalExpired() {


	if(proposalIdList.length > 0)
	{
        for (uint i = 0; i <= proposalIdList.length; i++)
        {

            //weeks is the avaible unit can be used to convert between units of time
            // where seconds are the base unit
            //AF: If myProposal[proposalIdList[i]].time was 10 days and 1 week is hardcoded
            //then we need now > myProposal[proposalIdList[i]].time - 1 weeks in the if statement!!!

            if (myProposal[proposalIdList[i]].time + 1 weeks >=  now)
             {

              proposalExpired(proposalIdList[i], true); // proposalIdList[i]-> proposalId

	      //deletes the array value and removes validator list
              deleteProposal(proposalIdList[i]);
	     
	      //restructures the size of the array for the removed proposal
	      removeFromArray(i);

             }
        }
	}
    }

    function removeFromArray(uint i)
    {
        for(uint j = 0; j < proposalIdList.length-1; j++)
        {
                if(j >= i)
                {
                        proposalIdList[j] = proposalIdList[j+1];
                }
        }
        proposalIdList.length--;
    }





       // get the selected validator list by proposalId
       // is used to notifiy validators after the specific proposal is exprired,
       // then according to the proposalId from the event IsProposalExpired
       // we can notify the validators for the specific proposal used the proposalId
    function getValidatorList(bytes32 proposalId) returns (bytes32[3] validatorsToVoteVal)
    {
        if (tx.origin == ballot)
        {

        //      validatorsToVoteVal = myProposal[proposalId].selectedValidatorList;
         for(uint j = 0; j < 3; j++)
         {

         validatorsToVoteVal[j] =  myProposal[proposalId].selectedValidatorList[j].voter;
         }
        }

        else
        {
        throw;
        }
    }






    // will be called by the js
    // If the proposal is deleted, user will recieve a notification
    function deleteProposal(bytes32 proposalId){

            // delete all data from coidData struct
            delete myProposal[proposalId];
            removeSelectedValidators(proposalId);
          // proposalDeleted("Your COID request has been exprired.");
    }


    bytes32[] public proposalIdList;


    // Provides unique proposal Id for gatekeeper app
    function getProposalId() returns (bytes32)
    {
       bytes32 availableProposalId;

       availableProposalId = sha3(block.timestamp + rand(0,1000));
       proposalIdList.push(availableProposalId);

       return availableProposalId;

    }


    // Check if the proposalId is valid(which is provided by ballot contract)
    //from gatekeeper contract
    function isproposalIdValid(bytes32 proposalId) returns (bool)
    {

       uint i;
       bool isproposalIdValid = false;

       for (i=0; i < proposalIdList.length; i++ )
       {
         if (proposalId == proposalIdList[i])
         isproposalIdValid = true;
       }

       return isproposalIdValid;

    }


    // Generate a random number between a range,
    // used to generate a unique proposalId
    function rand(uint min, uint max) internal returns(uint rnum)
    {
        nonce++;
        rnum = uint(sha3(nonce)) % (min + max) - min;
        return rnum;
    }


}
