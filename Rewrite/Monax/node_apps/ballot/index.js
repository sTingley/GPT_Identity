/*
BALLOT UTILITY MODULE FOR VOTING/ATTESTING TO DATA WITHIN GATEKEEPER/MYGATEKEEPER CONTRACTS

NOTE: The Monax company was formally called 'eris'

TODO:
- Evaluate proposalExpired scenario.
    Currently IDFgatekeeper app or Mygatekeeper app will delete proposal data from ballot
    contract on consensus but we are not deleting any proposals without at least 2 votes
- Evaluate validator vote delegation scenario

This app will leverage a ballot.sol, gatekeeper.sol/mygatekeeper.sol, verification.sol */
let contractStuff = {};

const keccak256 = require('js-sha3').keccak_256;
const app = require('express')();
const fs = require('fs');
const bodyParser = require('body-parser');
const process = require('process');
const secp256k1 = require('secp256k1');
const { promisify } = require('bluebird');
const moduleName = require('./package.json').name;

const port = process.env.PORT || 8072;
const logCatcher = require('../Component/logCatcher');
//
const twinUrl = 'http://10.4.0.167:8000';

const notification = require('../Component/notifications/notifications')(twinUrl);

const global = require('../configuration_service/configuration_files/global.json');
const chainConfigFile = require('../configuration_service/configuration_files/accounts.json')[global.properties.primary_account];
const jobs = require('../configuration_service/output_files/jobs_output.json');
const erisContracts = require('@monax/legacy-contracts');


const getContract = (contractMgr, path, original) => {
  const Abi = JSON.parse(fs.readFileSync(`../Solidity/abi/${path}`));
  return contractMgr.newContractFactory(Abi).at(!original ? path : original);
};

// Enable either filesystem operation or docker-based operation
const loadFiles = async (chainConfig = chainConfigFile) => {
  try {
    logCatcher('Creating Contracts calls.');
    const contractMgr = erisContracts
      .newContractManagerDev(global.properties.chainURL, chainConfig);
    const gateKeeperContract = getContract(contractMgr, jobs.GateKeeper);
    const ballotContract = getContract(contractMgr, jobs.ballot);
    const MyGateKeeperAddress = jobs.MyGateKeeper;
    const ballotContractAddr = jobs.ballot;

    return Promise.resolve({
      contractMgr,
      ballotContract,
      ballotContractAddr,
      gateKeeperContract,
      MyGateKeeperAddress,
      chain: global.properties.primaryAccount,
    });
  } catch (e) {
    return Promise.reject(new Error(e));
  }
};


// for verification
const verifyIt = (formdata) => {
  logCatcher('you have reached verifyIt internal function');
  if (!formdata.msg || !formdata.signature || !formdata.publicKey) return false;
  return secp256k1.verify(Buffer.from(formdata.msg, 'hex'), Buffer.from(formdata.signature, 'hex'), Buffer.from(formdata.publicKey.slice(2), 'hex'));
}; // end verification

