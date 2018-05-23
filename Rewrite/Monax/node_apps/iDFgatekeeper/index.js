/*

IDF Gatekeeper Node app which will interact with the Gatekeeper.sol instance

Please refer to the Functional-Process-Specification-CreateCOID to understand how
the gatekeeper works with the ballot, Dao, CoreIdentity, oraclizer contracts

NOTE:
    -Consensus condition is still hard coded as 2/3 in Gatekeeper.sol
    -Proposal is deleted from both gatekeeper.sol and ballot.sol after we call CoidMaker

*/

/** *********************************************************************************************
********************************************************************************************** */

// let chainConfig; // points to chain config json file
// let contractData; // points to jobs_output
// let accountData; // points to accounts json file
// let chain; // name of the chain
// let globalConfig; // points to global.json

const erisContracts = require('@monax/legacy-contracts');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

// for verification
const crypto = require('crypto');
const ed25519 = require('ed25519');
// this library is needed to calculate hash of blockchain id (chain name) and bigchain response
const { keccak_256 } = require('js-sha3');
const secp256k1 = require('secp256k1');
const { promisify } = require('bluebird');

// These variables are for creating the server
const moduleName = require('./package.json').name;

const port = process.env.PORT || 3000;

const logCatcher = require('../Component/logCatcher');
/** *********************************************************************************************
* Initialize a notifier object
********************************************************************************************** */
const notifier = require('../Component/notifications/notifications')('http://10.4.0.167:8000');

const global = require('../configuration_service/configuration_files/global.json');
const chainConfigFile = require('../configuration_service/configuration_files/accounts.json')[global.properties.primary_account];
const jobs = require('../configuration_service/output_files/jobs_output.json');

// When we hit the /gatekeeper endpoint, we will put our request body, 'formdata', into this array
const formdataArray = [];
// Once we have a proposalID, we will put in in this array
const proposalIDArray = [];

let contractStuff = {};

function HashIt(item) {
  if (typeof (item) === 'undefined') {
    return null;
  } else if (Array.isArray(item)) {
    return item.map(x => keccak_256(x));
  } else if (typeof item !== 'object') {
    return keccak_256(item);
  }
  return keccak_256(JSON.stringify(item));
}// end hashit

const checkSizeAndFix = (array, size = 10) => (Array.isArray(array) ? Array(size)
  .fill(0).map((x, i) => (array[i] ? array[i] : x)) : Array(size).fill(0));


const getContract = (contractMgr, path, original) => {
  const Abi = JSON.parse(fs.readFileSync(`../Solidity/abi/${path}`));
  return contractMgr.newContractFactory(Abi).at(!original ? path : original);
};

const CoidMaker = async (
  coidAddr, dimensionCtrlAddr, formdata,
  COIDabiAddr = contractStuff.coidAddress,
  contractMgr = contractStuff.contractMgr,
  dmctrlAddr = contractStuff.dmctrlAddr,
) => {
  // get params for their COID contract
  // parse the form data
  const dimCtrlContract = getContract(contractMgr, dmctrlAddr, dimensionCtrlAddr);
  const COIDcontract = getContract(contractMgr, COIDabiAddr, coidAddr);
  const myUniqueId = formdata.uniqueId;
  const myUniqueIdAttributes = formdata.uniqueIdAttributes.split(',');
  let myOwnerIdList = formdata.ownerIdList.split(',');
  let myControlIdList = formdata.controlIdList.split(',');
  let myOwnershipTokenQuantity = formdata.ownershipTokenQuantity.split(',');
  let myControlTokenQuantity = formdata.controlTokenQuantity.split(',');
  let myIdentityRecoveryIdList = formdata.identityRecoveryIdList.split(',');
  const myRecoveryCondition = formdata.recoveryCondition; // number of recoveryList needed

  // isHuman value is TRUE because the IDF gatekeeper creates only human identities
  const isHumanValue = true;
  let theUniqueIDAttributes = myUniqueIdAttributes;
  const UIDAttr = Array(10).fill('0');
  const fileHashes = Array(10).fill('0');

  for (let i = 0; i < theUniqueIDAttributes.length; i += 3) {
    UIDAttr[i / 3] = Buffer.from(myUniqueIdAttributes[i], 'utf8').toString('hex');
    fileHashes[i / 3] = myUniqueIdAttributes[i + 1];
  }

  // CombinedList is not used but might be needed so commenting it out. - Josh
  // let combinedList = JSON.parse(JSON.stringify(myControlIdList));
  // for (let i = 0; i < myOwnerIdList.length; i++) {
  //   if (combinedList.indexOf(myOwnerIdList[i]) === -1) {
  //     combinedList.push(myOwnerIdList[i]);
  //   }
  // }
  // combinedList = checkSizeAndFix(combinedList);

  COIDcontract.getIt((error, result) => {
    logCatcher(`${result} is the result`);
  });

  // we are filling the empty slots in the arrays with zeroes
  // Solidity requires us to set the entire array
  theUniqueIDAttributes = checkSizeAndFix(theUniqueIDAttributes);
  myOwnerIdList = checkSizeAndFix(HashIt(myOwnerIdList));
  myControlIdList = myControlIdList == '' ? checkSizeAndFix() : checkSizeAndFix(HashIt(myControlIdList));
  myOwnershipTokenQuantity = checkSizeAndFix(myOwnershipTokenQuantity);
  myControlTokenQuantity = myControlTokenQuantity == '' ? checkSizeAndFix() : checkSizeAndFix(myControlTokenQuantity);
  myIdentityRecoveryIdList = myIdentityRecoveryIdList == '' ? checkSizeAndFix() : checkSizeAndFix(HashIt(myIdentityRecoveryIdList));

  logCatcher(`form atr: ${formdata.uniqueIdAttributes}`);
  logCatcher(`uid: ${myUniqueId}`);
  logCatcher(`atr: ${theUniqueIDAttributes}`);
  logCatcher(`UIDAttr: ${UIDAttr}`);
  logCatcher(`fileHashes: ${fileHashes}`);
  logCatcher(`myOwnerIdList: ${myOwnerIdList}`);
  logCatcher(`myControlIdList: ${myControlIdList}`);
  logCatcher(`myIdentityRecoveryIdList: ${myIdentityRecoveryIdList}`);

  const setUniqueID = promisify(COIDcontract.setUniqueID);
  const setOwnership = promisify(COIDcontract.setOwnership);
  const setControl = promisify(COIDcontract.setControl);
  const setRecovery = promisify(COIDcontract.setRecovery);
  const StartCoid = promisify(COIDcontract.StartCoid);
  const IDCInstantiation = promisify(dimCtrlContract.IdentityDimensionControlInstantiation);

  // instantiate coid
  await setUniqueID(myUniqueId, UIDAttr, fileHashes, isHumanValue)
    .then(async () => {
      await setOwnership(myOwnerIdList, myOwnershipTokenQuantity);
    })
    .then(async () => {
      await setControl(myControlTokenQuantity, myControlIdList);
    })
    .then(async () => {
      await setRecovery(myIdentityRecoveryIdList, myRecoveryCondition);
    })
    .then(async () => {
      const ress = await StartCoid();
      logCatcher(`StartCoid: ${ress}`);
    })
    .then(async () => {
      await IDCInstantiation(coidAddr, '0x0');
    })
    .catch((err) => {
      logCatcher(`\n\ncoidmaker error:\n${err}`);
    });
}; // end CoidMaker function

