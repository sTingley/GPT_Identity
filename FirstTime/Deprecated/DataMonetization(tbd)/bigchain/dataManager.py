from pymongo import MongoClient, errors, ReturnDocument
from bson import json_util
import json
class DataManager:
    def __init__(self):
        self.dbconf = {
            'db_host':'172.16.217.94',
            'db_port':'27017',
            'db_dbase':'dm',
            'db_dataCollection':'dataset',
            "db_filterCollection":'analytics'
        }
        self.db = self.makeConnection()
        self._id = ""

    def makeConnection(self):
        try:
            client = MongoClient('mongodb://'+self.dbconf.get('db_host')+":"+self.dbconf.get('db_port'))
            return client[self.dbconf.get('db_dbase')]
        except errors.ServerSelectionTimeoutError as err:
            print(err)

    def setPublicKey(self, key):
        self._id = key

    def getData(self):
        return self.db[self.dbconf.get('db_dataCollection')].find_one({"_id":self._id})

    def append(self, filter, newdata):
        updated = self.db[self.dbconf.get('db_dataCollection')].find_one_and_update(filter, {'$push': {'assets.$.data': newdata }}, return_document=ReturnDocument.AFTER)
        return updated

    def update(self, filter, data):
        updated = self.db[self.dbconf.get('db_dataCollection')].find_one_and_update(filter, {'$set': data},return_document=ReturnDocument.AFTER)
        return updated

    def getAssetsByCategories(self, categories):
        output = {}
        if self._id:
            pipeline = [
                {"$match":{"_id":self._id}},
                {"$unwind": "$assets"},
                {"$match":{"assets.visibility":"public"}},
                {"$match":{"assets.id":{"$in":categories}}},
                {"$project": {"assets.category_title":1,"assets.data.label":1, "assets.data.value":1}},
                    {"$group": {
                    "_id":"$_id",
                    "assets":{"$push": '$assets'}
                }}
            ]
            result = list(self.db[self.dbconf.get('db_dataCollection')].aggregate(pipeline))
            if len(result) > 0:
                result = result[0]
                del result["_id"]
                output = result
        return output

    def getCities(self):
        result = self.db[self.dbconf.get('db_filterCollection')].find(None,{"city":1,"_id":0})
        return list(result)

    def getInterests(self):
        result = self.db[self.dbconf.get('db_filterCollection')].find({"city":"Mumbai"},{"tags.tag":1,"_id":0})
        return list(result)

    def countTotal(self,input):
        total = 0
        for key, value in input[0].items():
            if value is not None:
                for data in value:
                    if isinstance(data, list):
                        total += data[0]["count"]
                    else:
                        total += data["count"]
        return total

    def filters(self, data):
        params = {
            "cities":data.get("cities[]"),
            "agegroup":data.get("agegroup")[0],
            "gender":data.get("gender")[0],
            "interest": data.get("interest[]")
        }
        # return params
        qry = []
        if params.get("cities") and len(params.get("cities")) > 0:
            qry.append({"$match":{"city":{"$in":params.get("cities")}}})
        if params.get("agegroup"):
            qry.append({"$unwind": "$agegroup"})
        if params.get("interest") and len(params.get("interest")) > 0:
            qry.append({"$unwind": "$tags"})
        if params.get("gender"):
            qry.append({"$unwind": "$gender"})
        if params.get("interest") and len(params.get("interest")) > 0:
            qry.append({"$match":{"tags.tag":{"$in":params.get("interest")}}})
        qry.append({"$match": {"gender.sex":params.get("gender")}})
        if params.get("agegroup"):
            qry.append({"$match":{"agegroup.group": params.get("agegroup")}})
        qry.append({"$group":{"_id":None,"tags":{"$push":"$tags"}, "gender":{"$push":"$gender"},"agegroup":{"$push":"$agegroup"}}})
        result = list(self.db[self.dbconf.get('db_filterCollection')].aggregate(qry))
        # print(result)
        massTotal = self.countTotal(result)
        result[0]["total_subscribers"] = massTotal
        return result


    def getTitleByIds(self, ids):
        pipeline = [
            {"$match":{"_id":"02a1d0365f1c92971681dd0d28e0a0758c8e68d9ee2818f1b2371ad5c9bf1b7a5f"}},
            {"$unwind": "$assets"},
            {"$match":{"assets.id":{"$in":ids}}},
            {"$project": {"assets.category_title":1}},
                {"$group": {
                "_id":None,
                "categories":{"$push": '$assets.category_title'}
            }}
        ]
        result = list(self.db[self.dbconf.get('db_dataCollection')].aggregate(pipeline))
        return result
