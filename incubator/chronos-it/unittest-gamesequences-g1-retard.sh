#!/bin/bash 
set -e
set -x
# https://github.com/zpoley/json-command
# npm install json

../chronos-couch/createdb.sh localhost 5984

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

curl -iX POST -H Accept:application/json -H Content-Type:application/json -d '{"firstname" : "olivier1", "lastname" : "bazoud1", "mail" : "null1@gmail.com","password" : "secret"}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/user
sleep 6

GAME_JSON="`cat ../chronos-couch/sample/gamesession-sample-encode.json`"
curl -iX POST -H "Accept:application/json" -H "Content-Type:application/json" -d "${GAME_JSON}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/game
sleep 2

curl -iX POST -H "Accept:application/json" -H "Content-Type:application/json" -d '{"mail" : "null@gmail.com", "password" : "secret"}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/login

sessionkey=57db2395e17ef583d2aa5df81933699577160bdccb9cc40f1dee11ed9798870a09e99f86dc5e1b75bcb6219e8340418941233f83b4a1965d10350487dd60ef27660350c5faa64f31eb9d13f1bb696345ecc4872b8d3e5f06bc2393a74a6db7a9

curl -iX POST -H "Accept:application/json" -H "Content-Type:application/json" -d '{"mail" : "null1@gmail.com", "password" : "secret"}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/login

sessionkey1=9f64b55dce7bc3785cc47df7255d2d8d3049c662017c698de56af21e6f2cbece7e494f7fd5866f84d0626fee86ba57111a36d491389118d99e4c139b4ec5e48e4137bb277635c6a551c78d75a267a99c2d062e14532b4be042e0010f593c1bf8

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/1

sleep 1
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/1

sleep 7.99
curl -iX GET -H "Cookie: session_key=${sessionkey1}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/1
