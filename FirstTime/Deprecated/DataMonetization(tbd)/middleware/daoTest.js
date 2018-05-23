'use strict'
var contracts = require('eris-contracts')
var fs = require('fs')
var http = require('http')
var   app = require('express')(),
      bodyParser = require('body-parser');

      // for parsing application/json
      app.use(bodyParser.json());

      // for parsing application/x-www-form-urlencoded
      app.use(bodyParser.urlencoded({ extended: true }));

var chainConfig = require('./config.json')

//Set up addresses for deployed contracts
var address_Dao = require('../contracts/jobs_output.json').daoContract
// Set up abis for deployed contracts
var abi_Dao = JSON.parse(fs.readFileSync('../contracts/abi/' + address_Dao, 'utf8'))

var accounts = require('../contracts/accounts.json')
var chainUrl
var manager
var contract
var server
var hostname = 'localhost';
var port = 8002;

//URL to the rpc endpoint of the eris-db server
chainUrl = chainConfig.eris_db_url;
//Instantiate the contract object manager using the chain URL and the account data.
var manager_full = contracts.newContractManagerDev(chainUrl, accounts[chainConfig.chain+"_full_000"]);
// Instantiate the contract object using the ABI and the address.
var contract_Dao = manager_full.newContractFactory(abi_Dao).at(address_Dao);

app.post("/addValidator", function(req, res){
  var _formdata = req.body;
  contract_Dao.addValidator(_formdata.validatorAddr, _formdata.validatorIP, function (error, result) {
      if (error) {
        res.send("Not able to add. The validator is already in the list.Try a new one." + "\n");
      }
      else {
          res.send("The validator has been added to the list." + "\n");
      }
  });
});


app.post("/isExist", function(req, res){
  var formdata = req.body;
  contract_Dao.isExist(formdata.validatorAddr, function (error, result) {
      res.send("The validator is existing in the list: " + result + "\n");
  });
});

app.get("/getList",function(req, res){
  contract_Dao.getList(function (error, result) {
      if (error) { throw error }
      res.send("The list of validators is: " + result + "\n");
  })
});

http.createServer(app).listen(port, function() {
  console.log("Data Broker server started ... running at "+port);
});
