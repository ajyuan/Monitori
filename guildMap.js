const userMap = require("./userMap");
const config = require("./config.json");
const guildMap = new Map();

var bot;

class Guild {
    constructor(id) {
        this.id = id;
        this.userListModified = false;
        this.pointsBoard = null;
        this.scoreBoard = null;
    }

    setTimer(time = config.autopayOnInactivityTime * 1000) {
        setTimeout(function run() {
            userMap.updateMemberScores(bot.guilds.get(id).members);
            setTimeout(run, time);
        }, time);
    }
}

module.exports = {
    init: function (client) {
        bot = client;
    },
    newGuild: function (guildID) {
        newGuild(guildID)
    },
    /*
    Creates a leaderboard for a guildID if none exists, updates it if it does
    Returns a formatted string of users to be printed by bot
    */
    leaderboard: function (guild, type) {
        var output = "";
        guildID = guild.id;
        console.log("Generating leaderboard for guild: " + guildID);
        var members = [];
        var ids = [];

        if (!guildMap.has(guildID) || guildMap.get(guildID).userListModified) {
            console.log("Member list outdated, regenerating");
            guild.members.tap(user => {
                userMap.idCheck(user.id);
                userMap.updateUserScore(user.id);
                members.push(user.id);
            });
        } else {
            if (type === "points") {
                ids = guildMap.get(guildID).pointsBoard;
            } else if (type === "score") {
                ids = guildMap.get(guildID).scoreBoard;
            } else {
                console.log("Leaderboard generation error: Type not specified");
                process.exit(1);
            }
            if (ids === null) {
                console.log("Leaderboard generation error: Guild leaderboard null");
                process.exit(1);
            }
            let currentID;
            while (ids.length != 0) {
                currentID = ids.pop()
                userMap.updateUserScore(currentID);
                members.push(currentID);
            }
        }

        let createdGuild;
        if (guildMap.has(guildID)) {
            createdGuild = guildMap.get(guildID);
        } else {
            createdGuild = newGuild(guildID);
        }
        let currentBoard = newBoard(members, type);

        if (type === "points") {
            createdGuild.pointsBoard = currentBoard;
        } else if (type === "score") {
            createdGuild.scoreBoard = currentBoard;
        }
        createdGuild.userListModified = false;

        //Generates the string representation of the leaderboard
        for (var i = 0; i < currentBoard.length; i++) {
            if (currentBoard[i] !== config.botid) {
                output += "**" + bot.users.get(currentBoard[i]).username
                    + "** | " + valueGetter(type, currentBoard[i]) + " pts\n";
            }
        }
        return output;
    },
    //Notifies ADT that guild leaderboard has a change in member list, and needs to have
    //leaderboard regenerated
    flag: function (guildID) {
        if (!guildMap.has(guildID)) {
            console.log("Flag error: Attempted to flag guild that has not been mapped");
            process.exit(1);
        }
        console.log("Member list change detected on guild " + guildID);
        guildMap.get(guildID).userListModified = true;
    }
}

//Creates a new guild class
function newGuild(guildID) {
    let createdGuild = new Guild(guildID);
    createdGuild.setTimer();
    guildMap.set(guildID, createdGuild);
    return createdGuild;
}

//Determines appropriate sort to use and generates a new leaderboard
function newBoard(members, type) {
    if (members.length < config.sortThreshold) {
        console.log("Guild has " + members.length + " active member(s), using insertion sort!");
        return insertionSort(members, type);
    } else {
        console.log("Guild has " + members.length + " active members, using merge sort!");
        return mergeSort(members, type);
    }
}

/*
Sorting Algorithms -----
Given an array of userIDs and a type, these functions will return a sorted array of userIDs by
a given type
Ex. if type === "points", sort the users by their points
*/
function insertionSort(members, type) {
    for (var i = 1; i < members.length; i++) {
        let current = members[i];
        for (var j = i - 1; j >= 0 && valueGetter(type, members[j]) < valueGetter(type, current); j--) {
            //console.log(valueGetter(type, members[j]) + " is greater than " + valueGetter(type, current));
            members[j + 1] = members[j];
        }
        members[j + 1] = current;
    }
    return members;
}

function mergeSort(members, type) {
    /*for (i = 0; i < members.length; i ++) {
        console.log("Current subarray: " + members[i]);
    }*/
    if (members.length <= 1) {
        return members;
    } else {
        const mid = members.length / 2;
        const first = members.slice(0, mid);
        const last = members.slice(mid);
        return merge(mergeSort(first), mergeSort(last), type);
    }
}
function merge(first, last, type) {
    let output = [];
    let firstIndex = 0;
    let lastIndex = 0;
    while (firstIndex < first.length && lastIndex < last.length) {
        if (valueGetter(type, first[firstIndex]) > valueGetter(type, last[lastIndex])) {
            console.log(first[firstIndex]);
            output.push(first[firstIndex]);
            firstIndex++;
        } else {
            console.log(last[lastIndex]);
            output.push(last[lastIndex]);
            lastIndex++;
        }
    }
    return output.concat(first.slice(firstIndex)).concat(last.slice(lastIndex));
}

//Helper function that returns the appropriate value given the type of leaderboard requested
function valueGetter(type, member) {
    if (type === "points") {
        return userMap.points(member);
    } else if (type === "score") {
        return userMap.score(member);
    } else {
        console.log("leaderBoard error: valueGetter given incorrect type argument");
        process.exit(1);
    }
}