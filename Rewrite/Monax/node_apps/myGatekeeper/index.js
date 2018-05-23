const { promisify } = require('bluebird');
const app = require('express')();
const logCatcher = require('../Component/logCatcher');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const keccak256 = require('js-sha3').keccak_256;
const fs = require('fs');
const erisContracts = require('@monax/legacy-contracts');
const notify = require('../Component/notifications/notifications.js');

const notifier = notify('http://10.4.0.167:8000');
const crypto = require('crypto');
const ed25519 = require('ed25519');
const secp256k1 = require('secp256k1');

const FDarray = [];
const pIDArray = [];

const port = process.env.PORT || 3002;
let contractsInfo = {};

function HashIt(item) {
  if (typeof (item) === 'undefined') {
    return null;
  } else if (Array.isArray(item)) {
    return item.map(x => keccak256(x));
  } else if (typeof item !== 'object') {
    return keccak256(item);
  }
  return keccak256(JSON.stringify(item));
}// end hashit

const checkSizeAndFix = (array, size = 10) => {
  let newArray = [];
  if (Array.isArray(array)) {
    newArray = array;
  }
  if (newArray.length < size) {
    newArray = newArray.concat(Array(size - newArray.length).fill('0'));
  }
  return newArray;
};

const getContract = (contractMgr, path, original) => {
  const Abi = JSON.parse(fs.readFileSync(`../Solidity/abi/${path}`));
  return contractMgr.newContractFactory(Abi).at(!original ? path : original);
};

const setCoidRequester = async (requester, proposalId, sig, msg, gateKeeperContract) => {
  logCatcher('Accessing setCoidRequester');
  return promisify(gateKeeperContract.setCoidRequester)(requester, proposalId, sig, msg)
    .then((res) => {
      if (res) {
        return Promise.resolve(true);
      }
      return Promise.reject(new Error(`Bad return in setCoidRequester. ${res}`));
    }).catch((err) => {
      logCatcher(`Some kind of error in setCoidRequester. ${err}`);
      return Promise.reject(new Error(`Some kind of error in setCoidRequester. ${err}`));
    });
}; // end of function setCoidRequester

const setmyUniqueID = async (requester, proposalId, myUniqueID, myUniqueIdAttributes, gateKeeperContract) => {
  logCatcher('Accessing setmyUniqueID');
  const len = myUniqueIdAttributes.length;
  const promiseArray = [];
  for (let index = 0; index < len / 3; index++) {
    promiseArray.push(promisify(gateKeeperContract.setmyUniqueID)(
      requester, proposalId, myUniqueID, myUniqueIdAttributes[3 * index],
      myUniqueIdAttributes[(3 * index) + 1],
      myUniqueIdAttributes[(3 * index) + 2], index,
    ));
  }
  return Promise.all(promiseArray)
    .then(values => values.reduce(((acc, cur) => acc && cur), true))
    .catch((err) => {
      logCatcher(`setmyUniqueID error: ${err}`);
      return false;
    });
};

const setmyOwnershipID = async (requester, proposalId, myOwnershipId, myOwnerIdList, gateKeeperContract) => {
  logCatcher('Accessing setmyOwnershipID');
  return promisify(gateKeeperContract.setmyOwnershipID)(
    requester, proposalId,
    myOwnershipId, myOwnerIdList,
  )
    .then((res) => {
      if (res) {
        logCatcher(`Result2:${res}\nmyOwnershipId: ${myOwnershipId}\nmyOwnerIdList: ${myOwnerIdList}\n`);
        return Promise.resolve(true);
      }
      logCatcher(`Error with setmyOwnshipID ${res}`);
      return Promise.reject(new Error(`Error with setmyOwnshipID ${res}`));
    })
    .catch((err) => {
      logCatcher(`Error with setmyOwnshipID ${err}`);
      return Promise.reject(new Error(`Error with setmyOwnshipID ${err}`));
    }); // end of callback
}; // end of function setmyOwnershipID

const setmyControlID = async (requester, proposalId, myControlId, myControlIdList, gateKeeperContract) => {
  logCatcher('Accessing setmyControlID');
  return promisify(gateKeeperContract.setmyControlID)(requester, proposalId, myControlId, myControlIdList)
    .then((res) => {
      if (res) {
        logCatcher(`Result3:${res}\nmyControlId: ${myControlId}\nmyControlIdList: ${myControlIdList}\n`);
        return Promise.resolve(true);
      }
      logCatcher(`Error with setmyControlID: ${res}`);
      return Promise.reject(new Error(`Error with setmyControlID: ${res}`));
    })
    .catch((err) => {
      logCatcher(`Error with setmyControlID: ${err}`);
      return Promise.reject(new Error(`Error with setmyControlID: ${err}`));
    }); // end of callback
}; // end of function


const setmyOwnershipTokenID = async (requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes, myOwnershipTokenQuantity, gateKeeperContract) => {
  logCatcher(`ownershiptokenID is ${myOwnershipTokenId}\nmyOwnershipTokenAttributes : ${myOwnershipTokenAttributes}\nmyOwnershipTokenQuantity : ${myOwnershipTokenQuantity}\n`);
  return promisify(gateKeeperContract.setmyOwnershipTokenID)(requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes, myOwnershipTokenQuantity)
    .then((res) => {
      if (res) {
        logCatcher(`Result4:${res}\nmyOwnershipTokenId: ${myOwnershipTokenId}\nmyOwnershipTokenAttributes: ${myOwnershipTokenAttributes}\nmyOwnershipTokenQuantity${myOwnershipTokenQuantity}\n`);
        return Promise.resolve(true);
      }
      logCatcher(`Error with setmyOwnershipTokenID: ${res}`);
      return Promise.reject(new Error(`Error with setmyOwnershipTokenID: ${res}`));
    })
    .catch((err) => {
      logCatcher(`Error with setmyOwnershipTokenID: ${err}`);
      return Promise.reject(new Error(`Error with setmyOwnershipTokenID: ${err}`));
    }); // end of callback
};// end of function

