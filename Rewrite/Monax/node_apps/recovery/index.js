
/*
TODO
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
!!!!!!CHANGE NOTIFIER CALLS TO *--COMPROMISED--* DIGITAL TWIN TO BE AIRBITZ CALLS!!!!!!
ADD variable in contract to control 'cleanMyTwin' command usage and make ctrl file check for it
EVENTUALLY use crypto-conditions to prevent old owner from accessing bigchainDB and pass owership of all bigchainDB objects to new owner
EVENTUALLY make it so an owner is not listed as a controller or dim_controller in the digital twin
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

General Note from Refactoring Witch Alex:
- Many of these functions could be rewritten as compositional functions
  i.e. smaller functions composing larger functions and passing variables along the call stack using the parent function to store the state of the function
*/
process.on('unhandledRejection', (up) => { throw up; });
const chainConfig = require('/home/1070933/.monax/ErisChainConfig.json');
const contractData = require('./jobs_output.json');

const erisContracts = require('@monax/legacy-contracts');
const fs = require('fs-extra');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const secp256k1 = require('secp256k1');

// for sending a notification
const superAgent = require('superagent');

// for verification
const crypto = require('crypto');
const ed25519 = require('ed25519');

const deasync = require('deasync');

// this library is needed to calculate hash of blockchain id (chain name) and bigchain response
const { keccak_256 } = require('js-sha3');

// These variables are for creating the server
const hostname = 'localhost';

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

// holding recover objects
const formdataArray = [];
const IDArray = [];
const twinUrl = 'http://10.4.0.167:8000';


const theNotifier = require('../Component/notifications');


// ED25519 VERIFICATION FUNCTION:
function EDVerify(msg, signature, pubKey) {
  const logme = ed25519.Verify(Buffer.from(msg), Buffer.from(signature, 'hex'), Buffer.from(pubKey, 'hex'));
  return logme;
}


// SECP VERIFICATION FUNCTION:
function SECPVerify(msg, signature, pubKey) {
  console.log('reached verify function');
  const msgf = Buffer.from(msg, 'hex');
  const signaturef = Buffer.from(signature, 'hex');
  const pubKeyf = Buffer.from(pubKey.slice(2), 'hex');

  console.log(`msg: ${msg.toString('hex')}`);
  console.log(`sig: ${signature.toString('hex')}`);
  console.log(`pubKey: ${pubKey.toString('hex')}`);
  const verified = secp256k1.verify(msgf, signaturef, pubKeyf);
  console.log(`verified: ${verified}`);
}


function writeAllDimensions(formdata, callback) {
  let max = Math.max(formdata.dimension.controllers.length, formdata.dimension.owners.length);
  max = Math.max(formdata.dimension.delegations.length, max);
  max = Math.max(formdata.dimension.dim_controllers_keys.length, max);
  console.log('\n*****THE MIGHTY WRITEALL*****\n');
  console.log(JSON.stringify(formdata));
  console.log(`MAX :${max}`);
  let k = 0;
  let o = 0;
  let c = 0;
  // let d = 0; // Unused
  let e = 0;
  let delegateeLog;
  const total = formdata.dimension.controllers.length + formdata.dimension.owners.length + formdata.dimension.delegations.length + formdata.dimension.dim_controllers_keys.length;
  console.log(`total calls: ${total}`);

  const fn_setdim_cb_owner = () => {
    k++;
    console.log(`Writing to Owner: ${formdata.dimension.owners[o]} K: ${k}`);
    o++;
    if (k === total) { console.log('owner callback '); callback(); }
  };

  const fn_setdim_cb_controllers = () => {
    k++;
    console.log(`Writing to Controller: ${formdata.dimension.controllers[c]} K: ${k}`);
    c++;
    if (k === total) { console.log('controller callback'); callback(); }
  };

  const fn_setdim_cb_dimensions = () => {
    k++;
    console.log(`Writing to Controller: ${formdata.dimension.dim_controllers_keys[e]} K: ${k}`);
    e++;
    if (k === total) { console.log('dim_controllers_keys callback'); callback(); }
  };

  const fn_setdim_cb_delegatee = () => {
    k++;
    console.log(`Writing to Controller: ${formdata.dimension.dim_controllers_keys[e]} K: ${k}`);
    e++;
    if (k === total) { console.log('dim_controllers_keys callback'); callback(); }
  };

  for (let i = 0; i < max; i++) {
    if ((formdata.dimension.owners[i]) !== undefined && (formdata.dimension.owners[i]) !== null && formdata.dimension.owners !== '') {
      theNotifier.SetDimension(String(formdata.dimension.owners[i]), `${String(formdata.dimension.dimensionName)}.json`, 0, 0, formdata, '', '', fn_setdim_cb_owner);
    }
    if ((formdata.dimension.controllers[i]) !== undefined && (formdata.dimension.controllers[i]) !== null && formdata.dimension.controllers !== '') {
      theNotifier.SetDimension(String(formdata.dimension.controllers[i]), `${String(formdata.dimension.dimensionName)}.json`, 1, 0, formdata, '', '', fn_setdim_cb_controllers);
    }
    if ((formdata.dimension.dim_controllers_keys[i]) !== undefined && (formdata.dimension.dim_controllers_keys[i]) !== null && formdata.dimension.dim_controllers_keys !== '') {
      theNotifier.SetDimension(String(formdata.dimension.dim_controllers_keys[i]), `${String(formdata.dimension.dimensionName)}.json`, 1, 0, formdata, '', '', fn_setdim_cb_dimensions);
    }
    if ((formdata.dimension.delegations[i]) !== undefined && (formdata.dimension.delegations[i]) !== null && formdata.dimension.delegations[i] !== '' && formdata.dimension.delegations[i].owner !== '') {
      const { delegatee, accessCategories } = formdata.dimension.delegations[i];
      delegateeLog = formdata;
      delegateeLog.dimension.pubKey = '';
      delegateeLog.dimension.coidAddr = '';
      delegateeLog.dimension.uniqueId = '';
      delegateeLog.dimension.uniqueID = '';
      // delegateeLog.dimension.data=[""];

      for (let n = 0; n < delegateeLog.dimension.delegations.length; n++) {
        if (delegateeLog.dimension.delegations[n].delegatee !== delegatee) {
          delegateeLog.dimension.delegations.splice(n, 1);
        }
      }
      // for(var j=0;j<results.dimension.delegations.length;j++){
      if (accessCategories === '') {
        console.log('setting categories');
        delegateeLog.dimension.data = formdata.dimension.data;
        // break;
      } else {
        const keys = accessCategories.split(',');
        delegateeLog.dimension.data = [''];
        for (let j = 0; j < formdata.dimension.data.length; j++) {
          if (keys.indexOf(formdata.dimension.data[j].descriptor)) {
            delegateeLog.dimension.data.push(formdata.dimension.data[j]);
          }
        }
      }

      theNotifier.SetDimension(String(formdata.dimension.delegations[i].delegatee), `${String(formdata.dimension.dimensionName)}.json`, 2, 0, delegateeLog, '', '', fn_setdim_cb_delegatee);
    }
  }// end for loop
}// end writeAll


