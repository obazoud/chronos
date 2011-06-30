#!/bin/bash
set -x

MY_HOSTNAME=`hostname`
#MY_HOSTNAME="vfabric3"

SCRIPT_DIR=$(dirname $(readlink -f $0))
cd $SCRIPT_DIR

echo "Hostname: $MY_HOSTNAME"
if [[ $MY_HOSTNAME =~ "vfabric"  || $MY_HOSTNAME =~ "usi" ]]; then
    export http_proxy=http://10.200.1.44:8080;
    echo $http_proxy;
fi;

./ttytter "$@"