const prepareForm = (formdata) => {
  /* const correctForm; = {
        "pubKey":"",
        "uniqueId":"",
        "uniqueIdAttributes":[["","",""]],
        "ownershipId":"",
        "ownerIdList":["",""],
        "controlId":"",
        "controlIdList":["",""],
        "ownershipTokenId":"",
        "ownershipTokenAttributes":[""],
        "ownershipTokenQuantity":["",""],
        "controlTokenId":"",
        "controlTokenAttributes":[""],
        "controlTokenQuantity":["",""],
        "identityRecoveryIdList":[""],
        "recoveryCondition":"",
        "yesVotesRequiredToPass":"",
        "validatorList":["","",""],
        "delegateeIdList":[""],
        "delegateeTokenQuantity":[""],
        "isHuman":"",
        "timestamp":"",
        "assetID":[""],
        "Type":"",
        "bigchainHash":"",
        "bigchainID":"",
        "coidAddr":"",
        "sig":"",
        "msg":"",
        "gatekeeperAddr":"",
        "dimensionCtrlAddr":""
    } */

  const correctForm = JSON.parse(JSON.stringify(formdata));
  correctForm.uniqueIdAttributes = [];
  correctForm.uniqueIdAttributes.push(formdata.uniqueIdAttributes.split(','));
  correctForm.ownerIdList = formdata.ownerIdList.split(',');
  correctForm.controlIdList = formdata.controlIdList.split(',');
  correctForm.ownershipTokenAttributes = formdata.ownershipTokenAttributes.split(',');
  correctForm.ownershipTokenQuantity = formdata.ownershipTokenQuantity.split(',');
  correctForm.controlTokenAttributes = formdata.controlTokenAttributes.split(',');
  correctForm.controlTokenQuantity = formdata.controlTokenQuantity.split(',');
  correctForm.identityRecoveryIdList = formdata.identityRecoveryIdList.split(',');

  for (let j = correctForm.controlIdList.length - 1; j >= 0; j--) {
    for (let i = correctForm.ownerIdList.length - 1; i >= 0; i--) {
      if (correctForm.controlIdList[j] === correctForm.ownerIdList[i]) {
        correctForm.controlIdList.splice(j, 1);
      }
    }
  }
  return (correctForm);
}; // end prepareForm function

/** *********************************************************************************************
 Puts data inside a coreIdentity.sol contract, IdentityDimensionControl.sol contract after
we get them back from the gatekeeper contract
********************************************************************************************** */

// this function calls theNotifier.setAsset for the owners, controllers
const writeAll = (formdata, theNotifier = notifier) => {
  const owners = formdata.ownerIdList;
  let controllers = formdata.controlIdList;
  if (controllers == '') { controllers = []; }
  const max = Math.max(owners.length, controllers.length);
  const fileName = `${formdata.assetID}.json`;
  logCatcher('\n*****THE MIGHTY WRITEALL*****\n');
  logCatcher(JSON.stringify(formdata));
  logCatcher(`MAX :${max}`);
  let k = 0;
  const total = owners.length + controllers.length;
  logCatcher(`TOTAL: ${total}`);
  logCatcher(`${owners} len ${owners.length}`);
  let result = false;
  const cb = (index = k) => {
    if (index === total) { result = true; }
  };
  for (let i = 0; i < max; i++) {
    logCatcher(`loop ${owners[i]}`);
    if (!!owners[i] && owners !== '') {
      ++k;
      theNotifier.setAsset(String(owners[i]), String(fileName), 0, 0, formdata, '', '', cb);
    }
    if (!!controllers[i] && controllers !== '') {
      ++k;
      theNotifier.setAsset(String(controllers[i]), String(fileName), 1, 0, formdata, '', '', cb);
    }
  }
  return result;
}; // end writeAll

const setCoidRequester = async (
  requester, proposalId, sig, msg,
  gateKeeperContract = contractStuff.gateKeeperContract,
) => {
  await promisify(gateKeeperContract.setCoidRequester)(requester, proposalId, sig, msg)
    .catch(error => logCatcher(`Error with setCoidRequester: ${error}`)); // end of callback
}; // end of function setCoidRequester

const deleteProposal = (
  proposalId, ballotContract = contractStuff.ballotContract,
  gateKeeperContract = contractStuff.gateKeeperContract,
) => {
  ballotContract.deleteProposal(proposalId, (error, result) => {
    if (error) {
      logCatcher(`${proposalId} is the proposalId. Error in delete proposal from ballot? ${error}`);
    } else if (!result) {
      logCatcher(`deleteProposal returned ${result}`);
    }
  });

  gateKeeperContract.deleteProposal(proposalId, (error) => {
    if (error) {
      logCatcher(`${proposalId} is the proposalId. Error in delete proposal from gateKeeper? ${error}`);
    }
  });
};

