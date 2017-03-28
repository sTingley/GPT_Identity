var webpack = require('webpack');
var path = require('path');


var DEPLOY_PATH = "/opt/lampp/htdocs/wallet/";
var BUILD_DIR = path.resolve(DEPLOY_PATH+'/js');
var APP_DIR = path.resolve(__dirname, 'src/app');

var config = {
  entry: APP_DIR + '/index.jsx',
  output: {
    path: BUILD_DIR,
    filename: 'data_monitaization.min.js'
  },
  module : {
    loaders : [
      {
        test : /\.jsx?$/,
        exclude: /node_modules/,
        include : APP_DIR,
        loader : 'babel',
        query:{
          presets:['react','es2015']
        }
      },
      { test: /\.json$/, loader: "json" }
    ]
  }
};

module.exports = config;
