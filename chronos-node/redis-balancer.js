var fs =  require('fs');
var events = require('events');
var emitter = new events.EventEmitter();
var util = require('util');

var redis = require("redis");


function RedisBalancer(){

    this.redisClients =  [];
    this.redisPubSub = [];
    this.redisClientsDown = [];

};

var balancer = new RedisBalancer();

exports.init = function(){
    var servers = loadConfig("/home/user/deploiement/chronos-node/conf/redis.servers");

        // creation du master initial
        balancer.redisClients[0] = redis.createClient(servers[0].port,servers[0].ip);
        balancer.redisClients[0].debug_mode = false;
        balancer.redisClients[0].slaveof('no','one');
        balancer.redisClients[0].on("error", function (err) {
               util.log("Redis instance" + this.host + ":" + this.port + " Error " + err);
            if(err.message.indexOf("ECONNREFUSED") != -1){
                emitter.emit("masterDown",this);
            }
        });

        balancer.redisPubSub[0] = redis.createClient(servers[0].port,servers[0].ip);
        balancer.redisPubSub[0].debug_mode = false;

        util.log("client of "+balancer.redisClients[0].host +":"+balancer.redisClients[0].port+" (MASTER) on.");

        for(var i=1;i < servers.length;i++){
            balancer.redisClients[i] = redis.createClient(servers[i].port,servers[i].ip);
            balancer.redisClients[i].debug_mode = false;
            balancer.redisClients[i].on("error", function (err) {
                   util.log("Redis instance " + this.host + ":" + this.port + " Error " + err);
                if(err.message.indexOf("ECONNREFUSED") != -1){
                    emitter.emit("slaveDown",this);
                }
            });
            util.log("redis "+balancer.redisClients[i].host + ":" + balancer.redisClients[i].port+" (SLAVE) on.");
            balancer.redisClients[i].slaveof(balancer.redisClients[0].host,balancer.redisClients[0].port);

        }

        for(var i=1;i < servers.length;i++){
            balancer.redisPubSub[i] = redis.createClient(servers[i].port,servers[i].ip);
            balancer.redisPubSub[i].debug_mode = false;
            emitter.emit("subscriberClientCreated",balancer.redisPubSub[i]);
        }

};

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

exports.getSubscriber = function(token){
    if (balancer.redisPubSub.length == 1) {
        return balancer.redisPubSub[0];
    }
    else {  // TODO ne fonctionne que dans le cas de nommage  des noeuds actuel
            // TODO  doit tenir compte de la localite des nodes/redis
        return balancer.redisPubSub[ ( token % (balancer.redisPubSub.length - 1) ) + 1];
    }
};


exports.getPublisher = function(){
    return balancer.redisPubSub[0];
};

//TODO
exports.onSlaveCreation = function(callback){
     emitter.on("subscriberClientCreated",function(slave){
         util.log(" slave " + slave.host + ":" + slave.port + " created" );
         callback(slave);
     });
};

exports.onMasterElection = function(callback){
     emitter.on("masterElected",function(master){
         util.log(" master " + master.host + ":" + master.port + " elected" );
         callback(master);
     });
};


/**
 * NOTE : current master est tjrs a l index 0 dans redisClients;
 *
 */
emitter.on("masterDown",function(masterDown){

    if(masterDown.host == balancer.redisClients[0].host && masterDown.port == balancer.redisClients[0].port){

        util.log("event masterDown received for : " + masterDown.host + ":" + masterDown.port);

        balancer.redisClients[0].end();
        balancer.redisClientsDown.push(balancer.redisClients.shift());
        balancer.redisClients[0].slaveof('no','one');

        balancer.redisPubSub[0].end();
        balancer.redisPubSub.shift();
        emitter.emit("masterElected",balancer.redisPubSub[0]);

        balancer.redisClients[0].on("error", function (err) {
            util.log("Redis instance" + balancer.redisClients[0].host + ":" + balancer.redisClients[0].port + " Error " + err);
            if(err.message.indexOf("ECONNREFUSED") != -1){
                emitter.emit("masterDown",this);
            }
        });
        //balancer.redisClients[0].unsubscribe("#chronos");   // TODO
        util.log("redis instance "+ balancer.redisClients[0].host + ":" + balancer.redisClients[0].port+" will be Master");

        for(var i=1;i < balancer.redisClients.length;i++){
            balancer.redisClients[i].slaveof(balancer.redisClients[0].host,balancer.redisClients[0].port);
            util.log("redis instance "+balancer.redisClients[i].host + ":" + balancer.redisClients[i].port+" will be slaveof " + balancer.redisClients[0].host + ":" + balancer.redisClients[0].port);
        }
    }
});

emitter.on("slaveDown", function(slave){					
	var alreadyRemoved = false;
    balancer.redisClientsDown.forEach(function(client){
        if(client.host==slave.host && client.port == slave.port){
            alreadyRemoved = true;
        }
    });
    if(!alreadyRemoved){
        util.log("redis server " + slave.host + ":" + slave.port + " down.");
        slave.end();
        balancer.redisClients = removeServerFromArray(balancer.redisClients,slave);
        balancer.redisSubscribers = removeServerFromArray(balancer.redisPubSub,slave);
        balancer.redisClientsDown.push(slave);
    }
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
                 var newPubSubClient  =  redis.createClient(newClient.port ,newClient.host);
                 balancer.redisPubSub.push(newPubSubClient);
                 emitter.emit("subscriberClientCreated",newPubSubClient);
             }
         });

    });
},2000);


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
