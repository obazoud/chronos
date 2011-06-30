#!/bin/sh
set -x

servers="1 2 3 4"
for i in $servers; do
    rsync -avz -e ssh . vfabric$i:/home/user/workspace
done

