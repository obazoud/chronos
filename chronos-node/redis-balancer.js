var fs =  require('fs');
var events = require('events');
var emitter = new events.EventEmitter();
var util = require('util');

var redis = require("redis");


function RedisBalancer(){

    this.redisClients =  [];
    this.redisClientsDown = [];

    var servers = loadConfig("./conf/redis.servers");

    // creation du master initial
    this.redisClients[0] = redis.createClient(servers[0].port,servers[0].ip);
    this.redisClients[0].debug_mode = false;
    this.redisClients[0].slaveof('no','one');
    this.redisClients[0].on("error", function (err) {
           util.log("Redis instance" + this.host + ":" + this.port + " Error " + err);
        if(err.message.indexOf("ECONNREFUSED") != -1){
            emitter.emit("masterDown");
        }
    });

    util.log("client of "+this.redisClients[0].host +":"+this.redisClients[0].port+" (MASTER) on.");

    for(var i=1;i < servers.length;i++){
        this.redisClients[i] = redis.createClient(servers[i].port,servers[i].ip);
        this.redisClients[i].debug_mode = false;
        this.redisClients[i].on("error", function (err) {
               util.log("Redis instance " + this.host + ":" + this.port + " Error " + err);
            if(err.message.indexOf("ECONNREFUSED") != -1){
                emitter.emit("slaveDown",this);
            }
        });
        util.log("redis "+this.redisClients[i].host + ":" + this.redisClients[i].port+" (SLAVE) on.");
        this.redisClients[i].slaveof(this.redisClients[0].host,this.redisClients[0].port);

    }

};

var balancer = new RedisBalancer(1);

exports.getMaster = function(){
    return balancer.redisClients[0];
};

exports.getSlave = function(token){
    if (balancer.redisClients.length == 1) {
        return balancer.redisClients[0];
    }
    else {  // TODO ne fonctionne que dans le cas de nommage  des noeuds actuel
            // TODO  doit tenir compte de la localite des nodes/redis
        return balancer.redisClients[ ( token % (balancer.redisClients.length - 1) ) + 1];
    }
};

/**
 * NOTE : current master est tjrs a l index 0 dans redisClients;
 *
 */
emitter.on("masterDown",function(){

	util.log("event masterDown received for : " + balancer.redisClients[0].host + ":" + balancer.redisClients[0].port);
	
	balancer.redisClients[0].end();
	balancer.redisClientsDown.push(balancer.redisClients.shift());

	balancer.redisClients[0].slaveof('no','one');
	balancer.redisClients[0].on("error", function (err) {
   		util.log("Redis instance" + balancer.redisClients[0].host + ":" + balancer.redisClients[0].port + " Error " + err);
		if(err.message.indexOf("ECONNREFUSED") != -1){
			emitter.emit("masterDown");		
		}
	});
	
	util.log("redis instance "+ balancer.redisClients[0].host + ":" + balancer.redisClients[0].port+" will be Master");

	for(var i=1;i < balancer.redisClients.length;i++){
	    balancer.redisClients[i].slaveof(balancer.redisClients[0].host,balancer.redisClients[0].port);
	    util.log("redis instance "+balancer.redisClients[i].host + ":" + balancer.redisClients[i].port+" will be slaveof " + balancer.redisClients[0].host + ":" + balancer.redisClients[0].port);
	}
});

emitter.on("slaveDown", function(slave){					
	util.log("redis server " + slave.host + ":" + slave.port + " down.");
	slave.end();
	balancer.redisClients = removeServerFromArray(balancer.redisClients,slave);
	balancer.redisClientsDown.push(slave);
});

/**
 * Gere la reintegration des serveurs down qui reprennent
 *
 */

setInterval(function(){
    //util.log("checking for servers come back from : " + balancer.redisClientsDown.length + " server(s).");

    balancer.redisClientsDown.forEach(function(client){
        util.log("try to reintegrate client : " + client.host + ":" + client.port);
        var newClient = redis.createClient(client.port ,client.host);
        newClient.ping(function(err,pong){
             // emettre un signal server up
             if(pong){
                 util.log("redis server " + newClient.host + ":" + newClient.port + " come back.");
                 newClient.slaveof(balancer.redisClients[balancer.redisClients.length-1].host,balancer.redisClients[balancer.redisClients.length-1].port);
                 newClient.debug_mode=false;
                 util.log("redis instance "+newClient.host + ":" + newClient.port+
                            " will be slaveof " + balancer.redisClients[balancer.redisClients.length-1].host + ":" + balancer.redisClients[balancer.redisClients.length-1].port);
                 balancer.redisClientsDown= removeServerFromArray(balancer.redisClientsDown,client);
	             balancer.redisClients.push(newClient);
             }
         });

    });
},1000);



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