const setmyControlTokenID = async (requester, proposalId, myControlTokenId, myControlTokenAttributes, myControlTokenQuantity, gateKeeperContract) => {
  logCatcher('Accessing setmyControlTokenID');
  return promisify(gateKeeperContract.setmyControlTokenID)(requester, proposalId, myControlTokenId, myControlTokenAttributes, myControlTokenQuantity)
    .then((res) => {
      if (res) {
        logCatcher(`Result5:${res}\nmyControlTokenId: ${myControlTokenId}\nmyControlTokenAttributes: ${myControlTokenAttributes}\nmyControlTokenQuantity${myControlTokenQuantity}\n`);
        return Promise.resolve(true);
      }
      logCatcher(`Error in setmyControlTokenID: ${res}`);
      return Promise.reject(new Error(`Error in setmyControlTokenID: ${res}`));
    })
    .catch((error) => {
      logCatcher(`Error in setmyControlTokenID: ${error}`);
      return Promise.reject(new Error(`Error in setmyControlTokenID: ${error}`));
    }); // end of callback
}; // end of function

const setmyIdentityRecoveryIdList = async (requester, proposalId, myIdentityRecoveryIdList, myRecoveryCondition, gateKeeperContract) => {
  logCatcher(`Requester is: ${requester}\nproposalId is: ${proposalId}\nRecoveryIDLIST: ${myIdentityRecoveryIdList}\nRecoveryCondition: ${myRecoveryCondition}\n`);
  return promisify(gateKeeperContract.setmyIdentityRecoveryIdList)(requester, proposalId, myIdentityRecoveryIdList, myRecoveryCondition)
    .catch((err) => {
      logCatcher(`setmyIdentifyRecoverIdList error: ${err}`);
      return Promise.reject(new Error(`setmyIdentifyRecoverIdList error: ${err}`));
    });
}; // end of function

const setValidators = async (proposalId, validators, gateKeeperContract, contracts = contractsInfo) => {
  const arr = validators.concat(Array(10 - validators.length).fill(0x0));
  logCatcher(`validators: ${validators}`);
  logCatcher(`validators for setValidators: ${arr}`);
  return promisify(gateKeeperContract.setValidators)(proposalId, arr, contracts.ballotAddress)
    .catch((e) => {
      logCatcher(e);
      return Promise.reject(new Error(`setValidators error: ${e}`));
    });
}; // end of function

const setPropType = async (proposalId, propType, gateKeeperContract) => {
  logCatcher(`proptype: ${propType}`);
  promisify(gateKeeperContract.setPropType)(proposalId, Number(propType))
    .then(result => Promise.resolve(result))
    .catch((err) => {
      logCatcher(err);
      return Promise.reject(new Error(`setPropType error: ${err}`));
    });
};

const initiateCoidProposalSubmission = async (proposalId, yesVotesRequiredToPass, isHuman, address, propType, gateKeeperContract, contracts = contractsInfo) => {
  const tempPropType = propType || 0;
  return setPropType(proposalId, tempPropType, gateKeeperContract)
    .then(async () => {
      logCatcher(`propType in initcoid: ${propType || 0}`);
      return promisify(gateKeeperContract.initiateCoidProposalSubmission)(contracts.ballotAddress, proposalId, yesVotesRequiredToPass, isHuman, address, tempPropType);
    })
    .then(promisify(gateKeeperContract.getPropType)(proposalId))
    .catch((err) => {
      logCatcher(err);
      return Promise.reject(new Error(`initiateCoidProposalSubmission error: ${err}`));
    });
};// end of function


const setcoidData = async (proposalId, formdata, res, gateKeeperContract, callback) => {
  // local variables for API calls
  const arraySize = 10;
  const myUniqueIdAttributes = formdata.uniqueIdAttributes.split(',');
  const myOwnerIdList = checkSizeAndFix(HashIt(formdata.ownerIdList.split(',')), arraySize);
  const myControlIdList = checkSizeAndFix(HashIt(formdata.controlIdList.split(',')), arraySize);
  const myOwnershipTokenQuantity = checkSizeAndFix(formdata.ownershipTokenQuantity.split(','), arraySize);
  const myControlTokenQuantity = checkSizeAndFix(formdata.controlTokenQuantity.split(','), arraySize);
  const myIdentityRecoveryIdList = checkSizeAndFix(HashIt(formdata.identityRecoveryIdList.split(',')), arraySize);
  const validators = HashIt(formdata.validatorList.split(','));

  await setCoidRequester(formdata.pubKey, proposalId, formdata.sig, formdata.msg, gateKeeperContract);
  await setmyUniqueID(formdata.pubKey, proposalId, formdata.uniqueId, myUniqueIdAttributes, gateKeeperContract);
  await setmyOwnershipID(formdata.pubKey, proposalId, formdata.ownershipId, myOwnerIdList, gateKeeperContract);
  await setmyControlID(formdata.pubKey, proposalId, formdata.controlId, myControlIdList, gateKeeperContract);
  await setmyOwnershipTokenID(formdata.pubKey, proposalId, formdata.ownershipTokenId, formdata.ownershipTokenAttributes, myOwnershipTokenQuantity, gateKeeperContract);
  await setmyControlTokenID(formdata.pubKey, proposalId, formdata.controlTokenId, formdata.controlTokenAttributes, myControlTokenQuantity, gateKeeperContract);
  await setmyIdentityRecoveryIdList(formdata.pubKey, proposalId, myIdentityRecoveryIdList, formdata.recoveryCondition, gateKeeperContract);
  await setValidators(proposalId, validators, gateKeeperContract);
  await initiateCoidProposalSubmission(proposalId, formdata.yesVotesRequiredToPass, false, formdata.gatekeeperAddr, Number(formdata.propType), gateKeeperContract)
    .then(() => {
      notifier.createProposalPendingNotification(formdata.pubKey, proposalId, formdata.isHuman, formdata.gatekeeperAddr, 0);
      callback(false, res);
    })
    .catch((e) => {
      logCatcher(e);
      callback(true, res);
    });
};

