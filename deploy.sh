#!/bin/sh
set -x

servers="1 2 3 4"
for i in $servers; do
    rsync -az --delete --exclude='.git' -e ssh . vfabric$i:/home/user/deploiement
done
rsync -az --delete --exclude='.git' -e ssh . usi1:/home/user/deploiement
