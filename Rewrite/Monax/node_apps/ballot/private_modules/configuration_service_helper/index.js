const fs = require('fs');
const request = require('request');

let config = {};
const routes = {};

const loadRoutes = (cb) => {
  const data = fs.readFileSync('./private_modules/configuration_service_helper/api.json');
  cb(data);
};

/* eslint-disable no-param-reassign */
const formatRoute = (url) => {
  url = url.replace(new RegExp(/%SCHEMA%/, 'gi'), config.settings.schema);
  url = url.replace(new RegExp(/%BASEURL%/, 'gi'), config.settings.baseurl);
  if (config.settings.port !== 0) url = url.replace(new RegExp(/%PORT%/, 'gi'), `:${config.settings.port}`);

  return url;
};
/* eslint-enable no-param-reassign */

const handleRequest = (url, cb) => {
  request.get(url)
    .on('response', (response) => {
      if (response.statusCode === 200) {
        cb(response.body);
      } else {
        cb(undefined);
      }
    });
};

const getChainConfig = async (cb) => {
  handleRequest(routes.config, (filteredResponse) => {
    cb(filteredResponse);
  });
};

const getAccountConfig = async (cb) => {
  handleRequest(routes.accounts, (filteredResponse) => {
    cb(filteredResponse);
  });
};

const getGlobalProperties = async (cb) => {
  handleRequest(routes.global, (filteredResponse) => {
    cb(filteredResponse);
  });
};

const getModuleConfig = async (modname, cb) => {
  const path = routes.module.replace(new RegExp(/%NAME%/, 'gi'), modname);
  handleRequest(path, (filteredResponse) => {
    cb(filteredResponse);
  });
};

const getGlobalConfig = (erisContracts, callback) => {
  let conf;
  let chainConfig;
  let chain;
  let primaryAccount;
  let erisdburl;
  let accountData;
  let contractMgr;

  const p1 = getGlobalProperties((data) => {
    conf = data;

    primaryAccount = conf.properties.primary_account;
  });

  const p2 = getChainConfig((data) => {
    chainConfig = data;

    chain = chainConfig.chainName;
    erisdburl = chainConfig.chainURL;

    contractMgr = erisContracts.newContractManagerDev(this.erisdburl, chainConfig[chain]);
  });

  const p3 = getAccountConfig((data) => {
    accountData = data;
  });

  // Create a promise that awaits on p1, p2, and p3 (above) to resolve
  // ... then resolves itself. When resolved, call the user-defined callback (with their requested data)
  Promise.all(p1(), p2(), p3()).then(() => {
    callback({
      global: conf,
      chain,
      chainConfig,
      primaryAccount,
      erisdburl,
      accountData,
      contractMgr,
    });
  });
};

const getConfigHelper = () => ({
  getChainConfig,
  getAccountConfig,
  getGlobalConfig,
  getGlobalProperties,
  getModuleConfig,
});

loadRoutes((data) => {
  config = JSON.parse(data);
  Object.keys(config.call_routes).forEach((k) => {
    routes[k] = formatRoute(config.call_routes[k]);
  });
});

module.exports = getConfigHelper;
