/*This contract is used as a utility module that counts votes on different proposal types distinguished by 'propType'

NOTE: This contract assumes that digital signature verification has already happened in a Node app

-It is called by the IDFGatekeeper app when requesting a COID membership proposal (propType=0)
-It is called by the IDFGatekeeper app when editing the uniqueIDAttrs struct for a human (propType=0, forUniqueId=true)
-It is called by MyGatekeeper app when requesting an asset creation proposal (propType=0, isHuman=false)
-It is called by MyGatekeeper app when requesting an Identity Claim Attestation (ICA) proposal (propType=2)
-It is called by MyGatekeeper app when recovering an lost or stolen identity and initializing a recovery proposal (propType=3)

Suggestion for v2 rewrite: utilize the propType for adding official IDs to the main COID or a user-created COID (asset)
ACTION REQUIRED: In v2, get rid of the myProposal storage array and replace with a mapping
ACTION REQUIRED: In v2, suggest adding an address storage variable and setting it to Gatekeeper.sol address (if deemed necessary)

We do not need more than one ballot deployed. This is a singleton contract.
The IDFgatekeeper as well as user's with their respective MyGatekeeper contracts can use this singleton to retrieve proposal IDs
The structs within this contract do not care about the data being voted on. This is taken care of in Gatekeeper/MyGatekeepers
*/

pragma solidity ^0.4.4;
contract Ballot {
    
/*Notify selected validator to vote based on the proposalId-
    propType as described above is used to distinuish between different proposal types
    isHuman tells the ballot Node app whether or not to ask Gatekeeper.sol for the data or take a MyGatekeeper address from input
    myGKaddr will be all zeroes in the case of a human COID creation as we will use the Gatekeeper.sol address
    */
    event notifyValidator(bytes32 indexed proposalIdToVote, bytes32 validator, bool isHuman, address myGKaddr, uint propType);

    /*Notify selected validator or coid requester that a proposal of a given proposalId has expired-
    ACTION REQUIRED: This event is not being caught anywhere. It can be deleted if instead the deleteProposal method is called by an app on a timer
    We are deleting proposals that reach consensus in the appropriate gatekeeper but are currently not deleting those which do not receive enough votes
    */
    event proposalExpired(bytes32 indexed expiredProposalId);

    /*Notifies IDFGatekeeper Node app that consensus has been reached on a Human COID proposal (propType=0)
    -requestResult is true if 2/3 yes consensus (votersTrue >= yesVotesRequiredToPass) is reached
    IDFGatekeeper Node app will call Gatekeeper method 'ResultIsReady' when this event is caught which will subsequently
    create instances of CoreIdentity.sol, MyGatekeeper.sol, and IdentityDimensionControl.sol
    */
    event resultIsReadyIDF(bytes32 proposalId, bool requestResult); 

    /*Notifies proper MyGatekeeper app that consensus has been reached on an Asset/nonhuman COID proposal
    or an ICA proposal (that is any proposal stored in a MyGatekeeper contract)
    We let the requester of the Asset select how many validators to select for consensus
    -requestResult is true if yes consensus (votersTrue > yesVotesRequiredToPass) is reached
    MyGatekeeper Node app will call MyGatekeeper method 'ResultIsReady' when this event is caught which will subsequently
    create instances of CoreIdentity.sol and IdentityDimensionControl.sol
    */
    event resultIsReady(bytes32 proposalId, bool requestResult);

    /*Notifies proper recovery app that consensus has been reached on a COID recovery proposal (propType=3)
    The catching of this event will initiate the protocol's contract recovery process
    */
    event startRecovery(bytes32 proposalId, bool requestResult, address myGKaddr);

    //Global variable used in generating a random proposalId inside the 'rand' function
    uint nonce = 0;

    /*Struct which represents a single Voter who will vote 'yes' or 'no' on a aggregation of data called a Proposal-
    Currently we initialize a Voter array of size 10 in the proposal struct
    NOTE: We do not use the delegate field in any current use cases (or call the delegate method)
    NOTE: sigExpiration will be 0 unless Voter is voting on an ICA proposal and chooses to have an expiring signature
    'addSelectedValidator' function will set voter, vote, and voted
    'giveRightToVote' function will set weight from 0 to 1
    'vote' function will set msg, pubKey, sig, sigExpiration
    */
    struct Voter {
        bytes32 voter; //hashed secp256k1 pubkey
        uint vote;   //if vote = 1, they voted no, if vote = 2, they voted yes
        bool voted;  //if true, that person already voted
        uint weight; //weight is accumulated by delegation. can be changed by delegate function
        bytes32 delegate; //person delegated vote to
        string msg; //hashed msg stored at time of voting
        string pubKey; //voter pubkey, unhashed (secp256k1 keys are longer than 32 bytes in length)
        string sig; //voter signature stored when voting
        uint sigExpiration; //signature expiration converted from string epoch time stored when voting
    }

    /*Struct for a data proposal which also includes a Voter array-
    ACTION REQUIRED: selectedValidatorList should allow for different lengths in v2 ... or we can decide on an absolute max
    Based on uint propType, we know the type of the proposal (0 human/asset COID, 2 ICA, 3 Recovery)
    Currently we do not utilize propType key for forUniqueID proposals (adding an OfficialID to main COID or an asset)
    */
    struct Proposal {
        uint time; //timestamp for specific proposalId
        uint NumOfVoters; //number of voters for proposal
        uint votersFalse; //total # of votes on "no"
        uint votersTrue;  //total # of votes on "yes"
        uint yesVotesRequiredToPass; //total # votes required to pass
        bool isHuman; //true only for proposals from IDF_Gatekeeper
        address myGKaddr; //user's gk address when using own gk
        uint propType; //used to determine type of proposal and specific event thrown
        Voter[10] selectedValidatorList; // populated from DAO (IDF) or by user
    }

    //Map a bytes32 value (will be the 'proposalId' input in each function) to a Proposal struct
    mapping (bytes32 => Proposal) myProposal;

    //public list of proposals
    bytes32[] public proposalIdList;
    
    address chairperson; //set in constructor as the Monax account

    /*Verify that the function is called by the proper address/account
    Functions that are called directly by apps only need to check msg.sender whereas functions
    which are called by Gatekeeper.sol or a MyGatekeeper instance will have to check tx.origin
    */
    modifier onlyBy(address account) {
        if (account != chairperson) throw;
        _;
    }

    //Monax account which deployed the contract
    function Ballot() {
        chairperson = msg.sender;
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
        
        if (tx.origin == chairperson) {

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
        
        if (tx.origin == chairperson) {
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
        if (tx.origin == chairperson) {
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
