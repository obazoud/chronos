#!/bin/bash 
#set -e
#set -x
# https://github.com/zpoley/json-command
# npm install json

./createdb.sh localhost 5984
redis-cli flushdb

CHRONOS_HOST=localhost
CHRONOS_PORT=8080
CHRONOS_URL=http://${CHRONOS_HOST}:${CHRONOS_PORT}
HEADER_JSON="-H Accept:application/json -H Content-Type:application/json"

assertEquals() {
  if [ -f "$4" ]; then
    echo "$1, response: `cat $4`"
  fi
  if [ "${2}" != "${3}" ]; then
        echo "$1: expecting $2 but was $3"
        exit 1
  fi
}

assertNotNull() {
  if [ "${2}" == "" ]; then
        echo "$1 is null"
        exit 1
  fi
}

for I in {1..5000}; do 
  #echo $I;
  json="{\"firstname\" : \"olivier${I}\", \"lastname\" : \"bazoud${I}\", \"mail\" : \"null${I}@gmail.com\",\"password\" : \"secret${I}\"}"
  # echo $json
  curl -X POST $HEADER_JSON -d "${json}" $CHRONOS_URL/api/user
  #sleep 0.01
done 

sleep 5
curl -iX GET http://localhost:5984/thechallenge 2>&1 | awk '{ if ($1 == "HTTP/1.1") { print $2 } } END { print }' | sed ':a;N;$!ba;s/\n/ /g' | while read httpcode data; do
  assertEquals "Answer, http code" 200 $httpcode
  assertEquals "Doc count " 5003 $(echo "$data" | json -C doc_count)
done

