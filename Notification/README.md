# Digital Twin / Ballot

## Ballot (ballot.js)

TODO : Should create Ballot.sol instance
TODO : Should listen event from Ballot.sol, backend should send "public key" and "message" along with the event

- For now assuming event has triggerd ballot.js creates JSON file named with public key under the <Digital Twin>/notifications (path can be changed anywhere)
- If file already exists, read the files and push the messages at the top
- <public_key>.json has 
	- id : <public key>
	- messages :  <Array holds all messages>
		- msg : <message received from backend>
		- time : <created timestamp>
		- read_status : <intially false, once the user responded it will be true>
- runs in 8082 port

## Digital Twin

- Runs on 5050 port
- Filter the request from wallet app
- For now all requests from wallet app redirected to (app.js which is runs on 8081) expect notifications
- Read/send notifications based on public key in case of notification request from wallet app
- If notifications empty returns empty braces ({});
- Expected url from wallet App
	-http://<host:port>/notify/<public_key>-

## WalletApp

TODO : Notification request need to triggered when the user uploaded keystore file
TODO : If notification exists that has to be shown in wallet app




	