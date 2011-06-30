const redis = require('redis');

const client = redis.createClient();
const subscribe = redis.createClient();

subscribe.subscribe('channel'); //listen to messages from channel pubsub

subscribe.on("message", function(channel, message) {
    console.log("message received : " + message);
    client.end();
    subscribe.end();
});


client.publish('channel','hello');




