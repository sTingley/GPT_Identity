"use strict";
var app = require('express')(),
    http = require('http'),
    config = require('./config.json'),
    keccak_256 = require('js-sha3').keccak_256,
    fs = require('fs'),
    bodyParser = require('body-parser');

var superagentRequest = require("superagent");
var validationHandler = require('./validationHandler.js');
var DAO = require('./Dao.js');
var DataBrokerContractInterface = require('./DataBrokerContractInterface.js');
var dataBrokerContractEventListener = require('./DataBrokerEventListener.js');
var superagentRequest = require("superagent");
var dmConfig = require("./config.json");

var BigchainHandler = function() {

    // this function creates and retrieves the asset to the data requester
    // also, it updates the proposal status to 'transferCompleted' in data broker contract
    this.createAndTransferAsset = function(formdata, response, successMessage, callback) {
        console.log("createAndTransferAsset called");

        var dataBrokerApp = new DataBrokerContractInterface();
        var proposalData;
        var proposalId = formdata.proposalId;
        // first get the proposal details
        dataBrokerApp.getProposalData(proposalId, function(error, proposalDataResult) {
            if (error) {
                console.log("error from getProposalData ", error);
            } else {
                proposalData = proposalDataResult;
                var inputs = {
                    'owner_publickey': proposalData.ownerPubkey,
                    'amount': proposalData.requesterSuggestedPrice,
                    'requester_publickey': proposalData.requesterPubkey,
                    'access_type': 'private',
                    'data_type': proposalData.dimension
                }
                console.log("bigchain url ", dmConfig.bigchaindb_driver_url + "/create");
                console.log("inputs ", inputs);

                //create the asset and use the token generated to retrieve the asset
                superagentRequest.post(dmConfig.bigchaindb_driver_url + "/create")
                    .set('Content-Type', 'application/json')
                    .send(inputs)
                    .end((err, res) => {
                        if (err) {
                            console.log("err from bigchain driver");
                        } else if (res.status == 200) {
                            console.log("Asset Created Successfully");
                            // Retrieve the created asset
                            var secret = res.body.token;
                            superagentRequest.get(dmConfig.bigchaindb_driver_url + "/retrieve/" + secret)
                                .end((err, res) => {
                                    if (err) {
                                        console.log("Error in asset retrieval");
                                    } else if (res.status == 200) {
                                        res.body.successMessage = successMessage;
                                        console.log("Assets retrieved successfully");
                                        // update 'transferCompleted' status to contract
                                        dataBrokerApp.updateProposal(formdata, function(error, resultFromUpdateProposal) {
                                            if (error) {
                                                console.log("error from contract ", error);
                                            } else {
                                                console.log("contract result ", resultFromUpdateProposal);
                                                callback(response, res.body);
                                            }
                                        });

                                    }
                                }); // superagentRequest end
                        } // else if
                    }); // superagentRequest end
            } // else
        }); // getProposalData end
    } // this.createAndTransferAsset end
};
// for parsing application/json
app.use(bodyParser.json());

// for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true
}));

app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("X-Powered-By", "TCS");
    next();
});

app.post("/requestData", function(req, res) {
    var _formdata = req.body;
    var validator = new validationHandler(_formdata);
    var result = validator.validate(function(data) {
        var dao = new DAO();
        dao.getDAOValidators(function(result) {
            var validators = dao.filterDaoValidators(result[0]);
            var COID = data[0].block.transactions[0].transaction.asset.data;
            // Ensure you have validator signatures in the CHAIN
            dao.validateValidators(validators, COID.validator_signatures, function(status) {
                status = true;
                res.json({
                    "status": status
                });
            });
        });
    });
});

// Creating a new proposal
app.post("/dataRequestProposal", function(req, res) {
    var formdata = {};
    formdata.requesterPubkey = req.body.requester_publickey;
    formdata.requesterAlias = "xyz.com";
    formdata.ownerPubkey = req.body.owner_publickey;
    formdata.ownerAlias = "";
    formdata.dimension = req.body.datatype;
    formdata.suggestedPrice = parseInt(req.body.suggested_price) || 0;
    var dataBrokerApp = new DataBrokerContractInterface();
    dataBrokerApp.submitProposal(formdata, function(error, result) {
        if (error) {
            res.json({
                "Message": "Failed",
                "error": error
            });
        } else {
            res.json({
                "Message": "Success",
                "ProposalId": result
            });
        }
    });
});

// fetch existing proposal <proposal_id>
app.get('/dataRequestProposal', function(req, res) {
    var result = false;
    var proposalId;
    if (req.query.id) {
        proposalId = req.query.id;
    }

    var dataBrokerApp = new DataBrokerContractInterface();
    dataBrokerApp.getProposalData(proposalId, function(error, proposalDataResult) {
        if (error) {
            res.json({
                "error": error
            });
        } else {
            res.json({
                "success": true,
                "proposalData": proposalDataResult
            });
        }
    });
});