const retrieveData = (gateKeeper2, req, callback) => {
  // because a local variable supercedes global variable in this scope:
  // get input:
  const params = req.body;
  const { proposalId } = params;
  const requesterVal = params.publicKey;

  const response = {
    pubKey: '',
    sig: '',
    msg: '',
    uniqueId: '',
    uniqueIdAttributes: [],
    ownershipId: '',
    ownerIdList: [],
    ownershipTokenId: '',
    controlId: '',
    controlIdList: [],
    ownershipTokenAttributes: '',
    ownershipTokenQuantity: [],
    controlTokenId: '',
    controlTokenAttributes: '',
    controlTokenQuantity: [],
    identityRecoveryIdList: [],
    recoveryCondition: [],
  };


  // match hex strings and make sure that the value is not null
  const filterFunction = (value) => {
    const rex = /[0-9A-Fa-f]{6}/g;
    if (typeof (value) === 'string') {
      return value !== '' && rex.test(value) && value !== '0000000000000000000000000000000000000000000000000000000000000000';
    } return false;
  };

  /* getmyUniqueID contract return structure:
          index 0: bool result
          index 1: bytes32 uniqueIdRet
          index 2: string uniqueIdAttributes_nameRet
          index 3: bytes32 uniqueIdAttributes_filehashvalueRet
          index 4: string uniqueIdAttributes_IPFSFileHashRet
          index 5: uint index */

  let counter = 0;
  // (since you can't use i, i = 8 doesn't mean
  // we are on the 8th iterations -- async property)
  let uniqueArray = [];
  // eslint-disable-next-line
  // WARN: This might not works as originally intended, should not manipulate variables from outside of callback.
  // Formulate uniqueIdAttributes
  const getmyUniqueID = promisify(gateKeeper2.getmyUniqueID);
  const getmyOwnershipID = promisify(gateKeeper2.getmyOwnershipID);
  const getmyOwnershipTokenID = promisify(gateKeeper2.getmyOwnershipTokenID);
  const getmyControlID = promisify(gateKeeper2.getmyControlID);
  const getmyControlTokenID = promisify(gateKeeper2.getmyControlTokenID);
  const getmyIdentityRecoveryIdList = promisify(gateKeeper2.getmyIdentityRecoveryIdList);
  const getmyIdentityAuditTrail = promisify(gateKeeper2.getmyIdentityAuditTrail);
  const promiseArray = [];

  for (let i = 0; i < 10; i++) {
    logCatcher(`proposalId is: ${proposalId}`);
    logCatcher(`publicKey is: ${requesterVal}`);
    promiseArray.push(getmyUniqueID(proposalId, i));
  }
  Promise.all(promiseArray)
    .then((arrayResults) => {
      for (let i = 0; i < arrayResults.length; ++i) {
        if (Array.isArray(arrayResults[i])) {
          logCatcher('inside Array.isArray(result)..');
          logCatcher(`before trim, result is: ${arrayResults[i]}`);
          counter++;
          const rex = /[0-9A-Fa-f]{6}/g;
          if ((arrayResults[i][2].trim() && arrayResults[i][4].trim()) &&
            (arrayResults[i][3].trim() && rex.test(arrayResults[i][3]))) {
            logCatcher(`result after trim: ${arrayResults[i]}`);
            uniqueArray.push([arrayResults[i][2], arrayResults[i][4], arrayResults[i][3]]);
          }
          if (counter === 9) {
            response.uniqueIdAttributes = uniqueArray;
            uniqueArray = []; // reset array for another method use
          }
        }
      }
      return getmyOwnershipID(proposalId);
      // CONTRACT RETURNS: bool result, bytes32 ownershipIdRet, bytes32[10] ownerIdListRet
    })
    .then((result) => {
      if (Array.isArray(result)) {
        [, response.ownershipId] = result;
        // filter function will remove the null owners from the list (value of 000000...)
        response.ownerIdList = (result[2].filter(filterFunction));
        return getmyOwnershipTokenID(proposalId);
        // CONTRACT RETURNS: bool result, bytes32 ownershipTokenIdRet,
        // bytes32[10] ownershipTokenAttributesRet, uint ownershipTokenQuantityRet
      }
      return Promise.reject(new Error('getmyOwnershipTokenID result was not an array'));
    })
    .then((result) => {
      if (Array.isArray(result)) {
        [, response.ownershipTokenId] = result;
        response.ownershipTokenAttributes = `${result[2]}`;
        for (let i = 0; i < response.ownerIdList.length; i++) {
          response.ownershipTokenQuantity[i] = `${result[3][i]} `;
          logCatcher(result[3][i]);
        }
        return getmyControlID(proposalId);
        // CONTRACT RETURNS: bool result, bytes32 controlIdRet, bytes32[10] controlIdListRet
      }
      return Promise.reject(new Error('getmyOwnershipTokenID result was not an array'));
    })
    .then((result) => {
      if (Array.isArray(result)) {
        [, response.controlId] = result;
        // filter function will remove the null controllers from the list (value of 000000...)
        response.controlIdList = (result[2].filter(filterFunction));
        return getmyControlTokenID(proposalId);
        // CONTRACT RETURNS: bool result, bytes32 ownershipTokenIdRet,
        // bytes32[10] ownershipTokenAttributesRet, uint ownershipTokenQuantityRet
      }
      return Promise.reject(new Error('getmyControlID result was not an array'));
    })
    .then((result) => {
      if (Array.isArray(result)) {
        [, response.controlTokenId] = result;
        response.controlTokenAttributes = `${result[2]}`;
        for (let i = 0; i < response.controlIdList.length; i++) {
          response.controlTokenQuantity[i] = `${result[3][i]} `;
          logCatcher(result[3][i]);
        }
        logCatcher(result[3]);
        return getmyIdentityRecoveryIdList(proposalId);
        // CONTRACT RETURNS: bool result, bytes32[10] identityRecoveryIdListRet,
        // uint recoveryConditionRet
      }
      return Promise.reject(new Error('getmyControlTokenID result was not an array'));
    })
    .then((result) => {
      if (Array.isArray(result)) {
        // filter function will remove the null recoverers from the list (value of 000000...)
        response.identityRecoveryIdList = (result[1].filter(filterFunction));
        [, , response.recoveryCondition] = result;
        return getmyIdentityAuditTrail(proposalId, requesterVal);
        // CONTRACT RETURNS: string pubkeyRet,bytes32 uniqueIdRet, string sigRet, string messageRet
      }
      return Promise.reject(new Error('getmyIdentityRecoveryIdList result was not an array'));
    })
    .then((result) => {
      if (Array.isArray(result)) {
        [response.pubKey, response.uniqueId, response.sig, response.msg] = result;
        return Promise.resolve();
      }
      return Promise.reject(new Error('getmyIdentityAuditTrail result was not an array'));
    })
    .then(() => callback(response))
    .catch((err) => {
      logCatcher(err);
      callback({ error: 'Unknow error detected' });
    });
};
// first check that a validator is present

