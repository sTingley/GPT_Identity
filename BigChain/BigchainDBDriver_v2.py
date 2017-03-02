#BIGCHAIN IS INSTALLED IN 10.101.114.230 (10.100.98.217)


#Flask is the library that allows one to make a RESTful service in Python
import flask
import copy
import json

#These libraries let one get API requests and make data in JSON format
from flask import Flask
from flask import jsonify
from flask import request

#libraries for bigchain functionality
from bigchaindb import Bigchain
#from bigchaindb import crypto
from bigchaindb import util
import cryptoconditions as cc
#^Which of the above are not needed???


#bigchain functionality
from bigchaindb_driver import BigchainDB
bdb = BigchainDB('http://10.100.99.175:9984/api/v1')
from bigchaindb_driver.crypto import generate_keypair

#for file writing and reading
import os
import os.path

#for hashing & encoding/decoding
import hashlib
#import Crypto
from Crypto.Cipher import AES
import base64



#app declaration
app = Flask(__name__)





ErisPubKeys = [];
BigchainPubKeys = [];
BigchainPrivKeys = [];

#hashes something
def hashIt(input):
        input = bytes(input, 'utf-8')
        hash_object = hashlib.sha256(input)
        hex_dig = hash_object.hexdigest()
        return hex_dig

#DEBUG: print(hashIt('hi'))


#encryption & decryption methods
MASTER_KEY="Some-long-base-key-to-use-as-encyrption-key"
def encrypt_val(clear_text):
    enc_secret = AES.new(MASTER_KEY[:32])
    tag_string = (str(clear_text) +
                  (AES.block_size -
                   len(str(clear_text)) % AES.block_size) * "\0")
    cipher_text = base64.b64encode(enc_secret.encrypt(tag_string))

    return cipher_text.decode('UTF-8')


def decrypt_val(cipher_text):
    dec_secret = AES.new(MASTER_KEY[:32])
    raw_decrypted = dec_secret.decrypt(base64.b64decode(cipher_text))
    clear_val = raw_decrypted.decode('UTF-8').rstrip("\0")
    return clear_val


encrypted1 = encrypt_val('hi')
print(encrypted1)
print(decrypt_val(encrypted1))



#This function takes in an Eris Public Key (UNHASHED)
#If a BigchainDB key pair exists for the public key, it retreives it, then returns it.
#If a BigchainDB key pair does not exist for the public key, it creates it, then returns it.
#In any case, you input a public key, and a linked bigchaindb key pair is returned.
def erisfyIt(pubKey):
        flag = -1
        pubNDpriv = [];

        pubKey = hashIt(pubKey)

        #ErisPubKeys IS the name of the files
        ErisPubKeys = getPubKeysEris()
        for i in range(len(ErisPubKeys)):
            if ErisPubKeys[i] == (pubKey + ".txt"):
                flag = i;
        if flag == -1:
            #make the user in bigchain
            alice = generate_keypair()
            priv1 = alice.signing_key;
            pub1 = alice.verifying_key;
            print("test private: " + priv1)
            print("test public: " + pub1)
            priv1 = encrypt_val(priv1)
            pub1 = encrypt_val(pub1)
            print(decrypt_val(priv1))
            print(decrypt_val(pub1))
           # index = len(BigchainPubKeys)

            createFile(pubKey,pub1,priv1)
            #BigchainPubKeys.append(pub1)
            #BigchainPrivKeys.append(priv1)
            #ErisPubKeys.append(pubKey)

            pubNDpriv = [decrypt_val(pub1),decrypt_val(priv1)]
        else:
            pubNDpriv = [getPubKeyBigchain(pubKey),getPrivKeyBigchain(pubKey)]
        return pubNDpriv



#This function takes in a public key (UNHASHED), and returns an associated Bigchain public key
#FLAG 1 means this is an eris key
#FLAG 0 means this is a bigchaindb key
def keyPointerManagement(pubkey, flag):
        returnThisKey = pubkey
        if(flag == 1):
            returnThisKey = erisfyIt(pubkey)[0]
        return returnThisKey

#TODO: ADD FLAG FUNCTIONALITY FOR BIGCHAIN PUBLIC KEY
#This function takes in a public key (UNHASHED), and returns an associated Bigchain private key
#FLAG 1 means this is an eris key
#FLAG 0 means this is a bigchaindb key
def privKeyPointerManagement(pubkey,flag):
        returnThisKey = pubkey #TODO FOR FLAG = 0
        if(flag == 1):
            returnThisKey = erisfyIt(pubkey)[1]
        return returnThisKey


#This function takes in an UNHASHED public key (or list of public keys), and returns an associated Bigchain public key or list of Bigchain public keys
#1 means this is a bigchain key
#0 means this is an eris key
def listPoint(pubList, flag):
        newList = []
        for i in range(len(pubList)):
            newList.append(keyPointerManagement(pubList[i],flag))
        return newList

