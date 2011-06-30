#!/bin/bash 
set -e
set -x
# https://github.com/zpoley/json-command
# npm install json

./createdb.sh localhost 5984

redis-cli flushdb

CHRONOS_HOST=localhost
CHRONOS_PORT=8080

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

curl -iX POST -H Accept:application/json -H Content-Type:application/json -d '{"firstname" : "olivier", "lastname" : "bazoud", "mail" : "null@gmail.com","password" : "secret"}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/user
sleep 6

GAME_JSON="`cat ./sample/gamesession-sample-encode.json`"
curl -iX POST -H "Accept:application/json" -H "Content-Type:application/json" -d "${GAME_JSON}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/game
sleep 2


curl -iX POST -H "Accept:application/json" -H "Content-Type:application/json" -d '{"mail" : "null@gmail.com", "password" : "secret"}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/login
sessionkey=57db2395e17ef583d2aa5df81933699577160bdccb9cc40f1dee11ed9798870a09e99f86dc5e1b75bcb6219e8340418941233f83b4a1965d10350487dd60ef27660350c5faa64f31eb9d13f1bb696345ecc4872b8d3e5f06bc2393a74a6db7a9

sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/1

sleep 2
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/1

sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/25




