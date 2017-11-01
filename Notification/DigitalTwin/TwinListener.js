'use strict';
var app = require('express')(),
        proxy = require('http-proxy-middleware'),
        bodyParser = require('body-parser'),
        fileUpload = require('express-fileupload'),
        NotificationCtrl = require('./NotificationCtrl.js'),
	BallotCtrl = require('./ballotCtrl.js'),
        http = require('http'),
        expiredNotification = require('./expiredNotification.js'),
        IPFS = require('./ipfs.js'),
        TwinConfig = require('./TwinConfig.json'),
        IdentityDimensionCtrl = require('./IdentityDimensionCtrl.js'),
	contactCtrl = require('./contactsCtrl.js'),
	IcaSigCtrl = require('./IcaSigCtrl.js'),
	RecoveryCtrl = require('./RecoveryCtrl.js'),
        AssetCtrl = require('./AssetCtrl.js');

// for parsing application/json
app.use(bodyParser.json());
var fs = require('fs-extra')
// for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

app.use(fileUpload());

app.all('/*', function (req, res, next) {
        res.header("Access-Control-Allow-Origin", TwinConfig.ALLOWED_ORIGINS);
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
});




//Returns a proxy configuration
//This is for re-routing a request
//For example, if you have a request from the wallet to endpoint /createCoid
//It will reroute it to theTarget/newEndpoint
//It adds txnID to the request.
function getConfiguration(theTarget, oldEndpoint, newEndpoint, txnID) {
        return {
                target: theTarget,
                changeOrigin: true,
                ws: true,
                onProxyReq(proxyReq, req, res) {
                        if (req.method == "POST" && req.body) {

                                req.body.txn_id = txnID;

                                console.log(JSON.stringify(req.body));
                                let body = req.body;

                                // URI encode JSON object
                                body = Object.keys(body).map(function (key) {
                                        return encodeURIComponent(key) + '=' + encodeURIComponent(body[key])
                                }).join('&');

                                proxyReq.setHeader('content-type', 'application/x-www-form-urlencoded');
                                proxyReq.setHeader('content-length', body.length);

                                proxyReq.write(body);
                                proxyReq.end();
                        }
                },
                pathRewrite: function (path, req) {
                        return path.replace(oldEndpoint, newEndpoint);
                }
        };
}

// -> -> -> START CONTACT FUNCTIONS -> -> ->
app.get('/readContacts/:pubKey',contactCtrl.readContacts);
app.post('/writeContacts',contactCtrl.writeContacts);
// <- <- <- END CONTACT FUNCTIONS <- <- <-

// -> -> -> START NOTIFICATION FUNCTIONS -> -> ->
app.post('/ballot/writeNotify', BallotCtrl.writeBallot);
app.get('/ballot/readNotify/:pubKey', BallotCtrl.fetchBallot);
//writeExpiredProposalNotification is commented out in NotificationCtrl
app.post('/notification/writeExpiredProposal', NotificationCtrl.writeExpiredProposalNotification);
//writeNotification is called in Gatekeepers ..... need to verify that this notify requester correctly (?)
app.post('/notification/writeNotify', NotificationCtrl.writeNotification);
app.get('/notification/readNotify/:pubKey', NotificationCtrl.fetchNotification);

//ST WE NEVER USE THIS!!!!!!
//app.get('/ballot/readExpiredProposal/:pubKey', expiredNotification.fetchExpiredProposalNotification);


// <- <- <- END NOTIFICATION FUNCTIONS <- <- <-

// -> -> -> START ASSET FUNCTIONS -> -> ->
//*Note: These are all POST
app.post('/getOwnedAssets', AssetCtrl.getOwnedAssets);
app.post('/getControlledAssets', AssetCtrl.getControlledAssets);
app.post('/getDelegatedAssets', AssetCtrl.getDelegatedAssets);
app.post('/getAsset', AssetCtrl.getAsset);
app.post('/setAsset', AssetCtrl.setAsset);
app.post('/deleteAsset', AssetCtrl.deleteAsset);

app.post('/getOwnedDimensions', IdentityDimensionCtrl.getOwnedDimensions);
app.post('/getControlledDimensions', IdentityDimensionCtrl.getControlledDimensions);
app.post('/getDelegatedDimensions', IdentityDimensionCtrl.getDelegatedDimensions);

app.post('/getDimension', IdentityDimensionCtrl.getDimension);
app.post('/setDimension', IdentityDimensionCtrl.setDimension);
app.post('/deleteDimension', IdentityDimensionCtrl.deleteDimension);
// <- <- <- END ASSET FUNCTIONS <- <- <-

