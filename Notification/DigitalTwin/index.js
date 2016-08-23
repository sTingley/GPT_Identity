var app = require('express')(),
    proxy = require('http-proxy-middleware'),
    bodyParser = require('body-parser');

var ballotCtrl = require('./ballotCtrl.js');
  
 // for parsing application/json
app.use(bodyParser.json());
 // for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));


app.post('/ballot/writeNotify', ballotCtrl.writeNotification);
app.get('/ballot/readNotify/:pubKey', ballotCtrl.fetchNotification);

app.post('/ballot/writeCoid', ballotCtrl.writeCoidData);
app.get('/ballot/readCoid/:proposalID/publicKey/:pubKey/', ballotCtrl.fetchCoidData);

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