// hoisted function: init
const init = () => {
  // var erisContracts = require('eris-contracts')

  // monax:chain id with full privilages

  // Contains Verification.sol calls and methods to
  // write the the digital twin server NotificationCtrl.js
  const BallotApp = (ballotContract = contractStuff.ballotContract) => {
    // eris:chain id with full privilages
    // Change eris:db url

    // ballotContract.proposalExpired(
    //   (error, result) => { },
    //   (error, result) => {
    //     logCatcher('hello');
    //   },
    // );

    // function which willl write the 'voting' notification to the validator/attestor
    // currently this will write to AssetCtrl.js in the Digital Twin server


    // delete a notification ...
    // ST: Is not currently integrated as notification module not completed


    // no reason to write an expired proposal notification at this point in time
    // we can examine this later when we build out a larger notification module
    // createExpiredProposalNotification = function (inputs) {
    //     request.post(twinUrl + "/ballot/writeExpiredProposal")
    //         .send(inputs)
    //         .set('Accept', 'application/json')
    //         .end((err, res) => {
    //             if (res.status == 200) {
    //                 // do something
    //             }
    //         });
    // };

    ballotContract.notifyValidator(() => {
      // do nothing with event, continuously listen.
      // TODO: proper errror handling, function shouldn't continue with an error.
    }, (error, result) => {
      if (error) {
        logCatcher('Notification event exists with error: ', error);
      }
      logCatcher('notifyValidator event reached');
      logCatcher(`event args: ${JSON.stringify(result.args)}`);
      const proposal = result.args.proposalIdToVote;
      const {
        validator, isHuman, myGKaddr, propType,
      } = result.args;

      logCatcher(`isHuman val: ${isHuman}`);
      logCatcher(`address is: ${myGKaddr}`);

      // write to NotificationCtrl file in the Digital Twin server
      if (validator !== '0000000000000000000000000000000000000000000000000000000000000000') {
        notification.createNotification({
          pubKey: validator,
          proposalID: proposal,
          message: 'You have been selected to vote on the proposal.',
          isHuman,
          gatekeeperAddr: myGKaddr,
          propType,
          app: 'ballot',
        });
      }

      logCatcher('pass on err check: ballot contract notify event');
    });
    return {
      verifyIt,
    };
  };// end of ballotApp


  /** *********************************************************************************************
   * Initialize a new ballotApp object
  ********************************************************************************************** */

  BallotApp(); // changed to function call rather than object constructor -alex

  /** *********************************************************************************************
  ********************************************************************************************** */
  /* This endpoint is for voting
  Input Fields (as JSON): msg, signature, publicKey, proposalID, vote */

  app.use(bodyParser.json());
  // for parsing application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post('/vote', async (req, res, next, ballotContract = contractStuff.ballotContract) => {
    /* SAMPLE JSON:
    {"msg": "", "signature":"", "publicKey":"", "proposalID":"", "vote":"" , "sigExpire":"0"} */
    logCatcher('ST: propType can be removed from this endpoint we dont use it here. Only needed in the event');
    logCatcher(`/vote request.body ${JSON.stringify(req.body)}`);
    const {
      msg, signature, publicKey, proposalID,
    } = req.body;
    const vote = parseInt(req.body.vote, 10);

    // if the proposal is an ICA proposal, the signature may expire
    const sigExpire = req.body.sigExpire || 0;
    // const propType = parseInt(req.body.propType, 10);

    logCatcher(`${publicKey} is pub key`);
    logCatcher(`${proposalID} is proposalID`);
    logCatcher(`${signature} is signature`);
    logCatcher(`${vote} is vote`);
    logCatcher(`${msg} is msg`);
    logCatcher(`${sigExpire} is sigExpire`);
    // logCatcher(`${propType} is propType`);

    const isValid = await verifyIt(req.body);

    if (isValid) {
      logCatcher("voter's vote has been verified by oraclizer");
      promisify(ballotContract.vote)(proposalID, vote, publicKey, msg, signature, sigExpire)
        .then((result) => {
          res.json({ status: 'Ok', proposalID, msg: result });
          logCatcher(`You voted ${vote}`);
          logCatcher(`result of vote acceptance: ${result[0]}`);
          notification.deleteNotification({
            pubKey: publicKey,
            pid: proposalID,
          });
        })
        .catch((err) => {
          res.json({ status: 'failed', msg: 'Error on submitting vote', proposal_id: proposalID });
          logCatcher(`Error on submitting vote proposal ID : ${proposalID}`, err);
          logCatcher(err);
        });
    } else {
      logCatcher(`error in validation result: ${isValid}`);
    }
  });


  /* This endpoint is for retreiving the COID data out of a gatekeeper contract
  //Input Fields (as JSON): proposalId, requesterVal
  //TODO: YESVOTESREQUIREDTOPASS?
  //TODO: Call verification oraclizer inside here */
  app.post('/getCoidData', async (req, res, next, ballotContract = contractStuff.ballotContract) => {
    /* SAMPLE JSON:
    {  "publicKey":"","msg":"","signature":"","proposalId":"", "isHuman":true, "gatekeeperAddr":""} */
    // logCatcher("'publicKey' is normally called 'pubKey' everywhere else. Change it!"); this was fixed.
    logCatcher('--------------------\nIn getCoidData');
    const isValid = await verifyIt(req.body);
    if (isValid) {
      logCatcher(`verified: ${isValid}`);
      ballotContract.isValidatorPresent(req.body.proposalId, keccak256(req.body.publicKey), (err, success) => {
          if (err) {
            logCatcher(`isValidatorPresent error: ${err}`);
            res.status(500).send('There was an error on the server');
          } else if (success) {
            logCatcher(`isValidatorPresent: ${success}`);
            // If isHuman is true, we know to get the data out of Gatekeeper.sol (the IDF Gatekeeper)
            if (req.body.isHuman === true || req.body.isHuman === 'true') {
              retrieveData(contractStuff.gateKeeperContract, req, (result) => {
                res.json(result);
              });
            } else {
              logCatcher('inside the else statement -- isHuman false');
              retrieveData(getContract(contractStuff.contractMgr, contractStuff.MyGateKeeperAddress, req.body.gatekeeperAddr), req, (result) => {
                res.json(result);
              });
            }
          }
        },
      );
    } else {
      logCatcher(`error in validation result: ${isValid}`);
      res.status(400).send('Can not be varify');
    }

    // successively call the getters to view the proposal data (as a validator)

    // NOTE: yesVotesRequiredToPass is hardcoded as 2 here ..... we should take it from proposal
    // End of retrieveData function
  }); // End of 'getCoidData' POST

  /** *********************************************************************************************
  ********************************************************************************************** */
  /* This endpoint could be called by soeone who is delegating their
  vote to another (power of attorney)
  NOTE: This has not been integrated and is not currently called as no users are delegating votes
  Input Fields (as JSON): msg, signature, publicKey, proposalID, vote */
  app.post('/delegate', (req, res, next, ballotContract = contractStuff.ballotContract) => {
    const { msg } = req.body;
    const { signature } = req.body;
    const { publicKey } = req.body;
    const { proposalID } = req.body;
    const { toDelegate } = req.body;

    ballotContract.delegate(
      proposalID, toDelegate,
      publicKey, signature, msg, (error, result) => {
        logCatcher(JSON.stringify(result));
        if (result) res.send('Your delegate request has been submitted');
        else res.send('Your delegate request has been denied');
      },
    );
  });

  /** *********************************************************************************************
  ********************************************************************************************** */
  app.get('/getIsProposalExpired', async (req, res, next, ballotContract = contractStuff.ballotContract) => { /*
      logCatcher("inside /getProposalExpired "+ req);
      ballotContract.IsProposalExpired(function (error, result) {
                          res.statusCode = error ? 500 : 200
                          if (error) {
                                  logCatcher("After calling isProposalExpired error : "+ error);
                                  res.write(error + "\n")
                          }
                          else {
                                  watchForEvent();
                                  logCatcher("After calling isProposalExpired result : "+ result);
                                  res.write("result: " + result + "\n")
                          }
                          res.end()
                  }) */
    const isProposalExpired = promisify(ballotContract.IsProposalExpired);
    res.send(await isProposalExpired().then((result) => {
      if (result) return 'proposal expired event has returned';
      return 'proposal expire event has not returned';
    }).catch((err) => {
      logCatcher(err);
      return 'There was an error';
    }));
  });

  app.get('/propIdList', (req, res, next, ballotContract = contractStuff.ballotContract) => {
    ballotContract.proposalIdList(1, (error, result) => {
      logCatcher(result);
      res.send(result);
    });
  });

  /** *********************************************************************************************
  ********************************************************************************************** */

  app.listen(port);
  logCatcher(`App '${moduleName}' is running on port ${port}`);

  /** *********************************************************************************************
  ********************************************************************************************** */
}; // end of init function (ballot logic)

logCatcher(`Launching app: ${moduleName}`);
loadFiles()
  .then((value) => {
    contractStuff = value;
    Object.freeze(contractStuff);
    logCatcher('Configuration loaded!');
    init();
  })
  .catch((error) => {
    logCatcher(error);
  });