const setForUID = async (
  proposalId, uid,
  gateKeeperContract = contractStuff.gateKeeperContract,
) => {
  await promisify(gateKeeperContract.setForUID)(proposalId, Boolean(uid)).then().catch((err) => {
    logCatcher(`Error setting is UID attributes bool: ${err}`);
  });// end of callback
};// end of function setForUID


/* Set the 'isHuman' value into the gatekeeper contract proposal.
  Recall that humans may not be owned so this information is relevant
  when we get to setting the ownership structs. The Core Identity form
  will hardcode this value to true in the request and hardcode to false
  in the case of the Asset Creation form */

const setisHuman = async (
  proposalId, isHuman,
  gateKeeperContract = contractStuff.gateKeeperContract,
) => {
  await promisify(gateKeeperContract.setisHuman)(proposalId, Boolean(isHuman)).catch(e => logCatcher(e));
};

// set the UniqueID struct inside the gatekeeper contract proposal
const setmyUniqueID = async (
  requester, proposalId, myUniqueID,
  myUniqueIdAttributes, gateKeeperContract = contractStuff.gateKeeperContract,
) => {
  const len = myUniqueIdAttributes.length;
  logCatcher(`myUniqueIdAttributes.length: ${len}\nMY UNIQUEIDATTRIBUTES ARRAY: ${myUniqueIdAttributes}`);
  const loopFunction = index => promisify(gateKeeperContract.setmyUniqueID)(
    requester, proposalId, myUniqueID,
    myUniqueIdAttributes[3 * index],
    myUniqueIdAttributes[(3 * index) + 1],
    myUniqueIdAttributes[(3 * index) + 2],
  );
  const promiseArray = [];
  // set vals in gatekeeper contract one at a time
  for (let index = 0; index < len / 3; index++) {
    promiseArray.push(loopFunction(index));
  }
  await Promise.all(promiseArray).catch(e => logCatcher(e));
};// end of function setMyUniqueID

const selectValidators = async (
  proposalId, daoAddr, ballotAddress,
  gateKeeperContract = contractStuff.gateKeeperContract,
) => {
  promisify(gateKeeperContract.selectValidators)(proposalId, daoAddr, ballotAddress)
    .then(result => logCatcher(`VALIDATORS: ${JSON.stringify(result)}`)).catch(err => logCatcher(`Error gateKeeperContract.selectValidators: ${err}`));
}; // end of function

// this function will internally call the ballot.sol method 'setMyProposalID'
// which will trigger the event notifyValidator
const initiateCoidProposalSubmission = async (
  ballotAddress, proposalId, yesVotesRequiredToPass,
  isHuman, gateKeeperContract = contractStuff.gateKeeperContract,
) => {
  promisify(gateKeeperContract.initiateCoidProposalSubmission)(
    ballotAddress, proposalId, yesVotesRequiredToPass,
    isHuman,
  ).catch(err => logCatcher(`Error initiateCoidProposalSubmission: ${err}`));
};// end of function initiateCoidProposalSubmission

const checkUnique = async (formdata, gateKeeperContract = contractStuff.gateKeeperContract) => {
  const myUniqueId = formdata.uniqueId;
  const isUniqueResult = promisify(gateKeeperContract.isUnique)(myUniqueId)
    .then(result => result)
    .catch(error => logCatcher(error));// end of callback
  return isUniqueResult;
};// end checkUnique function

const verifyIt = (formdata) => {
  logCatcher('you have reached verifyIt internal function');
  if (!formdata.msg || !formdata.sig || !formdata.pubKey) return false;
  return secp256k1.verify(Buffer.from(formdata.msg, 'hex'), Buffer.from(formdata.sig, 'hex'), Buffer.from(formdata.pubKey.slice(2), 'hex'));
};

// This function will be called in the else case of the getProposalId method
const addUID = async (
  proposalId, formdata, res, callback,
  DaoContractAddr = contractStuff.DaoContractAddr,
  ballotContractAddr = contractStuff.ballotContractAddr,
) => {
  // local variables for contract calls
  logCatcher('addUID reached');
  const { sig } = formdata;
  const { msg } = formdata;
  const requester = formdata.pubKey; // the pubkey of coid requester
  const myUniqueId = formdata.uniqueId;
  const myUniqueIdAttributes = formdata.uniqueIdAttributes.split(',');
  const { yesVotesRequiredToPass } = formdata;
  const { isHuman } = formdata;
  const forUID = formdata.forUniqueId;

  try {
    logCatcher('addUID try catch');
    await setCoidRequester(requester, proposalId, sig, msg);
    await setisHuman(proposalId, isHuman);
    await setmyUniqueID(requester, proposalId, myUniqueId, myUniqueIdAttributes);
    await setForUID(proposalId, forUID);
    setTimeout(async () => {
      await selectValidators(proposalId, DaoContractAddr, ballotContractAddr);
      await initiateCoidProposalSubmission(
        ballotContractAddr, proposalId,
        yesVotesRequiredToPass, isHuman,
      );
      // theNotifier.createProposalPendingNotification(requester, proposalId);
      callback(false, res);
    }, 3000);
  } catch (e) {
    callback(true, res);
  }
};
const setmyOwnershipID = async (
  requester, proposalId, myOwnershipId,
  myOwnerIdList, gateKeeperContract = contractStuff.gateKeeperContract,
) => {
  const ownList = checkSizeAndFix(myOwnerIdList, 10);
  await promisify(gateKeeperContract.setmyOwnershipID)(
    requester, proposalId, myOwnershipId,
    ownList,
  ).catch(err => logCatcher(`Error2: ${err}`)); // end of callback
}; // end of function setmyOwnershipID

const setmyControlID = async (
  requester, proposalId, myControlId,
  myControlIdList, gateKeeperContract = contractStuff.gateKeeperContract,
) => {
  const conrolList = checkSizeAndFix(myControlIdList, 10);
  await promisify(gateKeeperContract.setmyControlID)(
    requester, proposalId,
    myControlId, conrolList,
  ).catch(err => logCatcher(`Error3: ${err}`));// end of callback
}; // end of function setmyControlID

