// required libraries for post requests parsing
const app = require('express')();
const bodyParser = require('body-parser');
const fs = require('fs');
const { keccak_256 } = require('js-sha3');
const secp256k1 = require('secp256k1');
const { promisify } = require('bluebird');

// for secp256k1 verification
// configuration of the chain including Monax accts used in this app
// required library for accessing the contract
const erisC = require('@monax/legacy-contracts');
// This is used to correlate the post requests to the function calls in MyCOID
const MyCoidConfig = require('../configuration_service/configuration_files/MyCOIDConfig.json');
// this function is intended to send a notification
const theNotifier = require('../Component/notifications')('http://10.4.0.167:8000');
const logCatcher = require('../Component/logCatcher');
const globalConfig = require('../configuration_service/configuration_files/global.json');

const moduleName = require('./package.json').name;

const chainConfig = require('../configuration_service/configuration_files/accounts.json')[globalConfig.properties.primary_account];


// for verification
const verifyIt = (formdata) => {
  if (!formdata.msg || !formdata.sig || !formdata.pubKey) return false;
  return secp256k1.verify(Buffer.from(formdata.msg, 'hex'), Buffer.from(formdata.sig, 'hex'), Buffer.from(formdata.pubKey.slice(2), 'hex'));
}; // end verification

/* MyCOID object which will call appropriate CoreIdentity.sol methods when hit with post requests
NOTE: The ABI can be obtained from the contractAddress because the location of the abi is known
The location will always be where respective gatekeeper deployed it. */
const MyCOID = (contractAddress) => {
  // debugging:
  logCatcher('You made a MyCOID object');

  // get the contract:
  const chain = globalConfig.properties.primary_account;
  const erisdburl = globalConfig.properties.chainURL;
  // updated by offshore    contractData = require('./epm.json')
  const contractData = require(globalConfig.jobs[moduleName].base_path);

  const contractAddr = contractAddress;
  logCatcher(`contract addr: ${contractAddr}`);
  const contractAbiAddress = contractData.CoreIdentity;
  const erisAbi = JSON.parse(fs.readFileSync(`../Solidity/abi/${contractAbiAddress}`));
  // const accountData = require(globalConfig.properties.accounts_file_path);
  const contractMgr = erisC.newContractManagerDev(erisdburl, chainConfig);
  const contract = contractMgr.newContractFactory(erisAbi).at(contractAddress);
  // const ErisAddress = chainConfig[chain].address;


  // ONE TIME INSTANTIATION
  // THIS FUNCTION IS INTENDED TO BE CALLED AT THE VERY BEGINNING
  // WHEN THEY MAKE THEIR TWIN
  // IT POPULATES THE ASSET SCREENS OF OTHER OWNERS, CONTROLLERS, DELEGATES
  const updateTwin = function (creatorPubkey, callback) {
    // 1. see if there are any other owners, if so,
  };


  /*    verify = function SECPVerify(msg, signature, pubKey) {
        msg = new Buffer(msg, "hex");
        signature = new Buffer(signature, "hex");
        pubKey = new Buffer(pubKey, "hex");

        var verified = secp256k1.verify(msg, signature, pubKey)
        logCatcher("\n\n\n\n\n\n\n\n\n\n\n" + verified + "\n\n\n\n\n\n\n\n\n\n");
        return verified;
    }
  */

  const clearExpirations = (formdatap, callback) => {
    let currentDate = new Date();
    currentDate = parseInt(currentDate.getTime(), 10) / 1000;
    const spliceArr = [];
    let formdata = Object.assign(formdatap);
    logCatcher(`CLEAR EXPIR: ${JSON.stringify(formdata)}`);
    // first check to avoid an out-of-bounds error
    if (formdata.delegations.length > 0) {
      for (let i = 0; i < formdata.delegations.length; i++) {
        const check = (currentDate > Number(formdata.delegations[i].expiration));
        logCatcher(check);
        if (check) {
          logCatcher(formdata.delegations[i].delegatee);
          spliceArr.push(i);
          logCatcher(`${currentDate}  token cleared ${i}`);
          const ctrlIndex = formdata.controlIdList.indexOf(formdata.delegations[i].owner);
          if (ctrlIndex >= 0) {
            formdata.controlTokenQuantity[ctrlIndex] += Number(formdata.delegations[i].amount);
          }
        }
      }
      if (spliceArr.length > 0) {
        for (let i = spliceArr.length - 1; i >= 0; i--) { formdata.delegations.splice(spliceArr[i], 1); logCatcher(`spliced ${spliceArr[i]}`); }
      }
      callback();
    } else { callback(); }
  };

  const writeAll = (formdatap, callback) => {
    let formdata = Object.assign(formdatap);

    if (typeof (formdata.delegations) === 'object' && formdata.delegations[0] === '') {
      formdata.delegations.splice(0, 1);
      // formdata.delegateeTokenQuantity.splice(0, 1);
      logCatcher(`empty delegatee removed from results: ${formdata}`);
    }

    if (typeof (formdata.delegations) !== 'object') {
      formdata.delegations = [];
      formdata.delegateeTokenQuantity = [];
    }

    const max = Math.max(formdata.ownerIdList.length, formdata.controlIdList.length, formdata.delegations.length);

    const filename = `${formdata.assetID}.json`;
    const owners = formdata.ownerIdList;
    const controllers = formdata.controlIdList[0] == '' ? formdata.controlIdList.splice(0 , 1) : formdata.controlIdList;
    // var delegatees = formdata.delegateeIdList;
    // max = Math.max(formdata.dimension.delegations.length, max);
    logCatcher('\n*****THE MIGHTY WRITEALL*****\n');
    logCatcher(JSON.stringify(formdata));
    logCatcher(`MAX :${max}`);
    let delegateeLog;

    const total = owners.length + controllers.length + formdata.delegations.length;
    logCatcher(`TOTAL: ${total}`);
    logCatcher(`${owners} len ${owners.length}`);
    const setAsset = promisify(theNotifier.setAsset);
    const promiseArray = [];
    for (let i = 0; i < max; i++) {
      logCatcher(`loop ${owners[i]}`);
      if (typeof (owners[i]) !== 'undefined' && !!owners[i] && owners !== '') {
        promiseArray.push(setAsset(String(owners[i]), String(filename), 0, 0, formdata, '', ''));
      }
      if (typeof (controllers[i]) !== 'undefined' && !!controllers[i] && controllers !== '') {
        promiseArray.push(setAsset(String(controllers[i]), String(filename), 1, 0, formdata, '', ''));
      }
      if (typeof (formdata.delegations[i]) !== 'undefined' && !!formdata.delegations[i] && formdata.delegations[i] !== '' && formdata.delegations[i].owner !== '') {
        const { delegatee } = formdata.delegations[i];
        delegateeLog = JSON.parse(JSON.stringify(formdata));
        delegateeLog.pubKey = '';
        delegateeLog.coidAddr = '';
        delegateeLog.uniqueId = '';
        delegateeLog.controlIdList = '';
        delegateeLog.ownerIdList = '';

        for (let n = 0; n < delegateeLog.delegations.length; n++) {
          if (delegateeLog.delegations[n].delegatee !== delegatee) {
            delegateeLog.delegations.splice(n, 1);
          }
        }
        promiseArray.push(setAsset(String(formdata.delegations[i].delegatee), String(filename), 2, 0, delegateeLog, '', ''));
      }
    } // end for loop
    Promise.all(promiseArray).then((values) => {
      console.log(`setAsset was called ${values.length} times`);
      callback();
    }).catch(err => logCatcher(err));
  };// end writeAll


  // -> -> -> START CONTROL FUNCTIONS -> -> ->

  /*
        -getControllerTokens
        -getControllerList
        -revokeControlDelegation
        -spendMyTokens (as a delegatee)
        -myAmount (get delegatee tokens)
        -delegate
        -changeTokenController (must call addController first)
        -amountDelegated
        -addController
        -removeController
        -offsetControllerTokenQuantity
    */

  // GET CONTROLLER VALUES (from list)
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":""}
  */
  const getControllerTokens = (formdata, callback) => {
    
    const { pubKey, msg, sig } = formdata;

    contract.getList((error, result) => {
      logCatcher('got controller tokens (inside function)');
      callback(error, result);
    });
  };


  // GET CONTROLLER LIST
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":""}
  */
  const getControllerList = (formdata, callback) => {
    
    const { pubKey, msg, sig } = formdata;

    contract.getControllers((error, result) => {
      logCatcher('get controller list...');
      callback(error, result);
    });
  };


  // REVOKE DELEGATION TO A DELEGATEE AS A CONTROLLER
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "delegatee":"", "filename":"", "flag":"", "all":"", "amount":""}
  */
  const revokeControlDelegation = (formdata, callback) => {
    let amount = Number(formdata.amount);
    
    const {
      msg, sig, pubKey, filename, flag, delegatee,
    } = formdata;
    const all = Boolean(formdata.all.toLowerCase() === 'true');// boolean - true or false;
    const spliceArr = [];
    let isCtrl = false;
    // TODO:
    const controllerHash = keccak_256(pubKey).toUpperCase();
    const owner = pubKey;
    const delegateeHash = keccak_256(delegatee).toUpperCase();

    theNotifier.getAsset(pubKey, filename, Number(flag), (results) => {
      const log = results;
      results.txn_id = "revokeControlDelegation";
      contract.revokeDelegation(controllerHash, delegateeHash, amount, all, (error, result) => {
        if (result) {
          const ctrlIndex = log.controlIdList.indexOf(pubKey);
          if (ctrlIndex >= 0) {
            isCtrl = true;
          }
          if (all) { // if the flag is true, just revoke everything from the owner
            if (log.delegations.length > 0) {
              for (let j = 0; j < log.delegations.length; j++) {
                if (log.delegations[j].owner === owner && log.delegations[j].delegatee === delegatee) {
                  spliceArr.push(j);
                  if (isCtrl) {
                    log.controlTokenQuantity[ctrlIndex] = Number(log.controlTokenQuantity[ctrlIndex]) + Number(log.delegations[j].amount);
                  }
                  if (j === (log.delegations.length - 1)) {
                    if (spliceArr.length > 0) {
                      for (let i = spliceArr.length - 1; i >= 0; i--) { log.delegations.splice(spliceArr[i], 1); logCatcher(`spliced ${spliceArr[i]}`); }
                    }
                  }
                }
              }
            }
          } else {
            // logic below is similar to the function spendTokens

            // first make sure they have the amount FROM that owner:
            let actualAmount = 0;

            if (log.delegations.length > 0) {
              for (let z = 0; z < log.delegations.length; z++) {
                if (log.delegations[z].delegatee === delegatee && log.delegations[z].owner === owner) {
                  actualAmount += log.delegations[z].amount;
                }
              }
            }

            // if they have less than the owner wants to remove, just remove how much they have
            if (actualAmount < amount) {
              amount = actualAmount;
            }

            if (amount > 0) {
              let keepGoing = true;

              let index = 0;
              while (keepGoing) {
                // first find index in delegations with closest expiration.
                // uint index = 0;
                // This correctly sets var index as the 1st available owner
                for (let n = 0; n < log.delegations.length; n++) {
                  if (log.delegations[n].owner === owner) {
                    index = n;
                    break;
                  }
                }

                // size of delegations must be greater than zero because actualAmount != 0
                // could probably initialize k=index to save cycles later
                for (let k = 0; k < log.delegations.length; k++) {
                  if (log.delegations[k].owner === owner) {
                    if (log.delegations[k].expiration <= log.delegations[index].expiration) {
                      index = k;
                    }
                  }
                }

                // now spend the amount
                if (amount >= log.delegations[index].amount) {
                  amount -= log.delegations[index].amount;
                  if (isCtrl) {
                    log.controlTokenQuantity[ctrlIndex] += Number(log.delegations[index].amount);
                  }
                  log.delegations.splice(index, 1);// this function clears and returns coins back to owner
                } else {
                  // no need to give tokens back to owner--they are infinite and created on the fly

                  // just subtract remaining amount from the current delegation amount
                  log.delegations[index].amount -= amount;
                  if (isCtrl) {
                    log.controlTokenQuantity[ctrlIndex] = Number(log.controlTokenQuantity[ctrlIndex]) + amount;
                  }
                  // now set amount = 0 since we are done
                  amount = 0;
                }

                if (amount === 0) {
                  keepGoing = false;
                }
              }// end while(keepgoing)
            }// end if amount>0
          }// end else

          logCatcher(`\n\nREVOKE LOG: ${JSON.stringify(log)}\n\n`);
          theNotifier.bcPreRequest(log.pubKey, log.proposalId, log, '0', '0x0', '0x0', Date.now(), log.validatorSigs, '', log.bigchainID, log.bigchainHash, log.visibility, log.description, (res, theId, theHash) => {
            log.bigchainID = theId;
            log.bigchainHash = theHash;
            writeAll(log, () => { callback(error, result); });
          });
        } else { callback(error, result); }
      });
    });
  };

  // SPEND MY TOKENS AS A DELEGATEE
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "delegatee":"", "filename":"", "flag":"", "amount":""}
  */
  const spendMyTokens = (formdata, callback) => {
    
    const {
      msg, sig, delegatee, pubKey, filename, flag,
    } = formdata;
    let amount = Number(formdata.amount);
    let index = 0;
    let keepGoing = true;
    let ctrlIndex = -1;

    // TODO:
    const delegateeHash = keccak_256(delegatee).toUpperCase();
    theNotifier.getAsset(pubKey, filename, Number(flag), (results) => {
      const log = results;
      results.txn_id = "spendMyTokens";
      contract.spendMyTokens(delegateeHash, amount, (error, result) => {
        if (result) {
          clearExpirations(log, () => {
            while (keepGoing) {
              // first find index in delegations with closest expiration.
              // uint index = 0;

              for (let n = 0; n < log.delegations.length; n++) {
                if (log.delegations[n].delegatee === delegatee) {
                  index = n;
                  break;
                }
              }

              // size of delegations must be greater than zero because actualAmount != 0
              for (let k = 0; k < log.delegations.length; k++) {
                if (log.delegations[k].expiration <= log.delegations[index].expiration && log.delegations[k].delegatee === delegatee && log.delegations[k].amount > 0) {
                  index = k;
                }
              }

              // now spend the amount
              if (amount >= log.delegations[index].amount) {
                amount -= log.delegations[index].amount;
                ctrlIndex = log.controlIdList.indexOf(log.delegations[index].owner);
                if (ctrlIndex >= 0) {
                  log.controlTokenQuantity[ctrlIndex] += Number(log.delegations[index].amount);
                }
                log.delegations.splice(index, 1);
              } else {
                // just subtract remaining amount from the current delegation amount
                log.delegations[index].amount -= amount;
                ctrlIndex = log.controlIdList.indexOf(log.delegations[index].owner);
                if (ctrlIndex >= 0) {
                  log.controlTokenQuantity[ctrlIndex] += amount;
                }
                // now set amount = 0 since we are done
                amount = 0;
              }

              if (amount === 0) {
                keepGoing = false;
                theNotifier.bcPreRequest(log.pubKey, log.proposalId, log, '0', '0x0', '0x0', Date.now(), log.validatorSigs, '', log.bigchainID, log.bigchainHash, log.visibility, log.description, (res, theId, theHash) => {
                  log.bigchainID = theId;
                  log.bigchainHash = theHash;
                  writeAll(log, () => { callback(error, result); });
                });
              }
            }
          });
        } else {
          logCatcher(`Error occurred while spending: ${error}`);
          if (result === 'false' || result === false) {
            clearExpirations(log, () => {
              theNotifier.bcPreRequest(log.pubKey, log.proposalId, log, '0', '0x0', '0x0', Date.now(), log.validatorSigs, '', log.bigchainID, log.bigchainHash, log.visibility, log.description, (res, theId, theHash) => {
                log.bigchainID = theId;
                log.bigchainHash = theHash;
                writeAll(log, () => { callback(error, result); });
              });
            });
          } else {
            callback(error, result);
          }
        }
      });
    });
  };


  // GET YOUR AMOUNT AS A DELEGATEE
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "delegatee":""}
  */
  const myAmount = (formdata, callback) => {
    
    const { delegatee, msg, sig } = formdata;
    const delegateeHash = keccak_256(delegatee).toUpperCase();

    contract.myAmount(delegateeHash, (error, result) => {
      callback(error, result);
    });
  };


  // DELEGATE TOKENS AS A CONTROLLER TO A DELEGATEE
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "delegatee":"", "filename":"", "flag":"", "timeFrame":"", "amount":""}
  */
  const delegate = (formdata, callback) => {
    logCatcher(JSON.stringify(formdata));
    const {
      delegatee, pubKey, filename, flag,
    } = formdata;
    const amount = Number(formdata.amount);
    const isOwner = true; // Should this be assumed?
    const timeFrame = Number(formdata.timeFrame) || 5000;//may want to change to last a day by default?
    let currentDate = new Date();
    currentDate = currentDate.getTime() / 1000;

    // TODO:
    const controllerHash = keccak_256(pubKey).toUpperCase();
    const delegateeHash = keccak_256(delegatee).toUpperCase();

    logCatcher(`pubkey: ${pubKey} filename: ${filename} flag: ${flag}\n`);
    theNotifier.getAsset(pubKey, filename, Number(flag), (results) => {
      const log = results;
      results.txn_id = "delegate";
      contract.delegate(controllerHash, delegateeHash, amount, timeFrame, (error, result) => {
        if (result) {
          if (!log.delegations) {
            log.delegations = [];
          }
          logCatcher('Contract call complete');
          const entry = {
            owner: pubKey,
            delegatee: delegatee,
            amount: formdata.amount,
            expiration: String(currentDate + timeFrame),
          };
          log.delegations.push(entry);
          const ctrlIndex = log.controlIdList.indexOf(pubKey);
          if (ctrlIndex >= 0) {
            log.controlTokenQuantity[ctrlIndex] -= amount;
          }
          // j++;
          // if (j == (formdata.length)) {
          theNotifier.bcPreRequest(log.pubKey, log.proposalId, log, '0', '0x0', '0x0', Date.now(), log.validatorSigs, '', log.bigchainID, log.bigchainHash, log.visibility, log.description, (res, theId, theHash) => {
            log.bigchainID = theId;
            log.bigchainHash = theHash;
            writeAll(log, () => { callback(error, result); });
          });
          // }
        } else {
          callback(error, result);
          logCatcher(`Error occurred while delegating: ${error}`);
        }
      });
    });
  };

  // CHANGE TOKEN CONTROLLER
  // ALLOWS A CONTROLLER TO GIVE TOKENS TO ANOTHER CONTROLLER
  // YOU MUST ADD A CONTROLLER BEFORE CALLING THIS FUNCTION(there must be 2)
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "originalController":"", "newController":"", "filename":"", "amount":"", "flag":""}
  */
  const changeTokenController = (formdata, callback) => {
    
    const {
      msg, sig, originalController, newController, filename, pubKey, flag,
    } = formdata;
    let amount = Number(formdata.amount);
    let oldIndex;
    let newIndex;

    // TODO:
    const originalControllerHash = keccak_256(originalController).toUpperCase();
    const newControllerHash = keccak_256(newController).toUpperCase();
    theNotifier.getAsset(pubKey, filename, Number(flag), (results) => {
      results.txn_id = "changeTokenController";
      const log = results;
      contract.changeTokenController(originalControllerHash, newControllerHash, amount, (error, result) => {
        if (error || result == false) { callback(error, result); } else {
          for (let j = 0; j < log.controlIdList.length; j++) {
            if (log.controlIdList[j] === originalController) { oldIndex = j; }
            if (log.controlIdList[j] === newController) { newIndex = j; }
          }
          //consider merrits of leaving controller on list
          if ( amount > Number(log.controlTokenQuantity[oldIndex]) ) {
            amount = Number(log.controlTokenQuantity[oldIndex]);
            log.controlIdList.splice(oldIndex, 1);// log.controlIdList[oldIndex] = 0;
            log.controlTokenQuantity.splice(oldIndex, 1);// log.controlTokenQuantity[oldIndex] = 0;
          } else {
            log.controlTokenQuantity[oldIndex] -= amount;
          }
          log.controlTokenQuantity[newIndex] += amount;
          theNotifier.bcPreRequest(log.pubKey, log.proposalId, log, '0', '0x0', '0x0', Date.now(), log.validatorSigs, '', log.bigchainID, log.bigchainHash, log.visibility, log.description, (res, theId, theHash) => {
            log.bigchainID = theId;
            log.bigchainHash = theHash;
            writeAll(log, () => { callback(error, result); });
          });
        }
      });
    });
  };


  // GIVES A CONTROLLER HOW MANY TOKENS THEY HAVE DELEGATED
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "controller":""}
  */
  const amountDelegated = (formdata, callback) => {
    
    const { msg, sig, controller } = formdata;
    const controllerHash = keccak_256(controller).toUpperCase();

    contract.amountDelegated(controllerHash, (error, result) => {
      callback(error, result);
    });
  };


  // ADD A CONTROLLER
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "filename":"", "controllers":"", "token_quantity":""}
  */
  const addController = (formdata, callback) => {
    logCatcher(`formdata: \n${JSON.stringify(formdata)}\n`);
    const {
      msg, sig, pubKey, filename,
    } = formdata;
    const controller = formdata.controllers.split(',');
    const amount = formdata.token_quantity.split(',');
    const flag = 0;
    let k = 0;

    logCatcher('----------Add Controller--------------');
    logCatcher(`PUBKEY :${pubKey}`);
    logCatcher(`CONTROLLERS :${controller}`);
    logCatcher(`AMOUNTS :${amount}`);


    logCatcher('\n-----VERIFIED-----\n');
    theNotifier.getAsset(pubKey, filename, Number(flag), (results) => {
      let i;
      let controllerHash;
      results.txn_id = "addController";
      const log = Object.assign({}, results);
      const loopFunction = (error, result) => {
        logCatcher('contract complete');
        if (result[0]) {
          log.controlIdList.push(controllerHash);
          log.controlTokenQuantity.push(Number(amount[k]));
          logCatcher(`data added: ${controllerHash} ${amount[k]}`);
          k++;
          logCatcher(`result: ${result}`);
          if (k === (controller.length)) {
            logCatcher('addController write');
            theNotifier.bcPreRequest(log.pubKey, log.proposalId, log, '0', '0x0', '0x0', Date.now(), log.validatorSigs, '', log.bigchainID, log.bigchainHash, log.visibility, log.description, (res, theId, theHash) => {
              log.bigchainID = theId;
              log.bigchainHash = theHash;
              writeAll(log, () => { callback(error, result); });
            });
            // writeAll(results,function () {callback(error, result)});
          }
        } else {
          logCatcher(`error: ${error}`);
          callback(error, result);
          i = controller.length;
          // k = formdata.data.length;
          logCatcher(`Error occurred while adding entry ${error}`);
        }
      };// end contract call
      for (i = 0; i < controller.length; i++) {
        logCatcher(`lenght: ${controller.length}`);
        controllerHash = (controller[i]);//no longer a hash
        logCatcher(`get complete : ${controllerHash}`);

        contract.addController(keccak_256(pubKey), keccak_256(controller[i]), Number(amount[i]), loopFunction);
      }// end for loop
    });// end getAsset

  };// end addcontroller


  // REMOVE A CONTROLLER
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "controller":"", "flag":""}
  */
  const removeController = (formdata, callback) => {
    const {
      msg, sig, pubKey, controller, filename, flag,
    } = formdata;

    // TODO:
    const controllerHash = keccak_256(controller).toUpperCase();

    logCatcher('\n-----VERIFIED-----\n');
    theNotifier.getAsset(pubKey, filename, Number(flag), (results) => {
      results.txn_id = "removeController";
      const log = results;
      contract.removeController(keccak_256(pubKey), controllerHash, (error, result) => {
        if (result[0]) {
          logCatcher('contract complete');
          for (let j = 0; j < log.controlIdList.length; j++) {
            logCatcher(`j: ${j}`);
            logCatcher(`CH: ${controller}res: ${log.controlIdList[j]}`);
            if (log.controlIdList[j] === controller) {
              for (let x = log.delegations.length - 1; x >= 0; x--) {
                logCatcher(`x: ${x}`);
                if (log.delegations[x].owner === controller) {
                  log.delegations.splice(x, 1);
                  logCatcher(`spliced ${x}`);
                }
              }
              log.controlIdList.splice(j, 1);
              log.controlTokenQuantity.splice(j, 1);
              theNotifier.bcPreRequest(log.pubKey, log.proposalId, log, '0', '0x0', '0x0', Date.now(), log.validatorSigs, '', log.bigchainID, log.bigchainHash, log.visibility, log.description, (res, theId, theHash) => {
                log.bigchainID = theId;
                log.bigchainHash = theHash;
                writeAll(log, () => { callback(error, result); });
              });
              break;
            }
          }
        } else {
          logCatcher(`Error while removeing controller${error}`);
          callback(error, result);
        }
      });
    });

  };

  // GIVES A CONTROLLER A NEW TOKEN AMOUNT (ONLY CALLED BY OWNERS)
  // ... currently we are not calling const .. need to test with controllers that have delegated
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "controller":"", "flag":"", "filename":"", "token_quantity":""}
  */
  const offsetControllerTokenQuantity = (formdata, callback) => {
    logCatcher(`formdata: \n${JSON.stringify(formdata)}\n`);
    const {
      msg, sig, pubKey, flag, filename, controller,
    } = formdata;
    const owner = keccak_256(pubKey);
    const amount = Number(formdata.token_quantity);
    const controllerHash = keccak_256(controller).toUpperCase();

    theNotifier.getAsset(pubKey, filename, Number(flag), (results) => {
      results.txn_id = "offsetControllerTokenQuantity";
      const log = results;
      contract.offsetControllerTokenQuantity(owner, controllerHash, (error, result) => {
        if (result) {
          const ctrlIndex = log.controlIdList.indexOf(controller);
          log.controlTokenQuantity[ctrlIndex] += Number(amount);
          if (log.controlTokenQuantity[ctrlIndex] < 0) {
            log.controlTokenQuantity[ctrlIndex] = 0;
          }
          theNotifier.bcPreRequest(log.pubKey, log.proposalId, log, '0', '0x0', '0x0', Date.now(), log.validatorSigs, '', log.bigchainID, log.bigchainHash, log.visibility, log.description, (res, theId, theHash) => {
            log.bigchainID = theId;
            log.bigchainHash = theHash;
            writeAll(log, () => { callback(error, result); });
          });
        } else {
          logCatcher(`Error while adding tokens to controller${error}`);
          callback(error, result);
        }
      });
    });
  };
  //
  // <- <- <- END CONTROL FUNCTIONS <- <- <-


  // -> -> -> START OWNERSHIP FUNCTIONS -> -> ->
  //
  //

  // Tells an owner how many tokens they have.
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "owner":""}
  */
  const myTokenAmount = (formdata, callback) => {
    logCatcher('DEBUGGING: YOU HIT MYTOKENAMOUNT');
    const { msg, sig, owner } = formdata;
    logCatcher(`owner: ${owner}`);
    const ownershipHash = keccak_256(owner).toUpperCase();

    contract.myTokenAmount(ownershipHash, (error, result) => {
      logCatcher(`DEBUGGING...RESULT,ERROR: ${result} ... ${error}`);
      callback(error, `${result}`);
    });
  };

  // Adds an owner
  //doesnt work with Human beings
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "owners":"", "token_quantity":"", "filename":""}
  */
  const addOwner = (formdata, callback) => {
    logCatcher(formdata);
    const {
      msg, sig, pubKey, filename,
    } = formdata;
    const flag = 0;
    let k = 0;
    // var filename = "MyCOID.json";
    const owner = formdata.owners.split(',');
    const amount = formdata.token_quantity.split(',');
    // newOwner = keccak_256(newOwner).toUpperCase()

    logCatcher('\n-----VERIFIED-----\n');
    theNotifier.getAsset(pubKey, filename, Number(flag), (results) => {
      let i;
      results.txn_id = "addOwner";
      const log = Object.assign({}, results);
      const loopFunction = (error, result) => {
        if (result) {
          log.ownerIdList.push(owner[k]);
          log.ownershipTokenQuantity.push(amount[k]);
          k++;
          logCatcher(`res: ${result}`);
          if (k === (owner.length)) {
            logCatcher('addOwner write');
            theNotifier.bcPreRequest(log.pubKey, log.proposalId, log, '0', '0x0', '0x0', Date.now(), log.validatorSigs, '', log.bigchainID, log.bigchainHash, log.visibility, log.description, (res, theId, theHash) => {
              log.bigchainID = theId;
              log.bigchainHash = theHash;
              writeAll(log, () => { callback(error, result); });
            });
          }
        } else {
          logCatcher(`error: ${error}`);
          callback(error, result);
          i = owner.length;
          // k = formdata.data.length;
          logCatcher(`Error occurred while adding entry ${error}`);
        }
      };
      for (i = 0; i < owner.length; i++) {
        logCatcher(`INFO: ${owner[0]}\n${amount[0]}`);
        const newOwner = keccak_256(owner[i]).toUpperCase();
        contract.addOwner(keccak_256(pubKey), newOwner, Number(amount[i]), loopFunction);
      }
    });

  };

  // Removes an owner 
  //doesnt work with Human beings
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "flag":"", "filename":"", "owner":""}
  */
  const removeOwner = (formdata, callback) => {
    const {
      msg, sig, pubKey, filename, flag,
    } = formdata;
    let { owner } = formdata;
    // var owner = formdata.owner.split(","); edited by offshore team
    // var filename = "MyCOID.json";


    // TODO:
    const ownerHash = keccak_256(owner).toUpperCase();

    logCatcher('\n-----VERIFIED-----\n');
    theNotifier.getAsset(pubKey, filename, Number(flag), (results) => {
      results.txn_id = "removeOwner";
      const log = results;
      contract.removeOwner(keccak_256(pubKey), ownerHash, (error, result) => {
        if (result) {
          for (let j = 0; j < log.ownerIdList.length; j++) {
            if (log.ownerIdList[j] === owner) {
              log.ownerIdList.splice(j, 1);
              log.ownershipTokenQuantity.splice(j, 1);
              theNotifier.bcPreRequest(log.pubKey, log.proposalId, log, '0', '0x0', '0x0', Date.now(), log.validatorSigs, '', log.bigchainID, log.bigchainHash, log.visibility, log.description, (res, theId, theHash) => {
                log.bigchainID = theId;
                log.bigchainHash = theHash;
                writeAll(log, () => { callback(error, result); });
              });
            }
          }
        } else {
          logCatcher(`Error while removing owner ${error}`);
          callback(error, result);
        }
      });
    });

  };


  // Allows an owner to give tokens to another owner (they must already be an owner!)
  //doesnt work with Human beings
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "flag":"", "filename":"", "originalOwner":"", "newOwner":"", "amount":""}
  */
  const giveTokens = (formdata, callback) => {
  
    const {
      msg, sig, pubKey, flag,
    } = formdata;
    let {
      originalOwner, newOwner, amount,
    } = formdata;
    const filename = 'MyCOID.json';
    // var filename = formdata.filename;

    // TODO:
    const originalOwnerHash = keccak_256(originalOwner).toUpperCase();
    const newOwnerHash = keccak_256(newOwner).toUpperCase();
    theNotifier.getAsset(pubKey, filename, Number(flag), (results) => {
      results.txn_id = "giveTokens";
      const log = results;
      contract.giveTokens(originalOwnerHash, newOwnerHash, amount, (error, result) => {
        let oldIndex;
        let newIndex;
        if (error) { callback(error, result); } else {
          for (let j = 0; j < log.owner_id.length; j++) {
            if (log.owner_id[j] === originalOwner) { oldIndex = j; }
            if (log.owner_id[j] === newOwner) { newIndex = j; }
          }
          if (amount > log.owner_token_quantity[oldIndex]) {
            amount = log.owner_token_quantity[oldIndex];
            log.owner_id.splice(oldIndex, 1);
            log.owner_token_quantity.splice(oldIndex, 1);
          } else {
            log.owner_token_quantity[oldIndex] -= amount;
          }
          log.owner_token_quantity[newIndex] += amount;
          theNotifier.bcPreRequest(log.pubKey, log.proposalId, log, '0', '0x0', '0x0', Date.now(), log.validatorSigs, '', log.bigchainID, log.bigchainHash, log.visibility, log.description, (res, theId, theHash) => {
            log.bigchainID = theId;
            log.bigchainHash = theHash;
            writeAll(log, () => { callback(error, result); });
          });
        }
      });
    });
  };

  // <- <- <- END OWNERSHIP FUNCTIONS <- <- <-

  // -> -> -> START RECOVERY FUNCTIONS -> -> ->
  //adds recovery person
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "filename":"", "recoveryID":"", "recoveryCondition":""}
  */
  const addRecoveryID = (formdata, callback) => {
    logCatcher(formdata);
    const {
      sig, pubKey, msg, filename,
    } = formdata;
    const recoveryID = formdata.recoveryID.split(',');
    const recoveryCondition = formdata.recoveryCondition || '';
    // TODO:
    // var recoveryIDHash = keccak_256(recoveryID).toUpperCase()
    // TODO
    // var filename = "MyCOID.json";
    const flag = 0;
    let k = 0;

    const loopFunction = (obj, i) => {
      const log = obj;
      contract.addRecovery(keccak_256(pubKey), keccak_256(recoveryID[i]).toUpperCase(), recoveryCondition, (error, result) => {
        // callback(error, result)
        const recoveryIDHash = keccak_256(recoveryID[k]);
        if (error) callback(error, result);
        // var condition = obj.recoveryCondition
        // if (condition != null) { }
        else {
          /* logCatcher("INSIDE ADD RECOVERY ID: " + JSON.stringify(obj))
                        var recovery_list = obj.identityRecoveryIdList;
  
                        logCatcher("RECOVERY KEYS: " + recovery_list);
  
                        //2. Modify Array
                        recovery_list.push(recoveryIDHash)
                        logCatcher("WITH ADDED RECOVERY ID HASH: " + recovery_list);
                        var keys = ["identityRecoveryIdList"]
                        var values = []
                        values.push(recovery_list);
                        logCatcher("Array of arrays: " + values) */


          log.identityRecoveryIdList.push(recoveryID[k]);
          if (recoveryCondition !== '') {
            log.recoveryCondition = recoveryCondition;
          }
          k++;

          // 3. Update
          // theNotifier.UpdateAsset(pubKey, filename, flag, "", keys, values)
          if (k === recoveryID.length) {
            theNotifier.bcPreRequest(log.pubKey, log.proposalId, log, '0', '0x0', '0x0', Date.now(), log.validatorSigs, '', log.bigchainID, log.bigchainHash, log.visibility, log.description, (res, theId, theHash) => {
              log.bigchainID = theId;
              log.bigchainHash = theHash;
              writeAll(log, () => { callback(error, result); });
            });
          }
        }
      });
    };

    logCatcher('\n-----VERIFIED-----\n');
    // 1. Get Current Recovery keys
    theNotifier.getAsset(pubKey, filename, Number(flag), (results) => {
      results.txn_id = "addRecoveryID";
      const obj = results;
      for (let i = 0; i < recoveryID.length; i++) {
        loopFunction(obj, i);
      }
    });

  };

  // ST: UPDATE FILE in DT!!!!! Currently hardcoded MyCOID.json
  //removes recovery person
  /* example JSON
  {"pubKey":"", "msg":"" "sig":"", "address":"", "filename":"", "recoveryID":"", "recoveryCondition":""}
  */
  const removeRecoveryID = (formdata, callback) => {
    const {
      sig, pubKey, msg, recoveryID, recoveryCondition, filename,
    } = formdata;
    const recoveryIDHash = keccak_256(recoveryID).toUpperCase();
    const flag = 0;

    logCatcher('\n-----VERIFIED-----\n');
    // 1. Get Current Recovery keys
    theNotifier.getAsset(pubKey, filename, Number(flag), (results) => {
      logCatcher(`${results}`);
      results.txn_id = "removeRecoveryID";
      const log = results;
      contract.removeRecovery(keccak_256(pubKey), recoveryIDHash, recoveryCondition, (error, result) => {
        if (result) {
          for (let j = 0; j < log.identityRecoveryIdList.length; j++) {
            if (log.identityRecoveryIdList[j] === recoveryID) {
              log.identityRecoveryIdList.splice(j, 1);
              theNotifier.bcPreRequest(log.pubKey, log.proposalId, log, '0', '0x0', '0x0', Date.now(), log.validatorSigs, '', log.bigchainID, log.bigchainHash, log.visibility, log.description, (res, theId, theHash) => {
                log.bigchainID = theId;
                log.bigchainHash = theHash;
                writeAll(log, () => { callback(error, result); });
              });
            }
          }
        }
      });
    });

  };


  // changeRecoveryCondition(function (formdata, callback) {

  // })


  // <- <- <- END RECOVERY FUNCTIONS <- <- <-


  /*
    ST: /addOfficialIDs endpoint goes to the IDF_GK for 'MyCOID'
        /addAssetOfficialIDs endpoint goes to MY_GK when more than one owner...
        if only one owner, come here */
  const addUniqueAttributes = (formdata, callback) => {
    // THIS NEEDS TO BE COMPLETED FOR MYGK assets and we therefore need gk address (?) and filename!!!!!!!
    // ALSO OF COURSE CHECK THAT THEY ARE AN OWNER
    // LAST, need to confirm they have sent the unqueID in the request and that it matches the file
    let theUniqueID;
    let theUniqueIDAttributes;
    let isHumanValue;
    let AoA;
    // var filename = "MyCOID.json";
    // var filename = formdata.filename;

    contract.getUniqueID((error, result) => {
      if (error) { callback(error, result); } else {
        // logCatcher("UniqueID: " + result[0]);
        // logCatcher("Attributes: " + result[1]);
        // logCatcher("isHuman: " + result[2]);
        // callback(error, result);

        const results = 'hey, this is good only for adding to assets created with your gatekeeper.. finish this code!!';
        callback(error, results);

        // ST: COMMENT THIS BACK IN LATER !!!!!
        // theUniqueID = result[0];
        // AoA = JSON.parse(result[1]);
        // isHumanValue = Boolean(result[2]);
        // logCatcher("Attributes: " + result[1]);
        // logCatcher("Parsed Attribute: " + AoA[0]);

        // for (var j = 0; j < theUniqueIDAttributes.length; j++) {
        //     AoA.push(theUniqueIDAttributes[j]);
        // }

        // AoA.concat(Array(10 - AoA.length).fill("0"));

        // contract.setUniqueID(theUniqueID, AoA, isHumanValue);
        // callback(error, result);
      }
    });
  };
  return {
    revokeControlDelegation,
    spendMyTokens,
    myAmount,
    delegate,
    changeTokenController,
    amountDelegated,
    addController,
    removeController,
    offsetControllerTokenQuantity,
    myTokenAmount,
    addOwner,
    removeOwner,
    giveTokens,
    getControllerList,
    getControllerTokens,
    addRecoveryID,
    removeRecoveryID,
    addUniqueAttributes,
  };
}; // MyCOID


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// This does all the endpoint listening:
// The variable endpoint references all keys in the json object.
Object.keys(MyCoidConfig).forEach((endpoint) => {
  // this is the function to call
  const functionCall = MyCoidConfig[endpoint];
  logCatcher(functionCall);
  logCatcher(endpoint);
  app.post(`/${endpoint}`, (req, res) => {
    logCatcher(`\n POSTED ENDPOINT: ${endpoint}`);

    // their contract address
    const contractAddress = req.body.address;
    logCatcher(`contract address: ${contractAddress}`);
    // instantiate a MyCOID object
    const myCoid = MyCOID(contractAddress);

    // function input
    const formdata = req.body;
    //this means that every function is required to send a msg, sig, and pubKey
    if (verifyIt(formdata)) {
      logCatcher(`function call is: ${functionCall}`);

      // res.json({'Status':'hi','Result':'hello'})

      // formulate the string of code for the function call
      myCoid[MyCoidConfig[endpoint]](formdata, (error, result) => {
        res.json({ Status: error, Result: result });
        logCatcher(`${result}`);
        logCatcher(`result is: ${result}`);
      });
    } else {
      res.send('Try again');
      logCatcher('Try again');
    }
  });
});

app.listen(3012);
logCatcher('running at port 3012');