// -> -> -> START Signature Revocation FUNCTIONS -> -> ->
var proxyIca = getConfiguration(TwinConfig.ICA_CONFIG.TARGET, '/signature/revokeIca', TwinConfig.ICA_CONFIG.ENDPOINT, '/signature/revokeIca');
app.use('/signature/revokeIca', proxy(proxyIca))
var proxyIca = getConfiguration(TwinConfig.ICA_CONFIG.TARGET, '/signature/attestIca', TwinConfig.ICA_CONFIG.ENDPOINT2, '/signature/attestIca');
app.use('/signature/attestIca', proxy(proxyIca))

app.post('/signature/writeAttestation', IcaSigCtrl.writeAttestation);
app.get('/signature/readAttestation/:pubKey', IcaSigCtrl.fetchAttestation);
// <- <- <- END Signature Revocation FUNCTIONS <- <- <-

// -> -> -> START Recovery FUNCTIONS -> -> ->
app.post('/recovery/writeRecovery', RecoveryCtrl.writeRecovery);
app.get('/recovery/readRecovery/:pubKey', RecoveryCtrl.fetchRecovery);
app.post('/recovery/transferRecovery', RecoveryCtrl.transferRecovery);
app.post('/recovery/deleteRecovery', RecoveryCtrl.deleteRecovery);
var proxyRecov = getConfiguration(TwinConfig.RECOV_CONFIG.TARGET, '/recovery/startRecoveryBallot', TwinConfig.RECOV_CONFIG.ENDPOINT, '/recovery/startRecoveryBallot');
app.use('/recovery/startRecoveryBallot', proxy(proxyRecov))
//app.post('recovery/writeWalletFile', RecoveryCtrl.writeWalletFile);
app.post('/recovery/cleanMyTwin/:pubKey',RecoveryCtrl.cleanMyTwin);

// <- <- <- END Recovery FUNCTIONS <- <- <-

// -> -> -> START IPFS FUNCTIONS -> -> ->
app.post('/ipfs/upload', IPFS.uploadFile);

//componentDidMount method of UploadIpfsFile and Documents classes hit this route
app.get('/ipfs/alldocs/:pubKey', IPFS.getAllFiles);

app.get('/ipfs/getfile/:hash', IPFS.getUrl);
app.post('/ipfs/validateFiles', IPFS.getHashFromIpfsFile);
// <- <- <- END IPFS FUNCTIONS <- <- <-

var proxyBigChain = getConfiguration(TwinConfig.BIGCHAIN_CONFIG.TARGET, '/bigchain/preRequest', TwinConfig.BIGCHAIN_CONFIG.ENDPOINT, '/bigchain/preRequest');
app.use('/bigchain/preRequest', proxy(proxyBigChain))
var proxyBigChainGet = getConfiguration(TwinConfig.BIGCHAIN_CONFIG.TARGET, '/bigchain/getRequest', TwinConfig.BIGCHAIN_CONFIG.ENDPOINT2, '/bigchain/getRequest');
app.use('/bigchain/getRequest', proxy(proxyBigChainGet))
var proxyBigChainTransfer = getConfiguration(TwinConfig.BIGCHAIN_CONFIG.TARGET, '/bigchain/transferRequest', TwinConfig.BIGCHAIN_CONFIG.ENDPOINT3, '/bigchain/transferRequest');
app.use('/bigchain/transferRequest', proxy(proxyBigChainTransfer))
var proxyBigChainTransferFile = getConfiguration(TwinConfig.BIGCHAIN_CONFIG.TARGET, '/bigchain/transferFileRequest', TwinConfig.BIGCHAIN_CONFIG.ENDPOINT4, '/bigchain/transferFileRequest');
app.use('/bigchain/transferFileRequest', proxy(proxyBigChainTransferFile))

var obj2 = { "dimensionType": "personal", "ID": "6678", "attr_list": [["val 1", "1914a856d46130819450f48a3cbf060cf01ce323021494a82fb8fec4eba7149d"], ["val 2", "a560b6d35e21c780b0f1d153849fc811aa4d7b35af9955329cb29f8237cf473f"]], "flag": [1, 1] }
//var obj3 = {"dimensionType": "photography",  "ID": "4538", "attr_list": [["senior photos", "QmdpXUXTa3WrZMuQr3tK3dsPXkAxY3BdLyBqu4YspS5Kuz"], ["my wedding", "QmStt2BEa2Z994ppJrqW3aZjW43Qco3fatRcE3HUjjUheT"]], "flag": [0,1,1] }
var DimensionReturn = { "Dimensions": [obj2] }



//temp function
app.post('/getMetaData', function (req, res) {
        console.log("endpoint getMetaData was hit");
        res.json({ "data": DimensionReturn })

})


//INPUT:
// "name" : name of dimension
// "flag" : either 0 or 1 (0 means public, 1 means private)
app.post('/createDimension', function (req, res) {
        var obj1 = { "dimensionType": "financial history", "ID": "1234", "attr_list": [["Banking history - JAN 2017", "QmTLY8y6isHoMvSz25p287c6BWD7op23BsgdhMzv2nsbMy"]], "flag": [] }
        var jsonArray = DimensionReturn.Dimensions;
        jsonArray.push(obj1);
        DimensionReturn.Dimensions = jsonArray;
})