const setmyOwnershipTokenID = async (
  requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes,
  myOwnershipTokenQuantity, gateKeeperContract = contractStuff.gateKeeperContract,
) => {
  const OwernshipTQuantity = checkSizeAndFix(myOwnershipTokenQuantity, 10);
  await promisify(gateKeeperContract.setmyOwnershipTokenID)(
    requester, proposalId, myOwnershipTokenId,
    myOwnershipTokenAttributes, OwernshipTQuantity,
  ).catch(err => logCatcher(`Error4: ${err}`));
};// end of function setmyOwnershipTokenID

const setmyControlTokenID = async (
  requester, proposalId, myControlTokenId, myControlTokenAttributes,
  myControlTokenQuantity, gateKeeperContract = contractStuff.gateKeeperContract,
) => {
  const ControlQuantity = checkSizeAndFix(myControlTokenQuantity, 10);

  await promisify(gateKeeperContract.setmyControlTokenID)(
    requester, proposalId, myControlTokenId,
    myControlTokenAttributes, ControlQuantity,
  ).catch(err => logCatcher(`Error5: ${err}`));
}; // end of function setMyControlTokenID

/* myIdentityRecoveryIdList is size 10 array in gatekeeper
  contract so we need to pass size 10 array as well
  If the myIdentityRecoveryIdList is less than 10, then rest of the values will be 0 */
const setmyIdentityRecoveryIdList = async (
  requester, proposalId, myIdentityRecoveryIdList,
  myRecoveryCondition, gateKeeperContract = contractStuff.gateKeeperContract,
) => {
  const RecoveryList = checkSizeAndFix(myIdentityRecoveryIdList);

  await promisify(gateKeeperContract.setmyIdentityRecoveryIdList)(
    requester, proposalId, RecoveryList,
    myRecoveryCondition,
  ).catch(err => logCatcher(`Error6: ${err}`));
}; // end of function setmyIdentityRecoveryIdList


const setcoidData = async (
  proposalId, formdata, res, callback, theNotifier = notifier,
  DaoContractAddr = contractStuff.DaoContractAddr,
  ballotContractAddr = contractStuff.ballotContractAddr,
) => {
  /* local variables for contract calls
      should be recognized as digital identity
      object structure prepared in the coid creation form */
  const {
    sig, msg, yesVotesRequiredToPass, isHuman,
  } = formdata;
  const requester = formdata.pubKey; // pubkey of coid requester
  const myUniqueId = formdata.uniqueId;
  const myUniqueIdAttributes = formdata.uniqueIdAttributes.split(',');
  const myOwnershipId = formdata.ownershipId;
  const myOwnerIdList = HashIt(formdata.ownerIdList.split(','));
  const myControlId = formdata.controlId;
  const myControlIdList = HashIt(formdata.controlIdList.split(','));
  const myOwnershipTokenId = formdata.ownershipTokenId;
  const myOwnershipTokenAttributes = formdata.ownershipTokenAttributes;
  const myOwnershipTokenQuantity = formdata.ownershipTokenQuantity.split(',');
  const myControlTokenId = formdata.controlTokenId;
  const myControlTokenAttributes = formdata.controlTokenAttributes;
  const myControlTokenQuantity = formdata.controlTokenQuantity.split(',');
  const myIdentityRecoveryIdList = HashIt(formdata.identityRecoveryIdList.split(','));
  const myRecoveryCondition = formdata.recoveryCondition; // m-of-n recovery condition

  try {
    await setCoidRequester(requester, proposalId, sig, msg);
    await setisHuman(proposalId, isHuman);
    await setmyUniqueID(requester, proposalId, myUniqueId, myUniqueIdAttributes);
    setTimeout(async () => {
      await setmyOwnershipID(requester, proposalId, myOwnershipId, myOwnerIdList);
      await setmyControlID(requester, proposalId, myControlId, myControlIdList);
      await setmyOwnershipTokenID(
        requester, proposalId, myOwnershipTokenId,
        myOwnershipTokenAttributes, myOwnershipTokenQuantity,
      );
      await setmyControlTokenID(
        requester, proposalId, myControlTokenId,
        myControlTokenAttributes, myControlTokenQuantity,
      );
      await setmyIdentityRecoveryIdList(
        requester, proposalId, myIdentityRecoveryIdList,
        myRecoveryCondition,
      );
      await selectValidators(proposalId, DaoContractAddr, ballotContractAddr);
      await initiateCoidProposalSubmission(
        ballotContractAddr, proposalId,
        yesVotesRequiredToPass, isHuman,
      );
      theNotifier.createProposalPendingNotification(requester, proposalId, isHuman, '');

      callback(false, res);
    }, 3000);
  } catch (e) {
    callback(true, res);
  }
};

// ask the ballot contract for a proposalId
const getProposalId = async (
  formdata, res, callback,
  ballotContract = contractStuff.ballotContract,
) => {
  logCatcher('hit getProposalId');

  const proposalId = await promisify(ballotContract.getProposalId)()
    .then((result) => {
      // add formdata and proposalID to the proper arrays
      formdataArray.push(JSON.parse(JSON.stringify(formdata)));
      proposalIDArray.push(result);
      logCatcher(`proposal id: ${result}`);
      return result;
    }).catch(error => logCatcher(`Error from ballotContract.getProposalId: ${error}`)); // end of callback
  // should this go any further if there is an error from the getProposalId contract call?

  // If the key 'forUniqueId' is not present, we are going to call
  // 'setcoidData' to create a standard COID membership proposal
  if (formdata.forUniqueId === undefined || formdata.forUniqueId === undefined || formdata.forUniqueId !== 'true') {
    setcoidData(proposalId, formdata, res, callback);
    /* setCoidData is the parent function call which will internally call
    several methods to set the proposal data in the Gatekeeper contract
          -setCoidRequester
          -setisHuman
          -setmyUniqueID
          -setmyOwnershipID
          -setmyControlID
          -setmyOwnershipTokenID
          -setmyControlTokenID
          -setmyIdentityRecoveryIdList
          -selectValidators
          -initiateCoidProposalSubmission
          -createProposalPendingNotification
          */
    logCatcher('gatekeeper.getProposalID has called set coid data. \n' +
      '---> This is a proposal to create a new Core Identity contract for an individual.');
  } else {
    /* If we detect the 'forUniqueID' key, we are creating a proposal
      to update the uniqueIDAttrs struct in the CoreIdentity.sol contract
      Since we are updating our OfficalIDs as we can them in the DI Protocol,
      the validators must approve this change just like they approved
      the initial documents in the initial COID membership proposal.
      Note that there is less data to set in this proposal type */
    addUID(proposalId, formdata, res, callback);
    /* addUID is the parent function call which will internally call
      several methods to set the proposal data in the Gatekeeper contract
          -setCoidRequester
          -setisHuman
          -setmyUniqueID
          -setForUID
          -selectValidators
          -initiateCoidProposalSubmission
          -createProposalPendingNotification
          */
    logCatcher("gatekeeper.getProposalID has detected the 'forUniqueID' key and thus called addUID. \n" +
      '---> This is a proposal to update the UniqueIDAttrs of an Identity Federation approved identity. \n IDF Validators will need to approve.');
  }
};// end of function getProposalId