const addUID = async (proposalId, formdata, res, gateKeeperContract, callback) => {
  // local variables for API calls
  logCatcher('addUID reached');
  const myUniqueIdAttributes = formdata.uniqueIdAttributes.split(',');
  const validators = HashIt(formdata.validatorList.split(','));
  logCatcher('adduid try catch');
  return Promise.resolve()
    .then(() => setCoidRequester(formdata.pubKey, proposalId, formdata.sig, formdata.msg, gateKeeperContract))
    .then(() => setmyUniqueID(formdata.pubKey, proposalId, formdata.uniqueId, myUniqueIdAttributes, gateKeeperContract))
    .then(() => setPropType(proposalId, Number(formdata.propType), gateKeeperContract))
    .then(() => setValidators(proposalId, validators, gateKeeperContract))
    .then(() => initiateCoidProposalSubmission(proposalId, formdata.yesVotesRequiredToPass, false, formdata.gatekeeperAddr, Number(formdata.propType), gateKeeperContract))
    .then(() => notifier.createProposalPendingNotification(formdata.pubKey, proposalId, false, formdata.gatekeeperAddr, Number(formdata.propType)))
    .then(() => {
      callback(false, res);
      Promise.resolve(true);
    })
    .catch((e) => {
      callback(true, res);
      return Promise.reject(new Error(`AddUID error: ${e}`));
    });
};

const KYC = (proposalId, formdata, res, gateKeeperContract, callback) => {
  const myUniqueIdAttributes = formdata.uniqueIdAttributes.split(',');
  const validators = HashIt(formdata.validatorList.split(','));
  Promise.resolve().then(() => setCoidRequester(formdata.pubKey, proposalId, formdata.sig, formdata.msg, gateKeeperContract))
    .then(() => setmyUniqueID(formdata.pubKey, proposalId, formdata.uniqueId, myUniqueIdAttributes, gateKeeperContract))
    .then(() => setPropType(proposalId, Number(formdata.propType), gateKeeperContract))
    .then(() => setValidators(proposalId, validators, gateKeeperContract))
    .then(() => initiateCoidProposalSubmission(proposalId, formdata.yesVotesRequiredToPass, false, formdata.gatekeeperAddr, Number(formdata.propType), gateKeeperContract))
    .then(() => {
      notifier.createProposalPendingNotification(formdata.pubKey, proposalId, false, formdata.gatekeeperAddr, Number(formdata.propType));
      callback(false, res);
    })
    .catch((e) => {
      logCatcher(e);
      callback(true, res);
    });
};

const verifyIt = async (formdata) => {
  logCatcher('you have reached verifyIt internal function');
  if (!formdata.msg || !formdata.sig || !formdata.pubKey) return false;
  return secp256k1.verify(Buffer.from(formdata.msg, 'hex'), Buffer.from(formdata.sig, 'hex'), Buffer.from(formdata.pubKey.slice(2), 'hex'));
}; // end verification

const checkUnique = async (formdata, gateKeeperContract) => {
  logCatcher(`inside checkUnique, formdata.uniqueId is: ${formdata.uniqueId}`);
  const result = await promisify(gateKeeperContract.isUnique)(formdata.uniqueId)
    .then(value => Promise.resolve(value))
    .catch((err) => {
      logCatcher(err);
      return Promise.reject(new Error(`isUnique error: ${err}`));
    });
  // logCatcher('\n\n\n\n\n\n\n' + result + '\n\n\n\n\n\n');
  return result;
};

const getProposalId = async (formdata, res, gateKeeperContract, callback, formdataArray = FDarray,
  contracts = contractsInfo, proposalIDArray = pIDArray,
) => {
  const proposalId = await promisify(contracts.ballotContract.getProposalId)().then((value) => {
    formdataArray.push(JSON.parse(JSON.stringify(formdata)));
    proposalIDArray.push(value);
    return Promise.resolve(value);
  }).catch((err) => {
    logCatcher(err);
    return Promise.reject(new Error(`getProposalId error: ${err}`));
  });
  if (proposalId === false || !proposalId) {
    return false;
  }
  switch (Number(formdata.propType)) {
    case 0:
      // coid request
      logCatcher(`proposalId: ${proposalId}`);
      await setcoidData(proposalId, formdata, res, gateKeeperContract, callback);
      logCatcher('right after set coid data....');
      break;
    case 1:
      // Unique Attr request
      logCatcher(`proposalId: ${proposalId}`);
      addUID(proposalId, formdata, res, gateKeeperContract, callback);
      logCatcher('right after Unique....');
      break;
    case 2:
      // KYC request
      logCatcher(`proposalId: ${proposalId}`);
      KYC(proposalId, formdata, res, gateKeeperContract, callback);
      logCatcher('right after KYC....');
      break;
    default:
      break;
  }
  return true;
}; // end of function

const writeAll = async (formdata, theNotifier = notifier) => {
  const owners = formdata.ownerIdList;
  let controllers = formdata.controlIdList;
  if (controllers === '') { controllers = []; }
  const max = Math.max(owners.length, controllers.length);
  const fileName = `${formdata.assetID}.json`;
  logCatcher('\n*****THE MIGHTY WRITEALL*****\n');
  logCatcher(JSON.stringify(formdata));
  logCatcher(`MAX :${max}`);
  const total = owners.length + controllers.length;
  logCatcher(`TOTAL: ${total}`);
  logCatcher(`${owners} len ${owners.length}`);
  const promiseArray = [];
  const SetAsset = promisify(theNotifier.setAsset);
  for (let i = 0; i < max; i++) {
    logCatcher(`loop ${owners[i]}`);
    if (!!owners[i] && owners !== '') {
      promiseArray.push(SetAsset(String(owners[i]), String(fileName), 0, 0, formdata, '', ''));
    }
    if (!!controllers[i] && controllers !== '') {
      promiseArray.push(SetAsset(String(controllers[i]), String(fileName), 1, 0, formdata, '', ''));
    } // end writeAll
  }
  return Promise.all(promiseArray).then(values => values.reduce((accumulator, currentValue) => accumulator && currentValue, true)).catch(err => logCatcher(err));
};

