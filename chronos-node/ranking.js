var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});


/*
client.zadd("scores",28,"user1",redis.print);
client.zadd("scores",2,"user2",redis.print);
client.zadd("scores",3,"user3",redis.print);
client.zadd("scores",8,"user4",redis.print);
client.zadd("scores",23,"user5",redis.print);

client.zadd("scores",15,"user6",redis.print);
client.zadd("scores",6,"user7",redis.print);
client.zadd("scores",32,"user8",redis.print);
client.zadd("scores",20,"user9",redis.print);
client.zadd("scores",17,"user10",redis.print);



client.zrevrangebyscore("scores","+inf","-inf", function (err,replies) {
		console.log("classement global par score: ");
		replies.forEach(function(resp,i){
			console.log("\t " + i + " - " + resp );
		});
});
*/

function scoring(user,range,totalNumberOfUsers,callback){
	client.zrevrank("scores",user,function(err,reply){
			console.log("user: "+user+", rank : "+reply);
            
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


scoring ("user8",6,10,function(i,resp,score){
	console.log("\t " + i + " - " + resp + "("+score+")");
});


//client.quit();

