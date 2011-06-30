#!/bin/bash 
set -e
set -x

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

GAME_JSON="`cat ../chronos-couch/sample/gamesession-sample-encode.json`"
curl -iX POST -H "Accept:application/json" -H "Content-Type:application/json" -d "${GAME_JSON}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/game
sleep 2


curl -iX POST -H "Accept:application/json" -H "Content-Type:application/json" -d '{"mail" : "abbott.adams@yahoo.com", "password" : "o1rufd3efty5fd3e"}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/login
sessionkey=456b29ca3cd897dde39bb1e23d42c8de2ae07f5461b3647af3f02ec82aed70a246c68278092948c18d077074b8458bea1819de4a0d7a6820c81b03a9f25a988d17f3922230bcd186eda86f8da005548ffcb05d4c2e3c3f6d51fc4649163c428c9f122ca733530798d36d2ee2f6798467

sleep 2 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/1

sleep 2
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/1

sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/2

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/2

sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/3

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/3


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/4

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/4


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/5

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/5


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/6

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/6


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/7

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/7


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/8

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/8


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/9

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/9


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/10

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/10


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/11

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/11


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/12

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/12



sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/13

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/13


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/14

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/14



sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/15

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/15


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/16

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/16


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/17

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/17


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/18

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/18

sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/19

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/19


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/20

sleep 3
curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/20


sleep 1 
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/21



sleep 1
curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/ranking
sleep 1
curl -iX GET "http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/score?user_mail=null@gmail.com&authentication_key=12IndR6r5V5618"
curl -iX GET "http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/audit/1?user_mail=null@gmail.com&authentication_key=12IndR6r5V5618"
curl -iX GET "http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/audit/2?user_mail=null@gmail.com&authentication_key=12IndR6r5V5618"
curl -iX GET "http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/audit?user_mail=null@gmail.com&authentication_key=12IndR6r5V5618"