// -> -> -> START GATEKEEPER FUNCTIONS -> -> ->
//This is to request a Core Identity (isHuman = true) from the gatekeeper:
var proxyGK = getConfiguration(TwinConfig.GK_CONFIG.TARGET, '/requestCOID', TwinConfig.GK_CONFIG.ENDPOINT, 'requestCOID');
app.use('/requestCOID', proxy(proxyGK))

var proxy_OfficialIDs = getConfiguration(TwinConfig.GK_CONFIG.TARGET, '/addOfficialIDs', TwinConfig.GK_CONFIG.ENDPOINT, 'addOfficialIDs');
app.use('/addOfficialIDs', proxy(proxy_OfficialIDs));
// <- <- <- END GATEKEEPER FUNCTIONS <- <- <-


// -> -> -> START BALLOT FUNCTIONS -> -> ->
var proxyBallot = getConfiguration(TwinConfig.BALLOT_CONFIG.TARGET, '/voteonCOIDproposal', TwinConfig.BALLOT_CONFIG.ENDPOINT, 'voteonCOIDproposal');
app.use('/voteonCOIDproposal', proxy(proxyBallot))
app.use('/getCoidData', proxy(proxyBallot))
// <- <- <- END BALLOT FUNCTIONS <- <- <-


// -> -> -> START MYCOID FUNCTIONS -> -> ->
var COID_TWIN_ENDPOINTS = TwinConfig.MY_COID_CONFIG.TWIN_ENDPOINTS;
var COID_NEW_ENDPOINTS = TwinConfig.MY_COID_CONFIG.NEW_ENDPOINTS;

var COID_TARGET = TwinConfig.MY_COID_CONFIG.TARGET;

for (let jsonKey in COID_TWIN_ENDPOINTS) {
        var oldEndpoint = COID_TWIN_ENDPOINTS[jsonKey];
        var newEndpoint = COID_NEW_ENDPOINTS[jsonKey];

        console.log("MY COID OLD ENDPOINT: " + oldEndpoint);
        console.log("MY COID NEW ENDPOINT: " + newEndpoint);

        var txnID = newEndpoint;
        var proxyObj = getConfiguration(COID_TARGET, oldEndpoint, newEndpoint, txnID);
        app.use(oldEndpoint, proxy(proxyObj))
}
// <- <- <- END MYCOID FUNCTIONS <- <- <-


// -> -> -> START IDENTITY DIMENSION FUNCTIONS -> -> ->
var DIMENSION_TWIN_ENDPOINTS = TwinConfig.IDENTITY_DIMENSION_CONFIG.TWIN_ENDPOINTS;
var DIMENSION_NEW_ENDPOINTS = TwinConfig.IDENTITY_DIMENSION_CONFIG.NEW_ENDPOINTS;

var DIMENSION_TARGET = TwinConfig.IDENTITY_DIMENSION_CONFIG.TARGET;

for (let jsonKey in DIMENSION_TWIN_ENDPOINTS) {
        var oldEndpoint = DIMENSION_TWIN_ENDPOINTS[jsonKey];
        var newEndpoint = DIMENSION_NEW_ENDPOINTS[jsonKey];

        console.log("DIMENSION OLD ENDPOINT: " + oldEndpoint);
        console.log("DIMENSION NEW ENDPOINT: " + newEndpoint);


        var txnID = newEndpoint;
        var proxyObj = getConfiguration(DIMENSION_TARGET, oldEndpoint, newEndpoint, txnID);
        app.use(oldEndpoint, proxy(proxyObj))
}
// <- <- <- END IDENTITY DIMENSION FUNCTIONS <- <- <-


//var proxyDimensions = getConfiguration(TwinConfig.IDENTITY_DIMENSION_CONFIG.TARGET, 'CreateDimension','/','CreateDimension');
//app.use('CreateDimension', proxy(proxyDimensions))


// -> -> -> START MYGATEKEEPER FUNCTIONS -> -> ->
var proxyMyGK = getConfiguration(TwinConfig.MY_GK_CONFIG.TARGET, '/request_new_COID', TwinConfig.MY_GK_CONFIG.ENDPOINT, 'request_new_COID');
app.use('/request_new_COID', proxy(proxyMyGK));
// <- <- <- END MYGATEKEEPER FUNCTIONS <- <- <-


//For three wallets, this has a port for each. To update.
for (var i = 0; i < TwinConfig.ports.length; i++) {
        var port = parseInt(TwinConfig.ports[i]);
        http.createServer(app).listen(port);
        console.log("Digital Twin running at " + port);
}