const prepareForm = (formdata) => {
  const correctForm = JSON.parse(JSON.stringify(formdata));
  correctForm.uniqueIdAttributes = [];
  correctForm.uniqueIdAttributes.push(formdata.uniqueIdAttributes.split(','));
  correctForm.ownerIdList = formdata.ownerIdList.split(',');
  correctForm.controlIdList = formdata.controlIdList.split(',') || [];
  correctForm.ownershipTokenAttributes = formdata.ownershipTokenAttributes.split(',') || [];
  correctForm.ownershipTokenQuantity = formdata.ownershipTokenQuantity.split(',') || [];
  correctForm.controlTokenAttributes = formdata.controlTokenAttributes.split(',') || [];
  correctForm.controlTokenQuantity = formdata.controlTokenQuantity.split(',') || [];
  correctForm.identityRecoveryIdList = formdata.identityRecoveryIdList.split(',') || [];
  correctForm.validatorList = formdata.validatorList.split(',');
  correctForm.delegateeIdList = formdata.delegateeIdList.split(',') || [];
  correctForm.delegateeTokenQuantity = formdata.delegateeTokenQuantity.split(',') || [];

  for (let j = correctForm.controlIdList.length - 1; j >= 0; j--) {
    for (let i = correctForm.ownerIdList.length - 1; i >= 0; i--) {
      if (correctForm.controlIdList[j] === correctForm.ownerIdList[i]) {
        correctForm.controlIdList.splice(j, 1);
      }
    }
  }

  return correctForm;
};

const CoidMaker = async (
  coidAddr, dimensionCtrlAddr, formdata,
  COIDabiAddr = contractsInfo.coidAddress,
  contractMgr = contractsInfo.contractMgr,
  dmctrlAddr = contractsInfo.dimCtrlAddress,
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
  const isHumanValue = false;
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
  myControlIdList = checkSizeAndFix(HashIt(myControlIdList));
  myOwnershipTokenQuantity = checkSizeAndFix(myOwnershipTokenQuantity);
  myControlTokenQuantity = checkSizeAndFix(myControlTokenQuantity);
  myIdentityRecoveryIdList = checkSizeAndFix(HashIt(myIdentityRecoveryIdList));

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
      await StartCoid();
    })
    .then(async () => {
      await IDCInstantiation(coidAddr, '0x0');
      logCatcher('***Finished***\n');
    })
    .catch((err) => {
      logCatcher(`\n\ncoidmaker error:\n${err}`);
    });
}; // end CoidMaker function

const createSignature = (nonHashedMessage, callback, contracts = contractsInfo) => {
  // make message hash
  const hash = crypto.createHash('sha256').update(nonHashedMessage).digest('hex');
  const { pubKey, privKey } = contracts.accounts[contracts.primary_account];
  const keyPair = { publicKey: Buffer.from(pubKey, 'hex'), privateKey: Buffer.from(privKey, 'hex') };
  let signature = ed25519.Sign(Buffer.from(hash), keyPair);
  signature = signature.toString('hex');
  callback(signature, pubKey, hash);
};

const UniqueAttributeChanger = (coidAddr, dimensionCtrlAddr, formdata, contracts = contractsInfo, web3 = Buffer.from) => {
  // get params for their COID contract
  logCatcher(`Unique Attribute Changer formdata:\n${JSON.stringify(formdata)}\n`);

  // parse the form data
  const myUniqueId = formdata.uniqueId;// since we are not changing the actual unique ID field
  let myUniqueIdAttributes = formdata.uniqueIdAttributes;
  const UIDAttr = Array(10).fill('0');
  const fileHashes = Array(10).fill('0');
  let k = 0;

  const COIDcontract = getContract(contracts.contractMgr, contracts.coidAddress, coidAddr);

  for (let i = 0; i < myUniqueIdAttributes.length; i += 3) {
    UIDAttr[k] = web3(myUniqueIdAttributes[i], 'utf8').toString('hex');
    fileHashes[k] = myUniqueIdAttributes[i + 1];
    k++;
  }

  setTimeout(() => {
    logCatcher(`\nATTRIBUTES:\n${myUniqueIdAttributes}`);
    myUniqueIdAttributes = myUniqueIdAttributes.concat(Array(10 - myUniqueIdAttributes.length).fill('0'));
    COIDcontract.addUniqueID(myUniqueId, UIDAttr, fileHashes, (error) => {
      if (error) { logCatcher(`adduid error: ${error}`); } else { logCatcher('\n-----Unique ID added-----\n'); }
    });// end addUniqueID
    // })
  }, 3000);
}; // end UniqueAttributeChanger function


// for checking expiry of proposals
// contract function will delete proposal for you
// const isExpired = (contract = contractsInfo) => {
//   contract.ballotContract.IsProposalExpired((error, result) => {
//     logCatcher(`IsproposalExpired has just been called: ${result}`);
//     if (error) {
//       logCatcher(`Error with isProposalExpired: ${error || result}`);
//       return false;
//     }
//     if (result) {
//       return true;
//     }
//     setTimeout(() => {
//       // recursively check every 9 seconds. in the future make this a day.
//       isExpired(contract);
//     }, 9000);
//     return false;
//   });
// };

