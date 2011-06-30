// TODO il faut configurer la connexion au serveur redis
var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});

exports.addUser = function addUser(lastname,firstname,mail){
    var token = JSON.stringify({"lastname":lastname,"firstname":firstname,"mail":mail});
    client.zadd("scores",0,token,function(err,reply){
        // console.log("user : " + token + " added");
        client.bgsave();
    });
};

exports.updateScore = function updateScore(lastname,firstname,mail,newScore){
    var token = JSON.stringify({"lastname":lastname,"firstname":firstname,"mail":mail});
    // TODO: avoid this call to redis by replacing newScore by increment
    client.zscore("scores",token,function(err,currentScore){
        var increment = newScore - currentScore;
        client.zincrby("scores",increment,token,function(err,updatedScore){
            console.log("score of user " + token + "incremented by " + increment);
            client.bgsave();
        });
    });
};

exports.getScore = function getScore(lastname,firstname,mail,callback){
    var token = JSON.stringify({"lastname":lastname,"firstname":firstname,"mail":mail});
    client.zscore("scores",token,function(err,reply){
        callback(reply);
    });    
};

exports.ranking = function ranking(lastname,firstname,mail,topN,range,callback){
    topN = topN - 1;
    var token = JSON.stringify({"lastname":lastname,"firstname":firstname,"mail":mail});
    var ranking = {
         "top_scores":{"mail":[],"scores":[],"firstname":[],"lastname":[]}
        ,"before":{"mail":[],"scores":[],"firstname":[],"lastname":[]}
        ,"after":{"mail":[],"scores":[],"firstname":[],"lastname":[]}
    };
    client.zscore("scores",token,function(err,userScore){
        ranking.score = userScore;
        client.zcard("scores",function(err,totalNumberOfUsers){
            console.log("totalNumberOfUsers = " + totalNumberOfUsers);
            totalNumberOfUsers = totalNumberOfUsers - 1;
            if (topN > totalNumberOfUsers) { topN = totalNumberOfUsers; }
            client.zrevrank("scores",token,function(err,userRank){
                console.log("user: "+firstname+", rank : "+userRank);

                // top_scores
                client.zrevrange("scores",0,topN, function (err,topRange) {
                    console.log("top_scores(0," + topN + ")");
                    topRange.forEach(function(topUser,i){
                        var topUserObject = JSON.parse(topUser);
                        client.zscore("scores",topUser,function(err,topScore){
                            ranking.top_scores.mail.push(topUserObject.mail);
                            ranking.top_scores.scores.push(topScore);
                            ranking.top_scores.firstname.push(topUserObject.firstname);
                            ranking.top_scores.lastname.push(topUserObject.lastname);
                            if (i == topN ) {
                                // after
                                if (userRank == totalNumberOfUsers) {
                                    var minBeforeRank = userRank - range;
                                    if (minBeforeRank < 0){ minBeforeRank = 0; }
                                    var maxBeforeRank = userRank - 1;
                                    client.zrevrange("scores",minBeforeRank,maxBeforeRank,function(err,beforeRange) {
                                        console.log("before(" + minBeforeRank + "," + maxBeforeRank + ")");
                                        beforeRange.forEach(function(beforeUser,k) {
                                            var beforeUserObject = JSON.parse(beforeUser);
                                            client.zscore("scores",beforeUser,function(err,beforeScore){
                                                ranking.before.mail.push(beforeUserObject.mail);
                                                ranking.before.scores.push(beforeScore);
                                                ranking.before.firstname.push(beforeUserObject.firstname);
                                                ranking.before.lastname.push(beforeUserObject.lastname);
                                                if(k==maxBeforeRank-minBeforeRank){
                                                    callback(ranking);
                                                }
                                            });
                                        });
                                    });
                                } // TODO factoriser
                                else {
                                    var maxAfterRank = userRank + range;
                                    if (maxAfterRank > totalNumberOfUsers) { maxAfterRank = totalNumberOfUsers; }
                                    var minAfterRank = userRank + 1;
                                    client.zrevrange("scores",minAfterRank,maxAfterRank,function(err,afterRange) {
                                        console.log("after(" + minAfterRank + "," + maxAfterRank + ")");
                                        afterRange.forEach(function(afterUser,j) {
                                            var afterUserObject = JSON.parse(afterUser);
                                            client.zscore("scores",afterUser,function(err,afterScore){
                                                ranking.after.mail.push(afterUserObject.mail);
                                                ranking.after.scores.push(afterScore);
                                                ranking.after.firstname.push(afterUserObject.firstname);
                                                ranking.after.lastname.push(afterUserObject.lastname);
                                                if(j==maxAfterRank-minAfterRank){
                                                    // before
                                                    if (userRank == 0) { callback(ranking); }
                                                    else {
                                                        minBeforeRank = userRank - range;
                                                        if (minBeforeRank < 0){ minBeforeRank = 0; }
                                                        maxBeforeRank = userRank - 1;
                                                        client.zrevrange("scores",minBeforeRank,maxBeforeRank,function(err,beforeRange) {
                                                            console.log("before(" + minBeforeRank + "," + maxBeforeRank + ")");
                                                            beforeRange.forEach(function(beforeUser,k) {
                                                                var beforeUserObject = JSON.parse(beforeUser);
                                                                client.zscore("scores",beforeUser,function(err,beforeScore){
                                                                    ranking.before.mail.push(beforeUserObject.mail);
                                                                    ranking.before.scores.push(beforeScore);
                                                                    ranking.before.firstname.push(beforeUserObject.firstname);
                                                                    ranking.before.lastname.push(beforeUserObject.lastname);
                                                                    if(k==maxBeforeRank-minBeforeRank){
                                                                        callback(ranking);
                                                                    }
                                                                });
                                                            });
                                                        });
                                                    }
                                                }
                                            });
                                        });
                                    });
                                }
                            }
                        });
                    });
                });
            });
        });
    });
};

exports.reset = function reset(callback) {
    client.zrange("scores",0,-1,function(err,users) {
        users.forEach(function(user,i) {
            client.zscore("scores",user,function(err,score) {
                client.zincrby("scores",-score,user,function(err,incrementedScore){
                    callback(err,incrementedScore);
                });
            });
        });
    });
};

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

ranking ("mage","pierre","pierre@gmail.com",100,5,function(ranking){
    console.log("pierre");
    console.log("\t ranking:" + JSON.stringify(ranking));
});

ranking ("bazoud","olivier","olivier@gmail.com",100,5,function(ranking){
    console.log("olivier");
    console.log("\t ranking:" + JSON.stringify(ranking));
});

ranking ("tebourbi","slim","slim@gmail.com",100,5,function(ranking){
    console.log("slim");
    console.log("\t ranking:" + JSON.stringify(ranking));
});

reset(function(err,incrementedScore){console.log(incrementedScore);});
*/
