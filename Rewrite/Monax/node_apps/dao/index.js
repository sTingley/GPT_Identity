let contractData; // points to jobs_output
let accountData; // points to accounts json file
let chain; // name of the chain
let globalConfig; // points to global.json
let addressDao;
let abiDao;
let chainUrl;

const contracts = require('@monax/legacy-contracts');
const fs = require('fs');
const { promisify } = require('bluebird');
const app = require('express')();
const bodyParser = require('body-parser');
// Set up addresses for deployed contracts

const logCatcher = require('../Component/logCatcher');
const moduleName = require('./package.json').name;

const port = process.env.PORT || 8002;

const throwErr = (e) => {
  logCatcher(e);
};

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
          logCatcher('Resolved promise for contract configuration');
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
          logCatcher('Resolved promise for accounts configuration');
          resolve();
        } catch (e) {
          reject(e);
        }
      }
    });
  }));

  await promise_accounts();
  await promise_jobsOutput();

  chainUrl = globalConfig.properties.chainURL; // eslint-disable-line prefer-destructuring
  addressDao = require(globalConfig.jobs[moduleName].base_path).Dao; // eslint-disable-line
  // Set up abis for deployed contracts
  abiDao = JSON.parse(fs.readFileSync(`../Solidity/abi/${addressDao}`, 'utf8')); // TODO: point the config at this
};
const init = () => {
  // Instantiate the contract object manager using the chain URL and the account data.
  const managerFull = contracts.newContractManagerDev(chainUrl, accountData[chain]);
  // Instantiate the contract object using the ABI and the address.
  const contractDao = managerFull.newContractFactory(abiDao).at(addressDao);

  // this configures a server and how it handles requests.
  // many of the 'if' statements below can be seen as
  // api endpionts, checking 'request.url' as the endpoint

  app.use(bodyParser.json());

  // Get the list of validators from Dao
  // Currently this list is of size 35 of hexstrings
  app.get('/getList', (req, res) => {
    promisify(contractDao.getList)()
      .then((value) => {
        res.status(200).send(`The list of validators is: ${value}\n`);
      }, throwErr);
  });

  // Add a validator to the list of validators in the Dao
  // and fire event 'validatorAddedNotification'
  // returns a boolean true from the contract if the validator is added
  // Reasons for false response: duplicate entry
  app.post('/addValidator', (req, res) => {
    promisify(contractDao.addValidator)(req.body.validatorAddr, req.body.validatorIP)
      .then((result) => {
        const statusCode = result ? 200 : 500;
        const message = result ? `The new Validator: ${req.body.validatorAddr} has been added to the list.`
          : 'Not able to add. The validator is already in the list.Try a new one.';
        res.status(statusCode).send(message);
      }, throwErr);
  });

  // Get total numbers of validators in the DAO (integer)
  app.get('/totalValidator', (req, res) => {
    promisify(contractDao.totalValidator)()
      .then((value) => {
        logCatcher(`The total number of validators is: ${value}\n`);
        res.status(200).send(`The total number of validators is: ${value}\n`);
      // callback();
      }, throwErr);
  });

  // Check if the validator is existing in the list
  // ST: isExist is an internal method so this should fail if we try
  app.post('/isExist', (req, res) => {
    promisify(contractDao.isExist)(req.body.validatorAddr)
      .then((value) => {
        const statusCode = value ? 200 : 500;
        const message = value ? `The validator exists in the list: ${value}`
          : 'The validator does not exist';
        res.status(statusCode).send(message);
      }, throwErr);
  });

  // Remove existing validator from Dao
  // Will return a true value if validator is removed
  // ST: suggest we update this to return a uint
  app.post('/removeValidator', (req, res) => {
    promisify(contractDao.removeValidator)(req.body.validatorAddr)
      .then((value) => {
        const statusCode = value ? 200 : 500;
        const message = value ? `The old validator: ${req.body.validatorAddr} has been removed`
          : 'Not able to remove it. The validator is not in the list. Enter a valid input\n';
        res.status(statusCode).send(message);
      }, throwErr);
  });


  // create the javascript server that listens for requests on a port
  app.listen(port, () => logCatcher(`Server running on port: ${port}/`));
};

logCatcher(`Launching app: ${moduleName}`);
loadFiles()
  .then(() => {
    logCatcher('Configuration loaded!');
    init();
  })
  .catch((error) => {
    logCatcher(error);
  });