function writeAllAssets(formdata, callback) {
  const owners = formdata.ownerIdList;
  let controllers = formdata.controlIdList;
  if (controllers === '') { controllers = []; }
  const max = Math.max(owners.length, controllers.length);
  const fileName = `${formdata.assetID}.json`;
  console.log('\n*****THE MIGHTY WRITEALL*****\n');
  console.log(JSON.stringify(formdata));
  console.log(`MAX :${max}`);
  let k = 0;
  let o = 0;
  let c = 0;
  const d = 0;
  const total = owners.length + controllers.length;
  console.log(`TOTAL: ${total}`);
  console.log(`${owners} len ${owners.length}`);

  const fn_setasset_cb_owners = () => {
    k++;
    console.log(`Writing to Owner: ${owners[o]} K: ${k}`);
    o++;
    if (k === total) { console.log('owner callback'); callback(); }
  };

  const fn_setasset_cb_controllers = () => {
    k++;
    console.log(`Writing to Controller: ${controllers[c]} K: ${k}`);
    c++;
    if (k === total) { console.log('controlller callback'); callback(); }
  };

  for (let i = 0; i < max; i++) {
    console.log(`loop ${owners[i]}`);
    if ((owners[i]) !== undefined && (owners[i]) !== null && owners !== '') {
      theNotifier.SetAsset(String(owners[i]), String(fileName), 0, 0, formdata, '', '', fn_setasset_cb_owners);
    }
    if ((controllers[i]) !== undefined && (controllers[i]) !== null && controllers !== '') {
      theNotifier.SetAsset(String(controllers[i]), String(fileName), 1, 0, formdata, '', '', fn_setasset_cb_controllers);
    }
  }// end for loop
}// end writeAll

// This needs to be rewritten as a higher order function or modularized
const Recovery = function (recoveryAddr) {
  this.chain = 'primaryAccount';
  this.erisdburl = chainConfig.chainURL;
  this.contractData = require('./jobs_output.json');
  this.contractAbiAddress = this.contractData.MyGateKeeper;
  this.erisAbi = JSON.parse(fs.readFileSync(`./abi/${this.contractAbiAddress}`));
  this.accountData = require('./accounts.json'); // TODO: this should not be a require but rather an fs read
  this.contractMgr = erisContracts.newContractManagerDev(this.erisdburl, chainConfig[this.chain]);
  // this.gateKeeperContract = this.contractMgr.newContractFactory(this.erisAbi).at(MyGKaddr);

  // ballot contract
  this.ballotAddress = this.contractData.ballot;
  // console.log("this is the ballot address: " + this.ballotAddress);
  this.ballotAbi = JSON.parse(fs.readFileSync(`./abi/${this.ballotAddress}`));
  this.ballotContract = this.contractMgr.newContractFactory(this.ballotAbi).at(this.ballotAddress);

  // verification contract (oraclizer)
  this.VerificationAddress = require('/home/1070933/.monax/apps/VerifyOraclizerEthereum/wallet2/jobs_output.json').Verification;
  this.VerificationAbi = JSON.parse(fs.readFileSync(`/home/1070933/.monax/apps/VerifyOraclizerEthereum/wallet2/abi/${this.VerificationAddress}`, 'utf8'));
  this.VerificationContract = this.contractMgr.newContractFactory(this.VerificationAbi).at(this.VerificationAddress);
  this.ErisAddress = chainConfig[this.chain].address;

  // bigchain contract (oraclizer)
  this.bigchain_query_addr = require('/home/1070933/.monax/apps/BigchainOraclizer/jobs_output.json').Verification;
  this.bigchain_abi = JSON.parse(fs.readFileSync(`/home/1070933/.monax/apps/BigchainOraclizer/abi/${this.bigchain_query_addr}`, 'utf8'));
  this.bigchain_contract = this.contractMgr.newContractFactory(this.bigchain_abi).at(this.bigchain_query_addr);

  // recovery contract
  this.recoveryAbiAddress = this.contractData.Recovery;
  this.recoveryAbi = JSON.parse(fs.readFileSync(`./abi/${this.recoveryAbiAddress}`));
  this.recoveryContract = this.contractMgr.newContractFactory(this.recoveryAbi).at(recoveryAddr);

  const self = this; // 'self' is a best practice variable name for a binding on this

  this.verifyIt = function (formdata, callback) {
    const msgf = formdata.msg;
    const sigf = formdata.sig;
    const pubKeyf = formdata.pubKey;
    let sync = true;
    const isValidResult = false;
    console.log('you have reached verifyIt internal function');
    console.log(`msg: ${msgf}`);
    console.log(`sig: ${sigf}`);
    console.log(`key: ${pubKeyf}`);
    self.VerificationContract.VerificationQuery(msgf, sigf, pubKeyf, (error, result) => {
      let elEvento;

      // porque espanol
      self.VerificationContract.CallbackReady((err1, res1) => { elEvento = result; }, (err2, res2) => {
        if (self.ErisAddress === result.args.addr) {
          self.VerificationContract.myCallback((err3, res3) => {
            if (!error) {
              elEvento.stop();
              console.log(`Received response from VerifyIt :${res3}...if that says false, you should not be able to Result0,etc.!!!`);
              callback(res3);
              sync = false;
            } else { callback(false); }
          });// end myCallback
        }
      }); // end CallbackReady.once
    });// end VerificationQuery

    while (sync) { deasync.sleep(100); }
  }; // end verification


  this.startBallot = function (ballotAddress, gkAddr, coidAddr, isHuman, callback) {
    console.log('starting ballot');
    self.recoveryContract.startBallot(ballotAddress, gkAddr, coidAddr, isHuman, (error, result) => {
      if (result) {
        console.log('ballot complete, waiting for votes');
        callback(result);
      } else {
        console.log(`start ballot error:\n${error}`);
        callback(false);
      }
    });
  };

  this.confirmRecoverer = function (initatorKey, coidAddr, callback) {
    console.log('verifying recoverer');
    self.recoveryContract.confirmRecoverer(initatorKey, coidAddr, (error, result) => {
      if (result) {
        console.log('verify complete, recoverer valid');
        callback(result);
      } else {
        console.log(`Mismatch or error:\n${error}`);
        callback(false);
      }
    });
  };

  this.readTree = function (formdata, callback) {
    self.recoveryContract.readTree((error, result) => {
      if (!result) {
        console.log(`start ballot error:\n${error}`);
      }
    });
  };

  this.editTree = function (formdata, callback) {
    self.recoveryContract.editTree((error, result) => {
      if (!result) {
        console.log(`start ballot error:\n${error}`);
      }
    });
  };
};// end recovery

