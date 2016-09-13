var app = require('express')(),
    proxy = require('http-proxy-middleware'),
    bodyParser = require('body-parser'),
	IPFS = require('./ipfs.js');

var ballotCtrl = require('./ballotCtrl.js');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

 // for parsing application/json
app.use(bodyParser.json());
 // for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/ballot/writeNotify', ballotCtrl.writeNotification);
app.get('/ballot/readNotify/:pubKey', ballotCtrl.fetchNotification);
app.post('/ballot/writeCoid', ballotCtrl.writeCoidData);
app.get('/ballot/readCoid/:proposalID/publicKey/:pubKey/', ballotCtrl.fetchCoidData);

app.post('/ipfs/upload', multipartMiddleware, IPFS.upload);

var proxyConfigGk = {
  target: 'http://localhost:8081',
  pathRewrite: (path, req) => {
    // small tweek to make work existing gatekeeper api
    return path.replace(path, path.replace("/gk",""));
  }
};
app.use('/gk/**', proxy(proxyConfigGk));


console.log("Digital Twin running at 5050");
app.listen(5050);