const eventListener = (MyGKAddr) => {
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