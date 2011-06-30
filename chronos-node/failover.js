var fs =  require('fs');
var events = require('events');
var emitter = new events.EventEmitter();
var util = require('util');

var redis = require("redis");

var redisClients = [];
var redisClientsDown = []; // TODO checker si on peut les reintegrer
var serversConf = loadConfig("../chronos-it/configuration.json");

// NOTE : current master est tjrs a l index 0 dans redisClients;

emitter.on("masterDown",function(){
	console.log("event masterDown received for : " + redisClients[0].host + ":" + redisClients[0].port);
	
	redisClients[0].end();
	// TODO valider l incrementation par rapport au max de serveurs dipo
	redisClientsDown.push(redisClients.shift());
		
	redisClients[0].on("error", function (err) {
   		console.log("Redis instance" + redisClients[0].host + ":" + redisClients[0].port + " Error " + err);
		if(err.message.indexOf("ECONNREFUSED") != -1){
			emitter.emit("masterDown");		
		}
	});
	
	console.log("redis instance "+ redisClients[0].host + ":" + redisClients[0].port+" will be Master");
	
	redisClients[1].slaveof(redisClients[0].host,redisClients[0].port);
	console.log("redis instance "+redisClients[1].host + ":" + redisClients[1].port+" will be slaveof " + redisClients[0].host + ":" + redisClients[0].port);
});

emitter.on("slaveDown", function(slave){					
	console.log("redis server " + slave.host + ":" + slave.port + " down.");
	slave.end();
	redisClients = removeServerFromArray(redisClients,slave);
	redisClientsDown.push(slave);

	//console.log("clients UP: ");
	//redisClients.forEach(function(s){ console.log(s.port); });

	//console.log("clients DOWN: ");
	//redisClientsDown.forEach(function(s){ console.log(s.port); });	
});



// TODO error d slaves

function createRedisClients(servers){
	
	// creation du master initial
	redisClients[0] = redis.createClient(servers[0].p,servers[0].h);
	redisClients[0].on("error", function (err) {
   		console.log("Redis instance" + redisClients[0].host + ":" + redisClients[0].port + " Error " + err);
		if(err.message.indexOf("ECONNREFUSED") != -1){
			emitter.emit("masterDown");		
		}
	});

	console.log("client of "+redisClients[0].host +":"+redisClients[0].port+" (MASTER) on.");

	for(var i=1;i < servers.length;i++){
		redisClients[i] = redis.createClient(servers[i].p,servers[i].h);				
		redisClients[i].on("error", function (err) {
	   		console.log("Redis instance " + this.host + ":" + this.port + " Error " + err);
			if(err.message.indexOf("ECONNREFUSED") != -1){
				emitter.emit("slaveDown",this);		
			}
		});
		console.log("redis "+redisClients[i].host + ":" + redisClients[i].port+" (SLAVE) on.");
		redisClients[i].slaveof(redisClients[0].host,redisClients[0].port);
		
	}


}

function loadConfig(confFile){
	var configuration = JSON.parse(fs.readFileSync(confFile,'utf-8'));
	return configuration.redisServers;
}

function removeServerFromArray(array,server){
	for(var i=0;i<array.length;i++){
		if( (array[i].host == server.host) && (array[i].port == server.port) ){			
			array.splice(i,1);		
		}	
	}
	return array;
}

createRedisClients(serversConf);



