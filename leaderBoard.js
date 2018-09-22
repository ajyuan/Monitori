const userMap = require("./userMap");
const config = require("./config.json");
const guildMap = new Map();

module.exports = {
    generate: function (guildID,ids) {
        console.log("Generating leaderboard for guild: " + guildID);

        //Update scores for all users in a guild
        ids.tap(user => {
            userMap.updateUserScore(user.id);
        });

        var sortedUsers = [];
    }
}