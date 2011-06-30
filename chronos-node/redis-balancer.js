var fs =  require('fs');
var events = require('events');
var emitter = new events.EventEmitter();
var util = require('util');

var redis = require("redis");

var redisClients = [];
var redisClientsDown = [];

/**
 * NOTE : current master est tjrs a l index 0 dans redisClients;
 *
 */
emitter.on("masterDown",function(){
	util.log("event masterDown received for : " + redisClients[0].host + ":" + redisClients[0].port);
	
	redisClients[0].end();
	redisClientsDown.push(redisClients.shift());

	redisClients[0].slaveof('no','one');
	redisClients[0].on("error", function (err) {
   		util.log("Redis instance" + redisClients[0].host + ":" + redisClients[0].port + " Error " + err);
		if(err.message.indexOf("ECONNREFUSED") != -1){
			emitter.emit("masterDown");		
		}
	});
	
	util.log("redis instance "+ redisClients[0].host + ":" + redisClients[0].port+" will be Master");

	for(var i=1;i < redisClients.length;i++){
	    redisClients[i].slaveof(redisClients[0].host,redisClients[0].port);
	    util.log("redis instance "+redisClients[i].host + ":" + redisClients[i].port+" will be slaveof " + redisClients[0].host + ":" + redisClients[0].port);
	}
});

emitter.on("slaveDown", function(slave){					
	util.log("redis server " + slave.host + ":" + slave.port + " down.");
	slave.end();
	redisClients = removeServerFromArray(redisClients,slave);
	redisClientsDown.push(slave);
});

/**
 * Gere la reintegration des serveurs down qui reprennent
 *
 */
setInterval(function(){
    // util.log("checking for servers come back from : " + redisClientsDown.length + " server(s).");

    redisClientsDown.forEach(function(client){
        util.log("try to reintegrate client : " + client.host + ":" + client.port);
        var newClient = redis.createClient(client.port ,client.host);
        newClient.ping(function(err,pong){
              util.log("redis server " + newClient.host + ":" + newClient.port + " coming back.");
             // emettre un signal server up
             if(pong){
                 util.log("redis server " + newClient.host + ":" + newClient.port + " come back.");
                 newClient.slaveof(redisClients[redisClients.length-1].host,redisClients[redisClients.length-1].port);
                 newClient.debug_mode=false;
                 util.log("redis instance "+newClient.host + ":" + newClient.port+
                            " will be slaveof " + redisClients[redisClients.length-1].host + ":" + redisClients[redisClients.length-1].port);
                 redisClientsDown= removeServerFromArray(redisClientsDown,client);
	             redisClients.push(newClient);
             }
         });

    });
},1000); // TODO redefinir ?!


function createRedisClients(servers){
	
	// creation du master initial
	redisClients[0] = redis.createClient(servers[0].port,servers[0].ip);
    redisClients[0].debug_mode = false;
	redisClients[0].slaveof('no','one');
	redisClients[0].on("error", function (err) {
   		util.log("Redis instance" + redisClients[0].host + ":" + redisClients[0].port + " Error " + err);
		if(err.message.indexOf("ECONNREFUSED") != -1){
			emitter.emit("masterDown");		
		}
	});

	util.log("client of "+redisClients[0].host +":"+redisClients[0].port+" (MASTER) on.");

	for(var i=1;i < servers.length;i++){
		redisClients[i] = redis.createClient(servers[i].port,servers[i].ip);
        redisClients[i].debug_mode = false;
		redisClients[i].on("error", function (err) {
	   		util.log("Redis instance " + this.host + ":" + this.port + " Error " + err);
			if(err.message.indexOf("ECONNREFUSED") != -1){
				emitter.emit("slaveDown",this);		
			}
		});
		util.log("redis "+redisClients[i].host + ":" + redisClients[i].port+" (SLAVE) on.");
		redisClients[i].slaveof(redisClients[0].host,redisClients[0].port);
		
	}

    return redisClients;
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

function RedisBalancer(token){
    this.token = token;

    var serversConf = loadConfig("./conf/redis.servers");

    this.redisClients = createRedisClients(serversConf);
};

RedisBalancer.prototype.getMaster = function(){
    return this.redisClients[0];
};

RedisBalancer.prototype.getSlave = function(){
    if (redisClients.length == 1) {
        return this.getMaster();
    }
    else {  // TODO ne fonctionne que dans le cas de nommage  des noeuds actuel
            // TODO  doit tenir compte de la localite des nodes/redis
        return this.redisClients[ ( this.token % (redisClients.length - 1) ) + 1];
    }
};

exports.createBalancer = function(token){
    return new RedisBalancer(token);
};
