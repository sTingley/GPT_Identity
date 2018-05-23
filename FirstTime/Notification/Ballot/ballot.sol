contract Ballot {
    
    //Notify selected validator to vote based on the proposalId
    //AF: If we have multiple proposals that might be completed at the same time we have to make the proposalID
    //in the event searchable through "indexed" ... so bytes32 indexed proposalIdToVote
    event notifyValidator(bytes32 proposalIdToVote, bytes32 validator, bool isHuman, address myGKaddr, uint propType);

    // Notify selected validator or coid requester  that the proposal is expired
    //AF: Same as above, need indexed for expiredProposalID
    event proposalExpired(bytes32 indexed expiredProposalId, bool isExpired);

    //if isReady is true, 2/3 consensus vote has been achieved, requesterResult tells if the coidRequest is been accepted or rejected
    event resultIsReady(bytes32 proposalId, bool requestResult);// true if 2/3 of validators have been voted
    event resultIsReadyIDF(bytes32 proposalId, bool requestResult);// true if 2/3 of validators have been voted. ishuman true
    event startRecovery(bytes32 proposalId,bool requestResult, address myGKaddr );// true if 2/3 of validators have been voted. starts recovery process
    
    //Global variables
    uint i = 0;
    uint nonce = 0;

    //Represents a single voter.
    struct Voter {
        bytes32 voter;
        uint weight; // weight is accumulated by delegation
        bool voted;  // if true, that person already voted
        bytes32 delegate; // person delegated vote to
        uint vote;   //  if vote = 1, they voted no, if vote = 2, they voted yes
        string msg; // msg from ballot.js
        string pubKey; // wallet pubkey
        string sig; // wallet signature
        uint sigExpiration;
    }

    address gatekeeper; // global variable to check if the function called is made by gatekeeper contract

    //Struct for the COID proposal to be voted on by the selected validators
    struct Proposal {
        uint time; // timestamp for specific proposalId
        uint NumOfVoters; // number of voters for proposal
        uint votersFalse; // total # of votes on "no"
        uint votersTrue;  // total # of votes on "yes"
        uint yesVotesRequiredToPass; // total # votes required to pass
        bool isHuman; // true only for proposals from IDF_Gatekeeper
        address myGKaddr; // user's gk address when using own gk
        uint propType; // Used to determine type of proposal
        Voter[10] selectedValidatorList; // populated from DAO (IDF) or by user
    }

    //map struct proposal with a unique proposalId
    mapping (bytes32 => Proposal) myProposal;

    bytes32[] public proposalIdList;
    
    address ballot;
    
    //sets the ballot address to be the Eris Account
    function Ballot() {
        ballot = msg.sender;
    }

    //Provides unique proposal Id to caller (gatekeeper apps)
    function getProposalId() returns (bytes32 availableProposalId) {
        
       availableProposalId = sha3(block.timestamp + rand(0,1000));
       proposalIdList.push(availableProposalId);
    }

    // Called by Gatekeeper.sol (IDF) and MyGatekeeper.sol 'initiateCoidProposalSubmission'
    function setMyProposalID(bytes32 proposalId, uint numOfVoters, uint yesVotesRequiredToPass, bool isHuman, address gkaddr, uint propType)
    returns (bool result) {

        result = isproposalIdValid(proposalId);
        
        if (result) {
            myProposal[proposalId].NumOfVoters = numOfVoters;
            myProposal[proposalId].votersTrue = 0;
            myProposal[proposalId].votersFalse = 0;
            myProposal[proposalId].yesVotesRequiredToPass = yesVotesRequiredToPass;
            myProposal[proposalId].isHuman = isHuman;
            myProposal[proposalId].myGKaddr = gkaddr;
            myProposal[proposalId].time = now; //current block timestamp (milliseconds)
            myProposal[proposalId].propType = propType;
            
            for (uint z = 0; z < numOfVoters;z++) {
                notifyValidator(proposalId,myProposal[proposalId].selectedValidatorList[z].voter, myProposal[proposalId].isHuman,
                myProposal[proposalId].myGKaddr, myProposal[proposalId].propType);
            }

        } else { result = false; }

    }

    // Check if validator present among (hash of wallet public key)
    // In ballot.js this is checked before data is pulled from a gatekeeper
    function isValidatorPresent(bytes32 proposalId, bytes32 validator) returns (bool result) {

        result = false;
        for (uint i=0; i < myProposal[proposalId].NumOfVoters; i++) {
            if (myProposal[proposalId].selectedValidatorList[i].voter == validator) {
                result = true;
            }
        }
    }

    //Give `voter` the right to vote on this ballot by increasing their weight to 1
    //MyGatekeeper.sol calls this ballot method with proposalId and a ballot address as params..
    //ST: I commented out MyGatekeeper.sol call because myGk also has selectValidators which internally
    //calls addSelectedValidator
    function giveRightToVote(bytes32 proposalId, bytes32 validator) returns (bool result) {
        uint index;
        result = false;
        for (uint i = 0; i < myProposal[proposalId].selectedValidatorList.length; i++) {
            if (validator == myProposal[proposalId].selectedValidatorList[i].voter && 
            myProposal[proposalId].selectedValidatorList[i].weight == 0) {
                index = i;
                result = true;
                myProposal[proposalId].selectedValidatorList[index].weight = 1;
            }
        }
    }

    // Calls giveRightToVote and adds validators to a proposal
    function addSelectedValidator(bytes32 proposalId, bytes32[10] validator) returns (bool isSet) {
        
        if (tx.origin == ballot) {

            // if ( //i <= myProposal[proposalId].NumOfVoters)
            for (uint i = 0; i < myProposal[proposalId].selectedValidatorList.length; i++) {
                myProposal[proposalId].selectedValidatorList[i].voter = validator[i];
                myProposal[proposalId].selectedValidatorList[i].vote = 0;
                myProposal[proposalId].selectedValidatorList[i].voted = false;
                giveRightToVote(proposalId,validator[i]);
            }

            isSet = true;

        } else { isSet = false; }

    }

    /// Delegate your vote to the voter `to`
    function delegate(bytes32 proposalId, string to1, string from1, string fromSig, string fromMsg) returns (bool result) {

        bytes32 from = sha3(from1);
        bytes32 to = sha3(to1);

        //first make sure validator is present
        result = isValidatorPresent(proposalId, from);

        uint index_from;
        uint index_to;

        for (uint i = 0; i < myProposal[proposalId].NumOfVoters; i++) {
            
            if (from == myProposal[proposalId].selectedValidatorList[i].voter) {
                index_from = i;
            }
            if (to == myProposal[proposalId].selectedValidatorList[i].voter) {
                index_to = i;
            }
        }

        if (myProposal[proposalId].selectedValidatorList[index_from].voted == true)
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
        if (to == from) { result = false; }
        else { result = true; }
            
        // modifies selectedValidatorList[index_from]
        myProposal[proposalId].selectedValidatorList[index_from].voted = true;
        myProposal[proposalId].selectedValidatorList[index_from].delegate = to;
        myProposal[proposalId].selectedValidatorList[index_from].msg = fromMsg;
        myProposal[proposalId].selectedValidatorList[index_from].pubKey = from1;
        myProposal[proposalId].selectedValidatorList[index_from].sig = fromSig;

        if (myProposal[proposalId].selectedValidatorList[index_to].voted == true) {
            // If the delegate already voted,
            // directly add to the number of votes
            if (myProposal[proposalId].selectedValidatorList[index_to].vote == 1) {
                 myProposal[proposalId].votersFalse += myProposal[proposalId].selectedValidatorList[index_from].weight;
                 
            } else { //vote = 2
                myProposal[proposalId].votersTrue += myProposal[proposalId].selectedValidatorList[index_from].weight;
            }

        } else {
            // If the delegate did not vote yet, add to his or her weight.
            myProposal[proposalId].selectedValidatorList[index_to].weight += myProposal[proposalId].selectedValidatorList[index_from].weight;
        }

    }

    /* Give your vote (including votes delegated to you)
    vote = 1, they voted no
    vote = 2, they voted yes*/
    function vote(bytes32 proposalId, uint voteVal, string voter1, string msg1, string sig1, uint sigExpire) returns (bool result, string debugging) {

       bytes32 voter = sha3(voter1);
       result = isValidatorPresent(proposalId, voter);

       if (!result) {
           debugging = "they are not present";

       } else {

           //find index of voter
           uint index;
           for (uint i = 0; i < myProposal[proposalId].NumOfVoters; i++) {
               if(voter == myProposal[proposalId].selectedValidatorList[i].voter) {
                   index = i;
               }
           }
           
           //if they have voted, do not let them vote
            if (myProposal[proposalId].selectedValidatorList[index].voted == true && myProposal[proposalId].selectedValidatorList[index].weight == 0) {
                result = false;
                debugging = "They have already voted, so they are not allowed to voted...";

            } else {
                //add their signature, msg, pubkey
                myProposal[proposalId].selectedValidatorList[index].msg = msg1;
                myProposal[proposalId].selectedValidatorList[index].sig = sig1;
                myProposal[proposalId].selectedValidatorList[index].pubKey = voter1;

                //note that result is not set to false
                if (sigExpire == 0) {} else {myProposal[proposalId].selectedValidatorList[index].sigExpiration = sigExpire;}

                //capture their vote
                myProposal[proposalId].selectedValidatorList[index].voted = true;
                myProposal[proposalId].selectedValidatorList[index].vote = voteVal;

                if (myProposal[proposalId].selectedValidatorList[index].vote == 1) { //voted no
                    myProposal[proposalId].votersFalse = myProposal[proposalId].votersFalse + myProposal[proposalId].selectedValidatorList[index].weight;

                } else { //voted yes
                    myProposal[proposalId].votersTrue = myProposal[proposalId].votersTrue + myProposal[proposalId].selectedValidatorList[index].weight;
                }

                myProposal[proposalId].selectedValidatorList[index].weight = 0; //set the weight to zero

                //WE HAVE GOT ENOUGH YES VOTES FOR CONSENSUS
                if (myProposal[proposalId].votersTrue >= myProposal[proposalId].yesVotesRequiredToPass) {
                    
                    if (myProposal[proposalId].propType == 3) {
                        startRecovery(proposalId,true,myProposal[proposalId].myGKaddr);

                    } else {
                        
                        if(myProposal[proposalId].isHuman) {
                            resultIsReadyIDF(proposalId, true); // trigger the event caught by IDFgatekeeper.js, same as isReady = true
                        } else {
                            resultIsReady(proposalId,true); // trigger the event, can be caught by js, same as isReady = true
                        }
                    }
                }

                //WE HAVE GOT ENOUGH NO VOTES FOR CONSENSUS
                if(myProposal[proposalId].votersFalse > (myProposal[proposalId].NumOfVoters - myProposal[proposalId].yesVotesRequiredToPass)) {
                    
                    if (myProposal[proposalId].propType == 3) {
                        startRecovery(proposalId,false,myProposal[proposalId].myGKaddr);

                    } else {
                        
                        if (myProposal[proposalId].isHuman){
                        resultIsReadyIDF(proposalId,false); // trigger the event, can be caught by js, same as isReady = true
                        }
                        else{
                        resultIsReady(proposalId,false); // trigger the event, can be caught by js, same as isReady = true
                        }
                    }
                }

            }//else(validator has not voted)
        } //else(validator is present)

    }

    // get the selected validator list by proposalId, called by gatekeeper apps
    // (right now we are calling it in both gk apps but not using the return to do anything)
    // idea: USE THIS FUNCTION WHEN WE ACTUALLY DELETE PROPOSALS to notify validators???
    function getValidatorList(bytes32 proposalId) returns (bytes32[3] validatorsToVoteVal) {
        
        if (tx.origin == ballot) {
            for (uint j = 0; j < 3; j++) {
                validatorsToVoteVal[j] =  myProposal[proposalId].selectedValidatorList[j].voter;
            }
        } else {
            throw;
        }
    }

    //added this function for ToVote.jsx (needs to know which gk contract to pull coid data from)
    // ST 8/29 .. we currently do not call this or need this bc we write isHuman val in notification
    function getIsHuman(bytes32 proposalId) returns (bool result) {
       
       result = isproposalIdValid(proposalId);

       if (result) {
           result = myProposal[proposalId].isHuman;
       }
       
    }

    //gets num of voters
    function getForTest(bytes32 proposalId) returns (uint num) {
        num = myProposal[proposalId].NumOfVoters;
    }

    //by putting index, since you know the number of validators, you save look ups
    function getValidatorSignature_byIndex(bytes32 proposalId, uint index) returns (string msg1, string sig1, string pubkey1, uint validatorsExpiration) {
        msg1 = myProposal[proposalId].selectedValidatorList[index].msg;
        sig1 = myProposal[proposalId].selectedValidatorList[index].sig;
        pubkey1 = myProposal[proposalId].selectedValidatorList[index].pubKey;
        validatorsExpiration = myProposal[proposalId].selectedValidatorList[index].sigExpiration;
    }

    function getValidatorSignature_byPubKey(bytes32 proposalId, bytes32 voter) returns (string sig1, string msg1, string pubkey1) {

       if (isValidatorPresent(proposalId, voter) != true) {
            sig1 = "";
            msg1 = "";
            pubkey1 = "";

       } else {

           uint index = 0;
           for (uint i = 0; i < myProposal[proposalId].NumOfVoters; i++) {
               if (voter == myProposal[proposalId].selectedValidatorList[i].voter) {
                   index = i;
               }
           }
           
           msg1 = myProposal[proposalId].selectedValidatorList[index].msg;
           sig1 = myProposal[proposalId].selectedValidatorList[index].sig;
           pubkey1 = myProposal[proposalId].selectedValidatorList[index].pubKey;
       }

    }


    /* Will be listened to by the gatekeeper apps---
        If true -> proposal is expired, execute deleteProposal() then delete proposal in gatekeeper contract
        If false -> do nothing */
    function IsProposalExpired() {
        
        if (proposalIdList.length > 0) {
            for (uint i = 0; i < proposalIdList.length; i++) {

                //ST: should we also check consensus? .. so we should have a subset of our proposalIdList
                if (myProposal[proposalIdList[i]].time + 1 weeks <= now) {
                    proposalExpired(proposalIdList[i], true);
                    //deletes the array value and deletes validator list for proposal
                    deleteProposal(proposalIdList[i]);
                    //restructures the size of the array for the removed proposal
                    removeFromArray(i);
                }
            }
        }
    }


    /*/////////////////////////////////////////////////////
        Internal functions
    *//////////////////////////////////////////////////////

    //delete all data from coidData struct
    function deleteProposal(bytes32 proposalId) {
        delete myProposal[proposalId];
        removeSelectedValidators(proposalId);
    }

    //After the coid proposal has been accepted/ rejected or expired, remove the validator list from the proposal
    function removeSelectedValidators(bytes32 proposalId) internal returns (bool isValidatorListDeleted) {
        if (msg.sender == ballot) {
            delete myProposal[proposalId].selectedValidatorList;
            isValidatorListDeleted = true;
        } else {
            isValidatorListDeleted = false; 
        }
    }
    
    //remove the proposal from the storage array
    function removeFromArray(uint i) internal { 
        if (proposalIdList.length > 1) {
            for (uint j = 0; j < proposalIdList.length-1; j++) {
                if (j >= i) {
                    proposalIdList[j] = proposalIdList[j+1];
                }
        	}
	    }
        proposalIdList.length--;
    }

    //before we set a proposalId we check this
    function isproposalIdValid(bytes32 proposalId) internal returns (bool isValid) {
       isValid = false;
       for (uint i=0; i < proposalIdList.length; i++ ) {
           if (proposalId == proposalIdList[i]) {
               isValid = true;
           }
       }
    }
 
    //generate a unique proposalId by getting a random number between a range
    function rand(uint min, uint max) internal returns(uint rnum) {
        nonce++;
        rnum = uint(sha3(nonce)) % (min + max) - min;
        return rnum;
    }

}