// set the OwnershipID struct inside the gatekeeper contract proposal

const createSignature = (nonHashedMessage, callback, chainConfig = contractStuff.chainConfig) => {
  // make message hash
  const hash = crypto.createHash('sha256').update(nonHashedMessage).digest('hex');

  const { pubKey } = chainConfig;
  const { privKey } = chainConfig;

  const keyPair = { publicKey: Buffer.from(pubKey, 'hex'), privateKey: Buffer.from(privKey, 'hex') };

  let signature = ed25519.Sign(Buffer.from(hash), keyPair);

  signature = signature.toString('hex');

  callback(signature, pubKey, hash);
};

const UniqueAttributeChanger = (
  coidAddr, dimensionCtrlAddr, formdata,
  COIDabiAddr = contractStuff.coidAddress,
  contractMgr = contractStuff.contractMgr,
) => {
  // get params for their COID contract
  const COIDcontract = getContract(contractMgr, COIDabiAddr, coidAddr);

  logCatcher(`Unique Attribute Changer formdata:\n${JSON.stringify(formdata)}\n`);
  COIDcontract.getIt((error, result) => {
    logCatcher(`${result} is the result`);
  });

  // parse the form data
  const myUniqueId = formdata.uniqueId;// since we are not changing the actual unique ID field
  let myUniqueIdAttributes = formdata.uniqueIdAttributes;
  const UIDAttr = Array(10).fill('0');
  const fileHashes = Array(10).fill('0');
  let k = 0;

  for (let i = 0; i < myUniqueIdAttributes.length; i += 3) {
    UIDAttr[k] = Buffer.from(myUniqueIdAttributes[i], 'utf8').toString('hex');
    fileHashes[k] = myUniqueIdAttributes[i + 1];
    k++;
  }

  setTimeout(() => {
    /* COIDcontract.getUniqueID( function (error,result) {

                  oldAttr = result[1];
                  var k=0;
                  for(var i=0;i<oldAttr.length;i++){
                      if(oldAttr[i] == 0 && k<theUniqueIDAttributes.length){
                          oldAttr[i] = theUniqueIDAttributes[k];
                          k++;
                      }
                  } */
    logCatcher(`\nATTRIBUTES:\n${myUniqueIdAttributes}`);
    myUniqueIdAttributes = myUniqueIdAttributes.concat(Array(10 - myUniqueIdAttributes.length).fill('0'));
    COIDcontract.addUniqueID(myUniqueId, UIDAttr, fileHashes, (error) => {
      if (error) { logCatcher(`adduid error: ${error}`); } else { logCatcher('\n-----Unique ID added-----\n'); }
    });// end addUniqueID
    // })
  }, 3000);
}; // end UniqueAttributeChanger function

