"use strict";
var   app = require('express')(),
      http = require('http'),
      bodyParser = require('body-parser');

var validationHandler = require('./validationHandler.js');
var DAO = require('./Dao.js');

// for parsing application/json
app.use(bodyParser.json());

// for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

app.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("X-Powered-By", "TCS");
    next();
});

app.get('/personaldata', function(req, res){

});

app.post("/requestData", function(req, res){
  var _formdata = req.body;
  var validator = new validationHandler(_formdata);
  var result = validator.validate(function(data){
    var dao = new DAO();
    dao.getDAOValidators(function(result){
      var validators = dao.filterDaoValidators(result[0]);
      var COID = data[0].block.transactions[0].transaction.asset.data;
      // Ensure you have validator signatures in the CHAIN
      dao.validateValidators(validators, COID.validator_signatures, function(status){
        status = true;
        res.json({"status":status});
      });
    });
  });
});

http.createServer(app).listen(5051, function() {
  console.log("Data Broker server started ... running at 5051")
});