const eventListener = (gateKeeperContract, contracts = contractsInfo) => {
  const indexer = 0;
  const deleteProposal = async (proposalId, contract = contractsInfo) => {
    return promisify(contract.ballotContract.deleteProposal)(proposalId)
      .then((value) => {
        return promisify(gateKeeperContract.deleteProposal)(proposalId);
      })
      .catch((error) => {
        logCatcher(`An error occured in deleteProposal: ${error}`);
        //Promise.reject(new Error(false));
      });
  }

  gateKeeperContract.resultReady(
    (error) => {
      if (error) logCatcher(`gateKeeperContract.resultReady: ${error}`);
    },
    (error, result, contract = contractsInfo, PIDarray = pIDArray, formdataArray = FDarray) => {
      logCatcher('create asset event');
      // grab parameters from the event
      const {
        proposalId, coidAddr, dimensionCtrlAddr,
        blockNumber, blockHashVal, blockchainID, timestamp,
      } = result.args;
      const votingResult = result.args.result;

      // implement logic if and only if votingResult is true:
      if (votingResult) {
        // find data given proposalId
        const index = PIDarray.indexOf(proposalId);

        logCatcher(`index is: ${index}`);

        if (index !== -1) {
          // TODO (to make cleaner): un-hardcode m -- grab number of validators from
          // NOTE: notice the use of let for m, rather than var!
          const validatorSigs = [];
          let indexSigs = 0;
          const consensusTime = new Date().toISOString();
          const loopFunction = (m) => {
            contract.ballotContract.getValidatorSignature_byIndex(proposalId, m, (err, res) => {
              // TODO: Create labels for validator sigs
              res.push(consensusTime);
              logCatcher(`This is the result: ${JSON.stringify(res)}`);
              validatorSigs[indexSigs] = res;
              indexSigs++;
            });
          };
          for (let m = 0; m < formdataArray[index].validatorList.split(',').length; m++) {
            loopFunction(m);
          }

          logCatcher(`validator sigs are: ${validatorSigs}`);

          // gatekeeper needs to sign this:
          setTimeout(
            () => {
              createSignature('GatekeeperAppVerified', (signatureGK, pubkeyGK, hashGK) => {
                const GKSig = { signature: signatureGK, pubkeyGK, hashGK };
                logCatcher(`GK Sig: ${JSON.stringify(GKSig)}`);
                const visibility = formdataArray[index].visibility || 'public';
                const description = 'ASSET';
                // _this.bigchainIt(proposalId, formdataArray[index], formdataArray[index].gatekeeperAddr, coidAddr, dimensionCtrlAddr, blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, function (result, theId, theHash) {
                notifier.bcPreRequest(formdataArray[index].pubKey, proposalId, formdataArray[index], blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, formdataArray[index].bigchainID, formdataArray[index].bigchainHash, visibility, description, (res, theId, theHash) => {
                  const form = formdataArray[index];
                  form.bigchainID = theId;
                  form.bigchainHash = theHash;
                  // form.gatekeeperAddr = coidGKAddr;
                  form.coidAddr = coidAddr;
                  form.dimensionCtrlAddr = dimensionCtrlAddr;
                  form.proposalId = proposalId;
                  form.description = description;
                  form.visibility = visibility;
                  form.validatorSigs = validatorSigs;
                  form.txn_id = 'createMyGK';
                  writeAll(prepareForm(form));

                  // make the core identity
                  CoidMaker(coidAddr, dimensionCtrlAddr, formdataArray[index]);

                  // delete the proposal
                  deleteProposal(proposalId);
                });
              });
            },
            5000,
          );
        } else {
          logCatcher('error finding form data--could not write acceptance to bigchaindb!');
          deleteProposal(proposalId);
        }
      }
    },
  );

  gateKeeperContract.resultReadyKYC(
    () => {
    },
    (error, result, contract = contractsInfo, proposalIDArray = pIDArray, theNotifier = notifier, web3 = Buffer.from, formdataArray = FDarray) => {
      logCatcher('KYC event');
      // grab parameters from the event
      const {
        proposalId, coidGKAddr, coidAddr, dimensionCtrlAddr,
        blockNumber, blockHashVal, blockchainID, timestamp,
      } = result.args;
      const votingResult = result.args.result;

      // implement logic if and only if votingResult is true:
      if (votingResult) {
        // find data given proposalId
        const index = proposalIDArray.indexOf(proposalId);
        // for (let k = 0; k < indexer; k++) {
        //   if (proposalIDArray[k] === proposalId) {
        //     index = k;
        //   }
        // }

        logCatcher(`index is: ${index}`);
        const validatorSigs = [];

        if (index !== -1) {
          // TODO (to make cleaner): un-hardcode m -- grab number of validators from
          // NOTE: notice the use of let for m, rather than var!
          let indexSigs = 0;
          const consensusTime = new Date().toISOString();
          const loopFunction = (m) => {
            contract.ballotContract.getValidatorSignature_byIndex(proposalId, m, (err, res) => {
              // TODO: Create labels for validator sigs
              res.push(consensusTime);
              logCatcher(`This is the result: ${JSON.stringify(res)}`);
              validatorSigs[indexSigs] = res;
              indexSigs++;
              logCatcher(`m is: ${m}`);
            });
          };
          for (let m = 0; m < formdataArray[index].validatorList.split(',').length; m++) {
            loopFunction(m);
          }
          // ST: we dont need this function anymore because we have getValidatorSignature_byIndex

          logCatcher(`validator sigs are: ${validatorSigs}`);

          // gatekeeper needs to sign this:
          setTimeout(
            () => {
              createSignature('GatekeeperAppVerified', (signatureGK, pubkeyGK, hashGK) => {
                const GKSig = { signature: signatureGK, pubkeyGK, hashGK };
                logCatcher(`GK Sig: ${JSON.stringify(GKSig)}`);
                // _this.bigchainIt(proposalId, formdataArray[index], formdataArray[index].gatekeeperAddr,
                // coidAddr, dimensionCtrlAddr, blockNumber, blockHashVal, blockchainID, timestamp,
                // validatorSigs, GKSig, function (result, theId, theHash) {
                const visibility = formdataArray[index].visibility || 'private';
                const description = 'ICA';
                theNotifier.bcPreRequest(formdataArray[index].pubKey, proposalId, formdataArray[index], blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, formdataArray[index].bigchainID, formdataArray[index].bigchainHash, visibility, description, async (res, theId, theHash) => {
                  // logCatcher(result);
                  logCatcher(`THE TXN ID: ${theId}\nTHE HASH: ${theHash}\nGK ADDR: ${coidGKAddr}\nCOID ADDR: ${coidAddr}\nDIM CTRL ADDR: ${dimensionCtrlAddr}\n`);
                  for (let j = 0; j < formdataArray[index].validatorList.split(',').length; j++) {
                    theNotifier.createIcaSigNotification(`0x${validatorSigs[j][2]}`, proposalId, validatorSigs[j][3], theId, formdataArray[index].assetID, formdataArray[index].pubKey);
                    logCatcher(`notify: ${validatorSigs[j][2]} Expires: ${validatorSigs[j][3]} txid: ${theId}`);
                  }
                  // theNotifier.notifyCoidCreation(formdataArray[index].pubKey, formdataArray[index].assetID, theId, theHash, coidGKAddr, coidAddr, dimensionCtrlAddr)
                  const form = formdataArray[index];
                  form.bigchainID = theId;
                  form.bigchainHash = theHash;
                  // form.gatekeeperAddr = coidGKAddr;
                  form.coidAddr = coidAddr;
                  const coidContract = getContract(contracts.contractMgr, contracts.coidAddress, coidAddr);
                  const dimCtrlContract = getContract(contract.contractMgr, contracts.dimCtrlAddress, dimensionCtrlAddr);
                  logCatcher(`${coidContract.setUniqueID}\n=========================================\n${coidContract.setOwnership}\n=========================================\n`);
                  logCatcher(`${coidContract.StartCoidIca}\n=========================================\n${dimCtrlContract.IdentityDimensionControlInstantiation}`);
                  form.dimensionCtrlAddr = dimensionCtrlAddr;
                  form.ownerIdList = (form.pubKey);
                  form.validatorSigs = validatorSigs;
                  form.proposalId = proposalId;
                  form.description = description;
                  form.visibility = visibility;
                  form.txn_id = 'createICAMyGK';

                  const myOwnerIdList = checkSizeAndFix(HashIt(form.ownerIdList.split(',')));
                  const myOwnershipTokenQuantity = Array(10).fill('0');
                  const myUniqueIdAttributes = form.uniqueIdAttributes.split(',');
                  let theUniqueIDAttributes = myUniqueIdAttributes;
                  const UIDAttr = Array(10).fill('0');
                  const fileHashes = Array(10).fill('0');
                  let k = 0;

                  for (let i = 0; i < theUniqueIDAttributes.length; i += 3) {
                    theUniqueIDAttributes[i] = myUniqueIdAttributes[i];
                  }
                  for (let i = 0; i < theUniqueIDAttributes.length; i += 3) {
                    UIDAttr[k] = web3(myUniqueIdAttributes[i], 'utf8').toString('hex');
                    fileHashes[k] = myUniqueIdAttributes[i + 1];
                    k++;
                  }
                  theUniqueIDAttributes = theUniqueIDAttributes.concat(Array(10 - theUniqueIDAttributes.length).fill('0'));
                  logCatcher(`form atr: ${form.uniqueIdAttributes}\nuid: ${form.uniqueId}\n
                  atr: ${theUniqueIDAttributes}\nUIDAttr: ${UIDAttr}\nfileHashes: ${fileHashes}\n`);

                  const setUniqueID = promisify(coidContract.setUniqueID);
                  const setOwnership = promisify(coidContract.setOwnership);
                  const StartCoidIca = promisify(coidContract.StartCoidIca);
                  const IdentityDimensionControlInstantiation = promisify(dimCtrlContract.IdentityDimensionControlInstantiation);

                  await setUniqueID(form.uniqueId, UIDAttr, fileHashes, false)
                    .then(async () => setOwnership(myOwnerIdList, myOwnershipTokenQuantity))
                    .then(async () => StartCoidIca())
                    .then(async () => IdentityDimensionControlInstantiation(coidAddr, '0x0'))
                    .then((value) => {
                      logCatcher(`DimensionInstantiation: ${JSON.stringify(value)}`);
                      Promise.resolve(value);
                    })
                    .catch((err) => {
                      logCatcher(`\n\nKYC error:\n${err}`);
                    });
                  writeAll(prepareForm(form));
                  // make the core identity
                  // CoidMaker(coidAddr, dimensionCtrlAddr, formdataArray[index])

                  // delete the proposal
                  // deleteProposal(proposalId);
                });
              });
            },
            5000,
          );
        } else {
          logCatcher('error finding form data--could not write acceptance to bigchaindb!');
          deleteProposal(proposalId);
        }
      }
    },
  );

  gateKeeperContract.resultReadyUniqueId(
    () => {
    },
    async (error, result, theNotifier = notifier, contract = contractsInfo, formdataArray = FDarray, proposalIDArray = pIDArray) => {
      logCatcher('unique ID event');
      // grab parameters from the event
      const {
        proposalId, coidGKAddr, coidAddr,
        dimensionCtrlAddr, blockNumber, blockchainID, timestamp, blockHashVal,
      } = result.args;
      const flag = 0;
      const votingResult = result.args.result;

      // implement logic if and only if votingResult is true:
      if (votingResult) {
        // find data given proposalId
        logCatcher(`propIDARRAY: ${proposalIDArray}`);
        logCatcher(`propID: ${proposalId}`);
        const index = proposalIDArray.indexOf(proposalId);
        logCatcher(`index is: ${index}`);

        if (index !== -1) {
          const fileName = `${formdataArray[index].assetId}.json`;
          // TODO (to make cleaner): un-hardcode m -- grab number of validators from
          // NOTE: notice the use of let for m, rather than var!
          const validatorSigs = [];
          const promiseArray = [];
          const consensusTime = new Date().toISOString();
          const loopFunction = (m) => {
            contract.ballotContract.getValidatorSignature_byIndex(proposalId, m, (err, res) => {
              // TODO: Create labels for validator sigs
              res.push(consensusTime);
              logCatcher(`This is the result: ${JSON.stringify(res)}`);
              validatorSigs[indexSigs] = res;
              indexSigs++;
              logCatcher(`m is: ${m}`);
            });
          };
          for (let m = 0; m < formdataArray[index].validatorList.split(',').length; m++) {
            loopFunction(m);
          }
          logCatcher(`validator sigs are: ${validatorSigs}`);

          // gatekeeper needs to sign this:
          setTimeout(() => {
            createSignature('GatekeeperAppVerified', (signatureGK, pubkeyGK, hashGK) => {
              const GKSig = { signature: signatureGK, pubkeyGK, hashGK };
              logCatcher(`GK Sig: ${JSON.stringify(GKSig)}`);
              logCatcher(`get asset: ${formdataArray[index].pubKey}`);
              theNotifier.getAsset(formdataArray[index].pubKey, fileName, flag, (results) => {
                const myUniqueIdAttributes = formdataArray[index].uniqueIdAttributes.split(',');
                results.uniqueIdAttributes.push(myUniqueIdAttributes);
                logCatcher(`get asset returns: ${JSON.stringify(results)}\n`);
                const { visibility, description } = results;
                theNotifier.bcPreRequest(formdataArray[index].pubKey, proposalId, formdataArray[index], blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, results.bigchainID, results.bigchainHash, visibility, description, (res, theId, theHash) => {
                  logCatcher(`THE TXN ID: ${theId}\nTHE HASH: ${theHash}\nGK ADDR: ${coidGKAddr}\nCOID ADDR: ${coidAddr}\nDIM_CTRL ADDR: ${dimensionCtrlAddr}\n`);
                  // Should this be res instead of results?
                  results.bigchainID = theId; // eslint-disable-line no-param-reassign
                  results.bigchainHash = theHash; // eslint-disable-line no-param-reassign
                  results.txn_id = 'updateUidMyGK'; // eslint-disable-line no-param-reassign
                  writeAll(results);
                  // makes the changes Unique ID attributes
                  UniqueAttributeChanger(results.coidAddr, results.dimensionCtrlAddr, results);

                  // delete the proposal
                  // TODO- add this function back
                  // deleteProposal(proposalId);
                });
              });
            });
          }, 5000);

          // Delete the proposal from gatekeeper only if storing coid into bigchaindb is successful
          // TODO: Call ballot removeSelectedValidators and removeProposal for the proposalID
        } else {
          logCatcher('error finding form data--could not write acceptance to bigchaindb!');
        }
      }
    },
  );

  contracts.ballotContract.resultIsReady(
    (error) => {
      if (error) logCatcher(`Error in Ballotcontract resultIsReady ${error}`);
    },

    (error, result, contract = contracts) => {
      const chainID = HashIt(contract.chain);

      logCatcher(`ballot contract event -- ResultIsReady\n
        proposalId from event is: ${result.args.proposalId}\n
        requestResult from event is: ${result.args.requestResult}\n`);
      gateKeeperContract.ResultIsReady(result.args.requestResult, result.args.proposalId, chainID, (err, res) => {
        if (err) {
          logCatcher(`error from Gatekeeper Contract function ResultIsReady:${err}`);
        } else {
          logCatcher('ResultIsReady function in gatekeeper successfully called.');
        }
      });
    },
  );// end of _this.ballotContract.resultIsReady

  // this is the event listening. the event is just for debugging purposes.
  contracts.ballotContract.proposalExpired(
    (error, result) => {

    },
    (error, result) => {
      logCatcher(`${JSON.stringify(result.args)}... is the result from event ballotContract.proposalExpired`);
    },
  );

  // start the recursive checking
  // setTimeout(() => {
  //   isExpired(contracts);
  // }, 500000);
};

