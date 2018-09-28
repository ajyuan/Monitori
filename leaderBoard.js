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
    //Returns a formatted string of users to be printed by bot
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
        createdGuild.pointsBoard = newBoard(members, type);

        for (var i = 0; i < createdGuild.pointsBoard.length; i++) {
            output += "**" + bot.users.get(createdGuild.pointsBoard[i]).username
                + "** | " + valueGetter(type,createdGuild.pointsBoard[i]) + " pts\n";
            //console.log("out: " + output);
        }
        guildMap.set(guildID, createdGuild);
        return output;
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

//Given an array of userIDs and a type, this function will sort the userIDs by the given type
//Ex. if type === "points", sort the users by their points
function insertionSort(members, type) {
    for (var i = 0; i < members.length; i++) {
        let current = members[i];
        for (var j = i - 1; j > -1 && valueGetter(type, members[j]) > valueGetter(type, current); j--) {
            console.log(valueGetter(type, members[j]) + " is greater than " + valueGetter(type, current));
            members[j + 1] = members[j];
        }
        members[j + 1] = current;
    }
    return members;
}

//Helper function that returns the appropriate value given the type of leaderboard requested
function valueGetter(type, member) {
    if (type === "points") {
        return userMap.points(member);
    } else if (type === "score") {
        return userMap.score(member);
    }
}