const EventListener = (
  ballotContract = contractStuff.ballotContract,
  gateKeeperContract = contractStuff.gateKeeperContract,
  MyGateKeeperContract = contractStuff.MyGateKeeperContract,
  chain = contractStuff.chain,
  recoveryAddress = contractStuff.recoveryAddress,
  contractMgr = contractStuff.contractMgr,
) => {
  // This is for signature generation:


  /** *********************************************************************************************
    ********************************************************************************************* */
  /* Listening of the 'resultIsReadyIDF' event in the ballot:
    When the ballot contract event 'resultIsReadyIDF' is caught we call the gatekeeper contract
    function ResultIsReady. The ResultIsReady function in the gatekeeper will trigger another
    event, 'resultReady' or 'resultReadyUniqueId' which will be caught by this app in the code
    that follows --> */

  ballotContract.resultIsReadyIDF(
    (error) => {
      if (error) {
        logCatcher(error);
      }
    },
    (error, result) => {
      logCatcher('ballot contract event -- ResultIsReady');
      const { proposalId, requestResult } = result.args;
      const chainID = HashIt(chain);

      // debugging statements
      logCatcher(`proposalId from event is: ${proposalId}`);
      logCatcher(`requestResult from event is: ${requestResult}`);
      logCatcher(`chainID from event is: ${chainID}`);

      // Ceates a CoreIdentity contract, IdentityDimensionControl contract,
      // and MyGatekeeper contract
      gateKeeperContract.ResultIsReady(requestResult, proposalId, chainID, (error1, result1) => {
        if (error) {
          logCatcher(`error from gateKeeperContract.ResultIsReady:${error1}`);
        } else {
          logCatcher(`ResultIsReady function in gatekeeper successfully called \n: ${result1}`);
        }
      });
    },
  );

  /* -->Listening of the 'resultReady' or 'resultReadyUniqueId' event from Gatekeeper.sol

    Each time the event is fired, we write in bigchain & delete the proposal

    NOTE: only ONE event will be fired by Gatekeeper.sol inside the function ResultIsReady.
    Case A) resultReady event is fired
    CASE B) resultReadyUniqueId event is fired */
  // CASE A:
  gateKeeperContract.resultReady(
    (error) => {
      if (error) {
        logCatcher(error);
      }
    },
    (error, result) => {
      // recovery contract will store necessary information in case identity is compromised
      const recoveryAbi = JSON.parse(fs.readFileSync(`../Solidity/abi/${recoveryAddress}`));
      const recoveryContractFactory = contractMgr.newContractFactory(recoveryAbi);
      let recoveryContract;
      const code = fs.readFileSync('../Solidity/bin/Recovery.bin');
      logCatcher(`recovery ABI: ${JSON.stringify(recoveryAbi)}`);

      // recovery contract is created using the contract binary in the file system
      recoveryContractFactory.new({ data: code }, (error1, contract) => {
        if (error1) {
          logCatcher(`\nError creating recovery contract: ${error1}`);
          throw error1;
        }
        recoveryContract = recoveryContractFactory.at(contract.address);

        // grab parameters from the event
        const { proposalId } = (result.args);
        const votingResult = (result.args).result;
        const { resultMessage } = (result.args);
        const { coidGKAddr } = (result.args);
        const { coidAddr } = (result.args);
        const { dimensionCtrlAddr } = (result.args);
        const blockNumber = (result.args).blockNumberVal;
        const { blockHashVal } = (result.args);
        const blockchainID = (result.args).blockchainIdVal;
        const { timestamp } = (result.args);

        // MyGateKeeperContract.setRecoveryAddress(recoveryContract.address, () => {
        // gkContract.getRecoveryAddress(function(error,result){
        // logCatcher(`\nset recovery address in gk: ${recoveryContract.address}`);
        // })
        // });

        // debugging
        logCatcher('\nCaught gatekeeper contract event ResultReady....');
        logCatcher(`Voting result is: ${votingResult}`);
        logCatcher(`proposalID is: ${proposalId}`);
        logCatcher(`resultMessage is: ${resultMessage}`);
        logCatcher(`coidGKAddr is: ${coidGKAddr}`);
        logCatcher(`coidAddr is: ${coidAddr}`);
        logCatcher(`dimensionCtrlAddr is: ${dimensionCtrlAddr}`);
        logCatcher(`blockNumber is: ${blockNumber}`);
        logCatcher(`blockHashVal is: ${blockHashVal}`);
        logCatcher(`blockchainID is: ${blockchainID}`);
        logCatcher(`timestamp is: ${timestamp}`);
        logCatcher(`result.args: ${JSON.stringify(result.args)}`);

        // if and only if votingResult is true (identity is valid)
        if (votingResult) {
          // find data given proposalId
          const index = proposalIDArray.indexOf(proposalId);
          logCatcher(`index is: ${index}`);

          if (index !== -1) {
            // TODO (to make cleaner): un-hardcode m -- grab
            // number of validators from this app or DAO
            const validatorSigs = [];
            let indexSigs = 0;
            const consensusTime = new Date().toISOString();

            const cbValidator = (err, res) => {
              // TODO: Create labels for validator sigs
              res.push(consensusTime);
              logCatcher(`Result of ballotContract.getValidatorSignature_byIndex: ${JSON.stringify(result)}`);
              validatorSigs[indexSigs] = res;
              indexSigs++;
              logCatcher(`index is: ${indexSigs}`);
            };

            for (let m = 0; m < 3; m++) {
              ballotContract.getValidatorSignature_byIndex(proposalId, m, cbValidator);
            }

            logCatcher(`validator sigs are: ${validatorSigs}`);

            // gatekeeper needs to sign this:
            setTimeout(() => {
              // MyGateKeeperContract.getRecoveryAddress((error2, result2) => {
              //   logCatcher(`\ngetrecov: ${result2}`);
              // });

              createSignature('GatekeeperAppVerified', (signatureGK, pubkeyGK, hashGK) => {
                const GKSig = { signature: signatureGK, pubkeyGK, hashGK };
                logCatcher(`GK Sig: ${JSON.stringify(GKSig)}`);
                const visibility = 'private';
                const description = 'COID';
                // bigchainIt(proposalId, formdataArray[index], coidGKAddr,
                // coidAddr, dimensionCtrlAddr, blockNumber, blockHashVal,
                // blockchainID, timestamp, validatorSigs, GKSig, function (
                // result, theId, theHash) {
                notifier.bcPreRequest(
                  formdataArray[index].pubKey, proposalId, formdataArray[index],
                  blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs,
                  GKSig, formdataArray[index].bigchainID, formdataArray[index].bigchainHash,
                  visibility, description, (res, theId, theHash) => {
                    const form = formdataArray[index];
                    form.bigchainID = theId;
                    form.bigchainHash = theHash;
                    form.gatekeeperAddr = coidGKAddr;
                    form.coidAddr = coidAddr;
                    form.dimensionCtrlAddr = dimensionCtrlAddr;
                    form.proposalId = proposalId;
                    form.trieAddr = 'pending';
                    form.description = description;
                    form.visibility = visibility;
                    form.validatorSigs = validatorSigs;
                    form.txn_id = 'createIDFGK';

                    // Update the Digital Twin(s) for owners, controllers, recoverers
                    writeAll(prepareForm(form));

                    for (let x = 0; x < form.identityRecoveryIdList.split(',').length; x++) {
                      notifier.createRecoveryNotification(form, recoveryContract.address, form.identityRecoveryIdList.split(',')[x]);
                    }

                    // Build an object that will put the appropriate data
                    // inside the newly created contracts
                    CoidMaker(coidAddr, dimensionCtrlAddr, formdataArray[index]);

                    // This function will delete the proposal from BOTH
                    // gatekeeper.sol and ballot.sol
                    deleteProposal(proposalId);
                  },
                );// end function bcPreRequest
              });// end function createSignature
            }, 5000);
          } else {
            logCatcher('error finding form data--could not write acceptance to bigchaindb!');
          }
        }
      });
    },
  );

  // CASE B:
  // this means we have consensus (the result) on an update UniqueId proposal
  gateKeeperContract.resultReadyUniqueId(
    (error) => {
      if (error) {
        logCatcher(error);
      }
    },
    (error, result) => {
      logCatcher(`event result: ${JSON.stringify(result)}\n`);
      logCatcher(`event args: ${JSON.stringify(result.args)}\n`);
      // grab parameters from the event
      const fileName = 'MyCOID.json';
      const flag = 0;
      const {
        proposalId, coidGKAddr, coidAddr,
        dimensionCtrlAddr, blockHashVal, timestamp,
      } = (result.args);
      const votingResult = (result.args).result;
      const blockNumber = (result.args).blockNumberVal;
      const blockchainID = (result.args).blockchainIdVal;

      // implement logic if and only if votingResult is true:
      if (votingResult) {
        // find data given proposalId
        const index = proposalIDArray.indexOf(proposalId);
        logCatcher(`index is: ${index}`);

        if (index !== -1) {
          // TODO (to make cleaner): un-hardcode m -- grab number of validators from
          // NOTE: notice the use of let for m, rather than var!
          const validatorSigs = [];
          let indexSigs = 0;
          const cbValidator = (error1, result1) => {
            // TODO: Create labels for validator sigs
            logCatcher(`This is the result: ${JSON.stringify(result)}`);
            validatorSigs[indexSigs] = result1;
            indexSigs++;
            logCatcher(`m is: ${indexSigs}`);
          };

          for (let m = 0; m < 3; m++) {
            ballotContract.getValidatorSignature_byIndex(proposalId, m, cbValidator);
          }

          logCatcher(`validator sigs are: ${validatorSigs}`);

          // gatekeeper needs to sign this:
          setTimeout(() => {
            createSignature('GatekeeperAppVerified', (signatureGK, pubkeyGK, hashGK) => {
              const GKSig = { signature: signatureGK, pubkeyGK, hashGK };
              logCatcher(`GK Sig: ${JSON.stringify(GKSig)}`);
              logCatcher(`get asset: ${formdataArray[index].pubKey}`);
              notifier.getAsset(formdataArray[index].pubKey, fileName, flag, (results) => {
                const myUniqueIdAttributes = formdataArray[index].uniqueIdAttributes.split(',');
                // for(var j=0;j<myUniqueIdAttributes.length;j++){
                results.uniqueIdAttributes.push(myUniqueIdAttributes);
                // }
                logCatcher(`get asset returns: ${JSON.stringify(results)}\n`);
                const visibility = 'private';
                const description = 'COID';
                notifier.bcPreRequest(
                  formdataArray[index].pubKey, proposalId, formdataArray[index],
                  blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs,
                  GKSig, results.bigchainID, results.bigchainHash, visibility,
                  description, (res, theId, theHash) => {
                    logCatcher(`THE TXN ID: ${theId}`);
                    logCatcher(`THE HASH: ${theHash}`);
                    logCatcher(`GK ADDR: ${coidGKAddr}`);
                    logCatcher(`COID ADDR: ${coidAddr}`);
                    logCatcher(`DIM_CTRL ADDR: ${dimensionCtrlAddr}`);
                    results.bigchainID = theId; // eslint-disable-line no-param-reassign
                    results.bigchainHash = theHash; // eslint-disable-line no-param-reassign
                    results.description = description; // eslint-disable-line no-param-reassign
                    results.visibility = visibility; // eslint-disable-line no-param-reassign
                    results.txn_id = 'updateUidIDFGK'; // eslint-disable-line no-param-reassign
                    notifier.setAsset((formdataArray[index].pubKey).toUpperCase(), fileName, flag, 0, results, '', '', () => { });

                    // makes the changes to Unique ID attributes
                    UniqueAttributeChanger(results.coidAddr, results.dimensionCtrlAddr, results);

                    // delete the proposal
                    deleteProposal(proposalId);
                  },
                );
              });
            });
          }, 5000);
        } else {
          logCatcher('error finding form data--could not write acceptance to bigchaindb!');
        }
      }
    },
  );
};// end of eventListener

