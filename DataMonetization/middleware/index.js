'use strict';
var app = require('express')(),
    config = require('./config.json'),
    proxy = require('http-proxy-middleware'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    keccak_256 = require('js-sha3').keccak_256,
    http = require('http');

// for parsing application/json
app.use(bodyParser.json());
// for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true
}));
app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", config.env.allowed_orgins);
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

var brokerConfig = {
    target: config.env.broker_url,
    changeOrigin: true,
    ws: true,
    onProxyReq(proxyReq, req, res) {
        if ((req.method == "POST" || req.method == "GET") && req.body) {
            //req.body.message = config.endpoints.voteonCOIDproposal.message;
            req.body.txn_id = "dataRequest";
            let body = req.body;
            // URI encode JSON object
            body = Object.keys(body).map(function(key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(body[key])
            }).join('&');

            proxyReq.setHeader('content-type', 'application/x-www-form-urlencoded');
            proxyReq.setHeader('content-length', body.length);

            proxyReq.write(body);
            proxyReq.end();
        }
    },
    pathRewrite: function(path, req) {
        return path.replace("/dataRequest", config.endpoints.dataRequest.path);
    }
}

var requesterResponseConfig = {
    target: config.env.broker_url,
    changeOrigin: true,
    ws: true,
    onProxyReq(proxyReq, req, res) {
        if ((req.method == "POST" || req.method == "GET") && req.body) {
            //req.body.message = config.endpoints.voteonCOIDproposal.message;
            req.body.txn_id = "requesterResponse";
            let body = req.body;
            // URI encode JSON object
            body = Object.keys(body).map(function(key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(body[key])
            }).join('&');

            proxyReq.setHeader('content-type', 'application/x-www-form-urlencoded');
            proxyReq.setHeader('content-length', body.length);

            proxyReq.write(body);
            proxyReq.end();
        }
    },
    pathRewrite: function(path, req) {
        return path.replace("/requesterResponse", config.endpoints.requesterResponse.path);
    }
}

var brokerForOwner = {
    target: config.env.broker_url,
    changeOrigin: true,
    ws: true,
    onProxyReq(proxyReq, req, res) {
        if ((req.method == "POST" || req.method == "GET") && req.body) {
            //req.body.message = config.endpoints.voteonCOIDproposal.message;
            req.body.txn_id = "ownerResponse";
            let body = req.body;
            // URI encode JSON object
            body = Object.keys(body).map(function(key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(body[key])
            }).join('&');

            proxyReq.setHeader('content-type', 'application/x-www-form-urlencoded');
            proxyReq.setHeader('content-length', body.length);

            proxyReq.write(body);
            proxyReq.end();
        }
    },
    pathRewrite: function(path, req) {
        return path.replace("/ownerResponse", config.endpoints.ownerResponse.path);
    }
}

