var fs = require ('fs');
var express = require('express');
var app = express();
var http = require('http');



/*var Ballot = function(){

	this.folderpath = "/Users/arunkumar/Node/proxy/notifications/";
	this.filename = "";

	this.writeFile = function(key, message){
		this.filename = this.folderpath+key+".json";
		var timestamp = Number(new Date()); 
		if (fs.existsSync(this.filename)) {
			var _this = this;
			fs.readFile(this.filename, function(err, data){
				if(err) return console.log("Error reading existing file", err);
				var notifications = JSON.parse(data.toString());
				var msg = {
					msg: message,
					read_status: false,
					time: timestamp
				}
				notifications.messages.unshift(msg);
				fs.writeFile(_this.filename, JSON.stringify(notifications), function(err){
					if(err) return console.log("Error updating file", err);
				});
			});
		} else {
			var msg = {
				id: key,
				messages: [{
					msg: message,
					read_status: false,
					time: timestamp
				}]
			};
			var _this = this;
			fs.writeFile(this.filename, JSON.stringify(msg), function (err) {
			  if (err) return console.log("Error creating file ", err);
			  console.log(_this.filename + " created");
			});
		}
	}
}
// this method has to initiated when the event fired from ballot.sol
var ballot = new Ballot();
ballot.writeFile("1dc99871943ad3a715f022273513a393564f9b060c4c047920fc1425b90b7740","You have notification");

app.get("/notify", function(req, res){
  console.log("comes to ballot");
});

app.listen(8082,function(){
	console.log("Ballot Server 8082 is running.....");
});*/



//The url we want is `www.nodejitsu.com:1337/`
var options = {
  host: 'localhost',
  path: '/notify/12345',
  //since we are listening on a custom port, we need to specify it by hand
  port: '5050',
  headers: {
    'Content-Type': 'application/json',
  },
  //This is what changes the request to a POST request
  method: 'POST'
};


var callback = function(response) {
  var str = ''
  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {
    console.log(JSON.stringify(str));
  });
};

var msg = {
  pubKey: '12345',
  proposal: 'Test proposal msg'
};


var req = http.request(options, callback);
console.log('Request sent:'+JSON.stringify(msg));
//This is the data we are posting, it needs to be a string or a buffer
req.write(JSON.stringify(msg));
req.end();