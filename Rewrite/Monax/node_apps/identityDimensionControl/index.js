// required libraries for post requests parsing
const app = require('express')();
const bodyParser = require('body-parser');
const fs = require('fs');
const { keccak_256 } = require('js-sha3');
// configuration of the chain
const globalConfig = require('../configuration_service/configuration_files/global.json');
const chainConfig = require('../configuration_service/configuration_files/accounts');
const IdentityConfig = require('../configuration_service/configuration_files/IdentityDimensionConfig.json');
const { promisify } = require('bluebird');

// required library for accessing the contract
const erisC = require('@monax/legacy-contracts');
// for secp256k1 verification
const secp256k1 = require('secp256k1');

// this function is intended to send a notification
// end var notifier

//* ******************************************** */

const connector = require('../Component/notifications')('http://10.4.0.167:8000');
const logCatcher = require('../Component/logCatcher');

//* ******************************************** */

const verifyIt = (formdata) => {
  logCatcher('you have reached verifyIt internal function');
  if (!formdata.msg || !formdata.sig || !formdata.pubKey) return false;
  return secp256k1.verify(Buffer.from(formdata.msg, 'hex'), Buffer.from(formdata.sig, 'hex'), Buffer.from(formdata.pubKey.slice(2), 'hex'));
};

const writeAll = async (formdata, callback) => {
  const max = Math.max(formdata.dimension.controllers.length, formdata.dimension.owners.length, formdata.dimension.delegations.length, formdata.dimension.dim_controllers_keys.length);
  logCatcher('\n*****THE MIGHTY WRITEALL*****\n');
  logCatcher(JSON.stringify(formdata));
  logCatcher(`MAX :${max}`);
  let delegateeLog; // don't delete this one
  if (formdata.dimension.controllers[0] === '') { formdata.dimension.controllers.splice(0); }
  const total = formdata.dimension.controllers.length + formdata.dimension.owners.length + formdata.dimension.delegations.length + formdata.dimension.dim_controllers_keys.length;

  const setDimension = promisify(connector.setDimension);

  const promiseArray = [];

  for (let i = 0; i < max; i++) {
    if (typeof (formdata.dimension.owners[i]) !== 'undefined' && !!formdata.dimension.owners[i] && formdata.dimension.owners !== '') {
      promiseArray.push(setDimension(String(formdata.dimension.owners[i]), `${String(formdata.dimension.dimensionName)}.json`, 0, 0, formdata, '', ''));
    }
    if (typeof (formdata.dimension.controllers[i]) !== 'undefined' && !!formdata.dimension.controllers[i] && formdata.dimension.controllers !== '') {
      promiseArray.push(setDimension(String(formdata.dimension.controllers[i]), `${String(formdata.dimension.dimensionName)}.json`, 1, 0, formdata, '', ''));
    }
    if (typeof (formdata.dimension.dim_controllers_keys[i]) !== 'undefined' && !!formdata.dimension.dim_controllers_keys[i] && formdata.dimension.dim_controllers_keys !== '') {
      promiseArray.push(setDimension(String(formdata.dimension.dim_controllers_keys[i]), `${String(formdata.dimension.dimensionName)}.json`, 1, 0, formdata, '', ''));
    }
    if (typeof (formdata.dimension.delegations[i]) !== 'undefined' && !!formdata.dimension.delegations[i] && formdata.dimension.delegations[i] !== '' && formdata.dimension.delegations[i].owner !== '') {
      const { delegatee, accessCategories } = formdata.dimension.delegations[i];
      delegateeLog = JSON.parse(JSON.stringify(formdata));
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

      if (accessCategories === '') {
        logCatcher('setting categories');
        delegateeLog.dimension.data = formdata.dimension.data;
      } else {
        const keys = accessCategories.split(',');
        delegateeLog.dimension.data = [''];
        for (let j = 0; j < formdata.dimension.data.length; j++) {
          if (keys.indexOf(formdata.dimension.data[j].descriptor)) {
            delegateeLog.dimension.data.push(formdata.dimension.data[j]);
          }
        }
      }
      promiseArray.push(setDimension(String(formdata.dimension.delegations[i].delegatee), `${String(formdata.dimension.dimensionName)}.json`, 2, 0, delegateeLog, '', ''));
    }
  }
  logCatcher(`total calls: ${total}`);
  Promise.all(promiseArray).then((values) => {
    logCatcher(`setDimension was called ${values.length} times`);
    callback();
  }).catch(err => logCatcher(`Error in WriteAll ${err}`));
};// end writeAll

const removeAll = (formdata, callback) => {
  const max = Math.max(formdata.dimension.controllers.length, formdata.dimension.owners.length, formdata.dimension.dim_controllers_keys.length);
  logCatcher('\n*****THE MIGHTY WRITEALL*****\n');
  logCatcher(JSON.stringify(formdata));
  logCatcher(`MAX :${max}`);

  if (formdata.dimension.controllers[0] === '') {
    formdata.dimension.controllers.splice(0);
  }
  const deleteDimension = promisify(connector.deleteDimension);
  const promiseArray = [];
  for (let i = 0; i < max; i++) {
    if (formdata.dimension.owners[i] && formdata.dimension.owners !== '') {
      promiseArray.push(deleteDimension(String(formdata.dimension.owners[i]), `${String(formdata.dimension.dimensionName)}.json`, 0));
    }
    if (formdata.dimension.controllers[i] && formdata.dimension.controllers !== '') {
      promiseArray.push(deleteDimension(String(formdata.dimension.controllers[i]), `${String(formdata.dimension.dimensionName)}.json`, 1));
    }
    if (formdata.dimension.dim_controllers_keys[i] && formdata.dimension.dim_controllers_keys !== '') {
      promiseArray.push(deleteDimension(String(formdata.dimension.dim_controllers_keys[i]), `${String(formdata.dimension.dimensionName)}.json`, 1));
    }
    if (formdata.dimension.delegations[i] && formdata.dimension.delegations[i] !== '' && formdata.dimension.delegations[i].owner !== '') {
      promiseArray.push(deleteDimension(String(formdata.dimension.delegations[i].delegatee), `${String(formdata.dimension.dimensionName)}.json`, 2));
    }
  }// end for loop
  Promise.all(promiseArray).then(values => logCatcher(`deleteDimension was called ${values.length} times`)).catch(err => logCatcher(err));
};// remove all

