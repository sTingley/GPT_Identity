import json
from collections import OrderedDict
from bigchaindb_driver.crypto import generate_keypair

class KeyStoreMgr:

    def __init__(self,keypair):
        self.filepath = "./"
        self.filename = "keystoremap.json"
        self.file = self.filepath + self.filename
        self.keypair = dict(keypair)

    def getBigchainKeyPair(self):
        return generate_keypair()

    def updateKeyStore(self, newStore):
        with open(self.file, 'w') as jsonfile:
            json.dump(newStore, jsonfile, indent=4)

    def pairToAppend(self):
        bigchain = self.getBigchainKeyPair()
        return {
            "pubkey": self.keypair["public_key"],
            "bigchainkeys": {
                "public_key": bigchain[1],
                "private_key": bigchain[0]
            }
        }

    def isExists(self, data):
        stores = data.get("keystore")
        for index in range(len(stores)):
            if stores[index].get("pubkey") == self.keypair["public_key"]:
                return stores[index].get("bigchainkeys")
        return False


    def getErisKeys(self):
        with open(self.file, 'r') as jsonfile:
            datadict = json.load(jsonfile,  object_pairs_hook=OrderedDict)
        hasBigchainPairs = self.isExists(datadict)
        if hasBigchainPairs == False:
            newPairs = self.pairToAppend()
            datadict["keystore"].append(newPairs)
            self.updateKeyStore(datadict)
            hasBigchainPairs = newPairs
        return hasBigchainPairs
