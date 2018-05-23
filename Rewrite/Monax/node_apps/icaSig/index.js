
/* REVOKING AND ADDING ATTESTATIONS TO IDENTTIY CLAIM OBJECTS

This app will be interacted with when the user is adding or removing an attestation
on an ALREADY CREATED ICA (identity claim attestation) which sits in a user's digital twin

PLEASE NOTE ANY 'logCatcher()' COMMANDS ARE LEFT IN THE CODE FOR EASE OF DEBUGGING */

// importing required packages and JSONs
const erisContracts = require('@monax/legacy-contracts');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const secp256k1 = require('secp256k1');

const twinUrl = 'http://10.4.0.167:8000';
const notification = require('../Component/notifications/notifications')(twinUrl);

const moduleName = require('./package.json').name;

const port = process.env.PORT || 3004;
const logCatcher = require('../Component/logCatcher');

// for verification
const verifyIt = (formdata) => {
  if (!formdata.msg || !formdata.sig || !formdata.pubKey) return false;
  return secp256k1.verify(Buffer.from(formdata.msg, 'hex'), Buffer.from(formdata.sig, 'hex'), Buffer.from(formdata.pubKey.slice(2), 'hex'));
}; // end verification

const init = () => {
  // These variables are for configuring the javascript server
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


  /** *********************************************************************************************
   * this endpoint adds a revocation signature to an asset and any corresponding dimension
  ********************************************************************************************** */

  app.post('/revokeIca', (req, res) => {
    /*
      var formdata = {
          sig:"",
          msg:"",
          pubkey:"",
          txid:""
      }
      */
    const formdata = req.body;
    logCatcher(`request body...${JSON.stringify(formdata)}`);
    // make predefined object and check signatures
    const isValid = verifyIt(formdata);
    if (isValid) {
      logCatcher(`Is valid value: ${isValid === 'true'}`);

      // get object from bigchain
      notification.bcGetRequest(formdata.pubKey, formdata.txid, (getResult, getId, getHash) => {
        logCatcher('\nbigchainGet finished\n');
        logCatcher(`getresult: ${getResult}`);
        const tempGetResult = JSON.parse(JSON.parse(getResult).response);
        // logCatcher("asset: "+getResult.asset);
        // logCatcher("asset data: "+JSON.stringify(getResult.asset.data));
        // logCatcher("asset data coid: "+getResult.asset.data.Coid_Data);

        // get updated asset from digital twin
        notification.getAsset(tempGetResult.asset.data.Coid_Data.pubKey, tempGetResult.asset.data.Coid_Data.assetID+'.json', 0, (results) => {

          if (results.revocationSignatures) { results.revocationSignatures = results.revocationSignatures.split(','); } else { results.revocationSignatures = [] }

          // push revocation signature into object
          //const rSig = [formdata.msg, formdata.sig, formdata.pubKey, formdata.expiration, new Date().toISOString()];
          //results.revocationSignatures.push(rSig);
          results.revocationSignatures.push(formdata.sig);

          logCatcher(`revocationSignatures: ${results.revocationSignatures}`);
          //logCatcher(`${tempGetResult}`);
          const timestamp = Date.now() / 1000;
          const visibility = tempGetResult.metadata.metadata.visibility;
          const description = results.description;

          // record new object in bigchain and digital twin
          notification.bcPreRequest(results.pubKey, tempGetResult.asset.data.proposalId, results, results.blockNumber, results.blockHashVal, results.blockchainID, timestamp, results.validatorSigs, tempGetResult.asset.data.gatekeeperSig, results.bigchainID, results.bigchainHash, visibility, description, (result, theId, theHash) => {
            logCatcher('\nbigchainPost finished\n');
            results.bigchainID = theId;
            results.bigchainHash = theHash;
            results.txn_id = "revokeIca";

            notification.setAsset(results.pubKey, results.assetID+'.json', 0, 0, results, '', '', ()=> {
            
              logCatcher('\nRevoking ICA Complete\n');
              //revokeIcaFile(formdata.pubKey, tempGetResult.asset.data.proposalID);need to change notif file
              logCatcher('Signature has been revoked');

              // update any dimesions that used the now updated object
              if (results.dimensions) {
                logCatcher(`inside if: ${JSON.stringify(results.dimensions)}`);
                logCatcher(` results.dimensions.length: ${results.dimensions.length}`);
                for (let k = 0; k < results.dimensions.length; k++) {
                  logCatcher(`k: ${k}  results.dimensions.length: ${results.dimensions.length}`);
                  const form = {
                    pubKey: (results.pubKey),
                    type: results.dimensions[k].dimensionName,
                    ID: results.dimensions[k].Id,
                    descriptor: results.dimensions[k].descriptor,
                    attribute: theId,
                    flag: 0,
                    dimensionCtrlAddr: results.dimensionCtrlAddr,
                  };
                  if (form.descriptor !== '') {
                    notification.updateDimensionEntry(form, () => { });
                  }
                  if (k === results.dimensions.length - 1) {
                    res.send('Signatures have been added');
                  }
                }
              } else { res.send('Signature has been added'); }
            });
          });// end bigchainpost
        });// end getAsset
      });// end bigchainget
    }// end isvalid
  });// end app post


  /** *********************************************************************************************
   * this endpoint adds a attestation signature to an asset and any corresponding dimension
  ********************************************************************************************** */
  app.post('/attestIca', (req, res) => {
    /*
      var formdata = {
          sig:"",
          msg:"",
          pubkey:"",
          txid:"",
          "expiration":""
      }
      */
    const formdata = req.body;
    logCatcher(`request body...${JSON.stringify(formdata)}`);

    const isValid = verifyIt(formdata);

    if (isValid) {
      logCatcher(`Is valid value: ${isValid === 'true'}`);
      // get object from bigchain
      notification.bcGetRequest(formdata.pubKey, formdata.txid, (getResult, getId, getHash) => {
        logCatcher('\nbigchainGet finished\n');
        logCatcher(`getresult: ${getResult}`);
        getResult = JSON.parse(JSON.parse(getResult).response);
        // logCatcher("asset: "+getResult.asset);
        // logCatcher("asset data: "+JSON.stringify(getResult.asset.data));
        // logCatcher("asset data coid: "+getResult.asset.data.Coid_Data);

        // get updated object from digital twin
        notification.getAsset(getResult.asset.data.Coid_Data.pubKey, getResult.asset.data.Coid_Data.assetID+'.json', 0, (results) => {
          if (!results.validatorSigs) { results.validatorSigs = []; }

          // push attestation signature into object
          const vSig = [formdata.msg, formdata.sig, formdata.pubKey, formdata.expiration, new Date().toISOString()];
          logCatcher(`adding signature: ${vSig}`);
          results.validatorSigs.push(vSig);
          logCatcher(`AttestedSignatures: ${results.validatorSigs}`);
          const timestamp = Number(new Date().getTime()) / 1000;
          logCatcher(`propID: ${results.proposalId}`);
          const visibility = getResult.metadata.metadata.visibility;
          const description = results.description;

          // record new object in bigchain and digital twin
          notification.bcPreRequest(results.pubKey, results.proposalId, results, results.blockNumber, results.blockHashVal, results.blockchainID, timestamp, results.validatorSigs, getResult.asset.data.gatekeeperSig, results.bigchainID, results.bigchainHash, visibility, description, (result, theId, theHash) => {
            logCatcher('\nbigchainPost finished\n');
            results.bigchainID = theId;
            results.bigchainHash = theHash;
            results.txn_id = "attestIca";
            
            notification.setAsset(results.pubKey, results.assetID+'.json', 0, 0, results, '', '', ()=> {
            //writeToOwner2(results.pubKey, results.assetID, theId, theHash, results.validatorSigs, () => {
              notification.attestIcaFile(formdata.pubKey, results.proposalId, 'signature added', timestamp, results.gatekeeperAddr, formdata.expiration, theId, results.assetID, formdata.pubKey);
              logCatcher('\nAttestinging ICA Complete\n');
              logCatcher(`Signature ${vSig} has been added\n`);

              // update any dimesions that used the now updated object
              if (results.dimensions) {
                logCatcher(`inside if: ${JSON.stringify(results.dimensions)}`);
                logCatcher(` results.dimensions.length: ${results.dimensions.length}`);
                for (let k = 0; k < results.dimensions.length; k++) {
                  logCatcher(`k: ${k}  results.dimensions.length: ${results.dimensions.length}`);
                  const form = {
                    pubKey: (results.pubKey),
                    type: results.dimensions[k].dimensionName,
                    ID: results.dimensions[k].Id,
                    descriptor: results.dimensions[k].descriptor,
                    attribute: theId,
                    flag: 0,
                    dimensionCtrlAddr: results.dimensionCtrlAddr,
                  };
                  if (form.descriptor !== '') {
                    notification.updateDimensionEntry(form, () => { });
                  }
                  if (k >= results.dimensions.length - 1) {
                    res.send('Signatures have been added');
                  }
                }// end for
              } else { res.send('Signature has been added'); }
            });// end writeToOwner2
          });// end bigchainpost
        });// end getAsset
      });// end bigchainget
    }// end isvalid
  });


  /** *********************************************************************************************
  ********************************************************************************************** */

  // create the javascript server that listens for requests
  app.listen(port, () => {
    logCatcher('Connected to contract http://localhost:1337/rpc');
    logCatcher(`Listening on port ${port}`);
  });
};
/** *********************************************************************************************
********************************************************************************************** */
logCatcher(`Launching app: ${moduleName}`);
init();