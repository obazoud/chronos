#!/bin/sh
# Run in crontab

IP=`/sbin/ifconfig eth0 | grep 'inet addr:' | cut -d: -f2 | awk '{ print $1}'`
MASTER='192.168.1.3'

case $IP in
  ${MASTER})
    #echo "Nothing to do, this is couchdb master."
  ;;
  *)
    JSON="{\"source\":\"http://${MASTER}:5984/thechallenge\",\"target\":\"http://${IP}:5984/thechallenge\"}"
    echo $JSON
    curl -iX POST -H "Content-Type:application/json" -d "${JSON}" http://${MASTER}:5984/_replicate --silent 2>&1 > /dev/null
  ;;
esac
