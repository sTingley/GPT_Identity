const { promisify } = require('util');
const logCatcher = require('../Component/logCatcher');

const chainConfig = require('/home/1070933/.monax/ErisChainConfig.json');

const erisContracts = require('@monax/legacy-contracts');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

// for verification
const crypto = require('crypto');
const ed25519 = require('ed25519');

// for hex conversion
const Web3 = require('web3'); // TODO: resolve bad peer dependency

const web3 = new Web3();

// this library is needed to calculate hash of blockchain id (chain name) and bigchain response
const { keccak_256 } = require('js-sha3');

const port = process.env.PORT || 3002;
const app = express();

const arraySize = 10;
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

// These hold
const formdataArray = [];
const proposalIDArray = [];
let indexer = 0;


// this function is intended to send a notification.
const notifier = require('../Component/notifications');
// end of notifier

const theNotifier = notifier(); // TODO: ADD TWIN URL AS PARAMETER

// makes a coid
function CoidMaker(coidAddr, dimensionCtrlAddr, formdata) {
  // get params for their COID contract
  logCatcher('Inside CoidMaker function');
  const chainUrl = chainConfig.chainURL;
  const contrData = require('./jobs_output.json'); // TODO: should not be a require()
  const accounts = require('./accounts.json'); // TODO: should not be a require()
  const manager = erisContracts.newContractManagerDev(chainUrl, chainConfig.primaryAccount);

  const abiAddr = contrData.CoreIdentity;
  const abi_COID = JSON.parse(fs.readFileSync(`./abi/${abiAddr}`, 'utf8'));
  const contract = manager.newContractFactory(abi_COID).at(coidAddr);

  const dimCtrlAddr = contrData.IdentityDimensionControl;
  const abi_dimCtrl = JSON.parse(fs.readFileSync(`./abi/${dimCtrlAddr}`, 'utf8'));
  const dimCtrlContract = manager.newContractFactory(abi_dimCtrl).at(dimensionCtrlAddr);

  // parse the form data
  const { sig, msg } = formdata;
  // const requester = formdata.pubKey; // the pubkey of coid requester // TODO: UNUSED
  const myUniqueId = formdata.uniqueId;
  const myUniqueIdAttributes = formdata.uniqueIdAttributes.split(',');
  // const myOwnershipId = formdata.ownershipId; // TODO: UNUSED
  let myOwnerIdList = [];
  myOwnerIdList = formdata.ownerIdList.split(',');
  if (myOwnerIdList.length < arraySize) {
    myOwnerIdList = myOwnerIdList.concat(Array(arraySize - myOwnerIdList.length).fill('0'));
  }
  // const myControlId = formdata.controlId; // TODO: UNUSED
  let myControlIdList = [];
  myControlIdList = formdata.controlIdList.split(',');
  if (myControlIdList.length < arraySize) {
    myControlIdList = myControlIdList.concat(Array(arraySize - myControlIdList.length).fill('0'));
  }

  // const myOwnershipTokenId = formdata.ownershipTokenId; // TODO: UNUSED
  // const myOwnershipTokenAttributes = formdata.ownershipTokenAttributes; // TODO: UNUSED
  let myOwnershipTokenQuantity = formdata.ownershipTokenQuantity.split(',');
  if (myOwnershipTokenQuantity.length < arraySize) {
    myOwnershipTokenQuantity = myOwnershipTokenQuantity.concat(Array(arraySize - myOwnershipTokenQuantity.length).fill('0'));
  }


  // const myControlTokenId = formdata.controlTokenId; // TODO: Unused
  // const myControlTokenAttributes = formdata.controlTokenAttributes; // TODO: UNUSED
  let myControlTokenQuantity = formdata.controlTokenQuantity.split(',');
  if (myControlTokenQuantity.length < arraySize) {
    myControlTokenQuantity = myControlTokenQuantity.concat(Array(arraySize - myControlTokenQuantity.length).fill('0'));
  }
  let myIdentityRecoveryIdList = formdata.identityRecoveryIdList.split(',');
  if (myIdentityRecoveryIdList.length < arraySize) {
    myIdentityRecoveryIdList = myIdentityRecoveryIdList.concat(Array(arraySize - myIdentityRecoveryIdList.length).fill('0'));
  }
  const myRecoveryCondition = formdata.recoveryCondition; // number of recoveryList needed

  const isHumanValue = false;
  let theUniqueIDAttributes = myUniqueIdAttributes;
  const UIDAttr = Array(10).fill('0');
  const fileHashes = Array(10).fill('0');
  let k = 0;
  let combinedList = JSON.parse(JSON.stringify(myControlIdList));

  for (let i = 0; i < theUniqueIDAttributes.length; i += 3) {
    theUniqueIDAttributes[i] = myUniqueIdAttributes[i];
  }
  for (let i = 0; i < theUniqueIDAttributes.length; i += 3) {
    UIDAttr[k] = web3.toHex(myUniqueIdAttributes[i]);
    fileHashes[k] = myUniqueIdAttributes[i + 1];
    k++;
  }

  setTimeout(async () => {
    theUniqueIDAttributes = theUniqueIDAttributes.concat(Array(10 - theUniqueIDAttributes.length).fill('0'));
    combinedList = combinedList.concat(Array(10 - combinedList.length).fill('0'));

    // TODO: No console output!
    logCatcher(`form atr: ${formdata.uniqueIdAttributes}`);
    logCatcher(`uid: ${myUniqueId}`);
    logCatcher(`atr: ${theUniqueIDAttributes}`);
    logCatcher(`UIDAttr: ${UIDAttr}`);
    logCatcher(`fileHashes: ${fileHashes}`);
    logCatcher(`combolist: ${combinedList}`);
    logCatcher(`ctrllist: ${myControlIdList}`);

    // instantiate coid
    await contract.setUniqueID(myUniqueId, UIDAttr, fileHashes, isHumanValue);
    await contract.setOwnership(myOwnerIdList, myOwnershipTokenQuantity);
    await contract.setControl(myControlTokenQuantity, myControlIdList);
    await contract.setRecovery(myIdentityRecoveryIdList, myRecoveryCondition);
    await contract.StartCoid(); // (err8, res8)
    await dimCtrlContract.IdentityDimensionControlInstantiation(coidAddr, '0x0'); // (res10)
  }, 3000);
}

