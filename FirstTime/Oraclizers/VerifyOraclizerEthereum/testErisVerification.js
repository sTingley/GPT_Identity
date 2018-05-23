var request = require('request');

var erisVerify = 'http://10.100.99.207:12345/verify';
var erisHash = 'http://10.100.99.207:12345/hash';
var erisSign = 'http://10.100.99.207:12345/sign';

//First Hash the Message
       
var hashMe = "hello. I am a message. Hash me!"

request({

        method: 'POST',
        url: erisHash,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"data": "hashMe", "type": "sha256"})
        }, function (error, response, body)
           {
           	var theHash = JSON.parse(body).Response;
		console.log(theHash);

		request({

        		method: 'POST',
       			url: erisSign,
        		headers: {
            			'Content-Type': 'application/json'
        		},
       			body: JSON.stringify({"msg":theHash ,"pub":"1AB39A6E80200A7146EFDF1E78C5D4E118BE7DA4" ,"name":"newchain_full_000" })
        		}, function (error, response, body)
           		{
               			 var theSignature = JSON.parse(body).Response;
				 console.log(body)
           		}
		);



           }
);


