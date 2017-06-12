'use strict'
var fs = require('fs');
var Crypto = require('./cryptoCtr.js'),
    keccak_256 = require('js-sha3').keccak_256,
    configuration = require('./NotificationCtrlConfig.json');

var PATH = "/home/demoadmin/DigitalTwin/contacts/"

var contactsCtrl =
    {
        writeContacts: function (req, res) {

            console.log("you have reached writeContacts");
            var param = req.body;
            var fileContent;
            var names = req.body.names;
            var pubKeys = req.body.pubKeys;
            var fileName = PATH + keccak_256(param.pubKey).toUpperCase() + ".json";
            var cryptoEncr = new Crypto({ pubKey: keccak_256(param.pubKey).toUpperCase() });
            console.log('pubKey: ' + param.pubKey);
            var unique = true;
            if (fs.existsSync(fileName)) {

                //debugging
                console.log("File exists: " + fs.existsSync(fileName))

                fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
                fileContent = JSON.parse(fileContent);

                //debugging
                console.log("Testing, File Pulled up: " + JSON.stringify(fileContent));

                for (var i = 0; i < names.length; i++) {
                    unique = true;
                    for (var j = 0; j < fileContent.contacts.length; j++) {
                        if (fileContent.contacts[j].contactName == names[i]) {
                            unique = false;
                            console.log("name is already in list: "+names[i]);
                        }
                        if (unique && j == fileContent.contacts.length - 1) {
                            var entry = {
                                "contactName": names[i],
                                "pubKey": pubKeys[i]
                            }
                            fileContent.contacts.push(entry)
                        }
                    }
                }



                 /*for (var i = 0; i < names.length; i++) {
                    var entry ={
                        "contactName":names[i],
                        "pubKey": pubKeys[i]
                    }
                    fileContent.contacts.push(entry)
                }*/
            }
            else{
                fileContent={
                    "pubkey":param.pubKey,
                    "contacts":[]
                }
                for (var i = 0; i < names.length; i++) {
                    var entry ={
                        "contactName":names[i],
                        "pubKey": pubKeys[i]
                    }
                     fileContent.contacts.push(entry)
                }


            }

            console.log("writing");
            fs.writeFile(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)), (err) => {
                    if (err) {
                        res.status(400).json({ "Error": "Unable to write message in " + fileName });
                    }
                    else {
                        res.json({ "Msg": "Contacts updated successfully" });
                    }
                });

        },

        readContacts: function (req, res) {
            console.log("you have reached readContacts");
            var param = req.params;
            console.log('pubKey: ' + param.pubKey);
            var fileName = PATH + keccak_256(param.pubKey).toUpperCase() + ".json";
            var cryptoDecr = new Crypto({ pubKey: keccak_256(param.pubKey).toUpperCase() });
            if (param.pubKey && fs.existsSync(fileName)) {
                console.log('inside if condition (file exists)')
                fs.readFile(fileName, 'utf8', function (err, data) {
                    if (err) { res.status(400).json({ "Error": "Unable to read contacts" }); }
                    else { res.json({ 'data': JSON.parse(cryptoDecr.decrypt(data)) }); }
                });
            }
            else {
                res.json({ 'data': 'Contacts unavailable' });
            }
        }


    }
module.exports = contactsCtrl;
