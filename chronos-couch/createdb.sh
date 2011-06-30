#!/bin/bash 
# -e
ADMIN_NAME=$1
ADMIN_PASS=$2
DB_HOST_NAME=$3
DB_PORT=$4

HOST=$DB_HOST_NAME:$DB_PORT


#curl -X PUT http://$HOST/_config/admins/$ADMIN_NAME -d '"${ADMIN_PASS}"'

HOST_ADMIN=$ADMIN_NAME:$ADMIN_PASS@$HOST


DB_URL=http://$HOST_ADMIN/thechallenge
# Delete and recreate database
curl -X DELETE $DB_URL
curl -X PUT $DB_URL

curl -X PUT $DB_URL/_design/warmup -d @design/warmup.json

curl -X PUT $DB_URL/game1 -d '{"gamers":0,"type":"warmup"}'

curl -X PUT $DB_URL/_design/validate -d @design/validate.json

curl -X PUT $DB_URL/_design/answer -d @design/answer.json

# ne mettre ici que ce qui est specifique a couch et peut fonctionner en se limitant a une instance couch
#JSON="`cat ./sample/gamesession-sample-encode.json`"
#curl -iX POST -H Accept:application/json -H Content-Type:application/json -d "${JSON}" http://localhost:8080/api/game