var DigitalTwin = {

    dataRequestsByYou: function(req, res) {
        var PATH = config.env.notifications_path;
        var param = req.params;
        var fileName = PATH + keccak_256(param.pubKey).toUpperCase() + ".json";
        if (param.pubKey && fs.existsSync(fileName)) {

            fs.readFile(fileName, 'utf8', function(err, data) {
                if (err) res.status(400).json({
                    "Error": "Unable to read notifications"
                });
                var requestsByYou = JSON.parse(data).requestsByYou;
                // res.json(requestsByYou);

                // TODO : does it have to be a array? Worth try changing it to be a object with each proposalId as key and value as proposal data
                var requestsByYouArray = [];

                for (var property in requestsByYou) {
                    if (requestsByYou.hasOwnProperty(property)) {
                        var proposal = {};
                        proposal[property] = requestsByYou[property];
                        requestsByYouArray.push(proposal);
                    }
                }
                res.json(requestsByYouArray);
            });
        } else {
            res.json();
        }
    },

    dataRequestsForYou: function(req, res) {
        var PATH = config.env.notifications_path;
        var param = req.params;
        var fileName = PATH + keccak_256(param.pubKey).toUpperCase() + ".json";
        if (param.pubKey && fs.existsSync(fileName)) {

            fs.readFile(fileName, 'utf8', function(err, data) {
                if (err) res.status(400).json({
                    "Error": "Unable to read notifications"
                });
                var requestsForYou = JSON.parse(data).requestsForYou;
                // res.json(requestsByYou);
                // TODO : does it have to be a array? Worth try changing it to be a object with each proposalId as key and value as proposal data
                var requestsForYouArray = [];

                for (var property in requestsForYou) {
                    if (requestsForYou.hasOwnProperty(property)) {
                        var proposal = {};
                        proposal[property] = requestsForYou[property];
                        requestsForYouArray.push(proposal);
                    }
                }
                res.json(requestsForYouArray);
            });
        } else {
            res.json();
        }
    },

    writeProposalNotification: function(req, res) {
        var param = req.params;
        var body = req.body;
        var notificationType = req.path.split("/")[2];
        if (!param.pubKey) {
            res.status(400).json({
                "Error": "Invalid input parameters"
            });
        }
        var PATH = config.env.notifications_path;
        var fileName = PATH + keccak_256(param.pubKey).toUpperCase() + ".json";
        var timestamp = Number(new Date());
        var proposalId = body.proposalId;
        var dataFormat = () => {
            return {
                "requesterPubkey": body.requesterPubkey,
                "requesterAlias": body.requesterAlias,
                "ownerPubkey": body.ownerPubkey,
                "ownerAlias": body.ownerAlias,
                "dimension": body.dimension,
                "requesterSuggestedPrice": body.requesterSuggestedPrice,
                "status": body.status,
                "counteredPrice": body.counteredPrice,
                "pendingWith": body.pendingWith,
                "readStatus": false,
                "updatedTime": timestamp
            }
        };
        if (fs.existsSync(fileName)) {
            setTimeout(function() {
                var fileContent = fs.readFileSync(fileName, 'utf-8');
                fileContent = JSON.parse(fileContent);
                if (config.notification_types.requestsByYou === notificationType) {
                    var formated = dataFormat();
                    if(proposalId in fileContent.requestsByYou){
                      if("token" in fileContent.requestsByYou[proposalId]){
                          formated.token = fileContent.requestsByYou[proposalId].token;
                      }
                    }
                    fileContent.requestsByYou[proposalId] = formated;
                } else if (config.notification_types.requestsForYou === notificationType) {
                    fileContent.requestsForYou[proposalId] = dataFormat();
                }
                fs.writeFileSync(fileName, JSON.stringify(fileContent));
                res.json({
                    "Msg": "Notification updated successfully"
                });
            }, 1000);
        } else {
            var fileContent = {
                requestsByYou: {},
                requestsForYou: {}
            };
            if (config.notification_types.requestsByYou === notificationType) {
                fileContent.requestsByYou[proposalId] = dataFormat();
            } else if (config.notification_types.requestsForYou === notificationType) {
                fileContent.requestsForYou[proposalId] = dataFormat();
            }
            var cryptoData = JSON.stringify(fileContent);
            fs.writeFile(fileName, cryptoData, (err) => {
                if (err) {
                    res.status(400).json({
                        "Error": "Unable to write message in " + fileName
                    });
                    return;
                }
                res.json({
                    "Msg": "Notification updated successfully"
                });
            });
        }
    }
}; // end of DigitalTwin

app.get('/dataRequestsByYou/:pubKey', DigitalTwin.dataRequestsByYou);
app.get('/dataRequestsForYou/:pubKey', DigitalTwin.dataRequestsForYou);
app.post('/notify/requestsByYou/:pubKey', DigitalTwin.writeProposalNotification);
app.post('/notify/requestsForYou/:pubKey', DigitalTwin.writeProposalNotification);
app.use('/dataRequest', proxy(brokerConfig));
app.use('/ownerResponse', proxy(brokerForOwner));
app.use('/requesterResponse', proxy(requesterResponseConfig));
app.use('/retriveAssets', proxy({
  target: config.env.broker_url,
  changeOrigin: true
}))


for (var i = 0; i < config.env.ports.length; i++) {
    var port = parseInt(config.env.ports[i]);
    http.createServer(app).listen(port, '0.0.0.0');
    console.log("Digital Twin running at " + port);
}
