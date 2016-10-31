# Digital Twin / Ballot

## Ballot (ballot.js)
- [ ] TODO : Should create Ballot.sol instance
- [ ] TODO : Should listen event from Ballot.sol, backend should send "public key" and "message" along with the event

- Listen the event from ballot contract
- Event should come along with `PublicKey`, `proposalID` and `COID` data
- Ballot app submit the data via HTTP request (POST) request to Digital Twin
- runs in 8082 port

## Digital Twin (index.js)

- Runs on 5050 port
- Digital Twin is now capabale of handle multiple contract through (route, filter, rewritePath)
- As of now, there Two api's created for Ballot App and redirection for GateKeeper
- ballotCtrl.js is a controller file which has Ballot Read/Write functionality(in future may have multiple controller file for Digital Twin).
- Sample JSON file exists in [public_key.json](https://github.com/sTingley/GPT_Identity/blob/master/Notification/DigitalTwin/notifications/1dc99871943ad3a715f022273513a393564f9b060c4c047920fc1425b90b7740.json)

## Gatekeeper (gatekeeper_v7.js

- Runs on port 3000

## Dao

- Populates validator (voter) list

### API Style
_Example: http://localhost:5050/ballot/notify_
- **http://localhost:5050** - Host:Port
- **ballot** - Contract (`gk` for GateKeeper)
- **notify** - Functionality
	- What ever left in the url considered as arguments (Query String - GET)

### API's
```
 /ballot/notify (POST)
```
- Invoked by ballot app
- Mandatory parameters are COID, proposalID, pubKey
- Content-Type must be `application/x-www-form-urlencoded`
- Resposible to write proposals in JSON against public key

```
 /ballot/proposals/:pubKey (GET)
 ```
- Invoked by Wallet App
- public key is madatory
- Responsible to send proposals to the wallet if exists





	