const gatekeepers = [];

const keeper = async (req, res, next, contracts = contractsInfo, gKeepers = gatekeepers) => {
  // const formdata = req.body;
  /*const formdata =
    {
      pubKey: '0x0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055',
      uniqueId: '40b4423ba3d83fec282b89fbbe03fb9c0c7cbfc1e3a9f9cbf092bec1e3e2df17',
      uniqueIdAttributes: 'ben40,402d9797c4a7f7026c066aa8007444b50821b1396ad532ccd7e86616cf9109cc,QmQNowQxrtGR9BtCvEG357NZfWVfftPLqLEqCr16PVPzRq',
      ownershipId: 'BC14293F08F6B71EDCF3725E6019D1D3BE826F790BC5A1B1684A0B7D7C2775F4',
      ownerIdList: '0x0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055',
      controlId: '5674453b04fe840851038e94bb45ecec7b88cac5a354bde6116e15f12295edfc',
      controlIdList: '0x03683536757fdb821c10810b51caa51a84fc1dfab5c17edbf5246f9713ffe31adf',
      ownershipTokenId: '6959b6456ec431bcf33b1538a98f1f80acc5871aea17ad8a7b2dcbd2b5561c2b',
      ownershipTokenAttributes: 'er',
      ownershipTokenQuantity: '0',
      controlTokenId: '70482ccbbd24866c7983f91f0e505e49b05c8a43b8255973bbe60444b4691060',
      controlTokenAttributes: 'gjk.',
      controlTokenQuantity: '0,0',
      delegateeIdList: '',
      delegateeTokenQuantity: '',
      identityRecoveryIdList: '0x03683536757fdb821c10810b51caa51a84fc1dfab5c17edbf5246f9713ffe31adf',
      recoveryCondition: '0',
      yesVotesRequiredToPass: '2',
      validatorList: '0x0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055',
      isHuman: 'false',
      timestamp: '',
      assetID: 'mygk',
      Type: 'non_cash',
      bigchainHash: '',
      bigchainID: '',
      coidAddr: "E558C8A8D4D2383BFEBC434FB8B66BA84FD2BFB4",
      gatekeeperAddr: "8CBA0D1936506DF0A67A95DCA8CBBA55BFEF5B4C",
      dimensions: '',
      sig: '79e2bb1c1f60f6d300a6676a157c7078fd4e0001f1e06bd49313807c8db0a60327f260cb4cd7d0aff3add0bf654be68b22e18bffcf5e9692dfdfc05efaab1763',
      msg: '4d0f626621af134d41a7ce8c21ca78e56616e7cb5a149ab91d19fb3dd30a8720',
      txn_id: 'requestCOID',
      propType: '0',
    };*/
  // logCatcher(`request body...${JSON.stringify(formdata)}`);

  // This object will add a unique ID to an asset
  // Meant t2o be used for testing. Make sure to update UNIQUEID when using repeatedly so uniqueness check doesn't fail. works with the object made above.
  var formdata = {
    pubKey: "0x0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055",
    uniqueId: "13054d5ef5836294462faaec0f228b1890e11a884fc41e41e159313754715885",
    uniqueIdAttributes: "UIDATTRIBUTE13,1337ec277538688caa77acdd4bce4befeda02b2bb9b1302c8fc73229fe7e9290,QmfGMiTStf38VcfmHeWz7HdyAo4ZjTQBfmoYF81SyJ4G6N",
    assetId: "mygk",
    isHuman: "false",
    yesVotesRequiredToPass: "1",
    coidAddr: "765A6A1A772FC15FF6EE3672E0C9A4CBB1A91F4F",
    gatekeeperAddr: "D7417C3B25DFA192E91318C967F1949373FD4074",
    validatorList: "0x0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055",
    sig: "79e2bb1c1f60f6d300a6676a157c7078fd4e0001f1e06bd49313807c8db0a60327f260cb4cd7d0aff3add0bf654be68b22e18bffcf5e9692dfdfc05efaab1763",
    msg: "4d0f626621af134d41a7ce8c21ca78e56616e7cb5a149ab91d19fb3dd30a8720",
    propType: "1"
  }

  // This Object will create an ICA
  // Meant t2o be used for testing. Make sure to update UNIQUEID
  // when using repeatedly so uniqueness check doesn't fail.
  /*const formdata =
  {
    pubKey: '0x0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055',
    uniqueId: '21054d5ef5836294462faaec0f228b1890e11a884fc41e41e159313754715885',
    uniqueIdAttributes: 'UIDATTRIBUTE,2137ec277538688caa77acdd4bce4befeda02b2bb9b1302c8fc73229fe7e9290,QmfGMiTStf38VcfmHeWz7HdyAo4ZjTQBfmoYF81SyJ4G6N',
    ownershipId: 'BC14293F08F6B71EDCF3725E6019D1D3BE826F790BC5A1B1684A0B7D7C2775F4',
    ownerIdList: '0x0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055',
    controlId: '',
    controlIdList: '',
    ownershipTokenId: '6959b6456ec431bcf33b1538a98f1f80acc5871aea17ad8a7b2dcbd2b5561c2b',
    ownershipTokenAttributes: 'er',
    ownershipTokenQuantity: '0',
    controlTokenId: '',
    controlTokenAttributes: '',
    controlTokenQuantity: '',
    delegateeIdList: '',
    delegateeTokenQuantity: '',
    identityRecoveryIdList: '0x03683536757fdb821c10810b51caa51a84fc1dfab5c17edbf5246f9713ffe31adf',
    assetId: 'TestAsset',
    isHuman: 'false',
    yesVotesRequiredToPass: '1',
    coidAddr: '',
    gatekeeperAddr: '8CBA0D1936506DF0A67A95DCA8CBBA55BFEF5B4C',
    dimensionCtrlAddr: '',
    validatorList: '0x0373ecbb94edf2f4f6c09f617725e7e2d2b12b3bccccfe9674c527c83f50c89055',
    sig: '79e2bb1c1f60f6d300a6676a157c7078fd4e0001f1e06bd49313807c8db0a60327f260cb4cd7d0aff3add0bf654be68b22e18bffcf5e9692dfdfc05efaab1763',
    msg: '4d0f626621af134d41a7ce8c21ca78e56616e7cb5a149ab91d19fb3dd30a8720',
    propType: '2',
  };*/

  if (formdata.isHuman === 'true') {
    return res.status(400).send('Error');
  }

  const gateKeeperContract = getContract(contracts.contractMgr, contracts.gatekeeperAddr, formdata.gatekeeperAddr);

  formdata.yesVotesRequiredToPass = formdata.validatorList.split(',').length;

  // ONLY ON SECOND REQUEST
  // logCatcher("AT INDEX 0: " + gatekeeperApp.debugging(0))
  const isValid = await verifyIt(formdata);
  const isUnique = await checkUnique(formdata, gateKeeperContract);
  if (!isValid) {
    return res.send('The signature is not valid....check that your public key, signature and message hash are correct.');
  }
  if (!isUnique) {
    return res.send('The uniqueId is not unique.');
  }
  if (gKeepers.indexOf(HashIt(formdata.pubKey)) === -1) {
    gKeepers.push(HashIt(formdata.pubKey));
    eventListener(gateKeeperContract, contracts);
    // WILL THIS EXPIRE AT THE END OF THEIR POST REQUEST?
  }

  logCatcher(`Is valid value: ${isValid === true}`);
  return getProposalId(formdata, res, gateKeeperContract, (err) => {
    if (err) {
      logCatcher('got an error inside gatekeeperApp.getPRoposalID');
      return res.status(400).json({ error: err });
    }
    return res.status(200).json({ Method: 'POST', msg: 'COID data submitted successfully' });
  });
};

