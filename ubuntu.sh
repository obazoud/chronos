#!/bin/sh
set -x

rsync -az --delete --exclude='.git' -e ssh . vm:/home/user/deploiement
