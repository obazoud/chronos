#!/bin/bash 
# -e
set -x

CHRONOS_HOST=$1
CHRONOS_PORT=$2

JSON="`cat ./sample/gamesession-sample-encode.json`"
curl -iX POST -H Accept:application/json -H Content-Type:application/json -d "${JSON}" http://${CHRONOS_HOST}:${CHRONOS_PORT}/api/game

