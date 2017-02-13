After downloading the file, place it in a directory. For example, you may run,


	mkdir BigchainDriver


Make sure python is installed in your environment. To run the driver, issue the following command in your directory:


	python BigchainDriver.py


The api is exposed at your local host at port 5000. To access it from a different server, simply type the ip. That is, the client-server API is exposed at:

	http://<ip>:5000/


We have the following requests. 
***Note: Inside the JSON objects, make sure to use double quotes. Single quotes may generate an error.


1. GET REQUEST (endpoint: /getKeys)
FUNCTION: This request generates a private and public key for a new user.
INPUT: None required.


2. POST REQUEST (endpoint: /transaction)
FUNCTION: This issues a transfer transaction between users. The input data is a json object.
INPUT: A json object. An example is shown below:
{
	"conID": "<this is the condition id>",
	"PubFrom": "<this is the public key of the sender>",
	"PrivFrom": "<this is the private key of the sender>",
	"PubTo": "<this is the receiver of the transaction>",
	"txID": "<the transaction id>"
}


3. GET REQUEST (endpoint: '/getTransaction/<tx_id>')
FUNCTION: This returns transaction details based on the transaction id.
INPUT: Inside the endpoint, put the transaction id.

thanks to bigchain community for helping this driver with their examples


generate threshold conditions
#POST:
#
#This does the following. It adds threshold conditions in a transaction to new users.
#
#And your threshold condition is made
#
#Input is a json object. Example shown below
#{
# "txID": "this is the transaction id to be transferred to new users"
# "cid": "this is the condition id of the transaction"
# "pubKeys": "these are public keys of owners ex. pub1_pub2_pub3"
# "privKeys": "these are private keys of owners ex. priv1_priv2_priv3"
# "newPubKeys" : "these are public keys of the new owners"
# "N" : "this is the threshold number"
#}



4. POST REQUEST (endoint: '/addData/default')
FUNCTION: This adds a digital asset payload to bigchain. It is done with the default internal user.
INPUT: The digital asset payload as a json object. An example is shown below:
{
	"msg": "hello"
}


5. POST REQUEST (endpoint: '/addData/<public key(s)>')
FUNCTION: This allows the user to assign a digital asset to one or more users. 
INPUT: The public keys in the endpoint and digital asset payload in json format. If there are more than one public keys, separate them with "_". For example pub1_pub2_pub3_pub4 if the transaction is being assigned to four users.