function prepareForm(formdata) {
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
}

function writeAll(formdata, callback) {
  const owners = formdata.ownerIdList;
  let controllers = formdata.controlIdList;
  if (controllers === '') { controllers = []; }
  const max = Math.max(owners.length, controllers.length);
  const fileName = `${formdata.assetID}.json`;
  logCatcher('\n*****THE MIGHTY WRITEALL*****\n');
  logCatcher(JSON.stringify(formdata));
  logCatcher(`MAX :${max}`);
  let k = 0;
  let o = 0;
  let c = 0;
  const d = 0;
  const total = owners.length + controllers.length;
  logCatcher(`TOTAL: ${total}`);
  logCatcher(`${owners} len ${owners.length}`);
  for (let i = 0; i < max; i++) {
    logCatcher(`loop ${owners[i]}`);
    if (!!owners[i] && owners !== '') {
      ++k;
      ++o;
      theNotifier.SetAsset(String(owners[i]), String(fileName), 0, 0, formdata, '', '');
      if (k === total) { logCatcher('owner callback'); callback(); }
    }
    if (!!controllers[i] && controllers !== '') {
      ++k;
      ++c;
      theNotifier.SetAsset(String(controllers[i]), String(fileName), 1, 0, formdata, '', '');
      if (k === total) { logCatcher('controlller callback'); callback(); }
    } // end writeAll
  }
}
/* Makes a change to unique attributes struct inside inside a CoreIdentity.sol contract
this function will be called ONLY IF the gatekeeper event 'resultReadyUniqueId' is thrown */
function UniqueAttributeChanger(coidAddr, dimensionCtrlAddr, formdata) {
  // get params for their COID contract
  logCatcher(`Unique Attribute Changer formdata:\n${JSON.stringify(formdata)}\n`);
  const chain = 'primaryAccount';
  const chainUrl = chainConfig.chainURL;
  const contrData = require('./jobs_output.json');
  const accounts = require('./accounts.json');
  const manager = erisContracts.newContractManagerDev(chainUrl, chainConfig[chain]);

  const COIDabiAddr = contrData.CoreIdentity;
  const abi_COID = JSON.parse(fs.readFileSync(`./abi/${COIDabiAddr}`, 'utf8'));
  const COIDcontract = manager.newContractFactory(abi_COID).at(coidAddr);

  COIDcontract.getIt((error, result) => {
    logCatcher(`${result} is the result`);
  });

  // parse the form data
  const { sig } = formdata;
  const { msg } = formdata;
  const requester = formdata.pubKey; // the pubkey of coid requester
  const myUniqueId = formdata.uniqueId;// since we are not changing the actual unique ID field
  let myUniqueIdAttributes = formdata.uniqueIdAttributes;
  const { proposalId } = formdata;// needed to get values
  const UIDAttr = Array(10).fill('0');
  const fileHashes = Array(10).fill('0');
  let k = 0;

  for (let i = 0; i < myUniqueIdAttributes.length; i += 3) {
    UIDAttr[k] = web3.toHex(myUniqueIdAttributes[i]);
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
}// end UniqueAttributeChanger function


let test;
// Instantiate one of these
const gatekeeper = (MyGKaddr) => {
  // Debugging Comment:
  logCatcher('A gatekeeper object has just been instantiated');

  const chain = 'primaryAccount';
  const erisdburl = chainConfig.chainURL;
  const contractData = require('./jobs_output.json');
  const contractAbiAddress = contractData.MyGateKeeper;
  const erisAbi = JSON.parse(fs.readFileSync(`./abi/${contractAbiAddress}`));
  const accountData = require('./accounts.json');
  const contractMgr = erisContracts.newContractManagerDev(erisdburl, chainConfig[chain]);
  const gateKeeperContract = contractMgr.newContractFactory(erisAbi).at(MyGKaddr);

  // ballot contract
  const ballotAddress = contractData.ballot;
  // logCatcher("this is the ballot address: " + this.ballotAddress);
  const ballotAbi = JSON.parse(fs.readFileSync(`./abi/${ballotAddress}`));
  const ballotContract = contractMgr.newContractFactory(ballotAbi).at(ballotAddress);

  // verification contract (oraclizer)
  const VerificationAddress = require('/home/1070933/.monax/apps/VerifyOraclizerEthereum/wallet2/jobs_output.json').Verification;
  const VerificationAbi = JSON.parse(fs.readFileSync(`/home/1070933/.monax/apps/VerifyOraclizerEthereum/wallet2/abi/${VerificationAddress}`, 'utf8'));
  const VerificationContract = contractMgr.newContractFactory(VerificationAbi).at(VerificationAddress);
  const ErisAddress = chainConfig[chain].address;

  // for verification
  const verifyIt = async (formdata) => {
    const { msg, sig, pubKey } = formdata;
    let isValidResult = false;
    logCatcher('you have reached verifyIt internal function');
    logCatcher(msg);
    logCatcher(sig);
    logCatcher(pubKey);

    VerificationContract.VerificationQuery(msg, sig, pubKey);
    const elEvento = await VerificationContract.CallbackReady();
    isValidResult = await VerificationContract.myCallback();
    elEvento.stop();
    return isValidResult;
  }; // end verification


  const setCoidRequester = async (requester, proposalId, sig, msg) => {
    if (!(await gateKeeperContract.setCoidRequester(requester, proposalId, sig, msg))) {
      logCatcher('Some kind of error... I dunno. -Josh');
    }
  }; // end of function setCoidRequester

  const checkUnique = async (formdata) => {
    logCatcher(`inside checkUnique, formdata: ${JSON.stringify(formdata)}`);
    logCatcher(`inside checkUnique, formdata.uniqueId is: ${formdata.uniqueId}`);
    const myUniqueId = formdata.uniqueId;// async error second time?
    logCatcher(`myUniqueId: ${myUniqueId}`);
    let isUniqueResult = false;
    logCatcher('#############################33');
    logCatcher(formdata.uniqueId);
    isUniqueResult = await gateKeeperContract.isUnique(formdata.uniqueId); // end of callback
    return isUniqueResult;
  };

  const setmyUniqueID = async (requester, proposalId, myUniqueID, myUniqueIdAttributes) => {
    const len = myUniqueIdAttributes.length;
    logCatcher(`${len + myUniqueIdAttributes}*MYUNIQUEIDATTRIBUTESARRAY`);
    const array = [];
    // set vals in gatekeeper contract one at a time
    // NOTE the let statemnt (not var!)
    for (let index = 0; index < (len) / 3; index++) {
      array.push(promisify(gateKeeperContract.setmyUniqueID(requester, proposalId, myUniqueID, myUniqueIdAttributes[3 * index], myUniqueIdAttributes[(3 * index) + 1], myUniqueIdAttributes[(3 * index) + 2], index)));
      // const result = gateKeeperContract.setmyUniqueID(requester, proposalId, myUniqueID, myUniqueIdAttributes[3 * index], myUniqueIdAttributes[(3 * index) + 1], myUniqueIdAttributes[(3 * index) + 2], index); // end of setmyUniqueID
      // if (!result) {
      //   logCatcher('Some kind of error 2... I dunno. -Josh');
      // } else {
      //   logCatcher(`${result}  index<> is: ${index}`);
      // }
    }

    await Promise.all(array).then((value) => {
      if (value) {
        logCatcher(`${value}`);
      }
    })
      .catch((reason) => {
        logCatcher(reason);
      });
  };

  const setValidators = (proposalId, validators) => {
    const arr = validators.concat(Array(10 - validators.length).fill(0x0));
    logCatcher(`validators: ${validators}`);
    logCatcher(`validators for setValidators: ${arr}`);

    gateKeeperContract.setValidators(proposalId, arr, ballotAddress, (err, res) => {
      logCatcher(res);
      logCatcher(`proposalId: ${proposalId}`);
      logCatcher(`ballotAddress: ${ballotAddress}`);
      logCatcher(`validators: ${validators}`);
      if (err) {
        logCatcher(`Error to selectValidators: ${err}`);
      } else {
        logCatcher('validators have been selected.');
        ballotContract.getValidatorList(proposalId, (error, result) => {
          logCatcher(`list...${result}`);
          ballotContract.getForTest(proposalId, (errors, results) => {
            logCatcher(`${results}`);
          });
        });
      }
    });// end of callback
  }; // end of function

  const initiateCoidProposalSubmission = (proposalId, yesVotesRequiredToPass, isHuman, gkaddr) => {
    const propType = arguments[5] || 0;
    this.setPropType(proposalId, propType);
    logCatcher(`propType in initcoid: ${propType}`);

    gateKeeperContract.initiateCoidProposalSubmission(ballotAddress, proposalId, yesVotesRequiredToPass, isHuman, gkaddr, propType, (err, res) => {
      if (err) {
        logCatcher(`Error for initiateCoidProposalSubmission: ${err}`);
      } else {
        gateKeeperContract.getPropType(proposalId, (error, result) => {
          logCatcher(`Get Proposal Type contract call: ${result}`);
        });
        logCatcher(`Is COID request has been initiated: ${res}`);
      }
    });// end of callback
  };// end of function

  const addUID = (proposalId, formdata, res, callback) => {
    // local variables for API calls
    logCatcher('addUID reached');
    // var proposalId = formdata.proposalId;
    const { sig, msg } = formdata;
    const requester = formdata.pubKey; // the pubkey of coid requester
    const myUniqueId = formdata.uniqueId;
    const myUniqueIdAttributes = formdata.uniqueIdAttributes.split(',');
    let validators = [];
    validators = formdata.validatorList.split(',');
    const ballotContractAddr = this.ballotAddress;
    const DaoContractAddr = this.DaoAddress;
    const { yesVotesRequiredToPass } = formdata;
    const { isHuman } = formdata;
    const { gatekeeperAddr } = formdata;
    const propType = Number(formdata.propType);
    logCatcher('adduid try catch');
    try {
      this.setCoidRequester(requester, proposalId, sig, msg);
      // this.setisHuman(proposalId, isHuman);
      this.setmyUniqueID(requester, proposalId, myUniqueId, myUniqueIdAttributes);
      this.setPropType(proposalId, propType);
      setTimeout(() => {
        setValidators(proposalId, validators);
        initiateCoidProposalSubmission(proposalId, yesVotesRequiredToPass, false, MyGKaddr, propType);
        theNotifier.createProposalPendingNotification(requester, proposalId, isHuman, gatekeeperAddr, propType);
        callback(false, res);
      }, 3000);
    } catch (e) {
      callback(true, res);
    }
  };


  const debugging = (val) => {
    gateKeeperContract.debugIt(val, (error, result) => {
      logCatcher(`DEBUGIT: ${val}`);
    });
  };

  // set proptype
  const setPropType = (proposalId, propType) => {
    let sync = true;

    // var propType = Number(propType);
    logCatcher(`proptype: ${propType}`);
    gateKeeperContract.setPropType(proposalId, Number(propType), (err, res) => {
      if (err) {
        logCatcher(`Error setting propType: ${err}`);
      } else {
        logCatcher(`Result setting propType: ${res}`);
        sync = false;
      }
    });// end of callback
  };

  const setmyOwnershipID = (requester, proposalId, myOwnershipId, myOwnerIdList) => {
    gateKeeperContract.setmyOwnershipID(requester, proposalId, myOwnershipId, myOwnerIdList, (err, res) => {
      if (err) {
        logCatcher('Error2');
      } else {
        // next();
        logCatcher(`Result2:${res}`);
        logCatcher(`myOwnershipId: ${myOwnershipId}`);
        logCatcher(`myOwnerIdList: ${myOwnerIdList}`);
        logCatcher();
      }
    }); // end of callback
  }; // end of function setmyOwnershipID

  const setmyControlID = (requester, proposalId, myControlId, myControlIdList) => {
    gateKeeperContract.setmyControlID(requester, proposalId, myControlId, myControlIdList, (err, res) => {
      if (err) {
        logCatcher('Error3');
        // res.send("Error");
      } else {
        // next();
        logCatcher(`Result3:${res}`);
        logCatcher(`myControlId: ${myControlId}`);
        logCatcher(`myControlIdList: ${myControlIdList}\n`);
      }
    });// end of callback
  }; // end of function

  const setmyOwnershipTokenID = (requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes, myOwnershipTokenQuantity) => {
    logCatcher(`ownershiptokenID is ${myOwnershipTokenId}`);
    logCatcher('myOwnershipTokenAttributes :', myOwnershipTokenAttributes);
    logCatcher('myOwnershipTokenQuantity : ', myOwnershipTokenQuantity);

    gateKeeperContract.setmyOwnershipTokenID(requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes, myOwnershipTokenQuantity, (err, res) => {
      if (err) {
        logCatcher('Error4', err);
        // res.send("Error");
      } else {
        // next();
        logCatcher(`Result4:${res}`);
        logCatcher(`myOwnershipTokenId: ${myOwnershipTokenId}`);
        logCatcher(`myOwnershipTokenAttributes: ${myOwnershipTokenAttributes}`);
        logCatcher(`myOwnershipTokenQuantity${myOwnershipTokenQuantity}`);
        logCatcher();
      }
    });// end of callback
  };// end of function

  const setmyControlTokenID = (requester, proposalId, myControlTokenId, myControlTokenAttributes, myControlTokenQuantity) => {
    gateKeeperContract.setmyControlTokenID(requester, proposalId, myControlTokenId, myControlTokenAttributes, myControlTokenQuantity, (err, res) => {
      if (err) {
        logCatcher('Error5');
      } else {
        logCatcher(`Result5:${res}`);
        logCatcher(`myControlTokenId: ${myControlTokenId}`);
        logCatcher(`myControlTokenAttributes: ${myControlTokenAttributes}`);
        logCatcher(`myControlTokenQuantity${myControlTokenQuantity}`);
        logCatcher();
      }
    });// end of callback
  }; // end of function

  const setmyIdentityRecoveryIdList = (requester, proposalId, myIdentityRecoveryIdList, myRecoveryCondition) => {
    logCatcher(`Requester is: ${requester}`);
    logCatcher(`proposalId is: ${proposalId}`);
    logCatcher(`RecoveryIDLIST: ${myIdentityRecoveryIdList}`);
    logCatcher(`RecoveryCondition: ${myRecoveryCondition}`);
    gateKeeperContract.setmyIdentityRecoveryIdList(requester, proposalId, myIdentityRecoveryIdList, myRecoveryCondition, (err, res) => {
      if (err) {
        logCatcher(`Error6${err}`);
        res.send('Error');
      } else {
        // isCoidInitiated = res;
        logCatcher(`Result6:${res}`);
        logCatcher(`myIdentityRecoveryIdList: ${myIdentityRecoveryIdList}`);
        logCatcher(`myRecoveryCondition: ${myRecoveryCondition}`);
        logCatcher();
      }
    }); // end of callback
  }; // end of function

  // after all the COID data has been set

  const setcoidData = (proposalId, formdata, res, callback) => {
    // local variables for API calls
    // var proposalId = formdata.proposalId;
    const { sig, msg } = formdata;
    const requester = formdata.pubKey; // the pubkey of coid requester
    const myUniqueId = formdata.uniqueId;
    const myUniqueIdAttributes = formdata.uniqueIdAttributes.split(',');
    const myOwnershipId = formdata.ownershipId;
    let myOwnerIdList = [];
    myOwnerIdList = formdata.ownerIdList.split(',');
    if (myOwnerIdList.length < arraySize) {
      myOwnerIdList = myOwnerIdList.concat(Array(arraySize - myOwnerIdList.length).fill('0'));
    }
    const myControlId = formdata.controlId;
    let myControlIdList = [];
    myControlIdList = formdata.controlIdList.split(',') || [];
    if (myControlIdList.length < arraySize) {
      myControlIdList.concat(Array(10 - myControlIdList.length).fill('0'));
    }
    const myOwnershipTokenId = formdata.ownershipTokenId;
    const myOwnershipTokenAttributes = formdata.ownershipTokenAttributes;
    let myOwnershipTokenQuantity = formdata.ownershipTokenQuantity.split(',');
    if (myOwnershipTokenQuantity.length < arraySize) {
      myOwnershipTokenQuantity = myOwnershipTokenQuantity.concat(Array(arraySize - myOwnershipTokenQuantity.length).fill('0'));
    }
    const myControlTokenId = formdata.controlTokenId;
    const myControlTokenAttributes = formdata.controlTokenAttributes;
    let myControlTokenQuantity = formdata.controlTokenQuantity.split(',');
    if (myControlTokenQuantity.length < arraySize) {
      myControlTokenQuantity = myControlTokenQuantity.concat(Array(arraySize - myControlTokenQuantity.length).fill('0'));
    }
    let myIdentityRecoveryIdList = formdata.identityRecoveryIdList.split(',');
    if (myIdentityRecoveryIdList.length < arraySize) {
      myIdentityRecoveryIdList = myIdentityRecoveryIdList.concat(Array(arraySize - myIdentityRecoveryIdList.length).fill('0'));
    }
    const myRecoveryCondition = formdata.recoveryCondition;
    const ballotContractAddr = ballotAddress;
    let validators = [];
    validators = formdata.validatorList.split(',');
    const { yesVotesRequiredToPass } = formdata;
    const { isHuman } = formdata;
    const { gatekeeperAddr } = formdata;
    const propType = Number(formdata.propType);

    try {
      setCoidRequester(requester, proposalId, sig, msg);
      setmyUniqueID(requester, proposalId, myUniqueId, myUniqueIdAttributes);

      setTimeout(() => {
        logCatcher(`ISHUMAN VALUE: ${isHuman}************************************************************************`);
        setmyOwnershipID(requester, proposalId, myOwnershipId, myOwnerIdList);
        setmyControlID(requester, proposalId, myControlId, myControlIdList);
        setmyOwnershipTokenID(requester, proposalId, myOwnershipTokenId, myOwnershipTokenAttributes, myOwnershipTokenQuantity);
        setmyControlTokenID(requester, proposalId, myControlTokenId, myControlTokenAttributes, myControlTokenQuantity);
        setmyIdentityRecoveryIdList(requester, proposalId, myIdentityRecoveryIdList, myRecoveryCondition);
        setValidators(proposalId, validators);

        initiateCoidProposalSubmission(proposalId, yesVotesRequiredToPass, false, MyGKaddr, propType);

        theNotifier.createProposalPendingNotification(requester, proposalId, isHuman, gatekeeperAddr, 0);

        callback(false, res);
      }, 4000);
    } catch (e) {
      callback(true, res);
    }
  };

  const KYC = (proposalId, formdata, res, callback) => {
    // local variables for API calls
    const { sig, msg } = formdata;
    const requester = formdata.pubKey; // the pubkey of coid requester
    const myUniqueId = formdata.uniqueId;
    const myUniqueIdAttributes = formdata.uniqueIdAttributes.split(',');
    let validators = [];
    validators = formdata.validatorList.split(',');
    const { yesVotesRequiredToPass } = formdata;
    const { isHuman } = formdata;
    const { gatekeeperAddr } = formdata;
    const propType = Number(formdata.propType);

    try {
      setCoidRequester(requester, proposalId, sig, msg);
      setmyUniqueID(requester, proposalId, myUniqueId, myUniqueIdAttributes);
      setPropType(proposalId, propType);
      const this1 = this;
      setTimeout(() => {
        setValidators(proposalId, validators);
        initiateCoidProposalSubmission(proposalId, yesVotesRequiredToPass, false, MyGKaddr, propType);
        theNotifier.createProposalPendingNotification(requester, proposalId, isHuman, gatekeeperAddr, propType);
        callback(false, res);
      }, 3000);
    } catch (e) {
      callback(true, res);
    }
  };

  const getProposalId = async (formdata, res, callback) => {
    const proposalId = await ballotContract.getProposalId();
    // add formdata and proposalID
    formdataArray[indexer] = formdata;
    proposalIDArray[indexer] = proposalId;
    // increment indexer
    indexer += 1;
    switch (Number(formdata.propType)) {
      case 0:
        // coid request
        setcoidData(proposalId, formdata, res, callback);
        logCatcher('right after set coid data....');
        break;
      case 1:
        // Unique Attr request
        addUID(proposalId, formdata, res, callback);
        logCatcher('right after Unique....');
        break;
      case 2:
        // KYC request
        logCatcher(`proposalId is: ${proposalId} or ${this.proposalId}`);
        KYC(proposalId, formdata, res, callback);
        logCatcher('right after KYC....');
        break;
      default:
    }
    logCatcher(`formdata: ${formdata}`);
  }; // end of function
};


// NOTE: Event listening must be done outside each gatekeeper app instance continuously
// This way, new instances are not done per each instance
const eventListener = (MyGKAddr) => {
  const chain = 'primaryAccount';
  const erisdburl = chainConfig.chainURL;
  const contractData = require('./jobs_output.json');
  const contractAddress = this.contractData.MyGateKeeper;
  const erisAbi = JSON.parse(fs.readFileSync(`./abi/${this.contractAddress}`));
  const accountData = require('./accounts.json');
  const contractMgr = erisContracts.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
  const gateKeeperContract = this.contractMgr.newContractFactory(this.erisAbi).at(MyGKAddr);

  // ballot contract
  const ballotAddress = contractData.ballot;
  const ballotAbi = JSON.parse(fs.readFileSync(`./abi/${this.ballotAddress}`));
  const ballotContract = this.contractMgr.newContractFactory(this.ballotAbi).at(this.ballotAddress);

  // verification contract (oraclizer)
  const VerificationAddress = require('/home/1070933/.monax/apps/VerifyOraclizerEthereum/wallet2/jobs_output.json').Verification;
  const VerificationAbi = JSON.parse(fs.readFileSync(`/home/1070933/.monax/apps/VerifyOraclizerEthereum/wallet2/abi/${this.VerificationAddress}`, 'utf8'));
  const VerificationContract = this.contractMgr.newContractFactory(this.VerificationAbi).at(this.VerificationAddress);
  const ErisAddress = chainConfig[this.chain].address;

  // use this to have the gatekeeper scope inside functions

  // This is for signature generation:
  const createSignature = (nonHashedMessage, callback) => {
    // make message hash
    const hash = crypto.createHash('sha256').update(nonHashedMessage).digest('hex');

    const { pubKey, privKey } = chainConfig.primaryAccount;
    const keyPair = { publicKey: Buffer.from(pubKey, 'hex'), privateKey: Buffer.from(privKey, 'hex') };

    let signature = ed25519.Sign(Buffer.from(hash), keyPair);
    signature = signature.toString('hex');

    // const result = { signature, pubKey, msg: hash };

    callback(signature, pubKey, hash);
  };


  //
  // Listening of the proposal expired event:
  //

  let eventBallotProposalExpired;

  function deleteProposal(proposalId) {
    ballotContract.deleteProposal(proposalId, (error, result) => {
      logCatcher(`${proposalId} is the proposalId. Error in delete proposal from ballot? ${error}`);
    });

    gateKeeperContract.deleteProposal(proposalId, (error, result) => {
      logCatcher(`${proposalId} is the proposalId. Error in delete proposal from gatekeepr? ${error}`);
    });
  }

  ballotContract.proposalExpired(
    (error, result) => {
      eventBallotProposalExpired = result;
    },
    (error, result) => {
      logCatcher(`result.args (line 950): ${JSON.stringify(result.args)}`);
      const { expiredProposalId } = result.args;
      // delete the proposal from gatekeeper
      gateKeeperContract.deleteProposal(expiredProposalId, (err, res) => {
        if (err) {
          logCatcher(`error from Gatekeeper Contract function deleteProposal:${err}`);
        } else {
          logCatcher('The Gatekeeper Contract function deleteProposal has been called with no error');
        }
      });
    },
  );

  //
  // Listening of the resultReady event in gatekeeper:
  // Each time the event is fired, we delete the proposal and write in bigchain
  //

  let eventGatekeeperResultReady;

  gateKeeperContract.resultReady(
    (error, result) => {
      eventGatekeeperResultReady = result;
    },
    (error, result) => {
      // grab parameters from the event
      const {
        proposalId, votingResult, resultMessage, coidGKAddr, coidAddr, dimensionCtrlAddr,
        blockNumber, blockHashVal, blockchainID, timestamp,
      } = result.args;

      // debugging
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

      // implement logic if and only if votingResult is true:
      if (votingResult) {
        // find data given proposalId
        let index = -1;
        for (let k = 0; k < indexer; k++) {
          if (proposalIDArray[k] === proposalId) {
            index = k;
          }
        }

        logCatcher(`index is: ${index}`);

        if (index !== -1) {
          // TODO (to make cleaner): un-hardcode m -- grab number of validators from
          // NOTE: notice the use of let for m, rather than var!
          const validatorSigs = [];
          let indexSigs = 0;
          const loopFunction = (m) => {
            ballotContract.getValidatorSignature_byIndex(proposalId, m, (err, res) => {
              // TODO: Create labels for validator sigs
              logCatcher(`This is the result: ${JSON.stringify(res)}`);
              validatorSigs[indexSigs] = res;
              indexSigs++;
              logCatcher(`m is: ${m}`);
            });
          };
          for (let m = 0; m < 3; m++) {
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
                theNotifier.bcPreRequest(formdataArray[index].pubKey, proposalId, formdataArray[index], blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, formdataArray[index].bigchainID, formdataArray[index].bigchainHash, visibility, description, (res, theId, theHash) => {
                  // logCatcher(result);
                  logCatcher(`THE TXN ID: ${theId}`);
                  logCatcher(`THE HASH: ${theHash}`);
                  logCatcher(`GK ADDR: ${formdataArray[index].gatekeeperAddr}`);
                  logCatcher(`COID ADDR: ${coidAddr}`);
                  logCatcher(`DIM CTRL ADDR: ${dimensionCtrlAddr}`);
                  // theNotifier.notifyCoidCreation(formdataArray[index].pubKey, formdataArray[index].assetID, theId, theHash, coidGKAddr, coidAddr, dimensionCtrlAddr)

                  const form = formdataArray[index];
                  form.bigchainID = theId;
                  form.bigchainHash = theHash;
                  // form.gatekeeperAddr = coidGKAddr;
                  form.coidAddr = coidAddr;
                  form.dimensionCtrlAddr = dimensionCtrlAddr;
                  form.proposalId = proposalId;
                  form.description = description;
                  form.visibility = visibility;
                  writeAll(prepareForm(form), () => { });

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

  let eventGatekeeperResultReadyKYC;
  gateKeeperContract.resultReadyKYC(
    (error, result) => {
      eventGatekeeperResultReadyKYC = result;
    },
    (error, result) => {
      // grab parameters from the event
      const {
        proposalId, votingResult, resultMessage, coidGKAddr, coidAddr, dimensionCtrlAddr,
        blockNumber, blockHashVal, blockchainID, timestamp,
      } = (result.args).proposalId;
      // debugging
      logCatcher('KYC EVENT RECIEVED');
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

      // implement logic if and only if votingResult is true:
      if (votingResult) {
        // find data given proposalId
        let index = -1;
        for (let k = 0; k < indexer; k++) {
          if (proposalIDArray[k] === proposalId) {
            index = k;
          }
        }

        logCatcher(`index is: ${index}`);
        const validatorSigs = [];

        if (index !== -1) {
          // TODO (to make cleaner): un-hardcode m -- grab number of validators from
          // NOTE: notice the use of let for m, rather than var!
          let indexSigs = 0;
          const loopFunction = (m) => {
            ballotContract.getValidatorSignature_byIndex(proposalId, m, (err, res) => {
              // TODO: Create labels for validator sigs
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
                theNotifier.bcPreRequest(formdataArray[index].pubKey, proposalId, formdataArray[index], blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, formdataArray[index].bigchainID, formdataArray[index].bigchainHash, visibility, description, (res, theId, theHash) => {
                  // logCatcher(result);
                  logCatcher(`THE TXN ID: ${theId}`);
                  logCatcher(`THE HASH: ${theHash}`);
                  logCatcher(`GK ADDR: ${coidGKAddr}`);
                  logCatcher(`COID ADDR: ${coidAddr}`);
                  logCatcher(`DIM CTRL ADDR: ${dimensionCtrlAddr}`);
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
                  form.dimensionCtrlAddr = dimensionCtrlAddr;
                  form.ownerIdList = keccak_256(form.pubKey);
                  form.validatorSigs = validatorSigs;
                  form.proposalId = proposalId;
                  form.description = description;
                  form.visibility = visibility;
                  const chainUrl = chainConfig.chainURL;
                  const contrData = require('./jobs_output.json');
                  const accounts = require('./accounts.json');
                  const manager = erisContracts.newContractManagerDev(chainUrl, chainConfig.primaryAccount);

                  const abiAddr = contrData.CoreIdentity;
                  const abi_COID = JSON.parse(fs.readFileSync(`./abi/${abiAddr}`, 'utf8'));
                  const contract = manager.newContractFactory(abi_COID).at(coidAddr);

                  const dimCtrlAddr = contrData.IdentityDimensionControl;
                  const abi_dimCtrl = JSON.parse(fs.readFileSync(`./abi/${dimCtrlAddr}`, 'utf8'));
                  const dimCtrlContract = manager.newContractFactory(abi_dimCtrl).at(dimensionCtrlAddr);
                  let myOwnerIdList = form.ownerIdList.split(',');
                  myOwnerIdList = myOwnerIdList.concat(Array(10 - myOwnerIdList.length).fill('0'));
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
                    UIDAttr[k] = web3.toHex(myUniqueIdAttributes[i]);
                    fileHashes[k] = myUniqueIdAttributes[i + 1];
                    k++;
                  }
                  theUniqueIDAttributes = theUniqueIDAttributes.concat(Array(10 - theUniqueIDAttributes.length).fill('0'));
                  logCatcher(`form atr: ${form.uniqueIdAttributes}`);
                  logCatcher(`uid: ${form.uniqueId}`);
                  logCatcher(`atr: ${theUniqueIDAttributes}`);
                  logCatcher(`UIDAttr: ${UIDAttr}`);
                  logCatcher(`fileHashes: ${fileHashes}`);

                  promisify(contract.setUniqueID)(form.uniqueId, UIDAttr, fileHashes, false)
                    .then(() => promisify(contract.setOwnership)(myOwnerIdList, myOwnershipTokenQuantity))
                    .then(() => promisify(contract.StartCoidIca)())
                    .then((value) => {
                      logCatcher(value);
                      return promisify(dimCtrlContract.IdentityDimensionControlInstantiation)(coidAddr, '0x0');
                    })
                    .then(value => logCatcher(`DimensionInstantiation: ${JSON.stringify(value)}`));
                  writeAll(prepareForm(form), () => { });
                  // make the core identity
                  // CoidMaker(coidAddr, dimensionCtrlAddr, formdataArray[index])

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


  let eventGatekeeperResultReadyUniqueId;

  gateKeeperContract.resultReadyUniqueId(
    (error, result) => {
      eventGatekeeperResultReadyUniqueId = result;
    },
    (error, result) => {
      // grab parameters from the event
      const {
        proposalId, votingResult, resultMessage, coidGKAddr, coidAddr,
        dimensionCtrlAddr, blockNumber, blockchainID, timestamp, blockHashVal,
      } = result.args;
      const flag = 0;

      // debugging
      logCatcher('CUID EVENT RECIEVED');
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

      // implement logic if and only if votingResult is true:
      if (votingResult) {
        // find data given proposalId
        let index = -1;
        logCatcher(`propIDARRAY: ${proposalIDArray}`);
        logCatcher(`propID: ${proposalId}`);
        for (let k = 0; k < indexer; k++) {
          if (proposalIDArray[k] === proposalId) {
            index = k;
          }
        }
        logCatcher(`index is: ${index}`);

        if (index !== -1) {
          const fileName = `${formdataArray[index].assetId}.json`;
          // TODO (to make cleaner): un-hardcode m -- grab number of validators from
          // NOTE: notice the use of let for m, rather than var!
          const validatorSigs = [];
          let indexSigs = 0;
          const loopFunction = (m) => {
            ballotContract.getValidatorSignature_byIndex(proposalId, m, (err, res) => {
              // TODO: Create labels for validator sigs
              logCatcher(`This is the result: ${JSON.stringify(res)}`);
              validatorSigs[indexSigs] = res;
              indexSigs++;
              logCatcher(`m is: ${m}`);
            });
          };
          for (let m = 0; m < 3; m++) {
            loopFunction(m);
          }

          logCatcher(`validator sigs are: ${validatorSigs}`);

          // gatekeeper needs to sign this:
          setTimeout(() => {
            createSignature('GatekeeperAppVerified', (signatureGK, pubkeyGK, hashGK) => {
              const GKSig = { signature: signatureGK, pubkeyGK, hashGK };
              logCatcher(`GK Sig: ${JSON.stringify(GKSig)}`);
              logCatcher(`get asset: ${formdataArray[index].pubKey}`);
              theNotifier.GetAsset(formdataArray[index].pubKey, fileName, flag, (results) => {
                const myUniqueIdAttributes = formdataArray[index].uniqueIdAttributes.split(',');
                // for(var j=0;j<myUniqueIdAttributes.length;j++){
                results.uniqueIdAttributes.push(myUniqueIdAttributes);
                // }
                logCatcher(`get asset returns: ${JSON.stringify(results)}\n`);
                const { visibility, description } = formdataArray[index];
                // _this.bigchainIt(proposalId, results, results.gatekeeperAddr, results.coidAddr, results.dimensionCtrlAddr, blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, function (result, theId, theHash) {
                theNotifier.bcPreRequest(formdataArray[index].pubKey, proposalId, formdataArray[index], blockNumber, blockHashVal, blockchainID, timestamp, validatorSigs, GKSig, results.bigchainID, results.bigchainHash, visibility, description, (res, theId, theHash) => {
                  // logCatcher(result);
                  logCatcher(`THE TXN ID: ${theId}`);
                  logCatcher(`THE HASH: ${theHash}`);
                  logCatcher(`GK ADDR: ${coidGKAddr}`);
                  logCatcher(`COID ADDR: ${coidAddr}`);
                  logCatcher(`DIM_CTRL ADDR: ${dimensionCtrlAddr}`);
                  // theNotifier.SetAsset(keccak_256(formdataArray[index].pubKey).toUpperCase(), fileName, flag, 0, results, "", "", function () { })
                  writeAll(res, () => { });
                  // makes the changes Unique ID attributes
                  UniqueAttributeChanger(res.coidAddr, res.dimensionCtrlAddr, res);

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


  // Listening of the resultIsReady event in the ballot:
  // When the event is ready, it calls the function in gatekeeper, result is ready
  // Note that after the function is called in gatekeeper, it triggers the gatekeeper resultReady event

  let eventBallotResultIsReady;
  ballotContract.resultIsReady(
    (error, res) => {
      eventBallotResultIsReady = res;
    },

    (error, result) => {
      const { proposalId, requestResult } = result.args;
      const chainID = keccak_256(chain);

      logCatcher('ballot contract event -- ResultIsReady');
      logCatcher(`proposalId from event is: ${proposalId}`);
      logCatcher(`requestResult from event is: ${requestResult}`);

      gateKeeperContract.ResultIsReady(requestResult, proposalId, chainID, (err, res) => {
        if (err) {
          logCatcher(`error from Gatekeeper Contract function ResultIsReady:${err}`);
        } else {
          logCatcher('ResultIsReady function in gatekeeper successfully called.');
        }
      });
    },

  );// end of _this.ballotContract.resultIsReady


  // this is the event listening. the event is just for debugging purposes.
  ballotContract.proposalExpired(
    (error, result) => {

    },
    (error, result) => {
      logCatcher(`${JSON.stringify(result.args)}... is the result from event ballotContract.proposalExpired`);
    },
  );


  // for checking expiry of proposals
  // contract function will delete proposal for you
  function isExpired() {
    ballotContract.IsProposalExpired((error, result) => {
      logCatcher('is proposal expired has just been called');
      setTimeout(() => {
        // recursively check every 9 seconds. in the future make this a day.
        isExpired();
      }, 9000);
    });
  }

  // start the recursive checking
  setTimeout(() => {
    isExpired();
  }, 500000);


  // this is to delete the proposal in the ballot and gatekeeper, upon consensus (rejection and acceptance)
}; // eventListener

/** *****************************************************
 *      THIS IS CALLED BY MYGATEKEEPER.JSX
****************************************************** */
let listening;
const gatekeepers = [];

app.post('/MyGatekeeper', (req, res) => {
  const formdata = req.body;
  logCatcher(`request body...${JSON.stringify(formdata)}`);


  // This Object will create an ICA
  // Meant t2o be used for testing. Make sure to update UNIQUEID
  // when using repeatedly so uniqueness check doesn't fail.

  if (formdata.isHuman === 'false') {
    logCatcher(formdata.gatekeeperAddr);
    const gatekeeperApp = gatekeeper(formdata.gatekeeperAddr);
    formdata.yesVotesRequiredToPass = formdata.validatorList.split(',').length;

    logCatcher(`LISTENING: ${listening}`);


    // ONLY ON SECOND REQUEST
    // logCatcher("AT INDEX 0: " + gatekeeperApp.debugging(0))

    const isValid = gatekeeperApp.verifyIt(formdata);
    const isUnique = gatekeeperApp.checkUnique(formdata);

    if (gatekeepers.indexOf(keccak_256(formdata.pubKey)) === -1) {
      gatekeepers.push(keccak_256(formdata.pubKey));
      listening = eventListener(formdata.gatekeeperAddr);
      // WILL THIS EXPIRE AT THE END OF THEIR POST REQUEST?
    }

    if (isValid) {
      logCatcher(`Is valid value: ${isValid === 'true'}`);
      if (isUnique) {
        gatekeeperApp.getProposalId(formdata, res, (err, result) => {
          if (err) {
            logCatcher('got an error inside gatekeeperApp.getPRoposalID');
            result.json({ error: err });
            logCatcher('Error');
          } else {
            result.json({ Method: 'POST', msg: 'COID data submitted successfully' });
          }
        });
      } else {
        res.send('The uniqueId is not unique.');
      }
    } else {
      res.send('The signature is not valid....check that your public key, signature and message hash are correct.');
    }
  }
});

app.listen(port, () => {
  logCatcher('Connected to contract http://10.101.114.231:1337/rpc');
  logCatcher(`Listening on port ${port}`);
});

