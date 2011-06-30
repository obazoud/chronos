const redis = require('redis');

const client79 = redis.createClient(6379,'localhost');


//const subscribe79 = redis.createClient(6379,'localhost');
const subscribe80 = redis.createClient(6380,'localhost');
const subscribe81 = redis.createClient(6381,'localhost');

/*
client79.slaveof('no','one');
subscribe80.slaveof('localhost',6379);
subscribe81.slaveof('localhost',6380);
*/

//subscribe79.subscribe('channel'); //listen to messages from channel pubsub
subscribe80.subscribe('channel'); //listen to messages from channel pubsub
subscribe81.subscribe('channel'); //listen to messages from channel pubsub


subscribe80.on("message", function(channel, message) {
    console.log("message received (80): " + message);

});

subscribe81.on("message", function(channel, message) {
    console.log("message received (81): " + message);

});

client79.publish('channel','hello1');
client79.publish('channel','hello2');
client79.publish('channel','hello3');




