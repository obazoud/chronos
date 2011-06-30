#!/bin/bash 
set -e
set -x
# https://github.com/zpoley/json-command
# npm install json

./createdb.sh localhost 5984

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

#USER_REV=`curl --silent -X GET http://superadmin:supersecret@localhost:5984/_users/org.couchdb.user:null@gmail.com | json -C _rev`
#if [ "$USER_REV" != "" ]; then
#  curl --silent -X DELETE http://superadmin:supersecret@localhost:5984/_users/org.couchdb.user:null@gmail.com?rev=$USER_REV
#fi

GAME_JSON="`cat ./sample/gamesession-sample-encode.json`"
curl -iX POST -H "Accept:application/json" -H "Content-Type:application/json" -d "${GAME_JSON}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/game 2>&1 | awk '{ if ($1 == "HTTP/1.1") { httpcode=$2 } } END { print httpcode}' | while read httpcode; do 
  assertEquals "Creating game, http code" 201 $httpcode
done

curl -iX POST -H Accept:application/json -H Content-Type:application/json -d '{"firstname" : "olivier", "lastname" : "bazoud", "mail" : "null@gmail.com","password" : "secret"}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/user 2>&1 | awk '{ if ($1 == "HTTP/1.1") { httpcode=$2 } } END { print httpcode }' | while read httpcode; do
  assertEquals "Creating user, http code" 201 $httpcode
done

curl -iX POST -H "Accept:application/json" -H "Content-Type:application/json" -d '{"mail" : "null@gmail.com", "password" : "secret"}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/login 2>&1 | awk '{ if ($1 == "HTTP/1.1") { httpcode=$2 } if ($1 == "Set-Cookie:") { sessionkey=$2 } if ($1 == "Set-Cookie:") { data=$2 } } END { print httpcode, sessionkey }' | while read httpcode sessionkey; do
  sessionkey=`echo ${sessionkey} | sed 's/\r//g' | sed 's/session_key=//g'`
  echo $data
  assertEquals "Creating user, http code" 201 $httpcode
  assertNotNull "Creating user, sessionkey" ${sessionkey}
  
  curl -iX GET -H "Cookie: session_key=${sessionkey}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/question/1  2>&1 | awk '{ if ($1 == "HTTP/1.1") { print $2 } } END { print }' | sed ':a;N;$!ba;s/\n/ /g' | while read httpcode data; do
    assertEquals "Question, http code" 200 $httpcode
    assertEquals "Score 0" 0 0 #$(echo "$data" | json -C score)

    curl -iX POST -H "Cookie: session_key=${sessionkey}" -H "Accept:application/json" -H "Content-Type:application/json" -d '{"answer":2}' http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/answer/1  2>&1 | awk '{ if ($1 == "HTTP/1.1") { print $2 } } END { print }' | sed ':a;N;$!ba;s/\n/ /g' | while read httpcode data; do
      assertEquals "Answer, http code" 200 $httpcode
      assertEquals "are_u_right " false $(echo "$data" | json -C are_u_right)
      assertEquals "good_answer " 1 $(echo "$data" | json -C good_answer)
      assertEquals "Score " 0 0 #$(echo "$data" | json -C score)
    done
  done
done