#TODO: ADD FLAG FUNCTINOALITY FOR BIGCHAIN PUBLIC KEY
#This function takes in an UNHASHED public key (or list of public keys), and returns an associated Bigchain private key or list of Bigchain private keys
#FLAG 1 means this is an eris key
#FLAG 0 means this is a bigchaindb key
def privListPoint(pubList,flag):
        newList = []
        for i in range(len(pubList)):
            newList.append(privKeyPointerManagement(pubList[i],flag))
        return newList


#This function returns all file names (HASHES of Eris Keys that have called the driver)
def getPubKeysEris():
        path = '/home/demoadmin/DriverFiles'
        files = os.listdir(path)
        files_txt = [i for i in files if i.endswith('.txt')]
        return files_txt

#This function takes in an ErisPubKey (HASHED) and returns the bigchaindb public key
def getPubKeyBigchain(ErisPubKey):
        pubKey = getBigchainKeys(ErisPubKey)
        pubKey = pubKey[0]
        return pubKey

#This function takes in an ErisPubKey (HASHED) and returns the bigchaindb private key
def getPrivKeyBigchain(ErisPubKey):
        privKey = getBigchainKeys(ErisPubKey)
        privKey = privKey[1]
        return privKey

#This function gives bigchaindb key pairs to an existing eris pubkey (Note: Eris Pubkey Input must be HASHED)
theDir = '/home/demoadmin/DriverFiles'
def getBigchainKeys(ErisPubKey):

        #name of directory
        name_of_file = ErisPubKey+".txt"
        #combine file name to directory
        #name_of_file = ErisPubKey + ".txt"
        completeName = os.path.join(theDir, name_of_file)
        fo = open(completeName, "r+", encoding="UTF-8")
        #open the file
        #fo = open(completeName,"r+",encoding="UTF-8");
        #fo = open(completeName,"r+")
        #read keys
        pubKey = fo.readline()
        pubKey = pubKey.strip()
        privKey = fo.readline()
        #close the connection
        fo.close()
        pubKey = decrypt_val(pubKey)
        privKey = decrypt_val(privKey)
        return [pubKey,privKey];



#The eris public key IS the file name
def createFile(ErisPubKey,BigchainPubKey,BigchainPrivKey):
        #name of directory
        theDir = '/home/demoadmin/DriverFiles'

        #combine file name to directory
        name_of_file = ErisPubKey + ".txt"
        completeName = os.path.join(theDir, name_of_file)

        #create the file
        fo = open(completeName,"w+")

        #write the BigchainPubKey FIRST (with next line delimiter)
        fo.write(BigchainPubKey+"\n")

        #write the BigchainPrivKey second
        fo.write(BigchainPrivKey)

        #close the connection
        fo.close()


#TESTING
#createFile("ErisPubkey","BigchainPubKey","BigchainPrivKey")
#print(getPubKeysEris())
#print("pubkey " + getPubKeyBigchain(hashIt("ErisPubkey")))
#print("privkey "+ getPrivKeyBigchain(hashIt("ErisPubkey")))
#erisfyIt("ErisPubkey")





#GET: public and private key of a new user to be generated
#User Input: None
@app.route('/getKeys', methods=['GET'])
def get_keys():
        alice = generate_keypair()
        pub1 = alice.verifying_key;
        priv1 = alice.signing_key;
        return jsonify({'publickey': pub1, 'privatekey': priv1})


#POST: a transfer transaction
#INPUT (JSON)
#pubFrom: the public key of the owner of the asset
#pubTo: the public key of the new owner of the asset
#txID: the txn id
#flag: 0 means input is bigchain keys; 1 means input is eris
@app.route('/transaction', methods = ['POST'])
def transaction():
        input = request.get_json(force=True)
        pubTo = str(input['PubTo'])
        pubFrom =str(input['PubFrom'])
        txID = str(input['txID'])
        flag = int(input['flag'])

        tx_retrieved = bdb.transactions.retrieve(txID)

        pubTo = keyPointerManagement(pubTo, flag)
        privFrom = privKeyPointerManagement(pubFrom,flag)

        tx_transfer = bdb.transactions.transfer(
            tx_retrieved,
            pubTo,
            asset = tx_retrieved['transaction']['asset'],
            signing_key=privFrom,
        )
        print(tx_transfer)
        return flask.jsonify(**tx_transfer)








#POST: Add a transaction
#User Input: A digital asset payload, public key
#The digital asset payload is the post request data in json format;
#The public key should be put into the URL
@app.route('/addData/<pub1>/<flag>', methods=['POST'])
def add_data_2(pub1,flag):
        pub = keyPointerManagement(pub1,int(flag))
        priv = getPrivKeyBigchain(hashIt(pub1))
        digital_asset_payload = request.get_json(force=True)
        tx = bdb.transactions.create(verifying_key=pub,
                                     signing_key=priv,
                                     asset=digital_asset_payload)
        return flask.jsonify(**tx)