const init = async () => {
  logCatcher('Initializing.');

  // context initialization of express module
  const app = express();
  app.use(morgan('dev'));
  app.use(bodyParser.json());

  app.set('trust proxy', true);

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, application/json-rpc');
    next();
  });

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(morgan('dev'));

  EventListener();

  app.post('/gatekeeper', async (req, res) => {
    logCatcher('Just transacted a POST Request to endpoint: /gatekeeper');
    // const formdata = req.body;
    // logCatcher('\n formdata from gatekeeper ===> ', formdata);

    // This object will create a core Identity
    // Meant to be used for testing. Make sure to
    // update UNIQUEID when using repeatedly so uniqueness check doesn't fail

    /*const formdata =
      {
        pubKey: '0x0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055',
        uniqueId: '55b4423ba3d83fec282b89fbbe03fb9c0c7cbfc1e3a9f9cbf092bec1e3e2df17',
        uniqueIdAttributes: 'ben55,552d9797c4a7f7026c066aa8007444b50821b1396ad532ccd7e86616cf9109cc,QmQNowQxrtGR9BtCvEG357NZfWVfftPLqLEqCr16PVPzRq',
        ownershipId: 'BC14293F08F6B71EDCF3725E6019D1D3BE826F790BC5A1B1684A0B7D7C2775F4',
        ownerIdList: '0x0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055',
        controlId: '',
        controlIdList: '',
        ownershipTokenId: '6959b6456ec431bcf33b1538a98f1f80acc5871aea17ad8a7b2dcbd2b5561c2b',
        ownershipTokenAttributes: 'er',
        ownershipTokenQuantity: '0',
        controlTokenId: '70482ccbbd24866c7983f91f0e505e49b05c8a43b8255973bbe60444b4691060',
        controlTokenAttributes: 'gjk.',
        controlTokenQuantity: '0,0',
        identityRecoveryIdList: '0x0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055',
        recoveryCondition: '0',
        yesVotesRequiredToPass: '2',
        isHuman: 'true',
        timestamp: '',
        assetID: 'MyCOID',
        Type: 'non_cash',
        bigchainHash: '',
        bigchainID: '',
        coidAddr: '',
        gatekeeperAddr: '',
        dimensions: '',
        sig: '79e2bb1c1f60f6d300a6676a157c7078fd4e0001f1e06bd49313807c8db0a60327f260cb4cd7d0aff3add0bf654be68b22e18bffcf5e9692dfdfc05efaab1763',
        msg: '4d0f626621af134d41a7ce8c21ca78e56616e7cb5a149ab91d19fb3dd30a8720',
        txn_id: 'requestCOID',
        forUniqueId: 'false',
      }; */


    // This object will add a unique ID to a core identity
    // Meant to be used for testing. Make sure to update UNIQUEID when using repeatedly
    // so uniqueness check doesn't fail. works with the object made above.
    const formdata = {
      pubKey: '0x0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055',
      uniqueId: '3d054d5ef5836294462faaec0f228b1890e11a884fc41e41e159313754715885',
      uniqueIdAttributes: 'ICA3,3137ec277538688caa77acdd4bce4befeda02b2bb9b1302c8fc73229fe7e9290,QmfGMiTStf38VcfmHeWz7HdyAo4ZjTQBfmoYF81SyJ4G6N',
      filename: 'MyCOID.json',
      isHuman: 'true',
      yesVotesRequiredToPass: '2',
      sig: '79e2bb1c1f60f6d300a6676a157c7078fd4e0001f1e06bd49313807c8db0a60327f260cb4cd7d0aff3add0bf654be68b22e18bffcf5e9692dfdfc05efaab1763',
      msg: '4d0f626621af134d41a7ce8c21ca78e56616e7cb5a149ab91d19fb3dd30a8720',
      forUniqueId: 'true',
    };

    if (formdata.isHuman === 'true') {
      // initialize a gatekeeper object
      // verify public key against msg and sig
      let isValid = verifyIt(formdata);
      if (!!isValid === false) { isValid = false; }
      // let isValid = true;
      // check the uniqueness of the uniqueId in the request
      const isUnique = await checkUnique(formdata);
      logCatcher(`testing uniqueness for uniqueId ${formdata.uniqueId}`);
      logCatcher(`isValid result: ${isValid}`);
      if (isValid) {
        if (isUnique) {
          // get the proposalId from ballot and then set the data in the proposal
          getProposalId(formdata, res, (err1) => {
            if (err1) {
              res.json({ 'error gatekeeperApp.getProposalId': err1 });
              logCatcher('Error');
            } else {
              res.json({ Method: 'POST', msg: 'COID data submitted successfully' });
            }
          });
        } else { res.send('The uniqueId is not unique.'); }
      } else { res.send('The signature is not valid.'); }
    } else { res.send('Something happened. isHuman is false. This request is not for me.'); }
  });

  /** *********************************************************************************************
 * If port is changed, make sure to update Digital Twin config file
********************************************************************************************** */

  app.listen(port, () => {
    logCatcher('Connected to contract http://35.154.255.203:1337/rpc');
    logCatcher(`App '${moduleName}' is running on port ${port}`);
  });
  // Instantiate one of these
}; // end of init


