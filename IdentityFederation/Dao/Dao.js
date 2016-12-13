'use strict'
var contracts = require('eris-contracts')
var fs = require('fs')
var http = require('http')

var chainConfig = require('/home/demoadmin/.eris/ErisChainConfig.json')

//Set up addresses for deployed contracts
var address_Dao = require('./epm.json').Dao
// Set up abis for deployed contracts
var abi_Dao = JSON.parse(fs.readFileSync('./abi/' + address_Dao, 'utf8'))

var accounts = require('./accounts.json')
var chainUrl
var manager
var contract
var server
var hostname = 'localhost';
var port = 8002;

//URL to the rpc endpoint of the eris-db server
chainUrl = chainConfig.chainURL;
//Instantiate the contract object manager using the chain URL and the account data.
var manager_full = contracts.newContractManagerDev(chainUrl, chainConfig.primaryAccount)
// Instantiate the contract object using the ABI and the address.
var contract_Dao = manager_full.newContractFactory(abi_Dao).at(address_Dao)

server = http.createServer(function (request, response) {

    var body = ''
    //variables for dao
    var newValidator
    var oldValidator

    //Get the list of validators from Dao
    if (request.method == 'GET' && request.url == '/getList') {

        contract_Dao.getList(function (error, result) {

            if (error) { throw error }
            response.write("The list of validators is: " + result + "\n");
            //callback();
            response.end();
        })
        
    } //end '/getList'


    if (request.method == 'POST' && request.url == '/addValidator') {

        request.on('data', function (chunk) {
            body += chunk
            console.log(body)
        })

        request.on('end', function () {

            body = JSON.parse(body)
            newValidator = body.validatorAddr
            var ip = body.validatorIP

            response.write("The new validator who is going to be added: " + newValidator + "\n")
            contract_Dao.addValidator(newValidator, ip, function (error, result) {
                response.statusCode = error ? 500 : 200
                if (error) {
                    response.write("Not able to add. The validator is already in the list.Try a new one." + "\n")
                }
                else {
                    response.write("The validator has been added to the list." + "\n")
                    // response.write(response.statusCode.toString())
                }
                response.end()
            })

        })

    } //end '/addValidator'


    //Get total numbers of validators in the DAO
    if (request.method == 'GET' && request.url == '/totalValidator') {

        contract_Dao.totalValidator(function (error, result) {
            if (error) { throw error }
            console.log("The total number of validators is: " + result + "\n");
            response.write("The total number of validators is: " + result + "\n");
            //callback();
            response.end();
        })

    } //end '/totalValidator'


    // Check if the validator is existing in the list
    if (request.method == 'POST' && request.url == '/isExist') {

        request.on('data', function (chunk) {
            body += chunk
            console.log(body)
        })

        request.on('end', function () {

            body = JSON.parse(body)
            oldValidator = body.validatorAddr
            contract_Dao.isExist(oldValidator, function (error, result) {
                response.statusCode = error ? 500 : 200
                // response.write(response.statusCode.toString())
                response.write("The validator is existing in the list: " + result + "\n")
                response.end()
            })

        })

    } //end '/isExist'


    if (request.method == 'POST' && request.url == '/getTheIndexer') {

        request.on('data', function (chunk) {
            body += chunk
            console.log(body)
        })

        request.on('end', function () {

            body = JSON.parse(body)
            oldValidator = body.validatorAddr
            contract_Dao.getTheIndexer(oldValidator, function (error, result) {
                response.statusCode = error ? 500 : 200
                if (error) {
                    response.write("Not able to get the indexer. The validator is the in the list. Enter a valid input." + "\n")
                }
                else {
                    //response.write(response.statusCode.toString())
                    response.write("The validator indexer is : " + result + "\n")
                }
                response.end()

            }) //contract_Dao.getTheIndexer

        }) //request.on

    } //end '/getTheIndexer'


    // Remove existing validator from Dao
    if (request.method == 'POST' && request.url == '/removeValidator') {

        request.on('data', function (chunk) {
            body += chunk
            console.log(body)
        })

        request.on('end', function () {

            body = JSON.parse(body)
            oldValidator = body.validatorAddr
            response.write("The old validator who is going to be removed: " + oldValidator + "\n")
            contract_Dao.removeValidator(oldValidator, function (error, result) {
                response.statusCode = error ? 500 : 200
                if (error) {
                    response.write("Not able to remove it. The validator is not in the list. Enter a valid input" + "\n")
                }
                else {
                    response.write("The validator has been removed" + "\n")
                    //response.write(response.statusCode.toString())
                }
                response.end()

            }) //contract_Dao.removeValidator

        }) //request.on

    } //end of '/removeValidator'

}) //end of server



server.listen(port, hostname, function () {
    console.log(`Server running at http://${hostname}:${port}/`);
});
