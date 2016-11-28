'use strict';
var app = require('express')(),
        config = require('./config.json'),
    proxy = require('http-proxy-middleware'),
    bodyParser = require('body-parser'),
    fileUpload = require('express-fileupload'),
    NotificationCtrl = require('./NotificationCtrl.js'),
    AssetCtrl = require('./AssetCtrl.js'),
    http = require('http'),
    expiredNotification = require('./expiredNotification.js'),
    IPFS = require('./ipfs.js'),
    MyCoidConfig = require('./MyCoidConfig.json');

 // for parsing application/json
app.use(bodyParser.json());

 // for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

app.use(fileUpload());

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", config.env.allowed_orgins);
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});