const loadFiles = async (chainConfig = chainConfigFile) => {
  try {
    logCatcher('Loading files.');
    logCatcher(global.properties);
    logCatcher(JSON.stringify(chainConfig));
    const contractMgr = erisContracts.newContractManagerDev(global.properties.chainURL, chainConfig);

    const COIDcontract = getContract(contractMgr, jobs.CoreIdentity);
    const gateKeeperContract = getContract(contractMgr, jobs.GateKeeper);
    const ballotContract = getContract(contractMgr, jobs.ballot);
    const DaoContract = getContract(contractMgr, jobs.Dao);
    const recoveryContract = getContract(contractMgr, jobs.Recovery);
    const MyGateKeeperContract = getContract(contractMgr, jobs.MyGateKeeper);
    const DaoContractAddr = jobs.Dao;
    const ballotContractAddr = jobs.ballot;
    const coidAddress = jobs.CoreIdentity;
    const recoveryAddress = jobs.Recovery;
    const dmctrlAddr = jobs.IdentityDimensionControl;

    return Promise.resolve({
      contractMgr,
      COIDcontract,
      gateKeeperContract,
      ballotContract,
      DaoContract,
      recoveryContract,
      MyGateKeeperContract,
      DaoContractAddr,
      ballotContractAddr,
      coidAddress,
      chainConfig,
      recoveryAddress,
      dmctrlAddr,
      chain: global.properties.primary_account,
    });
  } catch (e) {
    return Promise.reject(new Error(e));
  }
};


// const contractStuff = {};
//   try {
//     const globalConfig = JSON.parse(fs.readFileSync(globalPath));
//     const erisConfig = JSON.parse(fs.readFileSync(globalConfig.properties.accounts_file_path));
//     const chain = JSON.parse(fs.readFileSync(globalConfig.properties.chain_config_file_path));
//     const contractData = JSON.parse(fs.readFileSync(globalConfig.jobs.myGatekeeper.base_path));
//     const contractMgr = erisContracts.newContractManagerDev(chain.chainURL,
//      erisConfig[globalConfig.properties.primary_account]);
//     contractStuff.chain = chain;
//     contractStuff.primary_account = globalConfig.properties.primary_account;
//     contractStuff.gateKeeperContract = getContract(contractMgr, contractData.MyGateKeeper);
//     contractStuff.gatekeeperAddress = contractData.MyGateKeeper;
//     // ballot contract
//     contractStuff.ballotContract = getContract(contractMgr, contractData.ballot);
//     contractStuff.ballotAddress = contractData.ballot;

//     contractStuff.coidContract = getContract(contractMgr, contractData.CoreIdentity);
//     contractStuff.coidAddress = contractData.CoreIdentity;

//     contractStuff.dimCtrlContract = getContract(
//       contractMgr, contractData.IdentityDimensionControl);
//     contractStuff.dimCtrlAddress = contractData.IdentityDimensionControl;
//   } catch (e) {
//     throw e;
//   }
//   return contractStuff;

logCatcher(`Launching app: ${moduleName}`);
loadFiles()
  .then((contracts) => {
    contractStuff = contracts;
    Object.freeze(contractStuff);
    logCatcher('Configuration loaded!');
    init();
  })
  .catch((error) => {
    logCatcher(error);
  });
