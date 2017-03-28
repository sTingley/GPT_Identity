from bigchaindb_driver import BigchainDB
import cryptoconditions as cc
from dataManager import DataManager

class RequesterTxManager():

    def __init__(self, token):
        self.bigchaindb_url = 'http://172.16.217.94:9984'
        self.mongoCon = DataManager().makeConnection()
        self.b = self.getChainDriver()
        self.txnTbl = "transactions"
        self.preimage = token

    def getChainDriver(self):
        return BigchainDB(self.bigchaindb_url)

    def getTxnDetails(self):
        db = self.mongoCon
        data = db[self.txnTbl].find_one({'_id': self.preimage})
        return data

    def terminateTxn(self):
        db = self.mongoCon
        sts = db[self.txnTbl].update_one({'_id': self.preimage }, {'$set': {"txn.visibility_count": 0}})
        return sts;


    def validateTx(self, txid):
        trails = 0
        while trails < 100:
            try:
                if self.b.transactions.status(txid).get('status') == 'valid':
                    break
            except bigchaindb_driver.exceptions.NotFoundError:
                trails += 1
        return self.b.transactions.status(txid).get('status')

    def trasferAsset(self):
        data = self.getTxnDetails()
        if data and data.get('_id'):
            txn = data.get('txn')
            if txn.get('visibility_count') > 0:
                txnid = txn.get('txId')
                if self.validateTx(txnid) == 'valid':
                    return self.prepareAssetTransfer(txn)
                else:
                    return {"status":"False", "error": "invalid create transaction"}
            else:
                return {"status":"False", "error": "transaction expired"}
        return {"status":"False", "error": "invalid preimage"}

    def transferInput(self, tx):
        index = 0
        output = tx['outputs'][index]
        input_ = {
          'fulfillment': output['condition']['details'],
          'fulfills': {
              'output': index,
              'txid': tx['id'],
          },
          'owners_before': output['public_keys'],
        }
        return input_

    def prepareAssetTransfer(self, data):
        txnid = data.get('txId')
        tx = self.b.transactions.retrieve(txnid)
        transferAsset = {
          'id': tx['id']
        }
        transferTx = self.b.transactions.prepare(
          operation='TRANSFER',
          recipients=data.get('pubkey'),
          asset=transferAsset,
          inputs=self.transferInput(tx),
        )
        transfer_tx_condition = cc.PreimageSha256Fulfillment(preimage=str.encode(self.preimage))
        if tx['inputs'][0]['fulfillment'] == transfer_tx_condition.serialize_uri():
            transferTx['inputs'][0]['fulfillment'] = transfer_tx_condition.serialize_uri()
            sent_transfer_tx = self.b.transactions.send(transferTx)
            return {"status":"True", "asset":tx['asset']['data']}
        else:
            return {"status":"False", "error": "invalid transaction id"}
