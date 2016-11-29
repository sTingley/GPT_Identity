'use strict'

var fs = require ('fs');
var Crypto = require('./cryptoCtr.js'),
        keccak_256 = require('js-sha3').keccak_256,
        config = require('./config.json');
//DEFINE PATH (NOTIFICATION PATH)

//TO DEFINE:
//PATH
//ControlDirectory
//OwnershipDirectory
//DelegateDirectory


var AssetCtrl = 
{
        //returns all your files in your owned folder
        //INPUT: pubKey
        getOwnedAssets: function(req,res)
        {
            //get public key
            var pubKey = req.body.pubKey;
            
            //debugging
            console.log("INPUT, pubKey: " + pubKey)
            
            //get file path
            var filePath = PATH + "/" + keccak_256(pubKey).toUpperCase() + "/" + OwnershipDirectory;
            
            //debugging
            console.log("FILE PATH: " + filePath)
            
            
            
            var files = [];//to return

            //get all file names using file sync
            if(fs.existsSync(files))
            {
                files = fs.readdirSync(filePath);
            }
            
            //debugging
            console.log("FILES ARE: " + files)
            
            //send json response
            res.json({"data":files})
            
        },
        
        //returns all your files in your controlled folder
        //INPUT: pubKey
        getControlledAssets: function(req,res)
        {
            //get public key
            var pubKey = req.body.pubKey;
            
            //debugging
            console.log("INPUT, pubKey: " + pubKey)
            
            //get file path
            var filePath = PATH + "/" + keccak_256(pubKey).toUpperCase() + "/" + ControlDirectory;
            
            //debugging
            console.log("FILE PATH: " + filePath)
            

            var files = [];//to return

            //get all file names using file sync
            if(fs.existsSync(files))
            {
                files = fs.readdirSync(filePath);
            }


            
            //debugging
            console.log("FILES ARE: " + files)
            
            //send json response
            res.json({"data":files})
            
        },
        
        //returns all your files in your delegated folder
        //INPUT: pubKey
        getDelegatedAssets: function(req,res)
        {
            //get public key
            var pubKey = req.body.pubKey;
            
            //debugging
            console.log("INPUT, pubKey: " + pubKey)
            
            //get file path
            var filePath = PATH + "/" + keccak_256(pubKey).toUpperCase() + "/" + DelegateDirectory;
            
            //debugging
            console.log("FILE PATH: " + filePath)
            
            
            var files = [];//to return

            //get all file names using file sync
            if(fs.existsSync(files))
            {
                files = fs.readdirSync(filePath);
            }
            
            //debugging
            console.log("FILES ARE: " + files)
            
            //send json response
            res.json({"data":files})
            
        },
        
        //returns an asset
        //INPUT: pubKey
        //flag (0 = owned, 1 = controlled, 2 = delegated)
        //fileName
        getAsset: function(req,res)
        {
            //get public key
            var pubKey = req.body.pubKey;
            
            //get flag
            var flag = req.body.flag;
            
            //get fileName
            var fileName = req.body.fileName;
            
            //get the directory
            var directory = PATH + "/" + keccak_256(pubKey).toUpperCase() + "/";
            if(flag == 0)
            {
                directory = directory + OwnershipDirectory + "/" + fileName;
            }
            if(flag == 1)
            {
                directory = directory + ControlDirectory + "/" + fileName;
            }
            if(flag == 2)
            {
                directory = directory + DelegateDirectory + + "/" + fileName;
            }
            
            var cryptoEncr = new Crypto({pubKey: pubKey});
            
            //debugging
            var fileName = directory;
            console.log("FILE NAME: " + directory)


            if (fs.existsSync(fileName))
            {
                console.log("File exists")
                console.log(fs.existsSync(fileName))
                var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
                fileContent = JSON.parse(fileContent)

                res.json(fileContent)

             } 
             else
             {
                res.json({"Msg":"Not found."})
             }

            
        },
        
        //sets an asset
        //INPUT: pubKey
        //flag (0 = owned, 1 = controlled, 2 = delegated)
        //fileName
        //updateFlag (0 = new, 1 = update)
        //data -- only input for a write
        //keys,vals -- only input for an update
        setAsset: function(req,res)
        {
            //get public key
            var pubKey = req.body.pubKey;
            
            //get flag
            var flag = req.body.flag;
            
            //get fileName
            var fileName = req.body.fileName;
            
            //get updateFlag
            var updateFlag = req.body.updateFlag;
            
            //data to write
            var data = params.body.data;
            
            //get the directory
            var directory = PATH + "/" + keccak_256(pubKey).toUpperCase() + "/";
            if(flag == 0)
            {
                directory = directory + OwnershipDirectory + "/" + fileName;
            }
            if(flag == 1)
            {
                directory = directory + ControlDirectory + "/" + fileName;
            }
            if(flag == 2)
            {
                directory = directory + DelegateDirectory + + "/" + fileName;
            }
            
            var cryptoEncr = new Crypto({pubKey: pubKey});
            
            
            //debugging
            var fileName = directory;
            console.log("FILE NAME: " + directory)
            
            
            //this is an update
            if (fs.existsSync(fileName) && flag == 1) 
            {

                //file exists, so this is an update
                var keys = params.body.keys;
                var values = params.body.values;

                //debugging
                console.log("File exists: " + fs.existsSync(fileName))

                var fileContent = cryptoEncr.decrypt(fs.readFileSync(fileName, 'utf8'));
                fileContent = JSON.parse(fileContent);

                //debugging
                console.log("Testing, File Pulled up: " + JSON.stringify(fileContent));


                for(var i = 0; i < keys.length; i++)
                {
                    var name = keys[i];
                    var val = values[i];

                    fileContent[name] = val;
                 }


                 fs.writeFileSync(fileName, cryptoEncr.encrypt(JSON.stringify(fileContent)));
                
                } 
                else
                {

                        var data = params.body.data; //json input
                        var cryptoData = cryptoEncr.encrypt(JSON.stringify(msg.data));
                        fs.writeFile(fileName, cryptoData, (err) => {
                                if(err)
                                {
                                        res.status(400).json({"Error": "Unable to write message in " + fileName});
                                }
                                res.json({"Msg":"Proposal updated successfully" });
                        });
                }

        }
}
module.exports = AssetCtrl;
