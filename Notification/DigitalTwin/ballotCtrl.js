       'use strict'
var fs = require ('fs');
var Crypto = require('./cryptoCtr.js'),
    keccak_256 = require('js-sha3').keccak_256;

//TODO: PATH DEFINE
var PATH = "/home/demoadmin/DigitalTwin/notifications/";

//TODO: DEFINE NOTIFY_SUFFIX
var vote_suffix = "_vote";

//Functions inherited from BallotCtrl
//TODO: Change for folder structure
var BallotCtrl =
{
        //INPUT MUST CONTAIN:
        //message
        //pubKey
        //proposalID
        // Just write ballot (right after writes into bigchain)
        writeBallot: function(req, res)
        {
                //debugging
                console.log("you have reached writeBallot");

                //grab request
                var params = req.body;

                //debugging
                console.log(params);

                //grab message
                var message = params.message;

                //debugging
                console.log("Message is: " + message);
                console.log("pubkey is: "+params.pubKey);

                if(!params.pubKey) res.status(400).json({"Error": "Invalid input parameters"});

                var fileName = PATH + params.pubKey.toUpperCase() + vote_suffix + ".json";
                console.log("File name is: "+fileName);
                var timestamp = Number(new Date());
                var cryptoEncr = new Crypto({pubKey: params.pubKey});
                var dataFormat = () => {
                        return {
                                "type": 'proposal',
                                "proposal_id": params.proposalID,
                                "message": message,
                                "read_status": false,
                                "time": timestamp,
                                "gatekeeperAddr": params.gatekeeperAddr,
                                "isHuman": params.isHuman,
                                "propType": params.propType

                        };
                };
                if (fs.existsSync(fileName)) {
                       setTimeout(function(){
                        console.log("dataFormat");
                        console.log(dataFormat());
                        var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
                        var fileContent = JSON.parse(fileContent);
                        fileContent.messages.unshift(dataFormat());
                        fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
                        res.json({"Msg":"Ballot updated successfully"});},5000)
                } else {
                        var msg = {
                                id: params.pubKey,//public key
                                messages:[dataFormat()]
                        }
                        var cryptoData = cryptoEncr.encrypt(JSON.stringify(msg));
                        fs.writeFile(fileName, cryptoData, (err) => {
                                if(err){
                                        res.status(400).json({"Error": "Unable to write message in " + fileName});
                                        return;
                                }
                                res.json({"Msg":"Ballot updated successfully"});
                        });
                }
        },
        deleteBallot: function(req, res){
                var pid = req.params.pid,
                        pubKey = req.params.pubKey;
                if(pid && pubKey){
                        var fileName = PATH + keccak_256(pubKey).toUpperCase() + vote_suffix + ".json";
                        var cryptoDecr = new Crypto({pubKey: keccak_256(pubKey).toUpperCase()});
                        if(fs.existsSync(fileName)){
                                fs.readFile(fileName, 'utf8', function(err, data){
                                        var allBallots = JSON.parse(cryptoDecr.decrypt(data)),
                                                msgs = allBallots.messages;
                                        for(var i=0; i<msgs.length; i++){
                                                var msg = msgs[i];
                                                if(msg.proposal_id == pid){
                                                        msgs.splice(i,1);
                                                        fs.writeFileSync(fileName, cryptoDecr.encrypt(JSON.stringify(allBallots)));
                                                        break;
                                                }
                                        }
                                        res.send("successfully deleted");
                                });
                        }
                }
        },
        fetchBallot: function(req, res){
                var param = req.params;
                console.log('pubKey: ' + param.pubKey)
               // console.log('hash of pubkey: ' + keccak_256(param.pubKey).toUpperCase())
                var fileName = PATH + param.pubKey.toUpperCase() + vote_suffix + ".json";
                var cryptoDecr = new Crypto({pubKey: param.pubKey});
                console.log(fs.existsSync(fileName)+" trying to read: " +fileName);
                if(param.pubKey && fs.existsSync(fileName)){
                console.log('inside if condition (file exists)')
                        fs.readFile(fileName, 'utf8', function(err, data){
                                if(err) res.status(400).json({"Error": "Unable to read ballots"});
                                        console.log("error is: " + err)
                                        //console.log(JSON.parse(cryptoDecr.decrypt(data)))
                                        console.log(JSON.stringify((data)))
                                        res.json({'data': (cryptoDecr.decrypt(data))});
                        });
                } else {
                        res.json({'data': 'Ballots unavailable'});
                }
        }
}
module.exports = BallotCtrl;
