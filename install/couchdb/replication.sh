#!/bin/sh
# Run in crontab

SCRIPTNAME=`basename $0`
PIDFILE=/tmp/${SCRIPTNAME}.pid

if [ -f ${PIDFILE} ]; then
   OLDPID=`cat ${PIDFILE}`
   RESULT=`ps -ef | grep ${OLDPID} | grep ${SCRIPTNAME}`  

   if [ -n "${RESULT}" ]; then
     echo "Script already running! Exiting"
     exit 255
   fi

fi

PID=`ps -ef | grep ${SCRIPTNAME} | head -n1 |  awk ' {print $2;} '`
echo ${PID} > ${PIDFILE}

##
IP=`/sbin/ifconfig eth0 | grep 'inet addr:' | cut -d: -f2 | awk '{ print $1}'`
MASTER='192.168.1.3'

case $IP in
  ${MASTER})
    #echo "Nothing to do, this is couchdb master."
  ;;
  *)
    JSON="{\"source\":\"http://${MASTER}:5984/thechallenge\",\"target\":\"http://${IP}:5984/thechallenge\"}"
    #echo $JSON
    curl -iX POST -H "Content-Type:application/json" -d "${JSON}" http://${MASTER}:5984/_replicate --silent 2>&1 > /dev/null
  ;;
esac
##

if [ -f ${PIDFILE} ]; then
    rm ${PIDFILE}
fi
