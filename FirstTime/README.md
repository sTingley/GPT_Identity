# GPT_Identity
Repository for GPT platform


NOTE: As we are using the Monax software, we are deploying contracts with the eris package manager (EPM).
To check which contracts are being deployed withih a given folder in this repo, look at the epm.yaml file for deploy jobs

BigChain: BigchainDriver_v2.js (manages Eris-BcDB keypairs), BigchainRouter.js (called from an Android device to verify conditions against a bigchainDB payload)

COID: All CoreIdentity and CoreIdentityToken contracts

DataMonetization: To Be Integrated*
        
In /IdentityFederation you will see Dao, IdentityDimensions, Gatekeeper (also IdentityGraph.sol & IdentityGraphUtility.sol)
    -Gatekeeper: Includes IDF_GATEKEEPER AND MY_GATEKEEPER (IDF is central contract used to create inital COID and MyGateekeper is used to create subsequent COIDs
        Significant files: IDFGatekeeper.js, MyGatekeeper.js, Gatekeeper.sol, MyGatekeeper.sol
    -DAO smart contract module: Is used to populate the DAO list that the gatekeeper will use to notify validators
        Significant files: Dao.sol and Dao.js
    -Identity Dimension module: as per digital identity spec, dimensions extend from Core Identityies
        Significant files: IdentityDimension.sol, IdentityDimensionControl.sol, IdentityDimensionControlToken.sol, IdentityDimensionControl.js

In /Notification you will see folders: Ballot, Digital twin
    -Digital Twin is our routing application connected to the client wallet (walletApp-Dev)
        Significant files: TwinListener.js, TwinConfig.json, *ctrl.js files (helper files for requests), ipfs.js
            NOTE: all requests coming from the wallet are routed thru Digital Twin to appropriate blockchain service
        
    -Ballot is our 'voting' smart contract module. Gatekeepers put validators onto proposals that are voted on.
        Significant files: ballot.sol, ballot.js

In /Oraclizers you will see folders: BigchainOraclizer, VerifyOraclizerEthereum
        Significant files: ErisBigchainRequester.sol, ErisBigchainService.js, Verification.sol, RequesterApp.js

In /Oraclizers you will see folders: BigchainOraclizer, VerifyOraclizerEthereum
        Significant files: ErisBigchainRequester.sol, ErisBigchainService.js, Verification.sol, RequesterApp.js


CURRENT CHAIN: 'testchain'
ErisChainConfig.json is used for timely chain migration when necessary

MONAX:
    10.101.114.137 Base / 10.100.99.207 VPN

BIGCHAINDB:
    10.101.114.230 Base / 10.100.99.217 VPN

TOMCAT (DT):
    10.101.114.231 Base / 10.100.98.218 VPN

all Solidity code/Javascript apps in $HOME/.eris/apps in 10.101.114.137 (Eris server)
