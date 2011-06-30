var fs =  require('fs');
var events = require('events');
var emitter = new events.EventEmitter();
var util = require('util');

var redis = require("redis");

var redisM;
var redisS1;
var redisS2;

var redisClients = [];
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
	
	redisS2.slaveof(redisM.host,redisM.port);
	console.log("redis instance "+redisS2.host + ":" + redisS2.port+" will be slaveof " + redisM.host + ":" + redisM.port);
})

// TODO error d slaves

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

	// creation du slave 1	
	redisS1 = redis.createClient(servers[1].p,servers[1].h);
	redisS1.on("error", function (err) {
   		console.log("Redis instance" + redisS1.host + ":" + redisS1.port + " Error " + err);
		if(err.message.indexOf("ECONNREFUSED") != -1){
			emitter.emit("slave " + redisS1.host + ":" + redisS1.port);		
		}
	});

	console.log("redisS1 on.");

	// creation du slave 1	
	redisS2 = redis.createClient(servers[2].p,servers[2].h);
	redisS2.on("error", function (err) {
   		console.log("Redis instance" + redisS2.host + ":" + redisS2.port + " Error " + err);
		if(err.message.indexOf("ECONNREFUSED") != -1){
			emitter.emit("slave " + redisS2.host + ":" + redisS2.port);		
		}
	});

	console.log("redisS2 on.");


}

function loadConfig(confFile){
	var configuration = JSON.parse(fs.readFileSync(confFile,'utf-8'));
	return configuration.redisServers;
}

createRedisClients(serversConf);

