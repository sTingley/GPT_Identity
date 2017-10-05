contract Broker {

  event notifyRequesterAndOwner(bytes32 proposalId);

  enum ProposalStatus {created, accepted, denied, countered, updated, paid, transferCompleted}

  uint nonce = 0;

  // byteRemover is used to remove high order byte since event triggered removes it
  bytes32 byteRemover = 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
  //Struct for the COID proposal to be voted on by the selected validators
  //AF: Struct is missing the expiration time unless we hardcoded it somewhere
  struct Proposal {
    string requesterPubkey;
    string requesterAlias;
    string ownerPubkey;
    string ownerAlias;
    string dimension;
    string pendingWith;
    uint requesterSuggestedPrice;
    ProposalStatus proposalStatus;
    /*DataRequestStatus dataRequestStatus;*/
    uint createdTime;  //timestamp for specific proposalId
    uint counteredPrice;
    string ownerResponse;
    uint updatedTime;
  }

  //map struct proposal with a unique proposalId
  mapping (bytes32 => Proposal) dataRequestProposals;
  bytes32[] public proposalIdList;
  address public broker;

  // constructor for ballot contract, sets the msg.sender to be the Eris Account
  //which delpoyed the ballot contractw
  //AF: SECURITY ALERT!!!! that function can only be called one time and should be called after Broker is deployed.
  //We need a mutex for the function which makes it inaccessible ... or we just use modifier which references an
  //external permisisons contract
  function Broker() {
    broker = msg.sender;
  }

  // will be called by the js
  // If the proposal is deleted, user will recieve a notification
  function deleteProposal(bytes32 proposalId) {
    delete dataRequestProposals[proposalId];
  }

  // Provides unique proposal Id for gatekeeper app
  function getProposalId() returns (bytes32 availableProposalId) {
    availableProposalId = sha3(block.timestamp + rand(0,1000));
    availableProposalId = byteRemover & availableProposalId;
    proposalIdList.push(availableProposalId);
    return availableProposalId;
  }

  // Check if the proposalId is valid(which is provided by ballot contract)
  //from gatekeeper contract
  function isProposalIdValid(bytes32 proposalId) returns (bool isProposalIdValidResult) {
    uint i;
    for (i=0; i < proposalIdList.length; i++) {
      if (proposalId == proposalIdList[i])
        isProposalIdValidResult = true;
    }
    return isProposalIdValidResult;
  }

  function setProposalData(bytes32 proposalId,
                            string requester,
                            string requesterAlias,
                            string owner,
                            string ownerAlias,
                            string dimension,
                            uint price)
                          returns (bool) {
    dataRequestProposals[proposalId].requesterPubkey = requester;
    dataRequestProposals[proposalId].requesterAlias = requesterAlias;
    dataRequestProposals[proposalId].ownerPubkey = owner;
    dataRequestProposals[proposalId].ownerAlias = ownerAlias;
    dataRequestProposals[proposalId].dimension = dimension;
    dataRequestProposals[proposalId].requesterSuggestedPrice = price;
    dataRequestProposals[proposalId].createdTime = now;
    dataRequestProposals[proposalId].proposalStatus = ProposalStatus.created;
    /*dataRequestProposals[proposalId].dataRequestStatus = DataRequestStatus.notStarted;*/
    dataRequestProposals[proposalId].pendingWith = owner;
    notifyRequesterAndOwner(proposalId);
    return true;
  }

  function getProposalData(bytes32 requestedProposalId) returns (string requesterPubkey, string requesterAlias, string ownerPubkey, string ownerAlias, string dimension, uint requesterSuggestedPrice, ProposalStatus proposalStatus, uint counteredPrice, bool result) {
    if(isProposalIdValid(requestedProposalId) == true) {
      requesterPubkey = dataRequestProposals[requestedProposalId].requesterPubkey;
      requesterAlias = dataRequestProposals[requestedProposalId].requesterAlias;
      ownerPubkey = dataRequestProposals[requestedProposalId].ownerPubkey;
      ownerAlias = dataRequestProposals[requestedProposalId].ownerAlias;
      dimension = dataRequestProposals[requestedProposalId].dimension;
      requesterSuggestedPrice = dataRequestProposals[requestedProposalId].requesterSuggestedPrice;
      proposalStatus = dataRequestProposals[requestedProposalId].proposalStatus;
      counteredPrice = dataRequestProposals[requestedProposalId].counteredPrice;
      result = true;
    }
    else {
      result = false;
    }
  }

  function getPendingWith(bytes32 requestedProposalId) returns (string pendingWith) {
    return dataRequestProposals[requestedProposalId].pendingWith;
  }

  function updateOwnerResponse(bytes32 proposalId, uint responseStatusCode, uint counteredPrice) returns (string result) {

    if(isProposalIdValid(proposalId) == true) {
      if(dataRequestProposals[proposalId].proposalStatus == ProposalStatus.created ||  dataRequestProposals[proposalId].proposalStatus == ProposalStatus.updated) {

        //Proposal accepted condition
        if(responseStatusCode == 0x1) {
          dataRequestProposals[proposalId].proposalStatus = ProposalStatus.accepted;
          dataRequestProposals[proposalId].pendingWith = dataRequestProposals[proposalId].requesterPubkey;
          notifyRequesterAndOwner(proposalId);
          return "true";
        }

        //Proposal Denied condition
        else if(responseStatusCode == 0x2) {
          dataRequestProposals[proposalId].proposalStatus = ProposalStatus.denied;
          dataRequestProposals[proposalId].pendingWith = dataRequestProposals[proposalId].requesterPubkey;
          notifyRequesterAndOwner(proposalId);
          return "true";
        }

        //Proposal countered condition
        else if(responseStatusCode == 0x3) {
          dataRequestProposals[proposalId].proposalStatus = ProposalStatus.countered;
          dataRequestProposals[proposalId].counteredPrice = counteredPrice;
          dataRequestProposals[proposalId].pendingWith = dataRequestProposals[proposalId].requesterPubkey;
          notifyRequesterAndOwner(proposalId);
          return "true";
        }
        else {
          return "invalid status code sent from owner";
        }
      }
      else {
        return "Sorry, proposal status does not allow you to act";
      }
    }
    else {
      return "invalid proposal id";
    }
  }

  // function called by requester to update the proposal
  function updateProposal (bytes32 proposalId, uint suggestedPrice, uint responseStatusCode) returns (string result) {
    if(isProposalIdValid(proposalId) == true) {
      if(responseStatusCode == 0x4 && dataRequestProposals[proposalId].proposalStatus == ProposalStatus.countered) {
        dataRequestProposals[proposalId].requesterSuggestedPrice = suggestedPrice;
        dataRequestProposals[proposalId].proposalStatus = ProposalStatus.updated;
        dataRequestProposals[proposalId].pendingWith = dataRequestProposals[proposalId].ownerPubkey;
        notifyRequesterAndOwner(proposalId);
        return "true";
      } else if (responseStatusCode == 0x5 && dataRequestProposals[proposalId].proposalStatus == ProposalStatus.accepted) {
        //update proposal status to paid
        dataRequestProposals[proposalId].proposalStatus = ProposalStatus.paid;
        notifyRequesterAndOwner(proposalId);
        return "true";
      } else if (responseStatusCode == 0x6 && dataRequestProposals[proposalId].proposalStatus == ProposalStatus.paid) {
        //update proposal status to tokenGenerated
        dataRequestProposals[proposalId].proposalStatus = ProposalStatus.transferCompleted;
        notifyRequesterAndOwner(proposalId);
        return "true";
      } else {
        return "Sorry, proposal status does not allow you to act";
      }
    }
    else {
      return "invalid proposal id";
    }
  }

  /*function requestDataTransfer(bytes32 proposalId) {
    if(isProposalIdValid(proposalId) == true) {
      if(dataRequestProposals[proposalId].proposalStatus == ProposalStatus.accepted) {
        initiateDataTransfer(proposalId);
      }
    }
  }*/

  // Generate a random number between a range,
  // used to generate a unique proposalId
  function rand(uint min, uint max) internal returns(uint rnum) {
    nonce++;
    rnum = uint(sha3(nonce)) % (min + max) - min;
    return rnum;
  }

  function stringsEqual(string storage _a, string memory _b) internal returns (bool) {
		bytes storage a = bytes(_a);
		bytes memory b = bytes(_b);
		if (a.length != b.length)
			return false;
		// @todo unroll this loop
		for (uint i = 0; i < a.length; i ++)
			if (a[i] != b[i])
				return false;
		return true;
	}
}
