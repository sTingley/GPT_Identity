// grab the chain configuration:
let contractData; // points to jobs_output
let accountData; // points to accounts json file
let chain; // name of the chain
let globalConfig; // points to global.json

const contracts = require('@monax/legacy-contracts');
const fs = require('fs');
const address = require('../configuration_service/output_files/jobs_output.json').Bigchain;
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const logCatcher = require('../Component/logCatcher');
const { promisify } = require('bluebird');
// this is for signature generation:
const crypto = require('crypto');
const ed25519 = require('ed25519');

const moduleName = require('./package.json').name;

const port = process.env.PORT || 3018;

const loadFiles = async () => {
  globalConfig = JSON.parse(fs.readFileSync('../configuration_service/configuration_files/global.json'));

  chain = globalConfig.properties.primary_account;

  // read the contract data config file
  const promise_jobsOutput = () => (new Promise((resolve, reject) => {
    fs.readFile(globalConfig.jobs[moduleName].base_path, (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          contractData = JSON.parse(data);
          console.log('Resolved promise for contract configuration');
          resolve();
        } catch (e) {
          reject(e);
        }
      }
    });
  }));

  // read the accounts data config file
  const promise_accounts = () => (new Promise((resolve, reject) => {
    fs.readFile(globalConfig.properties.accounts_file_path.replace('%CHAINNAME%', chain), (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          accountData = JSON.parse(data);
          console.log('Resolved promise for accounts configuration');
          resolve();
        } catch (e) {
          reject(e);
        }
      }
    });
  }));
  await promise_accounts();
  await promise_jobsOutput();
};

