const fs = require('fs');

// Backbone for higher-order function
const jobsFile = './configuration_files/global.json';

let props = {};

const log = async (msg, ...args) => {
  if (args.length > 0) {
    console.log(msg, args);
  } else {
    console.log(msg);
  }
};

const initPropertiesFile = async (path) => {
  log('Loading properties file.');
  fs.readFile(path, (err, data) => {
    if (!err) {
      props = JSON.parse(data);
      log('Loaded properties file.');
    } else {
      log(err);
    }
  });
};

const initWatchPropertiesFile = (path, cb = () => {}) => {
  fs.watchFile(path, { persistent: true }, (curr, prev) => {
    if (curr !== prev) {
      log('Reloading properties file.');
      initPropertiesFile(path, (result) => {
        log('Reloaded properties file.');
      });
    }
  });
};

const getGlobalProperties = () => props;

const getChainConfig = () => JSON.parse(fs.readFileSync(getGlobalProperties().properties.chain_config_file_path));

const getAccountConfig = () => {
  const chainConfig = getChainConfig();

  // Replace the %CHAINNAME% variable in the config with the actual chain name
  let accountsFilePath = getGlobalProperties().properties.accounts_file_path;
  accountsFilePath = accountsFilePath.replace(new RegExp(/%CHAINNAME%/, 'gi'), chainConfig.chainName);

  // Parse the chain's accounts file into a readable object
  JSON.parse(fs.readFileSync(accountsFilePath));
};

const getGlobalConfig = (erisContracts) => {
  const config = getGlobalProperties();
  const chainConfig = getChainConfig();

  const chain = chainConfig.chainName;
  const primaryAccount = config.properties.primary_account;
  const erisdburl = chainConfig.chainURL;
  const accountData = getAccountConfig();
  const contractMgr = erisContracts.newContractManagerDev(this.erisdburl, chainConfig[chain]);

  // return a constructed object
  return {
    chain,
    primaryAccount,
    erisdburl,
    accountData,
    contractMgr,
  };
};

const getModuleConfig = async (basePath, cb) => {
  try {
    fs.readFile(`${basePath}/jobs_output.json`, (err1, data) => {
      if (err1) {
        cb(err1, undefined);
      } else {
        try {
          const obj = JSON.parse(data); // try to parse it
          cb(false, obj);
        } catch (err2) {
          cb(err2, undefined); // failed to parse this jobs_output.json file
        }
      }
    });
  } catch (e) {
    cb(e, undefined);
  }
};

initPropertiesFile(jobsFile);
initWatchPropertiesFile(jobsFile);

// higher order function to return the job config helper functions
const getConfigManager = () => ({
  getChainConfig,
  getAccountConfig,
  getGlobalConfig,
  getGlobalProperties,
  getModuleConfig,
});

module.exports = { getConfigManager };
