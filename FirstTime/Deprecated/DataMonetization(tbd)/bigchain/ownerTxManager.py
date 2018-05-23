# import sha3
import hashlib
import json
import time

from bigchaindb_driver import BigchainDB
import cryptoconditions as cc
from cryptoconditions.crypto import Ed25519SigningKey as SigningKey
from pymongo import MongoClient, errors, ReturnDocument

from keyStoreMgr import KeyStoreMgr
from dataManager import DataManager


class OwnerTxnManager():

    def __init__(self):
        self.bigchaindb_url = 'http://172.16.217.94:9984'
        self.transactionsrTbl = 'transactions'
        self.b = self.getChainDriver()
        self.condition = ''
        self.mongoCon = DataManager().makeConnection()

    def getChainDriver(self):
        return BigchainDB(self.bigchaindb_url)

    def txInput(self):
        input_ = {
            'fulfillment': None,
            'fulfills': None,
            'owners_before': (self.owner_pub_key,)
        }
        return input_

    def txOutput(self):
        secret = str.encode(self.secret_message)
        tx_condition = cc.PreimageSha256Fulfillment(preimage=secret)
        self.condition = tx_condition
        output = {
            'amount': 1,
            'condition': {
                'details': tx_condition.to_dict(),
                'uri': tx_condition.condition_uri,
            },
            'public_keys': (self.owner_pub_key,),
        }
        return output

    def tx_prepare(self, assets):
        return {
            'operation': 'CREATE',
            'asset': {
                'data': assets
            },
            'metadata': None,
            'outputs': (self.txOutput(),),
            'inputs': (self.txInput(),),
            'version': '0.9',
        }

    def createAsset(self, params, assets):
        # work here
        key = str(time.time())
        self.secret_message = hashlib.sha3_256(key.encode()).hexdigest()
        ownerStore = KeyStoreMgr({'public_key': params.get('owner_publickey') }).getErisKeys()
        requesterStore = KeyStoreMgr({'public_key': params.get('requester_publickey') }).getErisKeys()
        self.owner_pub_key = ownerStore.get('public_key')
        self.owner_priv_key = ownerStore.get('private_key')
        self.requester_pub_key = requesterStore.get('public_key')
        return self.deployAsset(assets)

    def deployAsset(self, assets):
        tx = self.tx_prepare(assets)
        json_str_tx = json.dumps(
            tx,
            sort_keys=True,
            separators=(',', ':'),
            ensure_ascii=False,
        )
        creation_txid = hashlib.sha3_256(json_str_tx.encode()).hexdigest()
        tx['id'] = creation_txid
        fl_str_tx = json.dumps(
            tx,
            sort_keys=True,
            separators=(',', ':'),
            ensure_ascii=False,
        )
        tx['inputs'][0]['fulfillment'] = self.condition.serialize_uri()
        returned_creation_tx = self.b.transactions.send(tx)

        if self.validateTx(tx['id']) == 'valid':
            try:
                self.insertTxn(self.secret_message, self.requester_pub_key, tx['id'])
                return {'status':'True', "token": self.secret_message }
            except errors.WriteError as err:
                return {'status':'False', 'err': err}

    def validateTx(self, txid):
        trails = 0
        while trails < 100:
            try:
                if self.b.transactions.status(txid).get('status') == 'valid':
                    break
            except bigchaindb_driver.exceptions.NotFoundError:
                trails += 1
        return self.b.transactions.status(txid).get('status')

    def getdbCon(self):
        return self.mongoCon

    def insertTxn(self, secret, pubkey, tx):
        db = self.getdbCon()
        db.transactions.insert({
            '_id': secret,
            'txn': {
                'pubkey': pubkey,
                'txId': tx,
                'visibility_count': 1
            }
        })
