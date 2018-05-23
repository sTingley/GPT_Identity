'use strict'
const Crypto = require('./cryptoCtr.js')
const fs = require('fs')
const keccak_256 = require('js-sha3').keccak_256
const configuration = require('./DimensionCtrlConfig.json')

const PATH = configuration.PATH;
const ControlDirectory = configuration.ControlDirectory;
const OwnershipDirectory = configuration.OwnershipDirectory;
const DelegateDirectory = configuration.DelegateDirectory;

//maps ints to directories
var flagMap = [];
flagMap[0] = OwnershipDirectory;
flagMap[1] = ControlDirectory;
flagMap[2] = DelegateDirectory;

//Makes the user's directories in case they don't exist NEEDS FIXING
var directoryManager = function (pubKey) {
    var sync = true;
    console.log("inside directoryManager...pubkey is " + pubKey)

    //uer's folder path:
    var currentPath = PATH + "/" + pubKey.toUpperCase()

    //make the user's folder:
    fs.existsSync(currentPath) || fs.mkdirSync(currentPath);

    //TODO: CHECK -- will this cause an async error?
    //make the ownership, control and delegate folders:
    for (let i = 0; i < flagMap.length; i++) {
        fs.existsSync(currentPath + "/" + flagMap[i]) || fs.mkdir(currentPath + "/" + flagMap[i]);
    }

    sync = false;

    while (sync) { require('deasync').sleep(100); }

}//end directoryManager

//****************************************************************************************************

