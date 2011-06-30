#!/bin/bash 
# -e

DB_HOST_NAME=$1
DB_PORT=$2

HOST=$DB_HOST_NAME:$DB_PORT

DB_URL=http://$HOST/thechallenge
# Delete and recreate database
curl -X DELETE $DB_URL
curl -X PUT $DB_URL

curl -X PUT $DB_URL/_design/warmup -d @design/warmup.json

curl -X PUT $DB_URL/game1 -d '{"gamers":0,"type":"warmup"}'

curl -X PUT $DB_URL/_design/validate -d @design/validate.json

curl -X PUT $DB_URL/_design/answer -d @design/answer.json

