#!/bin/sh
set -x

servers="1 2 3 4"
for i in $servers; do
    rsync -az -e ssh . vfabric$i:/home/user/workspace
done

