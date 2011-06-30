#!/bin/bash 
set -e
#set -x

#./createdb.sh localhost 5984
#redis-cli flushdb

CHRONOS_HOST=localhost
CHRONOS_PORT=8080
COOKIE='/tmp/cookie'

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

if [ -f $COOKIE ]; then
  rm $COOKIE
fi


curl -ivX POST -H Accept:application/json -H Content-Type:application/json -d '{"firstname" : "olivier", "lastname" : "bazoud", "mail" : "null@gmail.com","password" : "secret"}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/user
sleep 5
GAME_JSON="`cat ./sample/gamesession-sample-encode.json`"
curl -iX POST -H "Accept:application/json" -H "Content-Type:application/json" -d "${GAME_JSON}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/game
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"mail" : "null@gmail.com", "password" : "secret"}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/login

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/1
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/1

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/2
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":1}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/2

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/3
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/3

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/4
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":1}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/4

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/5
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":3}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/5

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/6
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":3}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/6

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/7
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":4}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/7

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/8
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/8

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/9
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":4}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/9

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/10
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/10

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/11
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/11

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/12
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/12

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/13
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":3}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/13

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/14
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/14

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/15
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":3}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/15

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/16
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":1}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/16

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/17
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/17

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/18
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":1}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/18

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/19
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/19

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/20
curl -iX POST --cookie $COOKIE --cookie-jar $COOKIE -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/20   2>&1 | awk '{ if ($1 == "HTTP/1.1") { print $2 } } END { print }' | sed ':a;N;$!ba;s/\n/ /g' | while read httpcode data; do
  assertEquals "Answer, http code" 201 $httpcode
  assertEquals "Score " 95 $(echo "$data" | json -C score)
done

curl -iX GET --cookie $COOKIE --cookie-jar $COOKIE http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/ranking

curl -iX GET "http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/score?user_mail=null@gmail.com&authentication_key=12IndR6r5V5618"

curl -iX GET "http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/audit/1?user_mail=null@gmail.com&authentication_key=12IndR6r5V5618"
curl -iX GET "http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/audit/2?user_mail=null@gmail.com&authentication_key=12IndR6r5V5618"

curl -iX GET "http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/audit?user_mail=null@gmail.com&authentication_key=12IndR6r5V5618"


