#!/bin/bash

curl -X PUT http://localhost:5984/thechallenge

curl -X PUT http://localhost:5984/thechallenge/_design/warmup -d @design/warmup.json

curl -X PUT http://localhost:5984/thechallenge/game1 -d '{"gamers":0}'

curl -X PUT http://127.0.0.1:5984/_config/admins/superadmin -d '"supersecret"'
