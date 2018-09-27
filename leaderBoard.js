const userMap = require("./userMap");
const config = require("./config.json");
const index = require("./index");
const guildMap = new Map();

var type;
var bot;

class Guild {
    constructor() {
        this.pointsBoard = null;
        this.scoreBoard = null;
    }
}

module.exports = {
    init: function (client) {
        bot = client;
    },
    //Creates a leaderboard for a guildID if none exists, updates it if it does
    generate: function (guild, type) {
        var output = "";
        guildID = guild.id;
        ids = guild.members;
        console.log("Generating leaderboard for guild: " + guildID);
        var members = [];

        //Update scores for all users in a guild
        ids.tap(user => {
            if (userMap.userExists(user.id)) {
                userMap.updateUserScore(user.id);
                members.push(user.id);
            }
        });

        //if (!guildMap.has(guildID)) {
            let createdGuild = new Guild();
            if (type === "points") {
                createdGuild.pointsBoard = newBoard(members, type);

                for (var i = 0; i < createdGuild.pointsBoard.length; i++) {
                    output += bot.users.get(createdGuild.pointsBoard[i]).username + "\n";
                    //console.log("out: " + output);
                }
            } else if (type === "score") {
                createdGuild.scoreBoard = newBoard(members, type);
            }
            console.log("Output: " + output);
            guildMap.set(guildID, createdGuild);
        //} else {}
    }
}

//Creates a new leaderboard
function newBoard(members, type) {
    if (members.length < config.sortThreshold) {
        console.log("Guild has " + members.length + " active member(s), using insertion sort!");
        return insertionSort(members, type);
    } else {
        console.log("Guild has " + members.length + " active members, using merge sort!");
    }
}

//Helper function that returns the appropriate value given the type of leaderboard requested
function valueGetter(type, members, index) {
    if (type === "points") {
        return userMap.points(members[index]);
    } else if (type === "score") {
        return userMap.score(members[index]);
    }
}

//Given an array of userIDs and a type, this function will sort the userIDs by the given type
//Ex. if type === "points", sort the users by their points
function insertionSort(members, type) {
    for (var i = 0; i < members.length; i++) {
        let current = members[i];
        for (var j = i - 1; j > -1 && valueGetter(type, members, j) > current; j--) {
            members[j + 1] = members[j];
        }
        members[j + 1] = current;
    }
    return members;
}