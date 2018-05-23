// function to send a notification:
// TODO: CHANGE THE ENDPOINT:
// NOTE: THE DIGITAL TWIN will reject it without pubKey

const superAgent = require('superagent');
const logCatcher = require('../logCatcher');

const notifier = (twinUrl) => {
  // from Recovery.js
  const notifyCoidCreation =
  (pubKey, assetID, txnID, txnHash, gkAddr, coidAddr, dimensionCtrlAddr) => {
    logCatcher(`ASSET ID IS: ${assetID}`);
    superAgent.post(`${twinUrl}/setAsset`)
      .send({
        pubKey,
        flag: 0,
        fileName: `${assetID}.json`,
        updateFlag: 1,
        keys: ['bigchainID', 'bigchainHash', 'gatekeeperAddr', 'coidAddr', 'dimensionCtrlAddr'],
        values: [txnID, txnHash, gkAddr, coidAddr, dimensionCtrlAddr],
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) {
          logCatcher(`Error has occured with notifyCoidCreation: ${err}`);
        } else {
          logCatcher(`Notify Coid Creation response is ${res}`);
        }
        // if(res.status === 200){
        // do something
        // }
      });
  };

  // original requirements (requester, proposalId, isHumanVal, gkAddr, propType), propType not used.
  const createProposalPendingNotification = (requester, proposalId, isHumanVal, gkAddr) => {
    logCatcher(`proposal pending event caught.. mygk addr:  ${gkAddr}`);

    superAgent.post(`${twinUrl}/notification/writeNotify`)
      .send({
        pubKey: requester,
        proposalID: proposalId,
        isHuman: isHumanVal,
        gatekeeperAddr: gkAddr,
        message: 'Your proposal is pending for validation',
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) {
          logCatcher(`Error has occured with createProposalPendingNotification: ${err}`);
        } else {
          logCatcher(`Create Proposal Pending Notification response: ${res}`);
        }
        // if(res.status === 200){
        // }
      });
  };

  const getAsset = (pubKey, fileName, flag, callback) => {
    logCatcher(`getting asset: ${fileName} flag: ${flag} pubkey: ${pubKey}`);
    superAgent.post(`${twinUrl}/getAsset`)
      .send({
        pubKey,
        fileName,
        flag,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.status === 200) {
          logCatcher(`GET ASSET RETURNED: ${JSON.stringify(res.body)}\n`);
          let result = res.body;
          if (result.msg === 'Not found.') { result = false; }
          callback(result);
        }
      });
  };

  const getAllOwnedAssets = (pubKey, callback) => {
    superAgent.post(`${twinUrl}/getOwnedAssets`)
      .send({
        pubKey,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.status === 200) {
          logCatcher(`GET OWNED ASSETS RETURNED: ${JSON.stringify(res.body)}\n`);
          const result = res.body;
          callback(result);
        }
      });
  };
  const getAllControlledAssets = (pubKey, callback) => {
    superAgent.post(`${twinUrl}/getControlledAssets`)
      .send({
        pubKey,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.status === 200) {
          logCatcher(`GET OWNED ASSETS RETURNED: ${JSON.stringify(res.body)}\n`);
          const result = res.body;
          callback(result);
        }
      });
  };
  const getAllDelegatedAssets = (pubKey, callback) => {
    superAgent.post(`${twinUrl}/getDelegatedAssets`)
      .send({
        pubKey,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.status === 200) {
          logCatcher(`GET OWNED ASSETS RETURNED: ${JSON.stringify(res.body)}\n`);
          const result = res.body;
          callback(result);
        }
      });
  };
  // Create an Asset in the twin folder (owned, delegated, controlled)
  const setAsset = (pubKey, fileName, flag, updateFlag, data, keys, values, callback) => {
    superAgent.post(`${twinUrl}/setAsset`)
      .send({
        pubKey,
        fileName,
        flag,
        updateFlag,
        data,
        keys,
        values,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.status === 200) {
          logCatcher('\nWRITE COMPLETE\n');
          callback();
        } else { logCatcher('\nWRITE BAD\n'); }
        // do something
        // }
      });
  };

  const createIcaSigNotification = (validator, proposalId, sigExpire, txid, assetId, owner) => {
    const tempTxid = txid || '';
    const tempAssetId = assetId || '';
    const tempOwner = owner || '';
    superAgent.post(`${twinUrl}/signature/writeAttestation`)
      .send({
        pubKey: (validator),
        proposalID: proposalId,
        isHuman: false,
        gatekeeperAddr: '',
        sigExpire,
        message: 'ICA has been attested',
        tempTxid,
        tempAssetId,
        tempOwner,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        // if (res.status === 200) {
        if (err) {
          logCatcher(`Error has occured with createIcaSigNotification: ${err}`);
        } else {
          logCatcher(`create ICA Sig Notification response was: ${res}`);
        }
      });
  };

  const attestIcaFile = (
    pubKey, proposalId, message, timestamp,
    gatekeeperAddr, sigExpire, txid, assetId,
  ) => {
    superAgent.post(`${twinUrl}/signature/writeAttestation`)
      .send({
        pubKey,
        proposalID: proposalId,
        message,
        read_status: false,
        time: timestamp,
        gatekeeperAddr,
        isHuman: false,
        sigExpire,
        txid,
        assetId,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        // if(res.status === 200){
        if (err) {
          logCatcher(`Error has occured with attestIcaFile: ${err}`);
        } else {
          logCatcher(`Attest Ica File response was: ${res}`);
        }
      });
  };

  const getAllOwnedDimensions = (pubKey, callback) => {
    superAgent.post(`${twinUrl}/getOwnedDimensions`)
      .send({
        pubKey,
        flag: 0,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.status === 200) {
          logCatcher(`GET RESBODY : ${JSON.stringify(res.body)}`);
          logCatcher(`CALLBACK IS A :${typeof (callback)}`);
          // for (var i = 0; i < arguments.length; i++) {
          //    logCatcher(String(arguments[i]));
          // }
          const results = res.body;
          callback(results);
          // return res.body;
        }
      });
  };
  const getAllControlledDimensions = (pubKey, callback) => {
    superAgent.post(`${twinUrl}/getControlledDimensions`)
      .send({
        pubKey,
        flag: 1,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.status === 200) {
          logCatcher(`GET RESBODY : ${JSON.stringify(res.body)}`);
          logCatcher(`CALLBACK IS A :${typeof (callback)}`);
          // for (var i = 0; i < arguments.length; i++) {
          //    logCatcher(String(arguments[i]));
          // }
          const results = res.body;
          callback(results);
          // return res.body;
        }
      });
  };
  const getAllDelegatedDimensions = (pubKey, callback) => {
    superAgent.post(`${twinUrl}/getDelegatedDimensions`)
      .send({
        pubKey,
        flag: 2,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.status === 200) {
          logCatcher(`GET RESBODY : ${JSON.stringify(res.body)}`);
          logCatcher(`CALLBACK IS A :${typeof (callback)}`);
          // for (var i = 0; i < arguments.length; i++) {
          //    logCatcher(String(arguments[i]));
          // }
          const results = res.body;
          callback(results);
          // return res.body;
        }
      });
  };
  // Get dimension data from the twin folder (owned, delegated, controlled)
  const getDimension = (pubKey, fileName, flag, callback) => {
    superAgent.post(`${twinUrl}/getDimension`)
      .send({
        pubKey,
        fileName,
        flag,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.status === 200) {
          logCatcher(`GET RESBODY : ${JSON.stringify(res.body)}`);
          logCatcher(`CALLBACK IS A :${typeof (callback)}`);
          // for (var i = 0; i < arguments.length; i++) {
          //    logCatcher(String(arguments[i]));
          // }
          const results = res.body;
          callback(results);
          // return res.body;
        }
      });
  };

  const setDimension = (pubKey, fileName, flag, updateFlag, data, keys, values, callback) => {
    logCatcher('\nSetDimension called\n');
    superAgent.post(`${twinUrl}/setDimension`)
      .send({
        pubKey,
        fileName,
        flag,
        updateFlag,
        data,
        keys,
        values,
      })
      .set('Accept', 'application/json')
      .end(callback);
  };

  // Remove an Dimension in the twin folder (owned, delegated, controlled,callback)
  const deleteDimension = (pubKey, fileName, flag, callback) => {
    superAgent.post(`${twinUrl}/deleteDimension`)
      .send({
        pubKey,
        fileName,
        flag,
      })
      .set('Accept', 'application/json')
      .end(callback);
  };

  const getRecovery = (pubKey, propId, callback) => {
    superAgent.get(`${twinUrl}/recovery/readRecovery/${(pubKey)}`)
      .set('Accept', 'application/json')
      .end((err, res) => {
        logCatcher(`${twinUrl}/recovery/readRecovery/${(pubKey)}`);
        logCatcher(`Recovery RESBODY: ${JSON.stringify(JSON.parse(res.body.data).messages)}\n`);
        const result = JSON.parse(res.body.data).messages;
        if (propId !== '') {
          let found = false;
          for (let j = 0; j < result.length; j++) {
            logCatcher(`resID: ${result[j].proposal_id}\nPropID: ${propId}`);
            if (result[j].proposal_id === propId) { callback(result[j]); found = true; break; }
            if (!found && j === result.length - 1) { callback(false); }
          }
        } else { callback(result); }
      });
  };


  // this.getSignatures = function (pubKey, callback) {
  //     logCatcher("\nsig1\n");
  //     superAgent.get(twinUrl + "/recovery/readRecovery/" + (pubKey))
  //         .set('Accept', 'application/json')
  //         .end((err, res) => {
  //             logCatcher(twinUrl + "/recovery/readRecovery/" + (pubKey));
  //             logCatcher("Recovery RESBODY: " + JSON.stringify(res.body.data) + "\n");
  //             var result = JSON.parse(res.body.data).messages;
  //             callback(result);

  //         });
  // }


  const getSignatures = (pubKey, callback) => {
    logCatcher('\nsig2\n');
    superAgent.get(`${twinUrl}/signature/readAttestation/${(pubKey)}`)
      .set('Accept', 'application/json')
      .end((err, res) => {
        // logCatcher(twinUrl + "/recovery/r/" + (pubKey));
        logCatcher(`Sig RESBODy: ${JSON.stringify(res.body.data.messages)}\n`);
        const result = res.body.data.messages;
        callback(result);
      });
  };


  const deleteIcaEntry = (pid, pubKey, callback) => {
    logCatcher(`delete ica sending: ${pid}   ${pubKey}`);
    superAgent.post(`${twinUrl}/signature/writeAttestation`)
      .send({
        pubKey,
        pid,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        // if(res.status === 200){
        logCatcher('Written to ICA File');
        callback(res.text);
        // }
      });
  };

  const cleanMyTwin = (pubKey, callback) => {
    superAgent.post(`${twinUrl}/recovery/cleanMyTwin/${(pubKey)}`)
      .send({
        pubKey,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        // if(res.status === 200){
        if (err) {
          logCatcher(`Error has occured: ${err}`);
        } else {
          logCatcher(`Cleanup Achieved: ${res}`);
          callback();
        }
      });
  };


  const bcTransferFileRequest = (pubKey1, pubKey2, callback) => {
    logCatcher(`params:\n${pubKey2}`);
    superAgent.post(`${twinUrl}/bigchain/transferFileRequest`)
      .send({
        toPubKey: pubKey1,
        fromPubKey: pubKey2,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) {
          logCatcher(`Error has occured in bcTransferFileRequest: ${err}`);
        } else if (res.status === 200) {
          logCatcher('Bigchain transfer FILE message sent successfully');
          callback(Boolean(JSON.stringify(res.text)));
        } else {
          logCatcher(`bcTransferFileRequest was not successful: ${res}`);
        }
      });
  };

  const transferRecovery = (toPubKey, fromPubKey, callback) => {
    superAgent.post(`${twinUrl}/recovery/transferRecovery`)
      .send({
        toPubKey,
        fromPubKey,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        // if (res.status === 200) {
        logCatcher(`res: ${JSON.stringify(res)}`);
        logCatcher(`${twinUrl}/recovery/transferRecovery from:${(fromPubKey)}`);
        callback(res.text);
        // }
        // else{callback(false);}
      });
  };

  const createRecoveryNotification = (params, recoveryAddr, pubKey) => {
    logCatcher(`params:\n${JSON.stringify(params)}`);
    superAgent.post(`${twinUrl}/recovery/writeRecovery`)
      .send({
        pubKey,
        proposalID: params.proposalId,
        isHuman: true,
        proposal_id: params.proposalId,
        gatekeeperAddr: params.gatekeeperAddr,
        coidAddr: params.coidAddr,
        dimensionCtrlAddr: params.dimensionCtrlAddr,
        trieAddr: params.trieAddr,
        txid: params.bigchainID,
        assetId: params.assetID,
        uniqueId: params.uniqueId,
        recoveryAddr,
        owner: params.pubKey,
        message: 'Your Recovery has been stored',
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.status === 200) {
          logCatcher('recovery message sent successfully');
        }
      });
  };

  const deleteRecoveryNotification = (pid, pubKey, callback) => {
    logCatcher(`sending: ${pid}   ${pubKey}`);
    superAgent.post(`${twinUrl}/recovery/deleteRecovery`)
      .send({
        pubKey,
        pid,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        // if (res.status === 200) {
        logCatcher('recovery delete sent successfully');
        callback(res.text);
        // }
      });
  };

    // from Ballot.js
  const createNotification = (inputs) => {
    superAgent.post(`${twinUrl}/notification/writeNotify`)
      .send(inputs)
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) { logCatcher(`/writeNotify error: ${err}`); } else {
          logCatcher(`Create Notification response: ${res}`);
        }
        // if (res.status === 200) {
        // do something
        // }
      });
  };
  const deleteNotification = (inputs) => {
    logCatcher('/deleteNotify---------------------------------------');
    superAgent.post(`${twinUrl}/notification/deleteNotify`)
      .send(inputs)
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) { logCatcher(`/deleteNotify error: ${err}`); } else {
          logCatcher(`delete Notification response: ${res}`);
        }
        // if (res.status === 200) {
        // do something
        // }
      });
  };
    // Nothing New from MyGateKeeper.js
    // From MyCOID_dev.js
  const createAsset = (pubKey, fileName, flag, data) => {
    superAgent.post(`${twinUrl}/setAsset`)
      .send({
        pubKey,
        fileName,
        flag,
        data,
        updateFlag: 0,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) {
          logCatcher(`Error has occured with createAsset: ${err}`);
        } else {
          logCatcher(`Create Asset response: ${res}`);
        }
        // if(res.status === 200){
        // do something
        // }
      });
  };
  const updateAsset = (pubKey, fileName, flag, data, keys, values) => {
    superAgent.post(`${twinUrl}/setAsset`)
      .send({
        pubKey,
        fileName,
        flag,
        keys,
        values,
        updateFlag: 1,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) {
          logCatcher(`Error has occured with updateAsset: ${err}`);
        } else {
          logCatcher(`Update Asset response: ${res}`);
        }
        // if(res.status === 200){
        // do something
        // }
      });
  };
  const removeAsset = (pubKey, fileName, flag) => {
    superAgent.post(`${twinUrl}/deleteAsset`)
      .send({
        pubKey,
        fileName,
        flag,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) {
          logCatcher(`Error has occured with removeAsset: ${err}`);
        } else {
          logCatcher(`Remove Asset response: ${res}`);
        }
        // if(res.status === 200){
        // do something
        // }
      });
  };

  // From IdentityDimensionControl.js
  // Slightly different from previous function of the same name
  const bcPreRequest = (
    pubKey, proposalId, data, blockNumber, blockHashVal, blockchainID,
    timestamp, validatorSigs, serviceSig, bigchainID, bigchainHash,
    visibility, description, callback,
  ) => {
    logCatcher(`params:\n${pubKey}`);
    // creating new object in the off chance this edits
    // the original passed in object like in writeall delegations
    const newObj = Object.assign({}, data);
    newObj.coidAddr = '';
    newObj.address = '';
    newObj.dimensionCtrlAddr = '';
    // newObj.delegations = ""
    superAgent.post(`${twinUrl}/bigchain/preRequest`)
      .send({
        pubKey,
        proposalId,
        data: JSON.stringify(newObj),
        blockNumber,
        blockHashVal,
        blockchainID,
        timestamp,
        validatorSigs,
        serviceSig,
        bigchainID,
        bigchainHash,
        visibility,
        description,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) { logCatcher(`error bcPreRequest: ${err}`); }
        if (res.status === 200) {
          logCatcher('Bigchain message sent successfully');
          callback(res.body.result, res.body.theId, res.body.theHash);
        }
      });
  };

    // from icaSig
    // Not sure if these are suppose to be in the Notifications
    // but have similar naming to other notification functions
  const updateDimensionEntry = (formdata, callback) => {
    superAgent.post(`${twinUrl}/dimensions/updateEntry`)
      .send(formdata)
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.status === 200) {
          logCatcher(`UPDAT ASSET: ${JSON.stringify(res.body)}\n`);
          const result = res.body;
          callback(result);
        }
      });
  };
  const bcGetRequest = (pubKey, txid, callback) => {
    logCatcher(`params:\n${pubKey}`);
    superAgent.post(`${twinUrl}/bigchain/getRequest`)
      .send({
        pubKey,
        txid,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.status === 200) {
          logCatcher(`Bigchain Get successfully recieved:\n${JSON.parse(res.text).getResult.response}`);
          callback(JSON.parse(res.text).getResult, res.text.getId, res.text.getHash);
        }
      });
  };
  return {
    attestIcaFile,
    bcGetRequest,
    bcPreRequest,
    bcTransferFileRequest,
    cleanMyTwin,
    createAsset,
    createIcaSigNotification,
    createNotification,
    createProposalPendingNotification,
    createRecoveryNotification,
    deleteDimension,
    deleteIcaEntry,
    deleteNotification,
    deleteRecoveryNotification,
    getAllOwnedAssets,
    getAllControlledAssets,
    getAllDelegatedAssets,
    getAllOwnedDimensions,
    getAllControlledDimensions,
    getAllDelegatedDimensions,
    getAsset,
    getDimension,
    getRecovery,
    getSignatures,
    notifyCoidCreation,
    removeAsset,
    setAsset,
    setDimension,
    transferRecovery,
    updateAsset,
    updateDimensionEntry,
  };
};// end of notifier
module.exports = notifier;