const IdentityDimensionControl = (iDimensionCtrlContractAddress) => {
  const chain = globalConfig.properties.primary_account;
  const erisdburl = globalConfig.properties.chainURL;
  const contractData = require('../configuration_service/output_files/jobs_output.json');
  const contractAbiAddress = contractData.IdentityDimensionControl;
  const erisAbi = JSON.parse(fs.readFileSync(`../Solidity/abi/${contractAbiAddress}`));
  const contractMgr = erisC.newContractManagerDev(erisdburl, chainConfig[chain]);
  const contract = contractMgr.newContractFactory(erisAbi).at(iDimensionCtrlContractAddress);

  // // NOTE: contract is identityDimensionControl contract that is passed as input
  // const testing = (valA, valB, valC, valD, valE, valF, callback) => {
  //   contract.testing(valA, valB, valC, valD, valE, valF, (error, result) => {
  //     callback(error, result);
  //   });
  // };
  //* **********************************************************************************************/
  // MUST BE CALLED FIRST!!!!
  // THIS FUNCTION IS CALLED BY GATEKEEPER app(s) when setting new COID contract data
  const Instantiation = (formdata) => {
    logCatcher(`formdata inside Instantiation: ${JSON.stringify(formdata)}`);
    const { pubKey, coidAddr } = formdata;
    logCatcher(`SHA3 of PUBKEY: ${keccak_256(pubKey)}`);
    return promisify(contract.IdentityDimensionControlInstantiation)(coidAddr);
  };

  // delegate ... this is called by createDimension and can also be called directly
  // ACTION required: add a flag here so its clear if this is being called by CreateDimension or by the twin
  // that way we know whether or not the signature has been checked previously or should be checked inside 
  // result is the bool success
  /*Request Format
  { "msg": "", "sig":"", "pubKey":"", "dimensionCtrlAddr":"", "dimensionName":"", "delegations":[stringified delegation] }
  delegation entry = {"owner":"", "delegatee":"" , "amount":"" , dimension:"", expiration:"", accessCategories:""};
  */
  const delegate = async (formdata, callback) => {
    logCatcher('hit delegate');
    logCatcher(`formdata: \n${JSON.stringify(formdata)}`);
    let delegation;
    if (formdata.delegations) {
      delegation = Object(JSON.parse(formdata.delegations));
    }
    const currentDate = Date.now();

    connector.getDimension(delegation[0].owner, `${delegation[0].dimension}.json`, 0, (results) => {
      results.txn_id = "delegateDimension";
      let j = 0;
      let i;
      const loopFunction = (
        owner, delegatee, accessCategories,
        amount, dimension, timeFrame,
      ) => {
        contract.delegate(keccak_256(owner), keccak_256(delegatee), Number(amount), dimension, Number(timeFrame), accessCategories, (error, result) => {
          const log = results;
          if (result) {
            logCatcher('Results came back' + JSON.stringify(log));
            const entry = {
              owner,
              delegatee: delegatee,
              amount: amount,
              dimension: dimension,
              expiration: String(currentDate + timeFrame),
              accessCategories: accessCategories,
            };
            log.dimension.delegations.push(entry);
            j++;
            const delegateeLog = JSON.parse(JSON.stringify(log));// to get a copy of object, not a reference of object
            delegateeLog.dimension.pubKey = '';
            delegateeLog.dimension.coidAddr = '';
            delegateeLog.dimension.uniqueId = '';
            delegateeLog.dimension.uniqueID = '';

            for (let n = 0; n < delegateeLog.dimension.delegations.length; n++) {
              if (delegateeLog.dimension.delegations[n].delegatee !== delegatee) {
                delegateeLog.dimension.delegations.splice(n, 1);
              }
            }
            if (accessCategories === '') {
              logCatcher('setting categories');
              delegateeLog.dimension.data = log.dimension.data;
            } else {
              const keys = accessCategories.split(',');
              delegateeLog.dimension.data = [''];
              for (let k = 0; k < log.dimension.data.length; k++) {
                if (keys.indexOf(log.dimension.data[k].descriptor)) {
                  delegateeLog.dimension.data.push(log.dimension.data[k]);
                }
              }
            }
            logCatcher(`\n\nDELEGATE LOG: ${JSON.stringify(log)}\n\n`);

            if (j === (delegation.length)) {
              connector.bcPreRequest(log.dimension.pubKey, '0x0', log.dimension, '0', '0x0', '0x0', Date.now(), '', '', log.dimension.bigchainID, log.dimension.bigchainHash, 'public', 'Dimension', (res, theId, theHash) => {
                log.dimension.bigchainID = theId;
                log.dimension.bigchainHash = theHash;
                writeAll(log, () => { callback(error, result); });
              });
            }
          } else {
            callback(error, result);
            i = delegation.length;
            logCatcher(`Error occurred while delegating: ${error}`);
          }
        });// end contract call
      };

      for (i = 0; i < delegation.length; i++) {
        //logCatcher(`current dele: ${delegation[0]}`);
        const {
          owner, delegatee, accessCategories,
          amount, dimension, expiration,
        } = delegation[0];
        // this is an entry={"owner":owner,"delegatee":delegatee,"amount":amount,"dimension":dimension,"expiration":timeFrame,"accessCategories":accessCategories};
        logCatcher('----------Delegate Tokens--------------');
        logCatcher(`Owner :${owner}`);
        logCatcher(`Delegatee :${delegatee}`);
        logCatcher(`Amount :${amount}`);
        logCatcher(`Dimension :${dimension}`);
        logCatcher(`Time Frame :${expiration}`);
        logCatcher(`Access Categories :${typeof (accessCategories)}`);
        logCatcher(`FDL: ${delegation.length}`);

        loopFunction(
          owner, delegatee, accessCategories,
          amount, dimension, expiration,
        );
      }// end for loop
    });// end get json

    // callback(error, result);
  };// end delegate
  /*Request Format
  {"msg": "", "sig":"", "pubKey":"", "ID":"", "dimensionCtrlAddr":"", "dimensionName":"", "flag":"", "data":[stringified object]}
  data object= [{"descriptor": "", "attribute": "", "flag": "" }...];
  */
  const addEntry = (formdata, callback) => {
    //also called inside createDimension 

    logCatcher(`stringified FD: ${JSON.stringify(formdata)}`);
    logCatcher(`FD: ${formdata}`);
    const { pubKey, ID } = formdata;
    const type = formdata.dimensionName;
    logCatcher(`FDLength${formdata.data.length}`);
    let k = 0;
    logCatcher(`formdata.data: ${formdata.data}`);
    const data = JSON.parse(formdata.data);
    logCatcher(`formdata.data2: ${data}`);
    logCatcher(`FDLength2: ${data.length}`);
    let flag = Number(formdata.flag) || 0;

    connector.getDimension(pubKey, `${type}.json`, flag, (results) => {
      results.txn_id = "addEntry";
      let i = 0;
      const loopFunction = (descriptor, attribute, attribute2, attribute3) => {
        contract.addEntry(keccak_256(pubKey), Buffer.from(type).toString('hex'), Buffer.from(ID).toString('hex'), Buffer.from(descriptor).toString('hex'), attribute, attribute2, attribute3, Number(flag), (error, result) => {
          if (result[0]) {
            logCatcher(`\n\nBefore ADD ENTRY LOG: ${JSON.stringify(results)}\n\n`);
            const entry = {
              descriptor: data[k].descriptor,
              attribute: data[k].attribute,
              flag: data[k].flag,
            };
            results.dimension.data.push(entry);
            k++;
            // push all changes, write once will remove race condition
            logCatcher(`\n\nAFTER ADD ENTRY LOG: ${JSON.stringify(results)}\n\n`);
            // add counter to ensure all entries succeeded b4 write
            if (k === (data.length)) {
              logCatcher('AddData Write');
              connector.bcPreRequest(results.dimension.pubKey, '0x0', results.dimension, '0', '0x0', '0x0', Date.now(), '', '', results.dimension.bigchainID, results.dimension.bigchainHash, 'public', 'Dimension', (res, theId, theHash) => {
                results.dimension.bigchainID = theId; // eslint-disable-line
                results.dimension.bigchainHash = theHash; // eslint-disable-line
                writeAll(results, () => { callback(error, result); });
              });
            }
          } else {
            callback(error, result);
            i = formdata.length;
            logCatcher(`Error occurred while adding entry: ${error}result: ${result}`);
          }
        });// end contract call
      };
      for (i = 0; i < data.length; i++) {
        logCatcher(`ADD ENTRY ********************  ${JSON.stringify(formdata)}`);

        let attribute = Buffer.from(data[i].attribute).toString('hex');
        const { descriptor } = data[i];
        flag = data[i];
        logCatcher('----------ADD ENTRY--------------');
        logCatcher(`PUBKEY :${pubKey}`);
        logCatcher(`TYPE :${type}`);
        logCatcher(`ID :${ID}`);
        logCatcher(`DESCRIPTOR :${descriptor}`);
        logCatcher(`ATTRIBUTE :${attribute}`);

        const attribute3 = attribute.substr(132) || 0x0;
        const attribute2 = attribute.substr(66, 66) || 0x0;
        attribute = attribute.substr(0, 66);
        logCatcher(`ATTRIBUTE :${attribute}`);
        logCatcher(`ATTRIBUTE2 :${attribute2}`);
        logCatcher(`ATTRIBUTE3 :${attribute3}`);
        loopFunction(descriptor, attribute, attribute2, attribute3);
      }// end for loop
    });// end getDimension
  };// end addentry
  //* **********************************************************************************************/

  // add dimension controller ... this is called by createDimension and can also be called directly
  // ACTION required: add a flag here so its clear if this is being called by CreateDimension or by the twin
  // that way we know whether or not the signature has been checked previously
  /* Request Format:
  {"msg": "", "sig":"", "pubKey":"", "dimensionCtrlAddr":"", "typeInput":"", "dim_controllers_keys":"", "owners":""}
  */
  const addController = async (formdata, callback) => {
    const owner = formdata.owners.split(',');
    const controller = formdata.dim_controllers_keys == '' || formdata.dim_controllers_keys == undefined ? [] : formdata.dim_controllers_keys.split(',');
    const loopFunction = async (results, i) => {
      const log = results;
      return new Promise((resolve, reject) => {
        contract.addController(keccak_256(owner[0]), keccak_256(controller[i]), (error, result) => {
          if (error) {
            reject(error);
          }
          if (result) {
            log.dimension.dim_controllers_keys.push(controller[i]);
            if (i === controller.length - 1) {
              connector.bcPreRequest(log.dimension.pubKey, '0x0', log.dimension, '0', '0x0', '0x0', Date.now(), '', '', log.dimension.bigchainID, log.dimension.bigchainHash, 'public', 'Dimension', (res, theId, theHash) => {
                log.dimension.bigchainID = theId;
                log.dimension.bigchainHash = theHash;
                writeAll(log, () => { callback(error, result); });
              });
            }
            resolve(false);
          } else {
            logCatcher('Result from addController was false');
            callback(error, result);
            resolve(true);
          }
        });
      });
    };
    if (controller.length > 0) {
      connector.getDimension(owner[0], `${String(formdata.typeInput)}.json`, 0, async (results) => {
        results.txn_id = "addControllerDimension";
        for (let i = 0; i < controller.length; i++) {
          logCatcher(`getDimension  : --------------------${results}`);
          logCatcher(`controller: ${controller[i]}`);
          logCatcher(`owner: ${owner[0]}`);
          logCatcher(`i: ${i}`);
          logCatcher(`controllers length: ${controller.length}`);
          // eslint-disable-next-line
          if (await loopFunction(results, i).catch((err) => { logCatcher(`Error getDimension loop: ${err}`); return true; })) {
            break;
          }
        }// for loop
      });// get
    } else {
      logCatcher('\n no new controllers to add\n');
      callback(null, false);
    }
  };// end addDimController

  const clearExpirations = (formdata, callback) => {
    const currentDate = Date.now() / 1000;
    const spliceArr = [];
    logCatcher(`CLEAR EXPIR: ${JSON.stringify(formdata)}`);
    // first check to avoid an out-of-bounds error
    if (formdata.dimension.delegations.length > 0) {
      for (let i = 0; i < formdata.dimension.delegations.length; i++) {
        const check = (currentDate > Number(formdata.dimension.delegations[i].expiration) && Number(formdata.dimension.delegations[i].expiration) !== 0);
        logCatcher(check);
        if (check) {
          logCatcher(formdata.dimension.delegations[i].delegatee);
          // formdata.dimension.delegations.splice(i,1);
          spliceArr.push(i);
          logCatcher(`${currentDate} token cleared ${i}`);
        }
      }
      spliceArr.forEach((value) => {
        formdata.dimension.delegations.splice(value, 1);
        logCatcher(`spliced ${value}`);
      });
    }
    callback();
  };

  // Contract returns, (bool success, bytes32 callerHash, address test)
  /* Request Format:
  {"msg": "", "sig":"", "pubKey":"", "ID":"", "dimensionCtrlAddr":"", "uniqueID":"", "typeInput":"", "flag":"", "dim_controllers_keys":"", "owners":"", "controllers":"", "data":[stringified object], "delegations":[stringified object]}
  */
  const CreateDimension = (formdata, callback) => {
    logCatcher(formdata);
    // create a json
    const log = {
      dimension: {
        dimensionName: '',
        pubKey: '',
        address: '',
        flag: '',
        ID: '',
        coidAddr: '',
        dimensionCtrlAddr: '',
        uniqueId: '',
        owners: [],
        controllers: [],
        delegations: [],
        data: [],
        propType: '',
        dim_controllers_keys: [],
        bigchainHash: '',
        bigchainID: '',
        txn_id: ''
      },
    };
    const {
      ID, dimensionCtrlAddr, uniqueID, typeInput, flag, pubKey
    } = formdata;

    //let { pubKey } = formdata;
    // ADDRESS IS SET WITH THE ADDRESS OF THE DIMENSION
    let address;
    let controllers = formdata.controllers == '' || formdata.controllers == undefined ? [] : formdata.controllers.split(',');
    //let { owners, dim_controllers_keys } = formdata;
    let dim_controllers_keys = formdata.dim_controllers_keys == '' || formdata.dim_controllers_keys == undefined ? [] : formdata.dim_controllers_keys.split(',');
    let owners = formdata.owners == '' || formdata.owners == undefined ? [] : formdata.owners.split(',');

    // if (typeof (formdata.dim_controllers_keys) === 'string') {
    //   dim_controllers_keys = dim_controllers_keys.split(',');
    // }
    // if (typeof (formdata.controllers) === 'string') {
    //   controllers = controllers.split(',');
    // }
    // if (typeof (formdata.owners) === 'string') {
    //   owners = formdata.owners.split(',');
    // }

    //[pubKey] = owners;
    const delegations = formdata.delegations == '' || formdata.delegations == undefined ? [] : Object(JSON.parse(formdata.delegations));
    const data = formdata.data == '' || formdata.data == undefined ? [] : Object(JSON.parse(formdata.data));
    // var data = log.dimension.data;
    logCatcher(`address is undefined until we set it with return of the contract: ${address}`);
    logCatcher(`CONTROLLER${controllers}`);
    logCatcher(`OWNERS: ${owners}`);
    logCatcher(`PUBKEY :${pubKey}`);
    logCatcher(`TYPE :${typeInput}`);
    logCatcher(`ID :${uniqueID}`);
    logCatcher(`flag :${flag}`);
    logCatcher(`DATA :${typeof (data)}`);
    //logCatcher(`DATA :${data[0].descriptor}`);
    logCatcher(`DATA :${JSON.stringify(data)}`);
    logCatcher(`dim_controllers_keys  :${dim_controllers_keys}`);
    const { msg, sig } = formdata;
    logCatcher(`sending msg: ${msg}`);
    logCatcher(`sending sig: ${sig}`);




    contract.CreateDimension(keccak_256(pubKey), uniqueID, typeInput, Number(flag), (error, result) => {
      logCatcher(`\n\nER: ${error}    ${result}\n\n`);
      if (result[0]) {
        logCatcher('made it create');
        log.dimension.dimensionName = typeInput;
        [, , log.dimension.address, log.dimension.ID] = result;
        log.dimension.uniqueID = uniqueID;
        log.dimension.pubKey = formdata.pubKey;
        log.dimension.controllers = controllers;
        log.dimension.owners = owners;
        log.dimension.flag = flag;
        log.dimension.dimensionCtrlAddr = dimensionCtrlAddr;
        log.dimension.propType = formdata.propType;
        log.dimension.dim_controllers_keys = dim_controllers_keys;
        log.dimension.txn_id = "createDimension";
        // log.dimension.delegations = delegations;
        // log.dimension.data = data;

        logCatcher(`dimension JSON to be created: \n${JSON.stringify(log)}`);
        const createWrite = (cb) => {
          const max = Math.max(controllers.length, owners.length);
          logCatcher(`MAX :${max}`);
          // var j = 0;
          const setDimension = promisify(connector.setDimension);
          const promiseArray = [];
          for (let i = 0; i < max; i++) {
            if (owners[i]) {
              promiseArray.push(setDimension(owners[i], `${typeInput}.json`, 0, 0, log, '', ''));
            }
            if (controllers[i]) {
              promiseArray.push(setDimension(controllers[i], `${typeInput}.json`, 1, 0, log, '', ''));
            }
            // if (i == (max - 1)) { callback(error, result); }
            logCatcher(`OWNERS :${owners[i]}`);
            logCatcher(`CONTROLLER :${typeof (controllers[i])}`);
            // if(i == max-1){callback(1);logCatcher("----------CREATEWRITE CALLBACK----------");}
          }
          Promise.all(promiseArray).then((values) => {
            logCatcher(`CreateDimension called setDimension ${values.length} times`);
            cb();
          }).catch(err => logCatcher(err));
        };

        // the reason they are nested is because the other functions also read/write the json. Due to the async nature of js you want to make sure
        // that the file being pulled is the latest.
        // var test = JSON.stringify(data);
        // var addPayload = { "pubKey": pubKey, "dimensionName": typeInput, "data": test };
        createWrite(() => {
          logCatcher(`Create Write Finished`);
          addController({ owners: String(owners), dim_controllers_keys: String(dim_controllers_keys), typeInput }, (err, res) => {
            const addPayload = {
              pubKey, dimensionName: typeInput, ID, data: JSON.stringify(data), flag: 0,
            };
            logCatcher(`addpayload: ${JSON.stringify(addPayload)}`);
            if (data.length > 0 && data[0].descriptor !== '' && delegations.length > 0 && delegations[0].owner !== '') {
              logCatcher('line 213 trying to add entry...');
              addEntry(addPayload, (err1, res1) => {
                if (err1) { logCatcher(`error: ${err1}`); }
                if (res1) {
                  logCatcher('about to call delegate line 194');
                  delegate(delegations, (err2, res2) => {
                    // createWrite();
                    callback(err2, res2);
                  });
                }
              });
            } else if (data.length > 0 && data[0].descriptor !== '') {
              addEntry(addPayload, (err1, res1) => {
                callback(err1, res1);
              });
            } else if (delegations.length > 0 && delegations[0].owner !== '') {
              delegate(delegations, (err1, res1) => {
                callback(err1, res1);
              });
            } else {
              callback(error, result);
            }
          });// add controller
        });// createwrite
      } else {
        callback(error, result);
        if (error) { logCatcher(`callback error: ${error}`); }
        if (result) { logCatcher(`callback result: ${result}`); }
      }
    });// end createDimension

  };
  //* **********************************************************************************************/

  // result is boolean success from the contract. //method uses the solidity suicide method....
  /*Request Format
  {"msg": "", "sig":"", "pubKey":"", "ID":"", "dimensionCtrlAddr":"", "caller":"", "dimensionName":"" }
  */
  const RemoveDimension = (formdata, callback) => {
    const { caller, dimensionName, ID } = formdata;

    contract.RemoveDimension(keccak_256(caller), Buffer.from(dimensionName).toString('hex'), Buffer.from(ID).toString('hex'), (error, result) => {
      if (result) {
        connector.getDimension(caller, `${dimensionName}.json`, 0, (results) => {
          const log = results;
          // write to bigchain and twin
          connector.bcPreRequest(log.dimension.pubKey, '0x0', log.dimension, '0', '0x0', '0x0', Date.now(), '', '', log.dimension.bigchainID, log.dimension.bigchainHash, 'public', 'Dimension', (res, theId, theHash) => {
            log.dimension.bigchainID = theId;
            log.dimension.bigchainHash = theHash;
            log.dimension.txn_id = "RemoveDimension";
            log.deleted = true;
            removeAll(log, () => { callback(error, result); });
          });
        });
      } else { callback(error, result); }
    });

  };

  // result is boolean success from the contract
  /*Request Format
  {"msg": "", "sig":"", "pubKey":"", "ID":"", "dimensionCtrlAddr":"", "type":"", "oldDescriptor":"", "newDescriptor":"" }
  */
  const changeDescriptor = (formdata, callback) => {
    const {
      pubKey, msg, sig, type, ID, oldDescriptor, newDescriptor,
    } = formdata;
    logCatcher('----------CHANGE DESCRIPTOR--------------');
    logCatcher(`PUBKEY :${pubKey}`);
    logCatcher(`MESSAGE :${msg}`);
    logCatcher(`SIG :${sig}`);
    logCatcher(`TYPE :${type}`);
    logCatcher(`ID :${ID}`);
    logCatcher(`oldDESCRIPTOR :${oldDescriptor}`);
    logCatcher(`newDESCRIPTOR :${newDescriptor}`);

    contract.changeDescriptor(keccak_256(pubKey), Buffer.from(type).toString('hex'), Buffer.from(ID).toString('hex'), Buffer.from(oldDescriptor).toString('hex'), Buffer.from(newDescriptor).toString('hex'), (error, result) => {
      if (result) {
        connector.getDimension(formdata.pubKey, `${formdata.type}.json`, 0, (results) => {   
          results.txn_id = "changeDescriptor";       
          const log = results;
          //also change delegations access-categories
          for (let i = 0; i < results.dimension.data.length; i++) {
            if (results.dimension.data[i].descriptor === oldDescriptor) {
              log.dimension.data[i].descriptor = newDescriptor;
              break;
            }
          }
          // write to bigchain and twin
          connector.bcPreRequest(results.dimension.pubKey, '0x0', results.dimension, '0', '0x0', '0x0', Date.now(), '', '', results.dimension.bigchainID, results.dimension.bigchainHash, 'public', 'Dimension', (res, theId, theHash) => {
            log.dimension.bigchainID = theId;
            log.dimension.bigchainHash = theHash;
            writeAll(log, () => { callback(error, result); });
          });
        });
      } else { callback(error, result); }
    });

  };

  // result is the boolean success from the contract
  /*Request Format
  {"msg": "", "sig":"", "pubKey":"", "ID":"", "dimensionCtrlAddr":"", "type":"", "descriptor":""}
  */
  const removeEntry = (formdata, callback) => {
    const {
      pubKey, type, ID, descriptor, msg, sig,
    } = formdata;
    logCatcher('----------REMOVE ENTRY--------------');
    logCatcher(`PUBKEY :${pubKey}`);
    logCatcher(`MESSAGE :${msg}`);
    logCatcher(`SIG :${sig}`);
    logCatcher(`TYPE :${type}`);
    logCatcher(`ID :${ID}`);
    logCatcher(`DESCRIPTOR :${descriptor}`);

    contract.removeEntry(keccak_256(pubKey), Buffer.from(type).toString('hex'), Buffer.from(ID).toString('hex'), Buffer.from(descriptor).toString('hex'), (error, result) => {
      if (result) {
        connector.getDimension(formdata.pubKey, `${formdata.type}.json`, 0, (results) => {
          results.txn_id = "removeEntry";
          logCatcher(`ENTERED RE GDJ${results}`);
          if (results.dimension.data.length > 0) {
            for (let i = 0; i < results.dimension.data.length; i++) {
              if (results.dimension.data[i].descriptor === descriptor) {
                results.dimension.data.splice(i, 1);
                const log = results;
                connector.bcPreRequest(results.dimension.pubKey, '0x0', results.dimension, '0', '0x0', '0x0', Date.now(), '', '', results.dimension.bigchainID, results.dimension.bigchainHash, 'public', 'Dimension', (res, theId, theHash) => {
                  log.dimension.bigchainID = theId;
                  log.dimension.bigchainHash = theHash;
                  writeAll(results, () => { callback(error, result); });
                });
                logCatcher(`\n\nLOG: ${JSON.stringify(results)}\n\n`);
                break;
              }
            }
          }
        });
      } else { callback(error, result); }
    });

  };

  // result is the boolean success from the contract
  // updateAttribute
  /*Request Format
  {"msg": "", "sig":"", "pubKey":"", "ID":"", "dimensionCtrlAddr":"", "type":"", "flag":"", "descriptor":"", "attribute":""}
  */
  const updateEntry = (formdata, callback) => {
    const {
      pubKey, type, ID, descriptor, flag, msg, sig,
    } = formdata;
    let attribute = Buffer.from(formdata.attribute).toString('hex');
    logCatcher('----------UPDATE ENTRY--------------');
    logCatcher(`PUBKEY :${pubKey}`);
    logCatcher(`MESSAGE :${msg}`);
    logCatcher(`SIG :${sig}`);
    logCatcher(`TYPE :${type}`);
    logCatcher(`ID :${ID}`);
    logCatcher(`DESCRIPTOR :${descriptor}`);
    logCatcher(`ATTRIBUTE :${attribute}`);
    const attribute3 = attribute.substr(132);
    const attribute2 = attribute.substr(66, 66);
    attribute = attribute.substr(0, 66);


    contract.updateEntry(
      keccak_256(pubKey), Buffer.from(type).toString('hex'), Buffer.from(ID).toString('hex'), Buffer.from(descriptor).toString('hex'),
      attribute, attribute2, attribute3, flag, (error, result) => {
        if (result) {
          connector.getDimension(formdata.pubKey, `${String(formdata.type)}.json`, 0, (results) => {
            results.txn_id = "updateEntry";
            const log = results;
            for (let i = 0; i < results.dimension.data.length; i++) {
              if (results.dimension.data[i].descriptor === descriptor) {
                log.dimension.data[i].attribute = formdata.attribute;
                if (flag !== 2 || flag !== '2') { log.dimension.data[i].flag = flag; }
                connector.bcPreRequest(results.dimension.pubKey, '0x0', results.dimension, '0', '0x0', '0x0', Date.now(), '', '', results.dimension.bigchainID, results.dimension.bigchainHash, 'public', 'Dimension', (res, theId, theHash) => {
                  log.dimension.bigchainID = theId;
                  log.dimension.bigchainHash = theHash;
                  writeAll(results, () => { callback(error, result); });
                });
                logCatcher(`\n\nUPDATE LOG: ${JSON.stringify(results)}\n\n`);
                break;
              }
            }
          });
        } else { callback(error, result); }
      },
    );

  };

  // result is a string which is the attribute of the entry
  /*Request Format
  {"msg": "", "sig":"", "pubKey":"", "ID":"", "dimensionCtrlAddr":"", "dimensionName":"", "flag":"", "descriptor":"", "owner":""}
  */
  const readEntry = (formdata, callback) => {
    const { pubKey, msg, sig, owner } = formdata;
    const type = Buffer.from(formdata.dimensionName).toString('hex');
    const ID = Buffer.from(formdata.ID).toString('hex');
    const descriptor = Buffer.from(formdata.descriptor).toString('hex');

    logCatcher(`${owner}  owner  ${formdata.owner}`);

    const toAscii = (string) => {
      if (typeof string !== 'string') throw new Error('toAscii: argument is not a string');
      const hexArray = string.split('');
      let result = '';
      for (let i = 0; i < hexArray.length; i += 2) {
        if (!(i === 0 && hexArray[0] + hexArray[1] === '0x')) {
          result += String.fromCharCode(parseInt(hexArray[i] + hexArray[i + 1], 16));
        }
      }
      return result;
    };

    contract.readEntry(keccak_256(pubKey), type, ID, descriptor, (error, result) => {
      let log = result;
      if (result) {
        let attribute = result[0] + result[1] + result[2];
        const test = result[0] + result[1] + result[2];
        logCatcher(`byte return: ${test}`);
        // convert the bytes to a string
        attribute = toAscii(attribute.replace('/0/g', '')).replace(/\u0000/g, '');
        logCatcher(`\nATTRIBUTE\n${attribute} ${attribute.length}`);
        log = [];
        
        // callback(error, result);

        connector.getDimension(owner, `${String(formdata.dimensionName)}.json`, 0, (results) => {
          results.txn_id = "readEntry";
          if (Boolean(result[3])) {

            let tempResults = results;
            clearExpirations(results, () => {
              let index = 0;
              let keepGoing = true;
              logCatcher(`\nclear expiration Results: ${JSON.stringify(results)}`);
              for (let i = 0; i < results.dimension.data.length; i++) {
                logCatcher('here1');
                if (tempResults.dimension.data[i].descriptor === tempResults.descriptor && tempResults.dimension.data[i].flag === 1 && tempResults.dimension.delegations.length > 0 && tempResults.dimension.delegations[0].owner !== '') {
                  logCatcher('here2');
                  while (keepGoing) {
                    logCatcher('here3');
                    for (let k = 0; k < tempResults.dimension.delegations.length; k++) {
                      const keys = tempResults.dimension.delegations[k].accessCategories.split(',');
                      if (tempResults.dimension.delegations[k].expiration <= tempResults.dimension.delegations[index].expiration && tempResults.dimension.delegations[k].delegateee === pubKey && (keys.includes(formdata.descriptor) || tempResults.dimension.delegations.accessCategories === '')) {
                        index = k; logCatcher('here4');
                      }
                    }
                    if (tempResults.dimension.delegations[index].amount === 0) {
                      tempResults.dimension.delegations.splice(index, 1); logCatcher('here5');
                    } else {
                      // just subtract remaining amount from the current delegation amount
                      tempResults.dimension.delegations[index].amount = String(Number(tempResults.dimension.delegations[index].amount) - 1);
                      logCatcher(`${tempResults.dimension.delegations[index].delegatee} AMOUNT: ${tempResults.dimension.delegations[index].amount}`);
                      keepGoing = false; logCatcher('here6');
                      logCatcher('RW ALL');

                      // logCatcher(JSON.stringify(results));
                      writeAll(results, () => { logCatcher('Read CALLBACK'); callback(error, attribute); });
                    }
                  }// end while
                }
              }// end for
              // callback(error, result)
            });// end clearexp

          }
          else if (test === '0536F7272792C20796F7520646F6E2774206861766520616E79206F7220656E60000000000000F75676820746F6B656E7320666F72207468697320646174612E0000000000000000000000000000000000000000000000000000000000000000') {
            const warning = "Sorry, you don't have any or enough tokens for this data.";
            clearExpirations(results, () => {
              writeAll(results, () => { logCatcher('Read CALLBACK'); callback(error, warning); });
            });
          } else { callback(error, attribute) }
        });// get json

      } else {
        callback(error, result);
      }
    });

  };


  // result is the bool found from the contract, as well as address of the dimension. This is for testing purposes and is not exported.
  /*Request Format
  {"msg": "", "sig":"", "pubKey":"", "ID":"", "dimensionCtrlAddr":"", "type":""}
  */
  const getDimensionAddress = (formdata, callback) => {
    const {
      sig, type, ID, pubKey, msg,
    } = formdata;

    contract.getDimensionAddress(type, ID, (error, result) => {
      callback(error, result);
    });

  };

  // result is bytes32[100] of public descriptors. This is for testing purposes
  /*Request Format
  {"msg": "", "sig":"", "pubKey":"", "ID":"", "dimensionCtrlAddr":"", "type":""}
  */
  const getPublicDescriptors = (formdata, callback) => {
    const type = Buffer.from(formdata.type).toString('hex');
    const ID = Buffer.from(formdata.ID).toString('hex');
    const { pubKey, msg, sig } = formdata;

    contract.getPublicDescriptors(type, ID, (error, result) => {
      callback(error, result);
    });

  };

  // result is bytes32[100] of private descriptors. This is for testing purposes and is not exported.
  /*Request Format
  {"msg": "", "sig":"", "pubKey":"", "ID":"", "dimensionCtrlAddr":"", "type":""}
  */
  const getPrivateDescriptors = (formdata, callback) => {
    const type = Buffer.from(formdata.type).toString('hex');
    const ID = Buffer.from(formdata.ID).toString('hex');
    const { pubKey, msg, sig } = formdata;

    contract.getPrivateDescriptors(type, ID, (error, result) => {
      callback(error, result);
    });

  };

  /*Request Format
  {"msg": "", "sig":"", "pubKey":"", "ID":"", "dimensionCtrlAddr":"", "dimension":"", "flag":"", "delegatee":"", "all":"", "controller":"", "amount":""}
  */
  const revokeDelegation = (formdata, callback) => {
    const {
      pubKey, msg, sig, delegatee, dimension,
    } = formdata;
    let { amount } = formdata;

    // didnt want to edit the same log
    let delegateeLog;

    const owner = formdata.controller;
    const all = Boolean(formdata.all.toLowerCase() === 'true');// boolean - true or false
    //logCatcher("all delgations being revoked .. change me I'm hardcoded.");
    const spliceArr = [];


    contract.revokeDelegation(keccak_256(owner), keccak_256(delegatee), amount, dimension, all, (error, result) => {
      logCatcher(`REVOKE RESULT: ${result}`);
      if (result) {
        connector.getDimension(formdata.controller, `${String(formdata.dimension)}.json`, 0, (results) => {
          results.txn_id = "revokeDelegation";
          const log = results;
          if (all) { // if the flag is true, just revoke everything from the owner
            if (log.dimension.delegations.length > 0) {
              for (let j = 0; j < log.dimension.delegations.length; j++) {
                if (log.dimension.delegations[j].owner === owner && log.dimension.delegations[j].delegatee === delegatee) {
                  spliceArr.push(j);
                  if (j === (log.dimension.delegations.length - 1)) {
                    if (spliceArr.length > 0) {
                      for (let i = spliceArr.length - 1; i >= 0; i--) { log.dimension.delegations.splice(spliceArr[i], 1); logCatcher(`spliced ${spliceArr[i]}`); }
                    }
                  }
                }
              }
            }
          } else {
            // logic below is similar to the function spendTokens

            // first make sure they have the amount FROM that owner:
            let actualAmount = 0;

            if (log.dimension.delegations.length > 0) {
              for (let z = 0; z < log.dimension.delegations.length; z++) {
                if (log.dimension.delegations[z].delegatee === delegatee && log.dimension.delegations[z].owner === owner && log.dimension.delegations[z].dimension === dimension) {
                  actualAmount += Number(log.dimension.delegations[z].amount);
                }
              }
            }

            // if they have less than the owner wants to remove, just remove how much they have
            if (actualAmount < amount) {
              logCatcher(`actualAmount: ${actualAmount} less than amount: ${amount}`);
              amount = actualAmount;
            }

            if (amount > 0) {
              let keepGoing = true;

              let index = 0;
              while (keepGoing) {
                // first find index in delegations with closest expiration.
                // uint index = 0;
                // This correctly sets var index as the 1st available owner
                for (let n = 0; n < log.dimension.delegations.length; n++) {
                  if (log.dimension.delegations[n].owner === owner && log.dimension.delegations[index].dimension === dimension) {
                    index = n;
                    break;
                  }
                }

                // size of delegations must be greater than zero because actualAmount != 0
                // could probably initialize k=index to save cycles later
                for (let k = 0; k < log.dimension.delegations.length; k++) {
                  if (log.dimension.delegations[k].owner === owner) {
                    if (log.dimension.delegations[k].expiration <= log.dimension.delegations[index].expiration && log.dimension.delegations[index].dimension === dimension) {
                      index = k;
                    }
                  }
                }

                // now spend the amount
                if (amount >= log.dimension.delegations[index].amount) {
                  amount -= log.dimension.delegations[index].amount;
                  logCatcher(`if log amount: ${log.dimension.delegations[index].amount}  index: ${index}  amount: ${amount}`);
                  log.dimension.delegations.splice(index, 1);// this function clears and returns coins back to owner
                } else {
                  // no need to give tokens back to owner--they are infinite and created on the fly
                  logCatcher(`else log amount: ${log.dimension.delegations[index].amount}  index: ${index}  amount: ${amount}`);
                  // just subtract remaining amount from the current delegation amount
                  log.dimension.delegations[index].amount -= amount;
                  keepGoing = false;

                }

                if (amount === 0) {
                  keepGoing = false;
                }
              }// end while(keepgoing)
            }// end if amount>0
          }// end else

          logCatcher(`\n\nREVOKE LOG: ${JSON.stringify(log)}\n\n`);

          connector.bcPreRequest(log.dimension.pubKey, '0x0', log.dimension, '0', '0x0', '0x0', Date.now(), '', '', log.dimension.bigchainID, log.dimension.bigchainHash, 'public', 'Dimension', (res, theId, theHash) => {
            log.dimension.bigchainID = theId;
            log.dimension.bigchainHash = theHash;
            writeAll(log, () => { callback(error, result); });
          });
        });// end get json
      } else { callback(error, result); }
    });

  };
  // returns amount. This is for testing purposes and is not exported.
  /*Request Format
  {"msg": "", "sig":"", "pubKey":"", "ID":"", "dimensionCtrlAddr":"", "dimension":"", "descriptor":"", "delegatee":""}
  */
  const delegateeAmount = (formdata, callback) => {

    const {
      delegatee, dimension, descriptor, msg, sig, pubKey,
    } = formdata;


    contract.delegateeAmount(keccak_256(delegatee), dimension, descriptor, (error, result) => {
      callback(error, result);
    });

  };

  //* *********************************************************************************** */
  /* Request Format
  {"msg": "", "sig":"", "pubKey":"", "dimensionCtrlAddr":"", "type":"", "controller":"", "owner":""}
  */
  const removeController = (formdata, callback) => {

    const {
      controller, owner, msg, sig, pubKey, type,
    } = formdata;

    logCatcher(`----RemoveController----`);
    logCatcher(`owner: ${owner}`);
    logCatcher(`controller: ${controller}`);
    logCatcher(`Dimension: ${type}`);

    contract.removeController(keccak_256(owner), keccak_256(controller), (error, result) => {
      logCatcher(`contract call complete: err:${error}    res:${result}`);
      if (result) {
        connector.getDimension(owner, `${String(formdata.type)}.json`, 0, (results) => {
          results.txn_id = "removeControllerDimension";
          const log = results;
          for (let i = 0; i < log.dimension.dim_controllers_keys.length; i++) {
            if (log.dimension.dim_controllers_keys[i] === controller) {
              log.dimension.dim_controllers_keys.splice(i, 1);
              logCatcher(`Replacing Controller ${controller}`);
              connector.bcPreRequest(log.dimension.pubKey, '0x0', log.dimension, '0', '0x0', '0x0', Date.now(), '', '', log.dimension.bigchainID, log.dimension.bigchainHash, 'public', 'Dimension', (res, theId, theHash) => {
                log.dimension.bigchainID = theId;
                log.dimension.bigchainHash = theHash;
                writeAll(log, () => { callback(error, result); });
              });
            }
          }
        });
      } else { callback(error, result); }
    });
  };

  return {
    Instantiation,
    CreateDimension,
    RemoveDimension,
    addEntry,
    readEntry,
    removeEntry,
    updateEntry,
    changeDescriptor,
    getDimensionAddress,
    delegate,
    revokeDelegation,
    removeController,
    delegateeAmount,
    addController,
    getPublicDescriptors,
    getPrivateDescriptors,
  };

  //* ********************************************************************************** */
};// end IdentityDimensionControl


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// This does all the endpoint listening:
// The variable endpoint references all keys in the json object.
Object.keys(IdentityConfig).forEach((endpoint) => {
  // this is the function to call
  const functionCall = IdentityConfig[endpoint];
  app.post(`/${endpoint}`, (req, res) => {
    const formdata = req.body;
    if (verifyIt(formdata)) {
      logCatcher('\n-----VERIFIED-----\n');
      // their contract address
      const contractAddress = formdata.dimensionCtrlAddr;
      // instantiate their IdentityDimensionControl
      const dimension = IdentityDimensionControl(contractAddress);

      logCatcher(`\ndimensionCtrl address: ${contractAddress} \n ${functionCall} \n ${JSON.stringify(dimension)}`);
      // formulate the string of code for the function call
      const callEndpoint = promisify(dimension[functionCall]);

      (new Promise((resolve, reject) => {
        dimension[functionCall](formdata, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      }))
        .then(result => res.json({ Status: 'OK', result }))
        .catch(error => res.json({ Status: error, result: '' }));

      // callEndpoint(formdata).then(result => res.json({ Status: 'OK', result }))
      //   .catch(error => res.json({ Status: error, result: '' }));
    } else {
      res.send('Try again');
      logCatcher('Try again');
    }
  });
});

app.listen(8001, () => {
  logCatcher('Connected to contract http://10.101.114.231:1337/rpc');
  logCatcher('Listening on port 8001');
});