const loadFiles = async (globalPath) => {
  const contractStuff = {};
  try {
    const globalConfig = JSON.parse(fs.readFileSync(globalPath));
    const erisConfig = JSON.parse(fs.readFileSync(globalConfig.properties.accounts_file_path));
    const chain = globalConfig.properties.chainURL;
    const contractData = JSON.parse(fs.readFileSync(globalConfig.jobs.myGatekeeper.base_path));
    const contractMgr = erisContracts.newContractManagerDev(chain, erisConfig[globalConfig.properties.primary_account]);

    contractStuff.chain = chain;
    contractStuff.accounts = erisConfig;
    contractStuff.primary_account = globalConfig.properties.primary_account;
    // ballot contract
    contractStuff.ballotContract = getContract(contractMgr, contractData.ballot);
    contractStuff.ballotAddress = contractData.ballot;

    contractStuff.coidContract = getContract(contractMgr, contractData.CoreIdentity);
    contractStuff.coidAddress = contractData.CoreIdentity;

    contractStuff.dimCtrlContract = getContract(contractMgr, contractData.IdentityDimensionControl);
    contractStuff.dimCtrlAddress = contractData.IdentityDimensionControl;

    contractStuff.gatekeeperAddr = contractData.MyGateKeeper;

    contractStuff.contractMgr = contractMgr;
  } catch (e) {
    throw e;
  }
  return contractStuff;
};

const init = () => {
  app.set('trust proxy', true);
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, application/json-rpc');
    next();
  });
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(morgan('dev'));

  app.post('/MyGatekeeper', keeper);

  app.listen(port, () => {
    logCatcher('Connected to contract http://10.101.114.231:1337/rpc');
    logCatcher(`Listening on port ${port}`);
  });
};

loadFiles('../configuration_service/configuration_files/global.json').then((contractStuff) => {
  contractsInfo = contractStuff;
  Object.freeze(contractsInfo);
  init();
}).catch(e => logCatcher(e));
