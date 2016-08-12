var http = require('http'),
    httpProxy = require('http-proxy');
var fs = require ('fs');
var path = "/Users/arunkumar/Node/proxy/notifications/";

//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({});


proxy.on('proxyReq', function(proxyReq, req, res, options) {
  console.log("request redirected to controller", req.url);
});

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
var server = http.createServer(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  var params = req.url.split("/");
  var key = params[2];

  function writeResponse(response, res){
  	res.writeHead(200, { 
  		'Content-Type': 'text/plain',
  		'Access-Control-Allow-Origin' : 'http://localhost',
    	'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE' 
    });
	res.write(response);
	res.end();
  }

  if(params[1] == "notify" && key != ""){
		var key = params[2];
		if(fs.existsSync("notifications/"+key+".json")){
			fs.readFile("notifications/"+key+".json", function(err, data){
				writeResponse(data, res);
			});
		} else {
			writeResponse("{}", res);	
		}
	} else {
		proxy.web(req, res, { target: 'http://localhost:8081' });		
	}
  
});

console.log("listening on port 5050")
server.listen(5050);