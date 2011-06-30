#!/bin/bash

curl -X PUT http://localhost:5984/_config/admins/superadmin -d '"supersecret"'

curl -X PUT http://superadmin:supersecret@localhost:5984/thechallenge

curl -X PUT http://superadmin:supersecret@localhost:5984/thechallenge/_design/warmup -d @design/warmup.json

curl -X PUT http://superadmin:supersecret@localhost:5984/thechallenge/game1 -d '{"gamers":0}'

curl -X PUT http://superadmin:supersecret@localhost:5984/thechallenge/_design/validate -d @design/validate.json

curl -X PUT http://superadmin:supersecret@localhost:5984/thechallenge/_design/game -d @design/game.json
