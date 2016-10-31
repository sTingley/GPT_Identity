var request = require('request');
var bigchainServer = 'http://10.100.98.217:5000/'
var bigchainInput = {"msg": "hi"}
bigchainInput = JSON.stringify(bigchainInput)

   var bigchainEndpoint = 'addData/' + '12321' + '/0'
  // var bigchainEndpoint = 'addData'

var theobj = {"method": "POST", "stringJSONData": bigchainInput, "endpoint": bigchainEndpoint}

bigchainDataStringified = JSON.stringify(bigchainInput);

request({
        method: 'POST',
        url: bigchainServer + 'addData/1Sha2321/1',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"msg":"hi"})
        }, function (error, response, body) {
                var theResponse = body;
                console.log(theResponse + " was the response")
        });
