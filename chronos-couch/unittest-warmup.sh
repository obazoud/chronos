#!/bin/bash 
set -e
set -x
# https://github.com/zpoley/json-command
# npm install json

#./createdb.sh localhost 5984

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

GAME_JSON="`cat ./sample/gamesession-sample-encode.json`"
curl -iX POST -H "Accept:application/json" -H "Content-Type:application/json" -d "${GAME_JSON}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/game

sleep 3

curl -iX POST -H "Accept:application/json" -H "Content-Type:application/json" -d '{"mail" : "null@gmail.com", "password" : "secret"}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/login

sessionkey=eyJsb2dpbiI6Im51bGxAZ21haWwuY29tIiwicGFzc3dvcmQiOiJzZWNyZXQiLCJmaXJzdG5hbWUiOiJvbGl2aWVyIiwibGFzdG5hbWUiOiJiYXpvdWQifQ==

sleep 4
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/1
sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/1



