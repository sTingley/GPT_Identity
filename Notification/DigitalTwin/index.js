var app = require('express')(),
    proxy = require('http-proxy-middleware'),
    bodyParser = require('body-parser'),
	fileUpload = require('express-fileupload'),
	ballotCtrl = require('./ballotCtrl.js'),
	IPFS = require('./ipfs.js');

 // for parsing application/json
app.use(bodyParser.json());

 // for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

app.use(fileUpload());

/**
 * 
 */
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.post('/ballot/writeNotify', ballotCtrl.writeNotification);
app.get('/ballot/readNotify/:pubKey', ballotCtrl.fetchNotification);
app.post('/ballot/writeCoid', ballotCtrl.writeCoidData);
app.get('/ballot/readCoid/:proposalID/publicKey/:pubKey/', ballotCtrl.fetchCoidData);

app.post('/ipfs/upload', IPFS.uploadFile);
app.get('/ipfs/alldocs/:pubKey', IPFS.getAllFiles);
app.get('/ipfs/getfile/:pubKey/:hash', IPFS.getFile);


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