const init = () => {
  logCatcher(`Chain Configuration Account: ${accountData[chain]}`);
  logCatcher(`Chain URL: ${globalConfig.properties.chainURL}`);
  const ErisAddress = accountData[chain].address;
  logCatcher(`\n\n\nChain Address: ${ErisAddress}`);
  // this library is needed to calculate hash of blockchain id (chain name) and bigchain response
  const keccak256 = require('js-sha3').keccak_256;

  // for calling contract:
  const abi = JSON.parse(fs.readFileSync(`../Solidity/abi/${address}`, 'utf8'));
  const waitingList = [];

  // for calling bigchaindb:
  const bigchainServer = 'http://10.4.1.54:8000/';
  // API for chain
  const chainUrl = globalConfig.properties.chainURL;
  // instantiate contract object manager (uses chain URL and account data)
  const manager = contracts.newContractManagerDev(chainUrl, accountData[chain]);
  // Make the contract object using ABI and address of deployed contract
  const contract = manager.newContractFactory(abi).at(address);


  logCatcher(`\n\n\nChain Address Hash: ${keccak256(ErisAddress)}`);

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

  // This is for signature generation:
  const createSignature = (nonHashedMessage, callback) => {
    // make message hash
    const hash = crypto.createHash('sha256').update(nonHashedMessage).digest('hex');
    const { pubKey, privKey } = accountData[chain];
    const keyPair = { publicKey: Buffer.from(pubKey, 'hex'), privateKey: Buffer.from(privKey, 'hex') };
    const signature = ed25519.Sign(Buffer.from(hash), keyPair).toString('hex');

    callback(signature, pubKey, hash);
  };

  // this handle post requests to bigchaindb
  const bigchainPost = async (
    OwnerPubKey, proposalID, coidData, blockNumber, blockHash, blockchainID,
    timestamp, validatorSigs, serviceSig, visibility, description, callback, ...args
  ) => {
    const thePubkey = OwnerPubKey;
    logCatcher(`In function bigchainIt, pubKey of eris account (ownerPubKey) is: ${thePubkey}`);

    // var description = "Recovery";
    let attrs = [];
    if (typeof (coidData.uniqueIdAttributes) === 'string') {
      attrs = coidData.uniqueIdAttributes.split(',');
    } else { attrs = coidData.uniqueIdAttributes; }

    const trimmed = [];
    // trimming IPFS hashes and sha3 hashes from the uniqueIdAttrs before we write to bcdb
    if (typeof (attrs) === 'undefined') { attrs = ''; }
    logCatcher(`attr: ${typeof (attrs)}`);
    for (let i = 0; i < attrs.length; i += 3) {
      trimmed.push(attrs[i]);
    }
    const tempCoidData = coidData;
    tempCoidData.coidAddr = '';
    tempCoidData.gatekeeperAddr = '';
    tempCoidData.uniqueIdAttributes = trimmed;
    tempCoidData.pubKey = thePubkey;

    // NOTE: signatures inputted to this object should include msg hash, signature and public key
    // NOTE: Coid_Data should include uniqueID and the signature of the one requesting a core identity
    let bigchainInput = {
      Description: description,
      proposalID,
      Coid_Data: tempCoidData,
      blockNumber,
      blockHash,
      blockchainID,
      blockchain_timestamp: timestamp,
      validator_signatures: validatorSigs,
      service_signature: serviceSig,
    };// end json struct

    const metadata = { bigchainID: args[0], bigchainHash: args[1], visibility } || '';
    tempCoidData.bigchainID = '';
    tempCoidData.bigchainHash = '';

    bigchainInput = JSON.stringify({ data: bigchainInput, metadata });
    logCatcher(`In function bigchainIt, the input to be sent to bigchain is: ${bigchainInput}`);
    const bigchainEndpoint = `addData/${thePubkey}/1`;
    const theobj = { method: 'POST', stringJsonData: bigchainInput, endpoint: bigchainEndpoint };
    logCatcher(`Bigchain Request: ${JSON.stringify(theobj)}`);

    // push request and requester into contract queue
    const BigChainQuery = promisify(contract.BigChainQuery);
    const CallbackReady = promisify(contract.CallbackReady.once);
    const myCallback = promisify(contract.myCallback);


    await BigChainQuery(JSON.stringify(theobj), keccak256(tempCoidData.pubKey).toUpperCase())
      .then(async () => CallbackReady())
      .then(async (results) => {
        logCatcher(`addr: ${results.args.addr}\nkey: ${keccak256(tempCoidData.pubKey).toUpperCase()}`);
        if (keccak256(tempCoidData.pubKey).toUpperCase() === results.args.addr) {
          return myCallback(keccak256(tempCoidData.pubKey).toUpperCase());
        }
        return Promise.reject(new Error('keccak256(tempCoidData.pubKey).toUpperCase() !== results.args.addr'));
      })
      .then(async (res) => {
        logCatcher(`RESULT: ${res}`);
        let bigchainID = JSON.parse(res).response;
        logCatcher(`Result.response: ${bigchainID}`);
        bigchainID = JSON.parse(bigchainID).id;
        const bigchainHash = keccak256(JSON.parse(res).response);
        logCatcher(`************: ${JSON.parse(res).response}`);

        const { signature } = JSON.parse(res);
        const { msg } = JSON.parse(res);
        const { pubKey } = JSON.parse(res);
        logCatcher(`pubkey returns is ......: ${pubKey}`);

        logCatcher(`logme: ${ed25519.Verify(Buffer.from(msg), Buffer.from(signature, 'hex'), Buffer.from(pubKey, 'hex'))}`);
        // return results
        return callback(res, bigchainID, bigchainHash);
      });
  };// end bigchain Post

  const bigchainGet = (pubKey, txid, callback) => {
    // const thePubkey = ErisAddress;
    const bigchainEndpoint = `getTransaction/${txid}`;
    const theobj = { method: 'GET', stringJsonData: '', endpoint: bigchainEndpoint };
    logCatcher(`Bigchain Request: ${JSON.stringify(theobj)}`);

    // push request and requester into contract queue
    contract.BigChainQuery(
      JSON.stringify(theobj),
      keccak256(pubKey).toUpperCase(), (error, result) => {
        let theEvent;
        // begin listening for 'callbackReady' event which means
        // you are currently 1st in the list and can retrieve your object
        contract.CallbackReady(
          (err, results) => {
            theEvent = results;
          },
          (err, results) => {
            if (keccak256(pubKey).toUpperCase() === results.args.addr) {
              logCatcher(`callbackready: ${JSON.stringify(results)}`);

              // retieves responce from bigchain that is stored in the contract and parses the text
              contract.myCallback(keccak256(pubKey).toUpperCase(), (errs, res) => {
                logCatcher(`RESULT: ${res}`);
                let bigchainID = JSON.parse(res).response;
                logCatcher(`\nResult.response: ${bigchainID}`);
                bigchainID = JSON.parse(bigchainID).id;
                const bigchainHash = keccak256(JSON.parse(res).response);

                const { signature } = JSON.parse(res);
                const { msg } = JSON.parse(res);
                const { pubKey } = JSON.parse(res);
                logCatcher(`pubkey returns is ......: ${pubKey}`);
                logCatcher(`msg returns is ......: ${msg}`);
                logCatcher(`signature returns is ......: ${signature}`);

                // verify oraclizer signature
                const logme = ed25519.Verify(Buffer.from(msg), Buffer.from(signature, 'hex'), Buffer.from(pubKey, 'hex'));
                logCatcher(logme);

                // for debugging--ignore:
                if (logme === true) {
                  logCatcher('logme is the bool true');
                } else {
                  logCatcher(`logme is not bool true but if this says true, it is a string: ${logme}`);
                }

                // return results
                callback(res, bigchainID, bigchainHash);

                // stop event listening
                theEvent.stop();
              });// end calling of myCallback
            }// end if statement
          },
        );// end callback listening
      },
    );// end bigchain query
  };// end bigchain get

  // eslint-disable-next-line
  const bigchainTransfer = (toPubKey, fromPubKey, txid, flag, callback) => {
    // var thePubkey = ErisAddress;
    const bigchainEndpoint = 'transfer';
    const bigchainInput = {
      toPubKey,
      fromPubKey,
      txid,
      flag,
    };
    const theobj = { method: 'POST', stringJsonData: JSON.stringify(bigchainInput), endpoint: bigchainEndpoint };
    logCatcher(`Bigchain Request: ${JSON.stringify(theobj)}`);

    // push request and requester into contract queue
    contract.BigChainQuery(
      JSON.stringify(theobj),
      keccak256(fromPubKey).toUpperCase(), (error, result) => {
        logCatcher('bigchain query called');
        let theEvent;
        // begin listening for 'callbackReady' event which means you are currently
        // 1st in the list and can retrieve your object
        contract.CallbackReady(
          (err, results) => {
            theEvent = results;
          },
          (err, results) => {
            logCatcher('callback ready called');
            if (keccak256(fromPubKey).toUpperCase() === results.args.addr) {
              logCatcher(`callbackready: ${JSON.stringify(results)}`);

              // retieves responce from bigchain that is stored in the contract and parses the text
              contract.myCallback(keccak256(fromPubKey).toUpperCase(), (errs, res) => {
                logCatcher(`RESULT: ${res}`);
                let bigchainID = JSON.parse(res).response;
                logCatcher(`\nResult.response: ${bigchainID}`);
                bigchainID = JSON.parse(bigchainID).id;
                const bigchainHash = keccak256(JSON.parse(res).response);

                const { signature } = JSON.parse(res);
                const { msg } = JSON.parse(res);
                const { pubKey } = JSON.parse(res);
                logCatcher(`pubkey returns is ......: ${pubKey}`);

                // verify oraclizer signature
                const logme = ed25519.Verify(Buffer.from(msg), Buffer.from(signature, 'hex'), Buffer.from(pubKey, 'hex'));
                logCatcher(logme);

                // for debugging--ignore:
                if (logme === true) {
                  logCatcher('logme is the bool true');
                } else {
                  logCatcher(`logme is not bool true but if this says true, it is a string: ${logme}`);
                }

                // return results
                callback(res, bigchainID, bigchainHash);

                // stop event listening
                theEvent.stop();
              });// end calling of myCallback
            }// end if statement
          },
        );// end callback listening
      },
    );// end bigchain query
  };// end bigchain transfer

  const bigchainTransferFile = async (toPubKey, fromPubKey, callback) => {
    // var thePubkey = ErisAddress;
    const bigchainEndpoint = 'transferFile';
    const bigchainInput = {
      toPubKey,
      fromPubKey,
    };
    const theobj = { method: 'POST', stringJsonData: JSON.stringify(bigchainInput), endpoint: bigchainEndpoint };
    logCatcher(`Bigchain Request: ${JSON.stringify(theobj)}`);

    const BigChainQuery = promisify(contract.BigChainQuery);
    const callbackReady = promisify(contract.CallbackReady.once);
    const myCallback = promisify(contract.myCallback);
    return BigChainQuery(JSON.stringify(theobj), keccak256(fromPubKey).toUpperCase()).then(async () => callbackReady())
      .then(() => myCallback(keccak256(fromPubKey).toUpperCase()))
      .then((res) => {
        logCatcher(`RESULT: ${res}`);
        callback(JSON.parse(res).response);
      });
  };// end bigchain transferFile


  // this service never stops

  const Process = () => {
    const throwErr = (e) => {
      logCatcher(e);
    };
    const getRequestByPubKey = promisify(contract.getRequestByPubKey);
    const getRequest = promisify(request, { multiArgs: true });
    const getCurrentInList = promisify(contract.getCurrentInList);

    contract.listIsEmpty(async (err, res) => {
      logCatcher(`List is empty: ${res}`)
      if (err) {
        return logCatcher('There was an error in ListIsEmpty.');
      } else if (res) {
        return logCatcher('Result was true');
      }
      return getCurrentInList().then(async (queryAddr) => {
        const result = await getRequestByPubKey(queryAddr);
        return [result, queryAddr];
      }).then(async ([result, queryAddr]) => {
        const currentQuery = JSON.parse(result);
        const method = (currentQuery.method === 'GET') ? 'Get' : 'Post';
        const value = await getRequest({
          method,
          url: bigchainServer + currentQuery.endpoint,
          headers: {
            'Content-Type': 'application/json',
          },
          body: currentQuery.stringJsonData,
        });
        return [queryAddr, value[1]];
      }).then(([queryAddr, result]) => {
        createSignature(result, (signature, pubKey, hash) => {
          contract.setCurrentInList(queryAddr, JSON.stringify({
            response: result, pubKey, signature, msg: hash,
          }));
        });
      })
        .catch(throwErr);// end contract.listIsEmpty;
    });
  }; // end recursive function

  // continuous listening for requestMade event, caught after 'BigchainQuery' call
  contract.requestMade(
    () => {
      // do nothing, we never want the event listening to stop
    },
    (error, result) => {
      // check if a query  is progress and of this app should process
      const shouldProcess = waitingList.indexOf(result.args.addr);
      logCatcher(`should process: ${shouldProcess}    result.args.addr ${result.args.addr}`);
      logCatcher(`result: ${JSON.stringify(result.args.addr)}`);
      logCatcher(`wait list: ${waitingList}`);
      Process();
    },
  );


  // continuous listening for CallbackReady event. called after 'setCurrentInList'
  contract.CallbackReady(
    () => {
      // do nothing, we never want the event listening to stop
    },
    (error, result) => {
      // check if a query  is progress and of this app should process
      const shouldProcess = waitingList.indexOf(result.args.addr);
      logCatcher(`should process callbackready: ${shouldProcess}    result.args.addr ${result.args.addr}`);
      Process();
    },
  );

  // process requests in the contract

  // the pubkey stored in the waiting list is hashed
  // change name to postRequest later
  // listing for request to the preRequest endpoint
  app.post('/preRequest', (req, res) => {
    logCatcher(`req: ${req.body}`);
    const formdata = req.body;
    logCatcher(`formdata: ${JSON.stringify(formdata)}`);
    // waiting list allows the app to know if it needs to process a certain request
    waitingList.push(keccak256(formdata.pubKey).toUpperCase());
    // this writes to our object bigchaindb
    bigchainPost(
      formdata.pubKey, formdata.proposalID, JSON.parse(formdata.data),
      formdata.blockNumber, formdata.blockHash, formdata.blockchainID, formdata.timestamp,
      formdata.validatorSigs, formdata.serviceSig, formdata.visibility, formdata.description,
      (result, theId, theHash) => {
        const ret = {
          result,
          theId,
          theHash,
        };
        res.status(200).send(ret);
      }, formdata.bigchainID, formdata.bigchainHash,
    );
    // logCatcher(result);
  });

  // listing for request to the getRequest endpoint
  app.post('/getRequest', (req, res) => {
    logCatcher(`GET req: ${req.body}`);
    const formdata = req.body;
    logCatcher(`formdata: ${formdata}`);
    // waiting list allows the app to know if it needs to process a certain request
    waitingList.push(keccak256(formdata.pubKey).toUpperCase());
    // this gets our object from bigchaindb
    bigchainGet(formdata.pubKey, formdata.txid, (getResult, getId, getHash) => {
      const ret = {
        getResult,
        getId,
        getHash,
      };
      logCatcher(`sending file:\n${JSON.stringify(ret)}`);
      res.send(ret);
    });
  });

  // this is a placeholder/work in progress that isnt used at the moment
  // app.post("/transferRequest", function (req, res) {
  //     logCatcher("req: " + req.body);
  //     var formdata = req.body;
  //     //waiting list allows the app to know if it needs to process a certain request
  //     waitingList.push(keccak256(formdata.fromPubKey).toUpperCase());
  //     bigchainTransfer(formdata.toPubKey, formdata.fromPubKey, formdata.txid,
  //     formdata.flag, function (getResult, getId, getHash) {
  //         var ret = {
  //             'transferResult': getResult,
  //             'transferId': getId,
  //             'transferHash': getHash
  //         }
  //         res.send(ret);
  //     })
  // })

  // listing for request to the transerFileRequest endpoint
  app.post('/transferFileRequest', async (req, res) => {
    logCatcher(`req: ${req.body}`);
    const formdata = req.body;
    // waiting list allows the app to know if it needs to process a certain request
    waitingList.push(keccak256(formdata.fromPubKey).toUpperCase());
    // this transfers 1 person's bigchain data objects to another person.
    // This is used in recovery when you need a new keypair and don't want to lose your assets.
    await bigchainTransferFile(formdata.toPubKey, formdata.fromPubKey, (result) => {
      res.send(result);
    });
  });

  // create the javascript server that listens for requests
  app.listen(port, () => {
    logCatcher('Connected to contract http://localhost:1337/rpc');
    logCatcher('Listening on port 3018');
  });
};

console.log(`Launching app: ${moduleName}`);
loadFiles()
  .then(() => {
    console.log('Configuration loaded!');
    init();
  })
  .catch((error) => {
    console.log(error);
  });