#POST: Implement a Threshold Condition Transaction
#
#Input is a Json object. An example is shown below.
#
#{
# "pubNew": "these are public keys of the receivers in the transaction"
# "txID": "this is the threshold transaction id"
# "cid": "this is the threshold condition id"
# "pubKeys": "these are the public keys of EVERYONE in the threshold agreement"
# "privKeys": "SAME ORDER. these are the private keys of the threshold agreement.Ofcourse, it must be at least the threshold number."
# "N": "this is the threshold number of the transaction"
#}
@app.route('/thresholdConditionsSatisfy', methods = ['POST'])
def threshold_it_2():
        #get data
        data = request.get_json(force=True)
        pubNew = data['pubNew']
        txID = data['txID']
        cid = int(data['cid'])
        pubKeys = data['pubKeys']
        privKeys = data['privKeys']
        N = int(data['N'])

        #format data
        pubNew = pubNew.split("_")
        pubKeys = pubKeys.split("_")
        privKeys = privKeys.split("_")
        txn  = {"cid": cid, "txid": txID}

        #this is the subfulfillment list. we use pubKeys initially as it has the same size.
        subfulfillments = pubKeys

        # Create the base template
        threshold_tx_transfer = b.create_transaction(pubKeys, pubNew, txn, 'TRANSFER')

        # Parse the condition
        threshold_tx = b.get_transaction(txID)
        threshold_fulfillment = cc.Fulfillment.from_json(threshold_tx['transaction']['conditions'][0]['condition']['details'])

        for i in range(len(pubKeys)):
                subfulfillments[i] = threshold_fulfillment.get_subcondition_from_vk(pubKeys[i])[0]

        threshold_tx_fulfillment_message = util.get_fulfillment_message(threshold_tx_transfer,
                                                                threshold_tx_transfer['transaction']['fulfillments'][0],
                                                                serialized=True)

        threshold_fulfillment.subconditions = []

        # Sign and add the subconditions until threshold of 2 is reached
        for i in range(N):
                subfulfillments[i].sign(threshold_tx_fulfillment_message, crypto.SigningKey(privKeys[i]))
                threshold_fulfillment.add_subfulfillment(subfulfillments[i])




        # Add remaining (unfulfilled) fulfillment as a condition
        for i in range(len(pubKeys)-N):
                threshold_fulfillment.add_subcondition(subfulfillments[i+N].condition)

        # Update the fulfillment
        threshold_tx_transfer['transaction']['fulfillments'][0]['fulfillment'] = threshold_fulfillment.serialize_uri()


#       b.write_transaction(threshold_tx_transfer)

        #return threshold_tx_transfer
        return flask.jsonify(threshold_tx_transfer)


# #POST:
#
#This does the following. It adds threshold conditions in a transaction to new users.
#
#And your threshold condition is made. Then (and only then) can you use thresholdTransaction Request.
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
@app.route('/generateThresholdConditions', methods=['POST'])
def threshold_it():

        #gets input data
        data = request.get_json(force=True)
        txID = data['txID']
        cid = int(data['cid'])
        pubKeys = data['pubKeys']
        privKeys = data['privKeys']
        newPubKeys = data['newPubKeys']
        N = int(data['N'])

        #formats input data
        pubKeys = pubKeys.split("_")
        privKeys = privKeys.split("_")
        newPubKeys = newPubKeys.split("_")

        #format retrieved_id
        txn  = {"cid": cid, "txid": txID}

        #makes the base template
        threshold_tx = b.create_transaction(pubKeys, newPubKeys,
                                            txn, 'TRANSFER')
        #implements the threshold condition
        threshold_condition = cc.ThresholdSha256Fulfillment(threshold=(N))
        for i in range(len (newPubKeys)):
                threshold_condition.add_subfulfillment(
                cc.Ed25519Fulfillment(public_key=newPubKeys[i]))

        #Update the condition in the newly created transaction
        threshold_tx['transaction']['conditions'][0]['condition'] = {
        'details': json.loads(threshold_condition.serialize_json()),
        'uri': threshold_condition.condition.serialize_uri()}

        #Now update the transaction hash (ID)
        threshold_tx['id'] = util.get_hash_data(threshold_tx)

        #Sign the transaction
        threshold_tx_signed = b.sign_transaction(threshold_tx, privKeys)

        #Write the transaction
        b.write_transaction(threshold_tx_signed)

        #Return the signed transaction
        return flask.jsonify(**threshold_tx_signed)



#GET: Get Transaction
#User Input: Transaction ID into the URL
@app.route('/getTransaction/<tx_ID>', methods=['GET'])
def get_transaction(tx_ID):
        tx_retrieved = bdb.transactions.retrieve(tx_ID)
        print(tx_retrieved)
        return flask.jsonify(tx_retrieved)

#GET: Most recent transaction
#GET: Get Transactions by user




#run app
if __name__ == '__main__':
        app.run (
                host = "0.0.0.0",
                debug = True)
