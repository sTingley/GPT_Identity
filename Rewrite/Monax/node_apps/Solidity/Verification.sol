/*This contract processes elliptic curve verification parameters (msg, sig, pubKey)
and makes sure that each user (identified by pubKey) is performing only one request at a time
    NOTE: When ecrecover is working in Burrow we may no longer need this contract*/

pragma solidity ^0.4.4;
contract Verification {
    //makes sure only the application can call functions,
    //which requesters should not be able to call:
    address chairperson;

    //The node app for this contract will continuously listen for these events
    event requestMade(address addr);
    event CallbackReady(address addr);

    //Create a structure for requests
    struct requestStruct {
        uint txnInProgress;
        string message;
        string sig;
        string pubKey;
    }

    //Mapping from addresses (msg.sender) to requests
    mapping (address => requestStruct) requests;
    //Mapping from addresses (msg.sender) to strings
    mapping (address => string) callbacks;

    //This information is needed to implement first-in-first-out
    address[] indexer;

    //Check that only the chairperson may call the function
    modifier onlyBy(address _account) {
        if (_account != chairperson) throw;
        _;
    }

    //Check there is no previous request in progress with calling account
    modifier txnInProgressCheck(address _account) {
        if (requests[_account].txnInProgress != 0) throw;
        _;
    }

    //Constructor
    function Verification() {
        chairperson = msg.sender;
    }

    //this function is currently called by IDFGatekeeper.js and MyGatekeeper.js which will fire the requestMade event caught by RequesterApp.js
    function VerificationQuery(string message, string sig, string pubKey) txnInProgressCheck(msg.sender) {

        address sender1 = msg.sender;
        requestMade(sender1);

        //no previous request, add to the mapping of requests
        requests[sender1].txnInProgress = 1;
        requests[sender1].message = message;
        requests[sender1].sig = sig;
        requests[sender1].pubKey = pubKey;

        //create the callback!
        callbacks[sender1] = "Your transaction is in progress.";

        //push into the array
        indexer.push(sender1);
    }

    //ST: Note this function is not currently called anywhere
    function removeMyRequest() {
        address sender = msg.sender;

        //(1) find index of msg.sender (there can be only one):
        uint theIndex = 0;
        bool check = false;

        for (uint i = 0; i < indexer.length; i++) {
            if (indexer[i] == sender) {
                theIndex = i;
                check = true;
            }
        }

        if (check) {
            //(2) Remove it, without leaving a gap, so we can treat it as a stack:
            //does doing this imply the need of mutex logic (confused multiple deletes)???
            for (uint j = 0; j < indexer.length; j++) {
                if (j >= theIndex && j < indexer.length-1) {
                    indexer[j] = indexer[j+1];
                }
            }

            delete(indexer[indexer.length - 1]);
        }

        address addr = msg.sender;

        callbacks[addr] = "";
        requests[addr].txnInProgress = 0;
        requests[addr].message = "";
        requests[addr].sig = "";
        requests[addr].pubKey = "";
    }

    //This function is called in IDFGatekeeper.js and MyGatekeeper.js
    function myCallback() returns (string userCallback) {

        userCallback = callbacks[msg.sender];
    }


    //this function is intended for requesterApp.js to check if the list is empty
    //if this returns false, requesterApp.js will call the function getCurrentInList
    function listIsEmpty() onlyBy(msg.sender) returns (bool emptyList) {

        emptyList = true;
        if (indexer.length == 0) {
            emptyList = true;
        }

        for (uint n = 0; n < indexer.length; n++) {

            address curAddr = indexer[n];
            if (requests[curAddr].txnInProgress == 1) {
                    emptyList = false;
            }
        }
    }

    //this function is intended for requesterApp.js
    //0 is the index of the current address in the stack
    function getCurrentInList() onlyBy(msg.sender) returns (address addr) {

        bool checkIt = false;
        uint theIndex = 0;

        for (uint k = 0; k < indexer.length; k++) {

            address current = indexer[k];
            if (requests[current].txnInProgress == 1) {
                if (checkIt == false) {
                    theIndex = k;
                    checkIt = true;
                }
            }
        }

        if (checkIt == true) {
            addr = indexer[theIndex];
        }
    }

    //this function is intended for requesterApp.js which passes the request by address
    //after requesterApp.js calls getCurrentInList it will then call this function
    //ST: suggestion that we can move this into getCurrentInList?
    function getRequestByAddress(address addr) onlyBy(msg.sender) returns (string message, string sig, string pubKey) {

        return (requests[addr].message, requests[addr].sig, requests[addr].pubKey);
    }

    //allows the javascript application requesterApp.js to set values
    function setCurrentInList(address addr, string response) onlyBy(msg.sender) {

        CallbackReady(addr);
        requests[addr].txnInProgress = 0;
        callbacks[addr] = response;
    }
}
