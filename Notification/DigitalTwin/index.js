'use strict';
var app = require('express')(),
	config = require('./config.json'),
    proxy = require('http-proxy-middleware'),
    bodyParser = require('body-parser'),
    fileUpload = require('express-fileupload'),
    ballotCtrl = require('./ballotCtrl.js'),
    http = require('http'),
    expiredNotification = require('./expiredNotification.js'),
    IPFS = require('./ipfs.js'),
    MyCoidConfig = require('./MyCoidConfig.json');

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

var gkConfig = {
  target: config.env.gatekeeper_url,
  changeOrigin: true,

  onProxyReq(proxyReq, req, res) {
	if ( req.method == "POST" && req.body ) {
//		req.body.txn_id = "requestCOID";
//		req.body.msg = "8836a77b68579d1d8d4427c0cda24960f6c123f17ccf751328cc621d6237da22";
//		req.body.msg = config.endpoints.requestCOID.message;
	        //msg should be hash of txn_id

		let body = req.body;
		console.log("req.body: " + req.body);
		// URI encode JSON object
		body = Object.keys( body ).map(function( key ) {
			return  key  + '=' + body[ key ]
		}).join('&');
		
		proxyReq.setHeader( 'content-type','application/x-www-form-urlencoded' );
		proxyReq.setHeader( 'content-length', body.length );

		proxyReq.write( body );
		proxyReq.end();
	}
  },
  pathRewrite: function(path, req){
	  return path.replace("/requestCOID", config.endpoints.requestCOID.path);
  }
};


var MyCoidConfig = 
{
	target: MyCoidConfig.mycoid_url,
	changeOrigin: true,

	onProxyReq(proxyReq, req, res)
	{
	
		if ( req.method == "POST" && req.body ) {
		

		console.log("You have reached MyCOID proxy configuration...")
		//console.log("Request is: " + req)
		
                let body = req.body;
                console.log("req.body: " + req.body);
                // URI encode JSON object
                body = Object.keys( body ).map(function( key ) {
                        return  key  + '=' + body[ key ]
                }).join('&');

                proxyReq.setHeader( 'content-type','application/x-www-form-urlencoded' );
                proxyReq.setHeader( 'content-length', body.length );

                proxyReq.write( body );
                proxyReq.end();
        	}

	},
  	pathRewrite: function(path, req)
	{
        	  return path.replace("/MyCOID/myTokenAmount", "/myTokenAmount");
	}


};


app.use('/requestCOID', proxy(gkConfig));


var myGatekeeper = {
  target: config.env.my_gatekeeper_url,
  changeOrigin: true,

  onProxyReq(proxyReq, req, res) {
        if ( req.method == "POST" && req.body ) {
//              req.body.txn_id = "request_new_COID";
		console.log("got myGatekeeper POST rq.. ")

                let body = req.body;
                console.log("req.body: " + req.body);
                // URI encode JSON object
                body = Object.keys( body ).map(function( key ) {
                        return  key  + '=' + body[ key ]
                }).join('&');

                proxyReq.setHeader( 'content-type','application/x-www-form-urlencoded' );
                proxyReq.setHeader( 'content-length', body.length );

                proxyReq.write( body );
                proxyReq.end();
        }
  },
  pathRewrite: function(path, req){
          return path.replace("/request_new_COID", config.endpoints.request_new_COID.path);
  }
};


app.use('/request_new_COID', proxy(myGatekeeper));


var ballotConfig = {
	target: config.env.ballot_url,
	changeOrigin: true,
	ws: true,
	onProxyReq(proxyReq, req, res) {
		if ( req.method == "POST" && req.body ) {
			//req.body.message = config.endpoints.voteonCOIDproposal.message;
			req.body.txn_id = "voteonCOIDproposal";
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
	pathRewrite: function(path, req){
		return path.replace("/voteonCOIDproposal", config.endpoints.voteonCOIDproposal.path);
	}
}



var ballotConfig2 = {
        target: config.env.ballot_url,
        changeOrigin: true,
        ws: true,
        onProxyReq(proxyReq, req, res) {
                if ( req.method == "POST" && req.body ) {
                       // req.body.message = config.endpoints.voteonCOIDproposal.message;
                        req.body.txn_id = "voteonCOIDproposal";
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
        pathRewrite: function(path, req){
                return path.replace("/", config.endpoints.voteonCOIDproposal.path);
}}





app.use('/MyCOID/myTokenAmount', proxy(MyCoidConfig));




app.use('/voteonCOIDproposal', proxy(ballotConfig));
app.post('/ballot/writeNotify', ballotCtrl.writeNotification);
app.post('/ballot/writeExpiredProposal', expiredNotification.writeExpiredProposalNotification);
app.get('/ballot/readNotify/:pubKey', ballotCtrl.fetchNotification);
app.get('/ballot/readExpiredProposal/:pubKey', expiredNotification.fetchExpiredProposalNotification);

app.post('/pullCoidData',ballotCtrl.pullCoidData);
app.post('/ipfs/upload', IPFS.uploadFile);
app.get('/ipfs/alldocs/:pubKey', IPFS.getAllFiles);
app.get('/ipfs/getfile/:hash', IPFS.getUrl);
app.post('/ipfs/validateFiles', IPFS.getHashFromIpfsFile);



app.post('/coidCreation',ballotCtrl.coidCreation);
  
app.use('/getCoidData', proxy(ballotConfig));
//removed /ballot
app.post('/writeCoid', ballotCtrl.writeCoidData);
//app.get('/ballot/readCoid/:proposalID/publicKey/:pubKey/', ballotCtrl.fetchCoidData);


for(var i=0; i<config.env.ports.length; i++){
	var port = parseInt(config.env.ports[i]);
	http.createServer(app).listen(port);
	console.log("Digital Twin running at "+port);
}

