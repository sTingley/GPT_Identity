'use strict';
var app = require('express')(),
        config = require('./config.json'),
    proxy = require('http-proxy-middleware'),
    bodyParser = require('body-parser'),
    fileUpload = require('express-fileupload'),
    NotificationCtrl = require('./NotificationCtrl.js'),
    http = require('http'),
    expiredNotification = require('./expiredNotification.js'),
    IPFS = require('./ipfs.js'),
    TwinConfig = require('./TwinConfig.json'),
    AssetCtrl = require('./AssetCtrl.js');

 // for parsing application/json
app.use(bodyParser.json());

 // for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

app.use(fileUpload());

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", config.env.allowed_orgins);
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});



//environment variables:
TwinConfig
AssetCtrl


//Returns a proxy configuration
//This is for re-routing a request
//For example, if you have a request from the wallet to endpoint /createCoid
//It will reroute it to theTarget/newEndpoint
//It adds txnID to the request.
function getConfiguration(theTarget, oldEndpoint, newEndpoint, txnID)
{
    return {
        target: theTarget,
        changeOrigin: true,
        ws: true,
        onProxyReq(proxyReq, req, res) 
        {
                if ( req.method == "POST" && req.body ) {
                       
                        req.body.txn_id = txnID;
                        
                        console.log(JSON.stringify(req.body));
                        let body = req.body;
                        
                        // URI encode JSON object
                        body = Object.keys( body ).map(function( key ) {
                                return encodeURIComponent( key ) + '=' + encodeURIComponent( body[ key ])
                        }).join('&');

                        proxyReq.setHeader( 'content-type','application/x-www-form-urlencoded' );
                        proxyReq.setHeader( 'content-length', body.length );

                        proxyReq.write( body );
                        proxyReq.end();
                }
        },
        pathRewrite: function(path, req)
        {
                return path.replace(oldEndpoint, newEndpoint);
        }
        };
}



// -> -> -> START ASSET FUNCTIONS -> -> ->
//*Note: These are all POST
app.post('/getOwnedAssets',AssetCtrl.getOwnedAssets);
app.post('/getControlledAssets',AssetCtrl.getControlledAssets);
app.post('/getDelegatedAssets',AssetCtrl.getDelegatedAssets);
app.post('/getAsset',AssetCtrl.getAsset);
app.post('/setAsset',AssetCtrl.setAsset);
// <- <- <- END ASSET FUNCTIONS <- <- <-



// -> -> -> START IPFS FUNCTIONS -> -> ->
app.post('/ipfs/upload', IPFS.uploadFile);
app.get('/ipfs/alldocs/:pubKey', IPFS.getAllFiles);
app.get('/ipfs/getfile/:hash', IPFS.getUrl);
app.post('/ipfs/validateFiles', IPFS.getHashFromIpfsFile);
// <- <- <- END IPFS FUNCTIONS <- <- <-




// -> -> -> START GATEKEEPER FUNCTIONS -> -> ->

//This is to request a Core Identity (isHuman = true) from the gatekeeper:
var proxyGK = getConfiguration(TwinConfig.GK_CONFIG.TARGET,'/requestCOID',TwinConfig.GK_CONFIG.ENDPOINT,'requestCOID');
app.use('/requestCOID', proxy(proxyGK))

// <- <- <- END GATEKEEPER FUNCTIONS <- <- <-


// -> -> -> START BALLOT FUNCTIONS -> -> ->

// <- <- <- END BALLOT FUNCTIONS <- <- <-


//START MYCOID FUNCTIONS
//END MYCOID FUNCTIONS

//START MYGATEKEEPER FUNCTIONS
//END MYGATEKEEPER FUNCTIONS
