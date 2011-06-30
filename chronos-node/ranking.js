// TODO il faut configurer la connexion au serveur redis
var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});


function addUser(lastname,firstname,mail){
   var token = "{lastname:"+lastname+",firstname:"+firstname+",mail:"+mail+"}";
   client.zadd("scores",0,token,function(err,reply){
			console.log("user : " + token + " added");
			client.save();
		}
	);
}


function updateScore(lastname,firstname,mail,increment){
    var token = "{lastname:"+lastname+",firstname:"+firstname+",mail:"+mail+"}";
	client.zincrby("scores",increment,token,function(err,reply){
		console.log("score of user "+token+"incremented by " + increment);
		client.save();
	});	
}

function getScore(lastname,firstname,mail,callback){
    var token = "{lastname:"+lastname+",firstname:"+firstname+",mail:"+mail+"}";
    client.zscore("scores",token,function(err,reply){
        callback(reply);
        });    
}

function ranking(lastname,firstname,mail,range,totalNumberOfUsers,callback){
	var token = "{lastname:"+lastname+",firstname:"+firstname+",mail:"+mail+"}";
    client.zrevrank("scores",token,function(err,reply){
			console.log("user: "+firstname+", rank : "+reply);
           low = reply-range;
            high = reply+range;
            if(low<0){
              low = 0;
            }
            if(high>=totalNumberOfUsers){
                high = totalNumberOfUsers - 1;
            }
            client.zrevrange("scores",low,high, function (err,replies) {
				replies.forEach(function(resp,i){
					client.zscore("scores",resp,function(err,score){
						callback(i,resp,score);
					});
					
				});
		    });
	});	
}

addUser("bazoud","olivier","olivier@gmail.com");
addUser("mage","pierre","pierre@gmail.com");
addUser("tebourbi","slim","slim@gmail.com");

updateScore("bazoud","olivier","olivier@gmail.com",3);
updateScore("mage","pierre","pierre@gmail.com",4);
updateScore("tebourbi","slim","slim@gmail.com",1);
/*
getScore("tebourbi","slim","slim@gmail.com",function(reply){
    console.log("score of user slim@gmail.com : " + reply);
});
*/
ranking ("tebourbi","slim","slim@gmail.com",2,6,function(i,resp,score){
	console.log("\t " + i + " - " + resp + "("+score+")");
    
});