var DimensionCtrl = {

    //returns all your files in your owned folder
    //INPUT: pubKey
    getOwnedDimensions: function (req, res) {

        var pubKey = req.body.pubKey;

        //call in case their folders have not been created:
        var manager = new directoryManager(pubKey);

        //debugging
        console.log("INPUT, pubkey: " + pubKey)

        //get file path
        var filePath = PATH + "/" + keccak_256(pubKey).toUpperCase() + "/" + OwnershipDirectory;

        //debugging
        console.log("FILE PATH: " + filePath)

        var files = [];//to return

        //get all file names using file sync
        if (fs.existsSync(filePath)) {
            files = fs.readdirSync(filePath);
        }

        //debugging
        console.log("FILES ARE: " + files)

        //send json response
        res.json({ "data": files })

    }, //end getOwnedDimensions

    //returns all your files in your controlled folder
    //INPUT: pubKey
    getControlledDimensions: function (req, res) {

        //get public key
        var pubKey = req.body.pubKey;

        //call in case their folders have not been created:
        var manager = new directoryManager(pubKey);

        //debugging
        console.log("INPUT, pubKey: " + pubKey)

        //get file path
        var filePath = PATH + "/" + keccak_256(pubKey).toUpperCase() + "/" + ControlDirectory;

        //debugging
        console.log("FILE PATH: " + filePath)

        var files = [];//to return

        //get all file names using file sync
        if (fs.existsSync(filePath)) {
            files = fs.readdirSync(filePath);
        }

        //debugging
        console.log("FILES ARE: " + files)

        //send json response
        res.json({ "data": files })

    }, //end getControlledDimensions

    //returns all your files in your delegated folder
    //INPUT: pubKey
    getDelegatedDimensions: function (req, res) {

        //get public key
        var pubKey = req.body.pubKey;

        //call in case their folders have not been created:
        var manager = new directoryManager(pubKey);

        //debugging
        console.log("INPUT, pubKey: " + pubKey)

        //get file path
        var filePath = PATH + "/" + keccak_256(pubKey).toUpperCase() + "/" + DelegateDirectory;

        //debugging
        console.log("FILE PATH: " + filePath)

        var files = [];//to return

        //get all file names using file sync
        if (fs.existsSync(filePath)) {
            files = fs.readdirSync(filePath);
        }

        //debugging
        console.log("FILES ARE: " + files)

        //send json response
        res.json({ "data": files })

    }, //end getDelegatedDimensions

    //returns an asset
    //INPUT: pubKey
    //flag (0 = owned, 1 = controlled, 2 = delegated)
    //fileName
    getDimension: function (req, res) {
        console.log("\nHit getDimesion endpoint\n");
        //get public key
        var pubKey = req.body.pubKey;

        //call in case their folders have not been created:
        var manager = new directoryManager(pubKey);

        //get flag
        var flag = req.body.flag;

        //get fileName
        var fileName = req.body.fileName;

        //get the directory
        var directory = PATH + "/" + pubKey.toUpperCase() + "/";
        if (flag == 0) {
            directory = directory + OwnershipDirectory + "/" + fileName;
        }
        if (flag == 1) {
            directory = directory + ControlDirectory + "/" + fileName;
        }
        if (flag == 2) {
            directory = directory + DelegateDirectory + "/" + fileName;
        }

        var cryptoEncr = new Crypto({ pubKey: pubKey });

        //debugging
        var fileName = directory;
        console.log("FILE NAME: " + directory)

        if (fs.existsSync(fileName)) {
            console.log("File exists")
            console.log(fs.existsSync(fileName))
            var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));

            console.log("debugging...file content is: " + fileContent)

            fileContent = JSON.parse(fileContent)
            console.log("File Sent");
            res.json(fileContent)

        }
        else {
            res.json({ "Msg": "Not found." })
        }

    }, //end getDimension

    //sets a dimension
    //INPUT: pubKey
    //flag (0 = owned, 1 = controlled, 2 = delegated)
    //fileName
    //updateFlag (0 = new, 1 = update)
    //data -- only input for a write
    //keys,values -- only input for an update
    setDimension: function (req, res) {
        //get public key
        var pubKey = req.body.pubKey;

        //call in case their folders have not been created:
        var manager = new directoryManager(pubKey);

        //get flag
        var flag = req.body.flag;

        //get fileName
        var fileName = req.body.fileName;

        //get updateFlag
        var updateFlag = req.body.updateFlag;

        //debugging functions
        console.log("\nsetDimension endpoint hit");
        console.log("pubKey is: " + pubKey);
        console.log("flag is: " + flag + " \n 1=owned,2=control,3=delegated");
        console.log("filename is: " + fileName);
        console.log("updateFlag is: " + updateFlag + "\n");

        //get the directory
        var directory = PATH + "/" + pubKey.toUpperCase() + "/";
        if (flag == 0) {
            directory = directory + OwnershipDirectory + "/" + fileName;
        }
        if (flag == 1) {
            directory = directory + ControlDirectory + "/" + fileName;
        }
        if (flag == 2) {
            directory = directory + DelegateDirectory + "/" + fileName;
        }

        var cryptoEncr = new Crypto({ pubKey: pubKey });

        //debugging
        var fileName = directory;
        console.log("FILE NAME: " + directory)

        //this is an update
        if (fs.existsSync(fileName) && updateFlag == 1) {

            //file exists, so this is an update
            var keys = req.body.keys;
            var values = req.body.values;

            //debugging
            console.log("File exists: " + fs.existsSync(fileName))

            var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
            fileContent = JSON.parse(fileContent);

            //debugging
            console.log("Testing, File Pulled up: " + JSON.stringify(fileContent));

            for (var i = 0; i < keys.length; i++) {
                var name = keys[i];
                var val = values[i];

                fileContent[name] = val;
            }

            fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));

        }
        else //this is a creation
        {
            console.log("This is a CREATION command");
            var data = req.body.data; //json input
            var cryptoData = cryptoEncr.encrypt(JSON.stringify(data));
            fs.writeFile(fileName, cryptoData, (err) => {
                if (err) {
                    res.status(400).json({ "Error": "Unable to write message in " + fileName });
                    console.log("This is a CREATION command AFTER ERR, " + err);
                }
                else {
                    res.json({ Msg: 'Proposal updated successfully' });
                    console.log("This is a CREATION command AFTER RES");
                }
            });
        }

    },//end setDimension

    //To delete a dimension
    //INPUT: pubKey
    //flag (0 = owned, 1 = controlled, 2 = delegated)
    //fileName
    deleteDimension: function (req, res) {
        //get public key
        var pubKey = req.body.pubKey;

        //get flag
        var flag = req.body.flag;

        //get fileName
        var fileName = req.body.fileName;

        //get the directory
        var directory = PATH + "/" + pubKey.toUpperCase() + "/";
        if (flag == 0) {
            directory = directory + OwnershipDirectory + "/" + fileName;
        }
        if (flag == 1) {
            directory = directory + ControlDirectory + "/" + fileName;
        }
        if (flag == 2) {
            directory = directory + DelegateDirectory + + "/" + fileName;
        }

        //debugging
        var fileName = directory;
        console.log("FILE NAME: " + directory)

        if (fs.existsSync(fileName)) {
            console.log("File exists")
            console.log(fs.existsSync(fileName))

            fs.unlinkSync(fileName);

            res.json({ "Msg": "File Deleted." })

        }
        else {
            res.json({ "Msg": "File Not found." })
        }
    }//end deleteAsset


} //end DimensionCtrl
module.exports = DimensionCtrl;
