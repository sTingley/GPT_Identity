const express = require('express');

const { getConfigManager } = require('../private_modules/global_configuration');

const getAccountConfig = (req, res, cb) => {
  const props = getConfigManager().getAccountConfig();
  cb(200, props);
};

module.exports = (req, res, next) => {
  switch (req.method.toLowerCase()) {
    case 'get':
      if (req.params === undefined || req.params.name === undefined) {
        res.status(400, { message: 'Malformed URL.' });
        return;
      }

      getAccountConfig(req, res, (code, ret) => {
        res.status(code).json(ret);
      });
      break;
    default:
      res.status(501).json({ message: 'Method not implemented for this route.' });
  }
  next();
};