// Negi - Remove
app.post('/ownerResponse', function(req, res) {
    var formdata = {
        "proposalId": "00030D79B13852BB1166B16BDC723CE5206B10B42A5E15AC260C4C8480034892",
        "responseStatusCode": 3,
        "counteredPrice": 15
    };
    formdata.proposalId = req.body.proposalId || formdata.proposalId;
    formdata.responseStatusCode = parseInt(req.body.responseStatusCode) || formdata.responseStatusCode;
    formdata.counteredPrice = parseInt(req.body.counteredPrice) || formdata.counteredPrice;

    var dataBrokerApp = new DataBrokerContractInterface();
    dataBrokerApp.updateOwnerResponse(formdata, function(error, result) {
        if (error) {
            res.json({
                "error": error
            });
        } else {
            res.json({
                "message": "success",
                "result": result
            });
        }
    });
    // res.json({"ownerResponse":"ownerResponse"});
});

// Nego - Remove
/*
app.post("/requesterResponse", function(req, res) {
    // var formdata = req.body;
    var formdata = {
        "proposalId": "00030D79B13852BB1166B16BDC723CE5206B10B42A5E15AC260C4C8480034892",
        "requesterSuggestedPrice": 12,
        "responseStatusCode": 0
    };

    formdata.proposalId = req.body.proposalId || formdata.proposalId;
    formdata.requesterSuggestedPrice = parseInt(req.body.requesterSuggestedPrice) || formdata.requesterSuggestedPrice;
    formdata.responseStatusCode = parseInt(req.body.responseStatusCode) || formdata.responseStatusCode;

    console.log("Form data from requesterResponse ===> ", formdata);
    if (formdata.responseStatusCode == 6) {
        var bigchainInterface = new BigchainHandler();
        bigchainInterface.createAndTransferAsset(formdata, res, "Asset Retrieved Successfully",
            function(response, inputs) {
                response.json(inputs);
            }
        );
        // res.json({"hi":"hi"})
    } else {
        var dataBrokerApp = new DataBrokerContractInterface();
        dataBrokerApp.updateProposal(formdata, function(error, result) {
            if (error) {
                res.json({
                    "updateProposal Error": error
                });
            } else {
                res.json({
                    "result": "success",
                    "message": result
                });
            }
        });
    }
});
*/

var updateDigitalTwin = function(proposalid, pair, pubkey){
  var PATH = config.env.notifications_path;
  var fileName = PATH + keccak_256(pubkey).toUpperCase() + ".json";
  if (pubkey && fs.existsSync(fileName)) {
    fs.readFile(fileName, 'utf8', function (err, data) {
      var content = JSON.parse(data);
      var newcont = Object.assign({},content.requestsByYou[proposalid], pair);
      content.requestsByYou[proposalid] = newcont;
      fs.writeFileSync(fileName, JSON.stringify(content));
    });
  }
}

app.post("/requesterResponse", function(req, res) {
  var dataBrokerApp = new DataBrokerContractInterface();
  var proposalId = req.body.proposalId;
  var statusCode = parseInt(req.body.responseStatusCode);
  if(proposalId){
    if(statusCode == 5){
      dataBrokerApp.getProposalData(proposalId, function(error, result){
        if (error) {
            res.json({
                "error": error
            });
        } else {
          var proposalData = result;
          var dta = {
            'owner_publickey': proposalData.ownerPubkey,
            'amount': proposalData.requesterSuggestedPrice,
            'requester_publickey':proposalData.requesterPubkey,
            'access_type':'private',
            'data_type': proposalData.dimension
          };
          superagentRequest.post(dmConfig.bigchaindb_driver_url + "/create")
            .set('Content-Type', 'application/json')
            .send(dta)
            .end((err, resp) => {
                if (err) {
                    res.json(resp.body);
                } else if (resp.status == 200) {
                  // update worflow state
                  var formdata = {
                      "proposalId": proposalId,
                      "requesterSuggestedPrice": proposalData.requesterSuggestedPrice,
                      "responseStatusCode": statusCode
                  };
                  dataBrokerApp.updateProposal(formdata,function(err, upres){
                    console.log("Token received ==> ", resp.body.token);
                    updateDigitalTwin(proposalId,{"token": resp.body.token}, proposalData.requesterPubkey)
                    res.json(resp.body);
                  });
                }
            })
        }
      })
    }
  }
})

app.get("/retriveAssets/:access_token", function(req, res){
  var access_token = req.params.access_token;
  superagentRequest.get(dmConfig.bigchaindb_driver_url + "/retrieve/" + access_token)
      .end((err, resp) => {
          if (err) {
              console.log("Error in asset retrieval");
          } else if (resp.status == 200) {
            res.json(resp.body);
          }
  });
});

// Following statement will trigger event listening
var eventListener = new dataBrokerContractEventListener();
eventListener.initEvets();

// Start the http server
http.createServer(app).listen(5051,'0.0.0.0', function() {
    console.log("Data Broker server started ... running at 5051")
});
