var fs =  require('fs');
var events = require('events');
var emitter = new events.EventEmitter();
var util = require('util');

var redis = require("redis");
var redisM;
var redisS1;

var serversConf = loadConfig("../chronos-it/configuration.json");
var currentMaster = -1;

emitter.on("masterDown",function(){
	console.log("event masterDown received.");
	redisM.end();	
	redisS1.on("error", function (err) {
   		console.log("Redis instance" + redisS1.host + ":" + redisS1.port + " Error " + err);
		if(err.message.indexOf("ECONNREFUSED") != -1){
			emitter.emit("masterDown");		
		}
	});
	redisM = redisS1;
	console.log("redis instance "+redisS1.host + ":" + redisS1.port+" will be Master");
})

function createRedisClients(servers){

	// creation du master	
	redisM = redis.createClient(servers[0].p,servers[0].h);
	currentMaster = 0;
	redisM.on("error", function (err) {
   		console.log("Redis instance" + redisM.host + ":" + redisM.port + " Error " + err);
		if(err.message.indexOf("ECONNREFUSED") != -1){
			emitter.emit("masterDown");		
		}
	});

	console.log("redisM on.");

	// creation du master	
	redisS1 = redis.createClient(servers[1].p,servers[1].h);
	console.log("redisS1 on.");

}

function loadConfig(confFile){
	var configuration = JSON.parse(fs.readFileSync(confFile,'utf-8'));
	return configuration.redisServers;
}

createRedisClients(serversConf);

