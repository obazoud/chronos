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
    });
};

exports.updateScore = function updateScore(lastname,firstname,mail,newScore){
    var token = JSON.stringify({"lastname":lastname,"firstname":firstname,"mail":mail});
    // TODO: avoid this call to redis by replacing newScore by increment
    client.zscore("scores",token,function(err,currentScore){
        var increment = newScore - currentScore;
        client.zincrby("scores",increment,token,function(err,updatedScore){
            // console.log("score of user " + token + " incremented by " + increment);
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
    client.zcard("scores",function(err,totalNumberOfUsers){
        totalNumberOfUsers = totalNumberOfUsers - 1;
        if (topN > totalNumberOfUsers) { topN = totalNumberOfUsers; }
        console.log("totalNumberOfUsers = " + (totalNumberOfUsers + 1));
        client.zscore("scores",token,function(err,userScore){
            ranking.score = parseInt(userScore);
            client.zrevrank("scores",token,function(err,userRank){
                console.log("user: " + firstname + ", rank: " + userRank);

                // top_scores
                client.zrevrange("scores",0,topN,"withscores",function(err,topRange) {
                    console.log("top_scores(0," + topN + "): " + topRange);
                    topRange.forEach(function(topUserOrTopScore,i){
                        if (i%2 == 0) {
                            var topUserObject = JSON.parse(topUserOrTopScore);
                            ranking.top_scores.mail.push(topUserObject.mail);
                            ranking.top_scores.firstname.push(topUserObject.firstname);
                            ranking.top_scores.lastname.push(topUserObject.lastname);
                            ranking.top_scores.scores.push(parseInt(topRange[i+1]));
                        }
                        if (i == topN ) {
                            // TODO factoriser
                            if (totalNumberOfUsers == 0) { callback(ranking); }
                            // before
                            else if (userRank == totalNumberOfUsers) {
                                // l'utilisateur est le dernier
                                // pas d'after
                                var minBeforeRank = userRank - range;
                                if (minBeforeRank < 0){ minBeforeRank = 0; }
                                var maxBeforeRank = userRank - 1;
                                client.zrevrange("scores",minBeforeRank,maxBeforeRank,"withscores",function(err,beforeRange) {
                                    console.log("before(" + minBeforeRank + "," + maxBeforeRank + ")");
                                    beforeRange.forEach(function(beforeUser,k) {
                                        if (k%2 == 0) {
                                            var beforeUserObject = JSON.parse(beforeUser);
                                            ranking.before.mail.push(beforeUserObject.mail);
                                            ranking.before.firstname.push(beforeUserObject.firstname);
                                            ranking.before.lastname.push(beforeUserObject.lastname);
                                            ranking.before.scores.push(parseInt(beforeRange[k+1]));
                                        }
                                        if (k == beforeRange.length -1) {
                                            callback(ranking);
                                        }
                                    });
                                });
                            }
                            else if (userRank == 0) {
                                // l'utilisateur est le premier
                                // pas de before
                                var maxAfterRank = userRank + range;
                                if (maxAfterRank > totalNumberOfUsers) { maxAfterRank = totalNumberOfUsers; }
                                var minAfterRank = userRank + 1;
                                client.zrevrange("scores",minAfterRank,maxAfterRank,"withscores",function(err,afterRange) {
                                    console.log("after first user(" + minAfterRank + "," + maxAfterRank + "): " + afterRange);
                                    afterRange.forEach(function(afterUser,j) {
                                        if (j%2 == 0) {
                                            var afterUserObject = JSON.parse(afterUser);
                                            ranking.after.mail.push(afterUserObject.mail);
                                            ranking.after.firstname.push(afterUserObject.firstname);
                                            ranking.after.lastname.push(afterUserObject.lastname);
                                            ranking.after.scores.push(parseInt(afterRange[j+1]));
                                        }
                                        if (j == afterRange.length - 1) {
                                            callback(ranking);
                                        }
                                    });
                                });
                            }
                            else {
                                // after
                                var maxAfterRank = userRank + range;
                                if (maxAfterRank > totalNumberOfUsers) { maxAfterRank = totalNumberOfUsers; }
                                var minAfterRank = userRank + 1;
                                client.zrevrange("scores",minAfterRank,maxAfterRank,"withscores",function(err,afterRange) {
                                    console.log("after(" + minAfterRank + "," + maxAfterRank + ")");
                                    afterRange.forEach(function(afterUser,j) {
                                        if (j%2 == 0) {
                                            var afterUserObject = JSON.parse(afterUser);
                                            ranking.after.mail.push(afterUserObject.mail);
                                            ranking.after.firstname.push(afterUserObject.firstname);
                                            ranking.after.lastname.push(afterUserObject.lastname);
                                            ranking.after.scores.push(parseInt(afterRange[j+1]));
                                        }
                                        if (j == afterRange.length - 1) {
                                            // before
                                            if (userRank == 0) { callback(ranking); }
                                            else {
                                                minBeforeRank = userRank - range;
                                                if (minBeforeRank < 0){ minBeforeRank = 0; }
                                                maxBeforeRank = userRank - 1;
                                                client.zrevrange("scores",minBeforeRank,maxBeforeRank,"withscores",function(err,beforeRange) {
                                                    console.log("before(" + minBeforeRank + "," + maxBeforeRank + ")");
                                                    beforeRange.forEach(function(beforeUser,k) {
                                                        if (k%2 == 0) {
                                                            var beforeUserObject = JSON.parse(beforeUser);
                                                            ranking.before.mail.push(beforeUserObject.mail);
                                                            ranking.before.firstname.push(beforeUserObject.firstname);
                                                            ranking.before.lastname.push(beforeUserObject.lastname);
                                                            ranking.before.scores.push(parseInt(beforeRange[k+1]));
                                                        }
                                                        if (k == beforeRange.length - 1) {
                                                            callback(ranking);
                                                        }
                                                    });
                                                });
                                            }
                                        }
                                    });
                                });
                            }
                        }
                    });
                });
            });
        });
    });
};

exports.reset = function reset(callback) {
    client.zrangebyscore("scores",1,'+inf',function(err,users) {
        if (users.length == 0) {
            callback();
        } else {
            users.forEach(function(user) {
                client.zadd("scores",0,user,function(err,score) {
                    callback(err,score);
                });
            });
        }
    });
};

/*
addUser("bazoud","olivier","olivier@gmail.com");
addUser("mage","pierre","pierre@gmail.com");
addUser("tebourbi","slim","slim@gmail.com");

updateScore("bazoud","olivier","olivier@gmail.com",3);
updateScore("mage","pierre","pierre@gmail.com",4);
updateScore("tebourbi","slim","slim@gmail.com",1);

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
