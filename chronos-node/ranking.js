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

// TODO bug sur les after

function ranking(lastname,firstname,mail,topN,range,callback){
	var token = "{lastname:"+lastname+",firstname:"+firstname+",mail:"+mail+"}";
    var topScores = [];
    var topUsers = [];
    var afterScores = [];
    var afterUsers = [];
    var beforeScores = [];
    var beforeUsers = [];
    client.zcard("scores",function(err,totalNumberOfUsers){
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
                lastScoreAfter = reply+1;
                if (lastScoreAfter>=high) {
                    lastScoreAfter=high;
                }
                console.log("totalNumberOfUsers = " + totalNumberOfUsers );
                console.log("low = " + low );
                console.log("high = " + high );
                console.log("lastScoreAfter = " + lastScoreAfter);
                
                
                client.zrevrange("scores",0,topN, function (err,replies) {
        			replies.forEach(function(resp,i){
    					client.zscore("scores",resp,function(err,score){
    						//callback(i,resp,score);
                            topUsers.push(resp);
                            topScores.push(score);
                            if(i==topN){
                            client.zrevrange("scores",lastScoreAfter,high,function(err,afterReplies) {
                                    afterReplies.forEach(function(afterResp,j) {
                                        afterUsers.push(resp);
                                        afterScores.push(score);
                                        if(j==high-lastScoreAfter){
                                               client.zrevrange("scores",low,reply,function(err,beforeReplies) {
                                                   beforeReplies.forEach(function(beforeResp,k) {
                                                        beforeUsers.push(resp);
                                                        beforeScores.push(score);
                                                        if(k==reply-low){
                                                            callback(afterUsers,afterScores,beforeUsers,beforeScores,topUsers,topScores);    
                                                        }
                                                   });
                                               });
                                                
                                        }
                                    });
                                });
                              
                            }
    					});
    					
    				});
    		    });
                
    	});	
    });
}

/*
addUser("user1","user1","user1@gmail.com");
updateScore("user1","user1","user1@gmail.com",6);

addUser("user2","user2","user2@gmail.com");
updateScore("user2","user2","user2@gmail.com",1)


addUser("bazoud","olivier","olivier@gmail.com");
addUser("mage","pierre","pierre@gmail.com");
addUser("tebourbi","slim","slim@gmail.com");

updateScore("bazoud","olivier","olivier@gmail.com",3);
updateScore("mage","pierre","pierre@gmail.com",4);
updateScore("tebourbi","slim","slim@gmail.com",1);
*/
/*
getScore("tebourbi","slim","slim@gmail.com",function(reply){
    console.log("score of user slim@gmail.com : " + reply);
});
*/
ranking ("mage","pierre","pierre@gmail.com",2,1,function(afterUsers,afterScores,beforeUsers,beforeScores,topUsers,topScores){
    console.log("\t topUsers:" + topUsers);
    console.log("\t topScores:" + topScores);
    console.log("\t beforeUsers:" + beforeUsers);
    console.log("\t beforeScores:" + beforeScores);
    console.log("\t afterUsers:" + afterUsers);
    console.log("\t afterScores:" + afterScores);
});


