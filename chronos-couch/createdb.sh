#!/bin/bash

curl -X PUT http://localhost:5984/_config/admins/superadmin -d '"supersecret"'

# Delete and recreate database
curl -X DELETE http://superadmin:supersecret@localhost:5984/thechallenge
curl -X PUT http://superadmin:supersecret@localhost:5984/thechallenge

curl -X PUT http://superadmin:supersecret@localhost:5984/thechallenge/_design/warmup -d @design/warmup.json

curl -X PUT http://superadmin:supersecret@localhost:5984/thechallenge/game1 -d '{"gamers":0}'

curl -X PUT http://superadmin:supersecret@localhost:5984/thechallenge/_design/validate -d @design/validate.json

JSON="`cat ./sample/gamesession-sample.json`"
curl -X POST -H Accept:application/json -H Content-Type:application/json -d "${JSON}" http://localhost:8080/api/game

