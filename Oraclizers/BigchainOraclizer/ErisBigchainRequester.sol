contract ErisBigchainRequester {
    //this is analagous to "chairperson" in "Ballot"
    //this makes sure only the application can call functions,
    //which requesters should not be able to call:
    //this will be hardcoded in this contract
    address chairperson;//will need to be a list of accounts later on

    event CallbackReady(bytes32 addr);
    event requestMade(bytes32 addr);

    //Create the structue for requests
    //it will prove useful in the future
    struct requestStruct {
        uint txnInProgress;
        string theRequest;
    }

    //Mappings (could have put callbacks in requestStruct?)
    mapping (bytes32 => requestStruct) requests;
    mapping (bytes32 => string) callbacks;

    //This information is needed to implement first-in-first-out
    bytes32[] indexer;

    modifier onlyBy(address _account) {
        if (_account != chairperson) throw;
        _
    }

    //check there is no previous request with calling account
    modifier txnInProgressCheck(bytes32 _account) {
        if (requests[_account].txnInProgress != 0) throw;
        _
    }

    function ErisBigchainRequester() {
        chairperson = msg.sender;
    }

    function BigChainQuery(string requestInfo, bytes32 requester)
    txnInProgressCheck(requester) {

        //no previous request, add to the mapping of requests
        requests[requester].txnInProgress = 1;
        requests[requester].theRequest = requestInfo;

        //create the callback!
        callbacks[requester] = "Your transaction is in progress.";

        //push into the indexer
        indexer.push(requester);

            requestMade(requester);
    }

    function removeMyRequest(bytes32 requester)
    {
        //(1) FIND index of msg.sender (there can be only one):
        uint theIndex = 0;
                bool check = false;

        for (uint i = 0; i < indexer.length; i++) {
            if (indexer[i] == requester) {
                theIndex = i;
                check = true;
            }
        }

        if (check) {
            //(2) Remove it, without leaving a gap, so we can treat it as a stack:
            //does doing this imply the need of mutex logic (confused multiple deletes)???
            for (uint j = 0; j < indexer.length; j++) {
                if (j >= theIndex && j < indexer.length -1) {
                    indexer[j] = indexer[j+1];
                }
            }

            delete(indexer[indexer.length - 1]);
        }

        //address addr = msg.sender;

        callbacks[requester] = "";
        requests[requester].txnInProgress = 0;
        requests[requester].theRequest = "";

    }

    function myCallback(bytes32 requester) returns (string userCallback) {
        userCallback = callbacks[requester];
    }

    //this function is intended for requesterApp.js
    //check if the list is empty
    function listIsEmpty() onlyBy(msg.sender) returns (bool emptyList) {

        emptyList = true;
        if (indexer.length == 0) {
            emptyList = true;
        }

        for (uint n = 0; n < indexer.length; n++) {
            bytes32 curAddr = indexer[n];
            if (requests[curAddr].txnInProgress == 1) {
                emptyList = false;
            }
        }
    }

    //this function is intended for requesterApp.js
    //0 is the index of the current address in the stack
    function getCurrentInList() onlyBy(msg.sender) returns (bytes32 addr) {

            bool checkIt = false;
            uint theIndex = 0;

            for (uint k = 0; k < indexer.length; k++) {
            bytes32 current = indexer[k];

            if (requests[current].txnInProgress == 1) {
                if (checkIt == false){
                    theIndex = k;
                    checkIt = true;
                }
            }
            }
            if (checkIt == true) {
                addr = indexer[theIndex];
            }

    }

    //this function is intended for requesterApp.js
    //this passes the request by address
    function getRequestByPubKey(bytes32 pubKey) onlyBy(msg.sender) returns (string request) {

        return requests[pubKey].theRequest;
    }

    //allows the javascript application to set values
    function setCurrentInList(bytes32 addr, string response) {

        CallbackReady(addr);
        requests[addr].txnInProgress = 0;
        callbacks[addr] = response;
    }
}

