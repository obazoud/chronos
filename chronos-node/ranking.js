var os = require('os');
var logger = require('util');
var redis = require("redis"),
  client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});
client.on("error", function (err) {
    console.log("Error " + err);
});

function initRanking(callback) {
    client.del("scores");
};
exports.initRanking = initRanking;

function addUser(lastname, firstname, mail, callback) {
    var token = JSON.stringify({"lastname":lastname,"firstname":firstname,"mail":mail});
    // logger.log("---->>>>" + token);
    client.zadd("scores", 0, token, function(err, added) {
        // added == 1 if the element was added.
        // added == 0 if the element was already a member of the sorted set and the score was updated.
        // callback(err, added);
    });
};
exports.addUser = addUser;

function ranking(lastname,firstname,mail,topN,range,callback){
    topN = topN - 1;
    var token = JSON.stringify({"lastname":lastname,"firstname":firstname,"mail":mail});
    // logger.log("Ranking " + mail + ": " + token);
    var ranking = {
         "score": "?"
        ,"top_scores":{"mail":[],"scores":[],"firstname":[],"lastname":[]}
        ,"before":{"mail":[],"scores":[],"firstname":[],"lastname":[]}
        ,"after":{"mail":[],"scores":[],"firstname":[],"lastname":[]}
    };
    client.zcard("scores",function(err,totalNumberOfUsers){
        totalNumberOfUsers = totalNumberOfUsers - 1;
        if (topN > totalNumberOfUsers) { topN = totalNumberOfUsers; }
        client.zscore("scores",token,function(err,userScore){
            ranking.score = -parseInt(userScore) + "";
            client.zrank("scores",token,function(err,userRank){
                zrange(ranking,ranking.top_scores,0,topN,function(err,ranking){
                    if (totalNumberOfUsers == 0) { callback(err,ranking); }
                    else {
                        var minBeforeRank = userRank - range;
                        if (minBeforeRank < 0){ minBeforeRank = 0; }
                        var maxBeforeRank = userRank - 1;

                        var maxAfterRank = userRank + range;
                        if (maxAfterRank > totalNumberOfUsers) { maxAfterRank = totalNumberOfUsers; }
                        var minAfterRank = userRank + 1;

                        if (userRank == totalNumberOfUsers) {
                            // l'utilisateur est le dernier
                            // pas d'after
                            zrange(ranking,ranking.before,minBeforeRank,maxBeforeRank,callback);
                        }
                        else if (userRank == 0) {
                            // l'utilisateur est le premier
                            // pas de before
                            zrange(ranking,ranking.after,minAfterRank,maxAfterRank,callback);
                        }
                        else {
                            zrange(ranking,ranking.before,minBeforeRank,maxBeforeRank,function(err,ranking) {
                                zrange(ranking,ranking.after,minAfterRank,maxAfterRank,callback);
                            });
                        }
                    }
                });
            });
        });
    });
};
exports.ranking = ranking;

function zrange(ranking,rankingField,min,max,callback) {
    client.zrange("scores",min,max,"withscores",function(err,zrange) {
        if (err) {
            callback(err,ranking);
        }
        else {
            zrange.forEach(function(user,i) {
                if (i%2 == 0) {
                    var userObject = JSON.parse(user);
                    rankingField.mail.push(userObject.mail);
                    rankingField.firstname.push(userObject.firstname);
                    rankingField.lastname.push(userObject.lastname);
                    rankingField.scores.push(-parseInt(zrange[i+1]) + "");
                }
                if (i == zrange.length - 1) {
                    callback(err,ranking);
                }
            });
        }
    });
}

function reset(callback) {
    client.zrangebyscore("scores",1,'+inf',function(err,users) {
        if (users.length == 0) {
            callback();
        } else {
            users.forEach(function(user) {
                client.zadd("scores", 0, user,function(err,updated) {
                    callback(err,updated);
                });
            });
        }
    });
};
exports.reset = reset;
