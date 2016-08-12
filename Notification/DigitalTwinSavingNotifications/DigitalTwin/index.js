var http = require('http'),
    httpProxy = require('http-proxy');
var fs = require ('fs');

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
  var body = "";

	req.on('data', function (chunk) {
    body += chunk;
  });
  req.on('end', function () {
		
		var key = params[2];

		// POST : /notify/<key>
		if(req.method == 'POST' && params[1] == "notify" && key != ""){
			console.log('param1:'+params[1]+" param2:"+params[2]);
			body = JSON.parse(body);
			console.log('received request:');
			console.log(body);
			saveNotification(key, body);
			writeResponse('Your message '+body+' has been saved successfully', res);
		} 

		//GET: /vote/<key>
		else if (req.method == 'GET' && params[1] == 'vote' && key != "") {
			console.log('param1:'+params[1]+" param2:"+params[2]);
			sendUnreadNotifications(key, res);
		}

		//Forward to gatekeeper
		else {
			proxy.web(req, res, { target: 'http://localhost:8081' });		
		}
  });

  var sendUnreadNotifications = function(key, res) {

  	var filename = "notifications/"+key+".json";
  	var contentToSend = {
  		id: key,
  		messages: []
  	};

  	if(fs.existsSync(filename)){
			fs.readFile(filename, function(err, data){
				//if the data is not empty
				if(data != '') {
					data = JSON.parse(data);
					console.log("data from file");
					console.log(data);
					var updatedContent = {
						id: key,
	  				messages: []
					};
					for (var i = 0; i < data.messages.length; i++) {
						if(data.messages[i].read_status === false) {
							contentToSend.messages.unshift(data.messages[i]);
							updatedContent.messages.unshift({
								msg: data.messages[i].msg,
								read_status: true,
								time: data.messages[i].time
							});
						}
						else {
							updatedContent.messages.unshift(data.messages[i]);
						}
					}
					console.log('updatedContent');
					console.log(updatedContent);
					console.log('contentToSend');
					console.log(contentToSend);
					fs.writeFile(filename, JSON.stringify(updatedContent), function (err) {
					  if (err) return console.log("Error creating file ", err);
					  console.log(filename + " created");
					});
					writeResponse(contentToSend, res);
				}
				else {
					writeResponse(contentToSend, res);
				}
			});
		}
		else {
			writeResponse(contentToSend, res);
		} 
  };

	function writeResponse(content, res){
		res.writeHead(200, { 'Content-Type': 'application/json' });
		console.log(content);
		res.write(JSON.stringify(content));
		res.end();
	}

	var saveNotification = function (key, saveMsg) {

		var folderpath = "notifications/";
		var filename = ""

		filename = folderpath+key+".json";
		console.log('filename:'+filename);
		var timestamp = Number(new Date()); 
		if (fs.existsSync(filename)) {
			
			fs.readFile(filename, function(err, data){
				if(err) return console.log("Error reading existing file", err);
				var notifications = JSON.parse(data.toString());
				var msg = {
					msg: saveMsg.proposal,
					read_status: false,
					time: timestamp
				}
				notifications.messages.unshift(msg);
				fs.writeFile(filename, JSON.stringify(notifications), function(err){
					if(err) return console.log("Error updating file", err);
				});
			});
		} else {
			var message = {
				id: key,
				messages: [{
					msg: saveMsg.proposal,
					read_status: false,
					time: timestamp
				}]
			};
			fs.writeFile(filename, JSON.stringify(message), function (err) {
			  if (err) return console.log("Error creating file ", err);
			  console.log(filename + " created");
			});
		}

	};
  
});

console.log("listening on port 5050")
server.listen(5050);