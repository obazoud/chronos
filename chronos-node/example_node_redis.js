var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});


client.zrank("scores","user3",function(err,index){
	console.log("-->"+index);
	var low = index - 1;
	var high = index + 1;
	getRange(client,parseInt(low),parseInt(high));
});


client.zrange("scores",2,4,redis.print);

function getRange(client,low,high){
        console.log("-->getRange("+low+","+high+")");	
	client.zrange("scores",parseInt(low),parseInt(high),function(err,replies){
		console("replies = " + replies);
		replies.forEach(function(reply,i){
			console.log(i +"/" + reply );
		})
	});
}


//var index = client.zrank("scores","user3",redis.print);
//console.log("index = " + index);
client.quit();
