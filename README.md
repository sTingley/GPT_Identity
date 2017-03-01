# GPT_Identity
Repository for GPT platform

TODO* - remove old files

NOTE* - As we are using the Monax software, we are deploying contracts with the eris package manager (EPM).
To check which contracts are being deployed withih a given folder in this repo, look at the epm.yaml file for deploy jobs

COID: All CoreIdentity and CoreIdentityToken contracts

In /Notification you will see folders: Ballot, Digital twin
    -Digital Twin is our routing application connected to the client wallet (walletApp-Dev)
        Significant files: TwinListener.js, TwinConfig.json
            NOTE: all requests coming from the wallet are routed thru Digital Twin to appropriate blockchain service
        
    -Ballot is our 'voting' smart contract module
        Significant files: ballot.sol, ballot.js
        
In /IdentityFederation you will see DAO, IdentityDimensions, and gatekeeper (also BigchainRouter.js and identityGraph)
    -Gatekeeper: Includes IDF_GATEKEEPER AND MY_GATEKEEPER (IDF is central contract used to create inital COID and MyGateekeper is used to      create subsequent COIDs afterwards. MyGatekeeper contract address returned to user after process in IDF_gatekeeper.js finishes.
        Significant files: IDFGatekeeper.js, MyGatekeeper.js, Gatekeeper.sol, MyGatekeeper.sol
    
    -DAO smart contract module: Is used to populate the DAO list that the gatekeeper will use to notify validators
        Significant files: Dao.sol and Dao.js
    -Identity Dimension module: as per digital identity spec, dimensions extend from Core Identityies
        Significant files: IdentityDimension.sol, IdentityDimensionControl.sol, IdentityDimensionControlToken.sol, IdentityDimensionControl.js
        
    MISC:
    -BigchainRouter.js is called by an Android app and is used to verify certains params against a bigchainDB payload


CURRENT CHAIN: 'tuesday4'

NEW FILE: ErisChainConfig.json (for easier chain migration)

ERIS:
    10.101.114.137 Base / 10.100.99.207 VPN

all Solidity code/Javascript apps in $HOME/.eris/apps in 10.101.114.137 (Eris server)
