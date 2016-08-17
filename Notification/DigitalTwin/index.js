var app = require('express')(),
    proxy = require('http-proxy-middleware'),
    bodyParser = require('body-parser');


var ballotCtrl = require('./ballotCtrl.js');
  
 // for parsing application/json
app.use(bodyParser.json());
 // for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));


/**
 * API responsible to wite coid data
 * Method : POST
 * Inputs : JSON Object (Mandatory : pubKey, proposalID, coidData )
 */
app.post('/ballot/notify', ballotCtrl.saveNotification);

/**
 * API responsible to send coid data to wallet app
 * Method : GET
 * Inputs : <public Key>
 * API invoked from Wallet
 */
app.get('/ballot/proposals/:pubKey', ballotCtrl.FetchCoidData);


/**
 * If gate keeper functionality that has to be proxied
 */
var proxyConfig = {
  target: 'http://localhost:8081',
  pathRewrite: (path, req) => {
    // small tweek to make work existing gatekeeper api
    return path.replace(path, path.replace("/gk",""));
  }
};

app.use('/gk/**', proxy(proxyConfig));

console.log("Digital Twin running at 5050");
app.listen(5050);