var webpack = require('webpack');
var path = require('path');
var DEPLOY_PATH = "C:/Users/1070933/Desktop/GPT_Identity/walletApp-Production";
var BUILD_DIR = path.resolve(DEPLOY_PATH + '/js');
var APP_DIR = path.resolve(__dirname, 'src/app');

var config = {
  entry: APP_DIR + '/index.jsx',
  output: {
    path: BUILD_DIR,
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?/,
        include: APP_DIR,
        loader: 'babel'
      },
      { test: /\.json$/, loader: 'json' }
    ]
  },

};

module.exports = config;
