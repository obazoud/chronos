#!/bin/sh

# Run in crontab
curl -iX POST -H "Content-Type:application/json" -d '{“source”:”thechallenge”,”target”:”http://192.168.1.1:5984/thechallenge”}'   http://192.168.1.3:5984/_replicate
curl -iX POST -H "Content-Type:application/json" -d '{“source”:”thechallenge”,”target”:”http://192.168.1.2:5984/thechallenge”}'   http://192.168.1.3:5984/_replicate
curl -iX POST -H "Content-Type:application/json" -d '{“source”:”thechallenge”,”target”:”http://192.168.1.4:5984/thechallenge”}'   http://192.168.1.3:5984/_replicate
curl -iX POST -H "Content-Type:application/json" -d '{“source”:”thechallenge”,”target”:”http://192.168.1.201:5984/thechallenge”}' http://192.168.1.3:5984/_replicate

