from flask import Flask, request
from flask_cors import CORS
from flask import jsonify

from dataManager import DataManager
from ownerTxManager import OwnerTxnManager
from requesterTxManager import RequesterTxManager

import json

app = Flask(__name__)
CORS(app)
mgr = DataManager()

@app.route("/")
def init():
    return jsonify(mgr.getData())

@app.route("/getMyData/<pubkey>")
def getMyData(pubkey):
    mgr.setPublicKey(pubkey)
    return jsonify(mgr.getData())

@app.route("/getTitles/<ids>")
def getTitles(ids):
    element = [ids]
    if ids:
        if "," in ids:
            element = ids.split(",")
    result = mgr.getTitleByIds(element)
    return jsonify(result)


@app.route("/update", methods=['POST'])
def updateVisibility():
    update = mgr.update({"_id":request.form['id'], "assets.id" : request.form['asset_id']}, {"assets.$.visibility": request.form['set']})
    return jsonify(update)

@app.route("/create", methods=['POST'])
def createNewProposal():
    print(json.loads(request.data))
    # dta = {
    #     'owner_publickey': '02a1d0365f1c92971681dd0d28e0a0758c8e68d9ee2818f1b2371ad5c9bf1b7a5f',
    #     'amount': 100,
    #     'requester_publickey':'03fd9b2b7f945f8c807202b3590645976e4a537d9833dbfca09a6e6fc8db4a339d',
    #     'access_type':'private',
    #     'data_type': 'basic_info,detailed_info'
    # }
    dta = json.loads(request.data)
    txManager = OwnerTxnManager()
    mgr.setPublicKey(dta.get("owner_publickey"))
    assets = mgr.getAssetsByCategories(dta.get("data_type").split(","))
    result = txManager.createAsset(dta, assets)
    return jsonify(result)

@app.route("/retrieve/<secret>", methods=['GET'])
def retriveProposal(secret):
    result = {"status":"False", "error":"unknown secret message"}
    if secret:
        txnManager = RequesterTxManager(secret)
        result = txnManager.trasferAsset()
        txnManager.terminateTxn()
    return jsonify(result)

@app.route("/isvalid/<secret>", methods=['GET'])
def isValidProposal(secret):
    result = {"status":"False", "error":"unknown secret message"}
    if secret:
        txnManager = RequesterTxManager(secret)
        result = txnManager.getTxnDetails()
        if result and result.get("txn").get("visibility_count") > 0:
            result = {"status": "valid"}
        else:
            result = {"status": "invalid"}
    return jsonify(result)

@app.route("/cities", methods=['GET'])
def getAllCities():
    return jsonify(mgr.getCities())

@app.route("/intrests", methods=['GET'])
def getAllIntrest():
    return jsonify(mgr.getInterests())

@app.route("/find", methods=['POST'])
def filterCustomers():
    # return jsonify()
     return jsonify(mgr.filters(dict(request.form)))

if __name__ == "__main__":
    app.run(host="0.0.0.0")
