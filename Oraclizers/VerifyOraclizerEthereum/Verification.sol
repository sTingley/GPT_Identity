contract Verification
{

    //this is analagous to "chairperson" in "Ballot"
    //this makes sure only the application can call functions,
    //which requesters should not be able to call:
    //this will be hardcoded in this contract
    address chairperson;

    event requestMade(address addr);
    event CallbackReady(address addr);


    //Create the structue for requests
    //it will prove useful in the future
    struct requestStruct
    {
        uint txnInProgress;
        string message;
        string sig;
        string pubKey;
    }


    //Mappings (could have put callbacks in requestStruct?)
    mapping (address => requestStruct) requests;
    mapping (address => string) callbacks;


    //This information is needed to implement first-in-first-out
    address[] indexer;


    function Verification()
    {
        chairperson = msg.sender;
    }

    //string msg, string sig, string pubKey
    function VerificationQuery(string message, string sig, string pubKey)
    {

        address sender1 = msg.sender;

        requestMade(sender1);

        //check there is no previous request with msg.sender
        if(requests[sender1].txnInProgress != 0)
        {
            throw;
        }

        //no previous request, add to the mapping of requests
        requests[sender1].txnInProgress = 1;
        requests[sender1].message = message;
        requests[sender1].sig = sig;
        requests[sender1].pubKey = pubKey;

        //create the callback!
        callbacks[sender1] = "Your transaction is in progress.";

        //push into the indexer
        indexer.push(sender1);
    }


    function removeMyRequest()
    {
        address sender = msg.sender;

        //(1) FIND index of msg.sender (there can be only one):
        uint theIndex = 0;
        bool check = false;

        for (uint i = 0; i < indexer.length; i++)
        {
            if(indexer[i] == sender)
            {
                theIndex = i;
                check = true;
            }
        }

        if(check)
        {
        //(2) Remove it, without leaving a gap, so we can treat it as a stack:
        //does doing this imply the need of mutex logic (confused multiple deletes)???
        for (uint j = 0; j < indexer.length; j++)
        {
            if( j >= theIndex && j < indexer.length -1)
            {
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


    function myCallback() returns (string userCallback)
    {
        //this.setSender();
        userCallback = callbacks[msg.sender];
    }


    //this function is intended for requesterApp.js
    //check if the list is empty
    function listIsEmpty() returns (bool emptyList)
    {
        //this.setSender();
        if(msg.sender == chairperson)
        {
            emptyList = true;
            if(indexer.length == 0)
            {
                emptyList = true;
            }

            for (uint n = 0; n < indexer.length; n++)
            {
                address curAddr = indexer[n];
                if(requests[curAddr].txnInProgress == 1)
                {
                        emptyList = false;
                }
            }
        }
    }


    //this function is intended for requesterApp.js
    //0 is the index of the current address in the stack
    function getCurrentInList() returns (address addr)
    {
        //this.setSender();
        if(msg.sender == chairperson)
        {
            bool checkIt = false;

            uint theIndex = 0;
            for (uint k = 0; k < indexer.length; k++)
            {
                address current = indexer[k];
                if(requests[current].txnInProgress == 1)
                {
                        if(checkIt == false)
                        {
                                theIndex = k;
                                checkIt = true;
                        }
                }
            }
            if(checkIt == true)
            {
                addr = indexer[theIndex];
            }
        }
    }


    //this function is intended for requesterApp.js
    //this passes the request by address
    function getRequestByAddress(address addr) returns (string message, string sig, string pubKey)
    {
        //this.setSender();
        if(msg.sender == chairperson)
        {
            return (requests[addr].message, requests[addr].sig, requests[addr].pubKey);
        }
    }


    //allows the javascript application to set values
    function setCurrentInList(address addr, string response)
    {
        //this.setSender();
        if(msg.sender == chairperson)
        {
            CallbackReady(addr);
            requests[addr].txnInProgress = 0;
            callbacks[addr] = response;

        }
    }
}

