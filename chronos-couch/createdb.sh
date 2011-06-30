#!/bin/bash 
# -e

DB_HOST_NAME=$1
DB_PORT=$2

HOST=$DB_HOST_NAME:$DB_PORT

DB_URL=http://$HOST/thechallenge
# Delete and recreate database
curl -X DELETE $DB_URL
curl -X PUT $DB_URL

curl -X PUT $DB_URL/_design/gameonly -d @design/gameonly.json

