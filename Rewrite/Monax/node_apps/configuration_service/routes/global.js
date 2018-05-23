const express = require('express');

const { getConfigManager } = require('../private_modules/global_configuration');

const getGlobalProperties = (req, res, cb) => {
  const props = getConfigManager().getGlobalProperties();
  cb(200, props);
};

module.exports = (req, res, next) => {
  switch (req.method.toLowerCase()) {
    case 'get':
      getGlobalProperties(req, res, (code, ret) => {
        res.status(code).json(ret);
      });
      break;
    default:
      res.status(501).json({ message: 'Method not implemented for this route.' });
  }
  next();
};
