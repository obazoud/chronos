#!/bin/bash 
# -e
set -x

CHRONOS_HOST=$1
CHRONOS_PORT=$2

# https://github.com/zpoley/json-command
# npm install json

JSON="`cat ./sample/gamesession-sample-encode.json`"
RETURNVALUE=`curl -silent -iX POST -H Accept:application/json -H Content-Type:application/json -d "${JSON}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/game --write-out %{http_code}`
assert(201, $RETURNVALUE);

curl -iX POST -H Accept:application/json -H Content-Type:application/json -d '{"firstname" : "olivier", "lastname" : "bazoud", "mail" : "null@gmail.com","password" : "secret"}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/user

curl -iX POST -H Accept:application/json -H Content-Type:application/json -d '{"mail" : "null@gmail.com", "password" : "secret"}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/login

curl -iX GET -H session_key:XXX http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/1

curl -iX POST -H session_key:XXX -H Accept:application/json -H Content-Type:application/json -d '{"answer":1}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/1


assert() {
  if [ "${1}" -ne "${1}" ]; then
        echo "Expecting $1 but was $2"
        exit 1
  fi
}