const eventListener = function () {
  let recoveryContract;
  const chain = 'primaryAccount';
  const erisdburl = chainConfig.chainURL;
  const ErisAddress = chainConfig[chain].address;
  const contractData2 = require('./jobs_output.json'); // TODO: Should not be a require()
  const contractAbiAddress = contractData.Recovery;
  const erisAbi = JSON.parse(fs.readFileSync(`./abi/${contractAbiAddress}`));
  const accountData = require('./accounts.json'); // TODO: Should not be a require()
  const contractMgr = erisContracts.newContractManagerDev(erisdburl, chainConfig[chain]);
  const recoveryContractFactory = contractMgr.newContractFactory(erisAbi);
  const dimCtrlAddress = contractData.IdentityDimensionControl;
  const dimCtrlAbi = JSON.parse(fs.readFileSync(`./abi/${dimCtrlAddress}`));

  this.accountData = require('./accounts.json'); // TODO: Should not be a require()
  this.contractMgr = erisContracts.newContractManagerDev(erisdburl, chainConfig[chain]);
  // ballot contract
  this.ballotAddress = contractData.ballot;
  this.ballotAbi = JSON.parse(fs.readFileSync(`./abi/${this.ballotAddress}`));
  this.ballotContract = this.contractMgr.newContractFactory(this.ballotAbi).at(this.ballotAddress);

  // bigchain contract (oraclizer)
  const bigchain_query_addr = require('/home/1070933/.monax/apps/BigchainOraclizer/jobs_output.json').Verification; // TODO: Should not be a require()
  const bigchain_abi = JSON.parse(fs.readFileSync(`/home/1070933/.monax/apps/BigchainOraclizer/abi/${bigchain_query_addr}`, 'utf8'));
  const bigchain_contract = contractMgr.newContractFactory(bigchain_abi).at(bigchain_query_addr);

  const blockchinID = keccak_256(chain);
  // these 2 vars seem to not work atm but will keep placeholders for when they do
  const blockNumber = 0;
  const blockHashVal = 0;
  const blockHash = 0;
  const blockchainID = keccak_256(chain);

  console.log('----------------------------------------------------------------------------------------------------------------\n');

  const self = this;


  // This is for signature generation:
  function createSignature(nonHashedMessage, callback) {
    // make message hash
    const hash = crypto.createHash('sha256').update(nonHashedMessage).digest('hex');
    const { pubKey, privKey } = chainConfig.primaryAccount;

    const keyPair = { publicKey: Buffer.from(pubKey, 'hex'), privateKey: Buffer.from(privKey, 'hex') };

    let signature = ed25519.Sign(Buffer.from(hash), keyPair);

    signature = signature.toString('hex');

    const result = { signature, pubKey, msg: hash };

    callback(signature, pubKey, hash);
  }


  let eventRecoveryResultReady;

  self.ballotContract.startRecovery(
    (error, result) => {
      eventRecoveryResultReady = result;
    },
    (error, result) => {
      if (error) { console.log(`err: ${error}`); } else {
        console.log(`Start recovery event caught: ${result}`);
        if (result !== undefined) {
          // grab parameters from the event
          const { proposalId, votingResult, coidGKAddr } = (result.args);
          let recoveryAddress;
          const local_chain = 'primaryAccount';
          const local_erisdburl = chainConfig.chainURL;
          const local_contractData = require('./jobs_output.json'); // TODO: remove this require()
          const local_contractAbiAddress = contractData.Recovery;
          const local_erisAbi = JSON.parse(fs.readFileSync(`./abi/${contractAbiAddress}`));
          const local_accountData = require('./accounts.json'); // TODO: remove this require()
          const local_contractMgr = erisContracts.newContractManagerDev(erisdburl, chainConfig[chain]);
          console.log('--------------------------------------------------------------------');

          // implement logic if and only if votingResult is true:
          if (votingResult) {
            const index = IDArray.indexOf(proposalId);
            if (index !== -1) {
              console.log(JSON.stringify(formdataArray[index]));
              const recoveryObject = {
                pubKey: `0x${formdataArray[index].newPubKey}`, // change if front end changes to send with '0x' attached
                oldPubKey: formdataArray[index].owner,
                gkAddr: coidGKAddr,
                proposalId,
                msg: formdataArray[index].msg,
                signature: formdataArray[index].sig,
                recovererPubkey: formdataArray[index].recoverer,
                recovererSignature: formdataArray[index].recovererSignature,
                recoveryAddr: formdataArray[index].recoveryAddr,
              };

              // TODO: refactor this callback soup
              recoverAll(recoveryObject, (res1) => {
                console.log(`Recoverall result: ${res1}`);
                theNotifier.transferRecovery(recoveryObject.pubKey, recoveryObject.oldPubKey, (res2) => {
                  console.log(`transfer recovery: ${res2}`);
                  theNotifier.cleanMyTwin(recoveryObject.oldPubKey, () => {
                    theNotifier.bcTransferFileRequest(recoveryObject.pubKey, recoveryObject.oldPubKey, (res3) => {
                      console.log(`xfer result: ${res3}`);
                      console.log('----------------------------------------------------------------------------------------------------------------\n');
                    });
                  });// end clean
                });// end transfer
              });// end recoverall
            }
          }
        }
      }
    },
  );// end event

  // this function recovers every asset,dimension, and signature related to an 'oldPubKey' and tansfers it to a 'pubkey'
  function recoverAll(recoveryObject, callback) {
    const { pubKey, oldPubKey } = recoveryObject;
    const hashedPubKey = keccak_256(pubKey);
    const oldHashedPubKey = keccak_256(oldPubKey);
    let ownedAssets;
    let controlledAssets;
    let delegatedAssets;
    const time = new Date();// if too many contract calls are called at once,this can stop an invalid jump
    let raSync = true;// for time
    let mutex = false;

    editSignatures(recoveryObject, (recoverySig, pk, hash) => {
      theNotifier.GetAllOwnedAssets(oldPubKey, (result) => {
        console.log(`res: ${result}`);
        if (result) {
          ownedAssets = result.data;
          theNotifier.GetAllControlledAssets(oldPubKey, (res1) => {
            if (res1) {
              controlledAssets = res1.data;
              theNotifier.GetAllDelegatedAssets(oldPubKey, (res2) => {
                if (res2) {
                  delegatedAssets = res2.data;
                  console.log(`dele length: ${delegatedAssets.length}`);
                  // looping vars
                  let max = Math.max(ownedAssets.length, controlledAssets.length);
                  max = Math.max(delegatedAssets.length, max);
                  const totalAssets = ownedAssets.length + controlledAssets.length + delegatedAssets.length;
                  let t = 0;
                  recoverMyGatekeeper(recoveryObject, (gatekeeperAddr) => {
                    // var gatekeeperAddr = "asdsdfsdv";
                    console.log(`new gk addr: ${gatekeeperAddr}`);
                    // get the owner for each asset, get the asset, edit the asset, under owner name call writeAllAssets()
                    console.log(`recoverall loop max: ${max} total: ${totalAssets}`);
                    for (let x = 0; x < max; x++) {
                      raSync = true;
                      console.log(`x: ${x}  owned: ${ownedAssets[x]}   controlled: ${controlledAssets[x]}`);
                      if (ownedAssets[x] !== undefined && (ownedAssets[x]) !== null && x < ownedAssets.length) {
                        // var ownerkey = ownedAssets[x].pubKey;
                        const fileName = ownedAssets[x];
                        const flag = 0; // why does this exist if its a const value and immediately passed as formal param
                        theNotifier.GetAsset(oldPubKey, fileName, flag, (results) => {
                          if (results) {
                            const asset = results;
                            if (asset.controlIdList) { } else { asset.controlIdList = []; }
                            const recovCoidObject = {
                              oldPubKey, pubKey, coidAddr: asset.coidAddr, propType: asset.propType,
                            };
                            console.log(`\n\nRECOVERING OWNED ASSET: ${asset.assetID}\n\n`);
                            recoverCoid(recovCoidObject, (result) => {
                              console.log(`res: ${result}`);
                              if (result) {
                                const recovDimObject = {
                                  pubKey,
                                  coidAddr: result,
                                  dimCtrlAddr: asset.dimensionCtrlAddr,
                                  oldPubKey,
                                };
                                asset.coidAddr = result;
                                recoverDimensionControl(recovDimObject, (result) => {
                                  asset.dimensionCtrlAddr = result;
                                  asset.gatekeeperAddr = gatekeeperAddr;
                                  if (asset.pubKey == oldPubKey) { asset.pubKey = pubKey; }
                                  if (oldHashedPubKey == asset.ownershipId) { asset.ownershipId = hashedPubKey; }
                                  if (oldHashedPubKey == asset.controlId) { asset.controlId = hashedPubKey; }
                                  console.log(`owneridlist[0]: ${asset.ownerIdList[0]}`);
                                  const indexO = asset.ownerIdList.indexOf(oldHashedPubKey);
                                  const indexC = asset.controlIdList.indexOf(oldHashedPubKey);
                                  if (indexO != -1) { asset.ownerIdList[indexO] = hashedPubKey; console.log('\n\nchanged an owner\n\n'); }
                                  if (indexC != -1) { asset.controlIdList[indexC] = hashedPubKey; console.log('\n\nchanged a controller\n\n'); }
                                  // bigchainPost(asset.proposalId, asset, blockNumber, blockHash, blockchainID, time.getTime(), asset.validatorSigs, recoverySig, function (result, theId, theHash) {

                                  while (mutex) { require('deasync').sleep(5000); }

                                  mutex = true;
                                  const visibility = 'private';
                                  const description = 'COID_RECOVERY';
                                  theNotifier.bcPreRequest(asset.pubKey, asset.proposalId, asset, blockNumber, blockHashVal, blockchainID, time.getTime(), asset.validatorSigs, recoverySig, asset.bigchainID, asset.bigchainHash, visibility, description, (result, theId, theHash) => {
                                    asset.bigchainID = theId;
                                    asset.bigchainHash = theHash;
                                    mutex = false;
                                    // if ica asset, edit all attestation files of those that have attested to the Ica.
                                    if (asset.propType == '2') {
                                      console.log('Ica sig edit');
                                      const attestors = asset.validatorSigs;
                                      for (let i = 0; i < attestors.length; i++) {
                                        theNotifier.getSignatures(attestors[i], (sigFile) => {
                                          if (sigFile != undefined) {
                                            for (var j = 0; j < sigFile.length; j++) {
                                              if (sigFile[j].proposal_id == asset.proposalId) {
                                                var l = 0;
                                                const expiration = asset.validatorSigs[j][3];
                                                theNotifier.deleteIcaEntry(asset.proposalId, attestors[j][2], (result) => {
                                                  // theNotifier.attestIcaFile(pubKey, asset.proposalId, "recovery", time.getTime(), asset.gatekeeperAddr, expiration, theId, asset.assetID);
                                                  theNotifier.createIcaSigNotification(attestors[j][2], asset.proposalId, attestors[j][3], theId, asset.assetID, pubKey);
                                                  l++;
                                                });
                                              }
                                            }
                                          }
                                        });
                                      }
                                    }
                                    writeAllAssets(asset, () => {
                                      if (asset.assetID == 'MyCOID' && asset.pubKey == pubKey) {
                                        let k = 0;
                                        for (let n = 0; n < asset.identityRecoveryIdList.length; n++) {
                                          theNotifier.deleteRecoveryNotification(asset.proposalId, asset.identityRecoveryIdList[n], (result) => {
                                            theNotifier.createRecoveryNotification(asset, recoveryObject.recoveryAddr, asset.identityRecoveryIdList[k]);
                                            k++;
                                          });
                                        }
                                      }
                                      t++;
                                      raSync = false;
                                      console.log(`owner t: ${t} x: ${x}`);
                                      if (x >= max - 1 && t == totalAssets) { editDimensions(recoveryObject, (result) => { callback(result); }); console.log('DIMcallback'); }
                                      // if (x >= max-1 && t != total) { callback(false) }
                                    });
                                  }, asset.bigchainID, asset.bigchainHash);
                                });
                              }
                            });
                          }
                        });
                      }// end owned
                      if (controlledAssets[x] != 'undefined' && typeof (controlledAssets[x]) !== 'null' && x < controlledAssets.length) {
                        var fileNameC = controlledAssets[x];
                        var flag = 1;
                        theNotifier.GetAsset(oldPubKey, fileNameC, flag, (results) => {
                          if (results) {
                            flag = 0;
                            if (fileNameC != 'MyCOID.json' && oldPubKey != results.pubKey) {
                              console.log(`\n\nRECOVERING CONTROLLED ASSET: ${fileNameC}\n\n`);
                              theNotifier.GetAsset(results.pubKey, fileNameC, flag, (results2) => {
                                if (results2) {
                                  const asset = results2;
                                  console.log(`\n\nRESULTS2: ${results2}`);
                                  if (asset.ownerIdList.indexOf(oldHashedPubKey) >= 0 && asset.controlIdList.indexOf(oldHashedPubKey) >= 0) {
                                    t++;
                                    if (x == max && t == totalAssets) {
                                      editDimensions(recoveryObject, (result) => { callback(result); }); console.log('ctrlDIMcallback');
                                    }
                                  } else {
                                    const coidAddress = contractData.CoreIdentity;
                                    const coidAbi = JSON.parse(fs.readFileSync(`./abi/${coidAddress}`));
                                    const coidContract = contractMgr.newContractFactory(coidAbi).at(asset.coidAddr);
                                    coidContract.setRecoveryState((error, result) => {
                                      console.log(`controller setrecovState: ${result}`);
                                      coidContract.recoverGetAll((error, result) => {
                                        const coidData = result;
                                        console.log(`\n\ncontroller recov data: ${coidData}`);
                                        coidContract.setInitState((error, result) => {
                                          console.log(`setInitState: ${result}`);
                                          const indexC = coidData[6].indexOf(oldHashedPubKey);
                                          if (indexC != -1) { coidData[6][indexC] = hashedPubKey; }
                                          coidContract.setControl(coidData[7].toString().split(','), coidData[6], (error, result) => {
                                            console.log('\nSETCONTROL\n');
                                            if (asset.pubKey == oldPubKey) { asset.pubKey = pubKey; }
                                            if (oldHashedPubKey == asset.ownershipId) { asset.ownershipId = hashedPubKey; }
                                            if (oldHashedPubKey == asset.controlId) { asset.controlId = hashedPubKey; }
                                            const indexO = asset.ownerIdList.indexOf(oldHashedPubKey);
                                            const indexC = asset.controlIdList.indexOf(oldHashedPubKey);
                                            const indexR = asset.identityRecoveryIdList.indexOf(oldHashedPubKey);
                                            if (indexR != -1) {
                                              asset.identityRecoveryIdList[indexR] = hashedPubKey;
                                              COIDcontract.setRecovery(coidData[8], String(coidData[9]), (error, result) => { });
                                            }
                                            if (indexO != -1) { asset.ownerIdList[indexO] = hashedPubKey; }
                                            if (indexC != -1) { asset.controlIdList[indexC] = hashedPubKey; }
                                            coidContract.setActiveState((error, result) => {
                                              console.log(`setActiveState: ${result}`);
                                              console.log('\nCONTROLWRITE\n');

                                              while (mutex) { require('deasync').sleep(5000); }

                                              mutex = true;
                                              const visibility = 'private';
                                              const description = 'ASSET_RECOVERY';
                                              theNotifier.bcPreRequest(asset.pubKey, asset.proposalId, asset, blockNumber, blockHashVal, blockchainID, time.getTime(), asset.validatorSigs, recoverySig, asset.bigchainID, asset.bigchainHash, visibility, description, (result, theId, theHash) => {
                                                asset.bigchainID = theId;
                                                asset.bigchainHash = theHash;
                                                mutex = false;
                                                writeAllAssets(asset, () => {
                                                  t++;
                                                  raSync = false;
                                                  console.log(`controller t: ${t} x: ${x}`);
                                                  if (x >= max - 1 && t == totalAssets) { editDimensions(recoveryObject, (result) => { callback(result); }); console.log('DIMcallback'); }
                                                  // if (x == max && t != total) { callback(false) }
                                                });
                                              }, asset.bigchainID, asset.bigchainHash);
                                            });
                                          });// setcontrol
                                        });
                                      });
                                    });
                                  }// else
                                }
                              });
                            } else { t++; if (x >= max - 1 && t == totalAssets) { editDimensions(recoveryObject, (result) => { callback(result); }); console.log('ctrlDIMcallback'); } }
                          }
                        });
                      }// end controlled
                      if (delegatedAssets[x] != 'undefined' && typeof (delegatedAssets[x]) !== 'null' && x < delegatedAssets.length) {
                        var fileName = delegatedAssets[x];
                        var flag = 2;
                        console.log(`\n\nRECOVERING DELEGATED ASSET: ${fileName}\n\n`);
                        theNotifier.GetAsset(oldPubKey, fileName, flag, (results) => {
                          if (results) {
                            flag = 0;
                            // get the original asset owned by another person
                            theNotifier.GetAsset(results.pubkey, fileName, flag, (results2) => {
                              if (results2) {
                                const asset = results2;
                                for (let y = 0; y < asset.delegations.length; y++) {
                                  if (asset.delegations[y].delegatee == oldHashedPubKey) { asset.delegatee = hashedPubKey; }
                                }
                                // write Assets to all owners controllers and delegatees
                                const visibility = 'private';
                                const description = 'ASSET_RECOVERY';
                                theNotifier.bcPreRequest(asset.pubKey, asset.proposalId, asset, blockNumber, blockHashVal, blockchainID, time.getTime(), asset.validatorSigs, recoverySig, asset.bigchainID, asset.bigchainHash, visibility, description, (result, theId, theHash) => {
                                  asset.bigchainID = theId;
                                  asset.bigchainHash = theHash;
                                  writeAllAssets(asset, () => {
                                    t++;
                                    raSync = false;
                                    console.log(`delegated t: ${t}`);
                                    if (x >= max - 1 && t == totalAssets) { editDimensions(recoveryObject, (result) => { callback(result); }); console.log('DIMcallback'); }
                                    // if (x == max && t != total) { callback(false) }
                                  });
                                }, asset.bigchainID, asset.bigchainHash);
                              }
                            });// end get asset
                          }
                        });// end get asset
                      }// end delegated
                      // while (raSync) { require('deasync').sleep(2000); }//may be needed later to prevent too many contract creation calls at once
                    }// for loop
                  });// end gatekeeper
                }
              });// end get delegated assets
            }
          });// end get controlled assets
        }
      });// end get owned assets
    });// end edit signatures
  }// end recoverall

  function recoverCoid(recoveryObject, callback) {
    console.log('recovering coid');
    // coid contract variables
    const newOwner = recoveryObject.pubKey;
    const newOwnerHash = keccak_256(newOwner).toUpperCase();
    const oldOwner = recoveryObject.oldPubKey;
    const oldOwnerHash = keccak_256(oldOwner).toUpperCase();

    // make my new Coid contract
    const coidAddress = contractData.CoreIdentity;
    console.log(`abi addr: ${coidAddress}`);
    const coidAbi = JSON.parse(fs.readFileSync(`./abi/${coidAddress}`));
    const coidContractFactory = contractMgr.newContractFactory(coidAbi);
    const oldCOIDAddress = recoveryObject.coidAddr;// check name
    const oldCOIDcontract = contractMgr.newContractFactory(coidAbi).at(oldCOIDAddress);
    let COIDcontract;
    // required bin file from monax
    const byteCode = fs.readFileSync('./bin/CoreIdentity.bin');
    console.log('makeing coid contract');
    coidContractFactory.new({ data: byteCode }, (error, contract) => {
      if (error) {
        console.log('\nerror creating coid recovery contractn\n');
        throw error;
      }
      COIDcontract = contract;
      console.log(`new coid contract addr: ${JSON.stringify(COIDcontract.address)}`);

      // get new values-----------------------------------------------------------------------------------------------------------------------------
      oldCOIDcontract.setRecoveryState((error, result) => {
        console.log(`setrecovState: ${result}`);
        oldCOIDcontract.recoverGetAll((error, result) => {
          const coidData = result;
          // set new values-----------------------------------------------------------------------------------------------------------------------------
          if (recoveryObject.propType != '2') {
            console.log(`recov data 0: ${coidData[0]}\n1: ${coidData[1]}\n2: ${coidData[2]}\n3: ${coidData[3]}\n4: ${coidData[4]}\n5: ${coidData[5]}\n6: ${coidData[6]}\n7: ${coidData[7]}\n8: ${coidData[8]}\n9: ${coidData[9]}`);
            COIDcontract.setUniqueID(coidData[0], coidData[1], coidData[2], coidData[3], (error, result) => {
              // debugging function (getIt)
              COIDcontract.getIt((error, result) => {
                console.log(`setUniqueID: ${result}`);

                const indexO = coidData[4].indexOf(oldOwnerHash);
                if (indexO != -1) { coidData[4][indexO] = newOwnerHash; console.log('coid owner changed'); }
                // console.log("b4 set: "+coidData[4] + "\n"+coidData[5]);
                COIDcontract.setOwnership(coidData[4], coidData[5].toString().split(','), (error, result) => {
                  // debugging function (getIt)
                  COIDcontract.getIt((error, result) => {
                    console.log(`setOwnership: ${result}`);

                    const indexC = coidData[6].indexOf(oldOwnerHash);
                    if (indexC != -1) { coidData[6][indexC] = newOwnerHash; console.log('coid controller changed'); }
                    COIDcontract.setControl(coidData[7].toString().split(','), coidData[6], (error, result) => {
                      // debugging function (getIt)
                      COIDcontract.getIt((error, result) => {
                        console.log(`setControl${result}`);

                        const indexR = coidData[8].indexOf(oldOwnerHash);
                        if (indexR != -1) { coidData[8][indexR] = newOwnerHash; console.log('coid recoverer changed'); }
                        COIDcontract.setRecovery(coidData[8], String(coidData[9]), (error, result) => {
                          // debugging function (getIt)
                          COIDcontract.getIt((error, result) => {
                            console.log(`setRecovery: ${result}`);

                            COIDcontract.StartCoid((error, result) => {
                              console.log(`startCoid1: ${result}`);
                              // oldCOIDcontract.kill(function (error, result) { });
                              callback(COIDcontract.address);
                              // COIDcontract.recoverGetAll(function (error, results) {
                              //    for (var x = 0; x < results.length; x++) { console.log("New res " + x + ": \n" + results[x]) }
                              // })
                            });// end StartCoid
                          });// end getIT
                        });// end setRecovery
                      });// end getIT
                    });// end setControl
                  });// end getIT
                });// end setOwnership
              });// end getIT
            });// end setUniqueID
          }// end if prop
          else {
            console.log(`recov data ICA 0: ${coidData[0]}\n1: ${coidData[1]}\n2: ${coidData[2]}\n3: ${coidData[3]}\n4: ${coidData[4]}\n5: ${coidData[5]}\n6: ${coidData[6]}\n7: ${coidData[7]}\n8: ${coidData[8]}\n9: ${coidData[9]}`);
            COIDcontract.setUniqueID(coidData[0], coidData[1], coidData[2], coidData[3], (error, result) => {
              // debugging function (getIt)
              COIDcontract.getIt((error, result) => {
                console.log(`setUniqueID: ${result}`);

                const indexO = coidData[4].indexOf(oldOwnerHash);
                if (indexO != -1) { coidData[4][indexO] = newOwnerHash; }
                COIDcontract.setOwnership(coidData[4], coidData[5].toString().split(','), (error, result) => {
                  // debugging function (getIt)
                  COIDcontract.getIt((error, result) => {
                    console.log(`setOwnership: ${result}`);
                    // needed to tansition to next contract state w/out creating token contracts
                    COIDcontract.StartCoidIca((error, result) => {
                      console.log(`startCoid1: ${result}`);
                      // oldCOIDcontract.kill(function (error, result) { });
                      callback(COIDcontract.address);
                    });// startcoid
                  });// get it
                });// set owner
              });// getit
            });// uid
          }// end else
        });
      });
    });// end contract creation
  }

  function recoverMyGatekeeper(recoveryObject, callback) {
    console.log('recover gatekeeper');
    // contract variables
    const newOwner = recoveryObject.pubKey;
    const newOwnerHash = keccak_256(newOwner).toUpperCase();
    const oldOwner = recoveryObject.oldPubKey;
    const oldOwnerHash = keccak_256(oldOwner).toUpperCase();

    // make my new GK contract
    const gkAddress = contractData.MyGateKeeper;
    console.log(`abi addr: ${gkAddress}`);
    const gkAbi = JSON.parse(fs.readFileSync(`./abi/${gkAddress}`));
    const gkContractFactory = contractMgr.newContractFactory(gkAbi);
    const oldGkAddress = recoveryObject.gkAddr;// need to check
    const myOldGkContract = contractMgr.newContractFactory(gkAbi).at(oldGkAddress);
    let myGkContract;
    let i = 0;
    const byteCode = fs.readFileSync('./bin/MyGateKeeper.bin');
    gkContractFactory.new({ data: byteCode }, (error, contract) => {
      if (error) {
        console.log('\nerror creating gatekeeper recovery contract\n');
        throw error;
      }
      myGkContract = contract;
      console.log(`new myGatekeeper contract addr: ${JSON.stringify(myGkContract)}`);

      // transfer audit tral of old contract to new one
      // counter: the number of audit trail entries of the gatekeeper contract
      myOldGkContract.counter((error, result) => {
        const counter = result;
        console.log(`counter: ${counter}`);
        if (counter > 0) {
          for (let index = 0; index < counter; index++) {
            // since the audit trail is stored by proposal ID we need to get all of them
            myOldGkContract.getProposalIdByIndex(index, (error, result) => {
              const propId = result;
              console.log(`propID: ${propId}`);
              myOldGkContract.getmyIdentityAuditTrail(propId, (error, result) => {
                const auditTrail = result;
                console.log(`audit trail: ${auditTrail}`);
                // have to use unhased public key for audit trail atm.....needs to be hashed
                if (auditTrail[0] == oldOwner) { auditTrail[0] = newOwner; }
                console.log('DOUBLE?');
                myGkContract.setmyIdentityAuditTrail(propId, auditTrail[0], auditTrail[1], auditTrail[2], auditTrail[3], (error, result) => {
                  i++;
                  if (i == counter) {
                    console.log('\n--------------GK CALLBACK----------------\n');
                    myOldGkContract.kill((error, result) => { });
                    callback(myGkContract.address);
                  }
                });
              });
            });
          }
        } else { console.log('empty gatekeeper'); myOldGkContract.kill((error, result) => { callback(myGkContract.address); }); }// add a kill here
      });// counter
    });// end contract creation
  }// end recover gk

  function recoverDimensionControl(recoveryObject, callback) {
    console.log('recover dimensions');
    // contract variables
    const newOwner = recoveryObject.pubKey;
    const newOwnerHash = keccak_256(newOwner).toUpperCase();
    const oldOwner = recoveryObject.oldPubKey;
    const oldOwnerHash = keccak_256(oldOwner).toUpperCase();

    // make my new Dimension contract
    const dimCtrlAddress = contractData.IdentityDimensionControl;
    const dimCtrlAbi = JSON.parse(fs.readFileSync(`./abi/${dimCtrlAddress}`));
    console.log(`abi addr: ${dimCtrlAddress}`);
    console.log(`dimctrl abi: ${JSON.stringify(dimCtrlAbi)}`);
    const dimCtrlContractFactory = contractMgr.newContractFactory(dimCtrlAbi);
    const oldDimCtrlAddress = recoveryObject.dimCtrlAddr;
    const oldDimCtrlContract = contractMgr.newContractFactory(dimCtrlAbi).at(oldDimCtrlAddress);
    console.log(`oldDimCtrlAddr: ${oldDimCtrlContract.address}`);
    let dimCtrlContract;
    const byteCode = fs.readFileSync('./bin/IdentityDimensionControl.bin');

    dimCtrlContractFactory.new({ data: byteCode }, (error, contract) => {
      if (error) {
        console.log('\nerror creating IDC recovery contract\n');
        throw error;
      } else {
        dimCtrlContract = contract;
        console.log(`new identityDimensionControl contract addr: ${JSON.stringify(dimCtrlContract.address)}`);

        // move old token contracts to new identity dimension control contract
        oldDimCtrlContract.getTokenAddr((error, result) => {
          console.log(`token addr: ${result}  error: ${error}`);
          console.log(`coidAddr: ${recoveryObject.coidAddr}`);
          // Instantiate
          dimCtrlContract.IdentityDimensionControlInstantiation(recoveryObject.coidAddr, result, (err, result) => {
            if (err) { console.log(`dimensioninstantiation error: ${err}    res: ${result}`); } else {
              console.log(`DimensionInstantiation: ${JSON.stringify(result)}`);
              oldDimCtrlContract.replaceTokenOwnerController(oldOwnerHash, newOwnerHash, (error, result) => {
                console.log(`replacetokenowner  error: ${error}    res: ${result}`);
                oldDimCtrlContract.getDimensionLength((error, result) => {
                  console.log(`dimlength: ${result}    err: ${error}`);
                  const dimlength = result;
                  let j = 0;
                  if (dimlength > 0) {
                    console.log('Edit dimensions loop');
                    for (var x = 0; x < dimlength; x++) {
                      oldDimCtrlContract.getGlobalsByIndex(x, (error, result) => {
                        theNotifier.GetDimension(keccak_256(oldOwner), `${result[2]}.json`, 0, (res) => {
                          const dimensionFile = res;
                          if (dimensionFile.dimension.controllers == undefined) { dimensionFile.dimension.controllers = []; }
                          dimensionFile.dimension.coidAddr = recoveryObject.coidAddr;
                          dimensionFile.dimension.dimensionCtrlAddr = dimCtrlContract.address;
                          if (dimensionFile.dimension.pubKey == oldOwner) { dimensionFile.dimension.pubKey = newOwner; }
                          // if (oldHashedPubKey == dimensionFile.ownershipId) { dimensionFile.ownershipId = newOwner }
                          // if (oldHashedPubKey == dimensionFile.controlId) { dimensionFile.controlId = newOwner }
                          const indexO = dimensionFile.dimension.owners.indexOf(keccak_256(oldOwner));
                          const indexC = dimensionFile.dimension.controllers.indexOf(keccak_256(oldOwner));
                          if (indexO != -1) { dimensionFile.dimension.owners[indexO] = keccak_256(newOwner); }
                          if (indexC != -1) { dimensionFile.dimension.controllers[indexC] = keccak_256(newOwner); }
                          for (let y = 0; y < dimensionFile.dimension.delegations.length; y++) {
                            if (dimensionFile.dimension.delegations[y].delegatee == keccak_256(oldOwner)) { dimensionFile.dimension.delegations[y].delegatee = keccak_256(newOwner); }
                            if (dimensionFile.dimension.delegations[y].owner == keccak_256(oldOwner)) { dimensionFile.dimension.delegations[y].owner = keccak_256(newOwner); }
                          }
                          writeAllDimensions(dimensionFile, () => {
                            console.log(`writeall#: ${j}`);
                          });
                        });
                        dimCtrlContract.setGlobalsByIndex(x, result[0], result[1], result[2], (error, result) => {
                          console.log(`setGlobalsByIndex: ${x}`);
                          j++;
                          if (j >= dimlength - 1) {
                            // oldDimCtrlContract.kill(function (error, result) { });
                            callback(dimCtrlContract.address);
                          }
                          // find people who have delegated to owner and change delegation
                          // using digital twin in place of airbitz
                        });
                      });
                    }
                  } else { // oldDimCtrlContract.kill(function (error, result) { });
                    callback(dimCtrlContract.address);
                  }
                });
              });
            }
          });// end instatiation
        });
      }// end else
    });// end contract creation
  }// end recover dimension

  // add the new signature to all the old signed assets and label the old signature as 'recovered'
  function editSignatures(formdata, callback) {
    const pubKey = formdata.pubKey;
    const oldPubKey = formdata.oldPubKey;
    const hashedPubKey = keccak_256(pubKey);
    const oldHashedPubKey = keccak_256(oldPubKey);
    const signature = formdata.signature;
    let k = 0;
    let l = 0;
    const time = new Date();
    const msg = formdata.msg;
    const blockchainID = keccak_256(chain);
    // these 2 vars seem to not work atm
    const blockNumber = 0;
    const blockHash = 0;
    // var recoverySig = "recoverysig";
    let sync = true;// was causing invalid jump from bigchain without it

    // get the signature of the recovery app a.k.a the eris account
    createSignature('0r1e2c3o4v5e6r7y8', (recoverySig, recoveryPubKey, recoveryHash) => {
      theNotifier.getSignatures(oldPubKey, (sigFile) => {
        if (sigFile != undefined) {
          console.log(`Signature file:\n${JSON.stringify(sigFile)}`);
          // loop through all assets that contain the old signature
          // ADD asset name and owner pubkey to signature files
          console.log(`sigF length: ${sigFile.length}`);
          for (let j = 0; j < sigFile.length; j++) {
            sync = true;
            // get file from original owners digital twin(not the person being recovered)
            theNotifier.GetAsset(sigFile[j].owner, `${sigFile[j].assetId}.json`, 0, (asset) => {
              console.log(`signed asset:\n${JSON.stringify(asset)}`); l++;
              // asset.validatorSigs[1].splice(4,1);asset.validatorSigs.splice(0,1);//testing only
              for (let y = 0; y < asset.validatorSigs.length; y++) {
                if ((asset.validatorSigs[y][2] == oldPubKey || `0x${asset.validatorSigs[y][2]}` == oldPubKey) && asset.validatorSigs[y][4] != 'recovered') {
                  // copy signature object from array, label new object as recovered/invalid,edit old signature with new signature
                  const newSigObj = JSON.parse(JSON.stringify(asset.validatorSigs[y]));
                  console.log(`newsig \n${JSON.stringify(newSigObj)}`);
                  newSigObj[4] = 'recovered';

                  asset.validatorSigs.push(newSigObj);
                  asset.validatorSigs[y][2] = pubKey;
                  asset.validatorSigs[y][1] = signature;
                  asset.validatorSigs[y][0] = msg;
                  var expiration = asset.validatorSigs[y][3];
                  console.log(`\n\nL: ${l}`);
                  console.log(`Vsigs: ${JSON.stringify(asset.validatorSigs)}`);
                  // write changes to bigchain, digital twin asset folder, and digital twin attestations folder
                  // bigchainPost(sigFile[l - 1].proposal_id, asset, blockNumber, blockHash, blockchainID, time.getTime(), asset.validatorSigs, recoverySig, function (result, theId, theHash) {
                  const visibility = 'private';
                  const description = 'ICA_RECOVERY';
                  theNotifier.bcPreRequest(asset.pubKey, sigFile[l - 1].proposalId, asset, blockNumber, blockHashVal, blockchainID, time.getTime(), asset.validatorSigs, recoverySig, asset.bigchainID, asset.bigchainHash, (result, theId, theHash) => {
                    asset.bigchainID = theId;
                    asset.bigchainHash = theHash;
                    theNotifier.attestIcaFile(pubKey, sigFile[k].proposal_id, 'recovery', time.getTime(), asset.gatekeeperAddr, expiration, theId, asset.assetID);
                    writeAllAssets(asset, () => {
                      sync = false;
                      console.log('Write All Signatures');
                      k++;
                      if (k >= sigFile.length) { callback(recoverySig, recoveryPubKey, recoveryHash); }
                    });
                  }, asset.bigchainID, asset.bigchainHash);
                }// if
                // else{if( y >= asset.validatorSigs.length-1){callback(recoverySig, recoveryPubKey, recoveryHash);}}//only testing
              }// for
            });// notifier
            while (sync) { require('deasync').sleep(10000); }// may not be needed if all signed assets have to be different asset files
          }// for
        } else { callback(recoverySig, recoveryPubKey, recoveryHash); }
      });// getsig
    });// end create signature
  }// end edit sigs


  // edit controlled and delegated dimension
  // owned dimensions require a coid made sense to recover those when we generate a new coid
  // all the contracts we edit here do not belong to the identity being recovered
  function editDimensions(formdata, callback) {
    const pubKey = formdata.pubKey;
    const oldPubKey = formdata.oldPubKey;
    const hashedPubKey = keccak_256(pubKey);
    const oldHashedPubKey = keccak_256(oldPubKey);
    let ownedAssets;
    let controlledAssets;
    let delegatedAssets;
    // var dimCtrlAddress = formdata.dimCtrlAddr;


    console.log('Edit dimensions JSON');

    theNotifier.GetAllControlledDimensions(oldPubKey, (result) => {
      if (result) {
        controlledAssets = result.data;
        theNotifier.GetAllDelegatedDimensions(oldPubKey, (result) => {
          if (result) {
            delegatedAssets = result.data;
            // looping vars
            const max = Math.max(delegatedAssets.length, controlledAssets.length);
            const total = controlledAssets.length + delegatedAssets.length;
            let t = 0;
            if (total > 0) {
              // get the owner for each asset, get the asset, edit the asset, under owner name call writeAllAssets()
              for (var x = 0; x < max; x++) {
                if (x < controlledAssets.length && controlledAssets[x] != 'undefined') {
                  // var controllerkey = controlledAssets[x].pubKey;
                  var fileNameC = controlledAssets[x];
                  var flag = 1;
                  theNotifier.GetDimension(oldHashedPubKey, fileNameC, flag, (results) => {
                    if (results) {
                      flag = 0;
                      theNotifier.GetDimension(results.dimension.owners[0], fileNameC, flag, (results2) => {
                        if (results2) {
                          const asset = results2;
                          console.log(`Controlled Dimension: ${JSON.stringify(asset)}`);
                          if (asset.dimension.owners.indexOf(oldHashedPubKey) >= 0 && asset.dimension.controllers.indexOf(oldHashedPubKey) >= 0) {
                            t++;
                            if (x >= max - 1 && t == total) { callback(true); }
                          } else {
                            const ownerDimCtrlContract = contractMgr.newContractFactory(dimCtrlAbi).at(asset.dimension.dimensionCtrlAddr);
                            ownerDimCtrlContract.replaceTokenOwnerController(oldHashedPubKey, hashedPubKey, (error, result) => {
                              if (result) { console.log(`replacedTokenOwnerController: ${result}`); } else { console.log(`errorTokenOwnerController: ${error}`); }
                            });
                            ownerDimCtrlContract.replaceTokenDelegatee(oldHashedPubKey, hashedPubKey, (error, result) => { });
                            if (asset.dimension.pubKey == oldPubKey) { asset.dimension.pubKey = pubKey; }
                            const indexO = asset.dimension.owners.indexOf(oldHashedPubKey);
                            const indexC = asset.dimension.controllers.indexOf(oldHashedPubKey);
                            const indexDC = asset.dimension.dim_controllers_keys.indexOf(oldHashedPubKey);
                            if (indexO != -1) { asset.dimension.owners[indexO] = hashedPubKey; }
                            if (indexC != -1) { asset.dimension.controllers[indexC] = hashedPubKey; }
                            if (indexDC != -1) { asset.dimension.controllers[indexDC] = hashedPubKey; }
                            for (let y = 0; y < asset.dimension.delegations.length; y++) {
                              if (asset.dimension.delegations[y].delegatee == oldHashedPubKey) { asset.dimension.delegations[y].delegatee = hashedPubKey; }
                              if (asset.dimension.delegations[y].owner == oldHashedPubKey) { asset.dimension.delegations[y].owner = hashedPubKey; }
                            }
                            writeAllDimensions(asset, () => {
                              t++;
                              if (x >= max - 1 && t == total) { callback(true); }
                            });
                          }// else
                        }
                      });
                    }
                  });
                }// end controlled
                if (x < delegatedAssets.length && delegatedAssets[x] != 'undefined') {
                  var fileName = delegatedAssets[x];
                  var flag = 2;
                  console.log(`filename: ${fileName}`);
                  theNotifier.GetDimension(oldHashedPubKey, fileName, flag, (results) => {
                    if (results) {
                      console.log(result);
                      flag = 0;
                      theNotifier.GetDimension(results.dimension.owners[0], fileName, flag, (results2) => {
                        if (results2) {
                          const asset = results2;
                          // var dimCtrlAddress = asset.dimCtrlAddr;//may need to change
                          const ownerDimCtrlContract = contractMgr.newContractFactory(dimCtrlAbi).at(asset.dimension.dimensionCtrlAddr);
                          ownerDimCtrlContract.replaceTokenDelegatee(oldHashedPubKey, hashedPubKey, (error, result) => {
                            if (result) { console.log(`replacedTokenDelegatee: ${result}`); } else { console.log(`errorTokenDelegatee: ${error}`); }
                          });
                          if (asset.dimension.pubKey == oldPubKey) { asset.pubKey = pubKey; }
                          for (let y = 0; y < asset.dimension.delegations.length; y++) {
                            if (asset.dimension.delegations[y].delegatee == oldHashedPubKey) { asset.dimension.delegations[y].delegatee = hashedPubKey; }
                          }
                          console.log(`asset: \n${asset}`);
                          // write dimension to all owners controllers and delegatees
                          writeAllDimensions(asset, () => {
                            t++;
                            if (x >= max - 1 && t == total) { callback(true); }
                          });
                        }
                      });
                    }
                  });
                }// end delegated
              }// for loop
            } else { callback(true); }
          }
        });
      }
    });
  }// end edit dimensions
};// end eventListener
const listening = new eventListener();

