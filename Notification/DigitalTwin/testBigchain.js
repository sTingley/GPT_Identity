var request = require('request')
var bigchainLink = 'http://10.100.98.217:5000/addData/5F1BFB2E4DE393EFA349BC9599D0DFAE717CF5D01BC342F3465AEDC018287465/1'

var input = {"data": {"msg": "hi"}}

    request({
        method: 'POST',
        url: bigchainLink,
        body: JSON.stringify(input),
        headers:
        {
            'Content-Type': 'application/json'
        }
        },
        function (error, response, body)
        {
            //the response is body -- send that
            console.log(body)

        });

