// grab the chain configuration:
const { promisify } = require('bluebird');
const logCatcher = require('../Component/logCatcher');
const moduleName = require('./package.json').name;

// for calling contract:
const monax = require('@monax/legacy-contracts');
const fs = require('fs');

//* DEBUG--does this cause errors?
const secp256k1 = require('secp256k1');
// API for chain

const loadFiles = async () => {
  const contractsStuff = {};
  contractsStuff.globalConfig = JSON.parse(fs.readFileSync('../configuration_service/configuration_files/global.json'));

  contractsStuff.chain = contractsStuff.globalConfig.properties.primary_account;

  // read the chain configuration
  const promise_chainConfig = globalConfig => (new Promise((resolve, reject) => {
    logCatcher('Initialized promise for chain configuration');
    fs.readFile(globalConfig.properties.chain_config_file_path, (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          contractsStuff.chainConfig = JSON.parse(data);
          logCatcher('Resolved promise for chain configuration');
          resolve();
        } catch (e) {
          reject(e);
        }
      }
    });
  }));

  // read the contract data config file
  const promise_jobsOutput = globalConfig => (new Promise((resolve, reject) => {
    fs.readFile(globalConfig.jobs[moduleName].base_path, (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          contractsStuff.contractData = JSON.parse(data);
          logCatcher('Resolved promise for contract configuration');
          resolve();
        } catch (e) {
          reject(e);
        }
      }
    });
  }));

  // read the accounts data config file
  const promise_accounts = globalConfig => (new Promise((resolve, reject) => {
    fs.readFile(globalConfig.properties.accounts_file_path.replace('%CHAINNAME%', contractsStuff.chain), (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          contractsStuff.accountData = JSON.parse(data);
          logCatcher('Resolved promise for accounts configuration');
          resolve();
        } catch (e) {
          reject(e);
        }
      }
    });
  }));

  await promise_chainConfig(contractsStuff.globalConfig);
  await promise_accounts(contractsStuff.globalConfig);
  await promise_jobsOutput(contractsStuff.globalConfig);
  // eslint-disable-next-line global-require, import/no-dynamic-require
  contractsStuff.address = require(contractsStuff.globalConfig.jobs[moduleName].base_path).Dao;
  // Set up abis for deployed contracts
  contractsStuff.abi = JSON.parse(fs.readFileSync(`../Solidity/abi/${contractsStuff.address}`, 'utf8')); // TODO: point the config at this
};

const verify = (msg, signature, pubKey) => secp256k1.verify(
  Buffer.from(msg, 'hex'),
  Buffer.from(signature, 'hex'),
  Buffer.from(pubKey, 'hex'),
);
  // INPUT msg: This is a hex string of the message hash from wallet
  // INPUT signature: This is a hex string of the signature from wallet
  // INPUT pubKey: This is a hex string of the public key from wallet

// could maybe reduce a few contract calls here
const Process = async (contracts) => {
  const throwErr = (e) => {
    logCatcher(e);
  };
  return Promise.resolve()
    .then(contracts.listIsEmpty())
    .then((value) => {
      if (value !== false) return Promise.reject(new Error('Value = true'));
      return contracts.getCurrentInList();
    })
    .then(queryAddr => [queryAddr, contracts.getRequestByAddress(queryAddr)])
    .then((value) => {
      promisify(contracts.setCurrentInList)(
        value[0],
        verify(value[1][0], value[1][1], value[1][2]).toString(),
      );
      Promise.resolve(true);
    }, (e) => {
      throwErr(e);
      Promise.resolve(false);
    });
};

const init = (contractsInfo) => {
  logCatcher(`Chain configuration account: ${contractsInfo.chainConfig.primaryAccount}`);
  logCatcher(`Chain URL: ${contractsInfo.chainConfig.chainURL}`);
  const { chainURL } = contractsInfo.chainConfig;
  // instantiate contract object manager (uses chain URL and account data)
  const manager = monax.newContractManagerDev(chainURL, contractsInfo.chainConfig.primaryAccount);
  // Make the contract object using ABI and address of deployed contract
  const contract = manager.newContractFactory(contractsInfo.abi).at(contractsInfo.address);
  // these are for the function Process
  // verify function
  // continuous listening for requestMade event ('VerificationQuery', Verification.sol)
  contract.requestMade(
    () => {
    // do nothing, we never want the event listening to stop
    },
    () => {
      Process(contract);
    },
  );

  // continuous listening for CallbackReady event ('setCurrentInList', Verification.sol)
  contract.CallbackReady(
    () => {
    // do nothing, we never want the event listening to stop
    },
    () => {
      Process(contract);
    },
  );
};

logCatcher(`Launching app: ${moduleName}`);
loadFiles()
  .then((contracts) => {
    logCatcher('Configuration Loaded!');
    init(contracts);
  })
  .catch((error) => {
    logCatcher(error);
  });

module.exports = {
  Process,
  verify,
};