app.post('/startRecoveryBallot', (req, res) => {
  console.log(`reached startrecovery endpoint:\n${JSON.stringify(req.body)}`);
  const formdata = req.body;
  let recoveryAddr;
  let gkAddr;
  let coidAddr;
  let isHuman = true;
  let recov;
  const initatorKey = formdata.recoverer;
  const initatorSig = formdata.recovererSignature;
  const msg = formdata.msg;
  const sig = formdata.signature;
  const propId = formdata.proposalID;
  const verifyObj = { msg, sig: initatorSig, pubKey: initatorKey };
  const newPubKey = formdata.newPubKey;

  theNotifier.getRecovery(initatorKey, propId, (result) => {
    if (result) {
      console.log(`getRecov:\n${JSON.stringify(result)}`);
      const recoveryObj = result;
      recoveryAddr = result.recoveryAddr;
      gkAddr = result.gatekeeperAddr;
      coidAddr = result.coidAddr;
      isHuman = result.isHuman;
      recov = new Recovery(recoveryAddr);
      recov.verifyIt(verifyObj, (verified) => {
        console.log(`verify: ${verified}`);
        if (verified == true || verified == 'true') {
          recov.confirmRecoverer(keccak_256(initatorKey), coidAddr, (result) => {
            if (result) {
              recoveryObj.newPubKey = newPubKey;
              console.log(`recovObj:\n${JSON.stringify(recoveryObj)}`);
              recoveryObj.msg = msg;
              recoveryObj.signature = sig;
              recoveryObj.recoverer = initatorKey;
              recoveryObj.recovererSignature = initatorSig;
              recov.startBallot(recov.ballotAddress, gkAddr, coidAddr, isHuman, (result) => {
                if (result) {
                  formdataArray.push(recoveryObj);
                  IDArray.push(result);
                  res.send('Ballot sent');
                } else { res.send(`Ballot error: ${error}`); }
              });
            } else { res.send('Recoverer not confirmed'); }
          });
        } else { res.send('Recoverer not verified'); }
      });// end verifyit
    } else { res.send('No recovery file found'); }
  });
});

app.listen(3008, () => {
  console.log('Connected to contract http://10.101.114.231:1337/rpc');
  console.log('Listening on port 3008');
});

