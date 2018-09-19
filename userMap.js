const vader = require("vader-sentiment");
const LinkedList = require("linkedlist");
const config = require("./config.json");
const userMap = new Map();

//This is the User object that each user id maps to
function User(messageLog) {
    this.score = 0;
    this.totalMessages = 0;
    this.messages = messageLog;
}
module.exports = {
    /*
    Adds a given message to its respective user's log
    Performs checks: User exists, message is not empty, message does not begin with filtered prefix
    */
    add: function ( message) {
        //filters out messages that are not intended to be analyzed,
        //ex. captionless images, bot commands, etc.
        if (message.content === "") {
            return;
        }
        for (var i = 0; i < config.filters.length; i++) {
            if (message.content.charAt(0) === config.filters[i]) {
                return;
            }
        }
        const id = message.author.id;
        newUserCheck(id); //If a user does not exist in usermap, create a new user
        userMap.get(id).messages.push(message.content);  //Inserts the message

        if (config.autopay > 0 && userMap.get(id).messages.length >= config.autopayThreshold) {
            updateScore(userMap.get(id));
            console.log(message.author + " was automatically paid")
        }
    },
    /*
    Calculates and updates the sentiment score of a user
    Returns true if elligable messages to process were found, returns false otherwise
    */
    updateScore: function (id) {
        var User = userMap.get(id);
        var messagesProcessed = 0;
        var adjustment = 0;

        User.messages.resetCursor();
        while (User.messages.next()) {
            /*
            Because most sentenances may not be easily identified as positive or negative sentiment,
            we will automatically filter out statements with relatively low compound scores
            to preserve consistency
            */
            if (Math.abs(vader.SentimentIntensityAnalyzer.polarity_scores(User.messages.current).compound) >= 0.5) {
                adjustment += vader.SentimentIntensityAnalyzer.polarity_scores(User.messages.current).compound;
                messagesProcessed++;
            }
        }
        if (User.totalMessages + messagesProcessed === 0) {
            User.messages = new LinkedList();
            return false;
        } else {
            User.score = ((User.score * User.totalMessages) + adjustment) / (User.totalMessages + messagesProcessed);
            User.score = Math.round(User.score * 1000) / 1000;
            User.messages = new LinkedList();
            User.totalMessages += messagesProcessed;
            return true;
        }
    },
    clearUser: function (id) {
        userMap.delete(id);
    },
    clearAll: function () {
        userMap.clear();
    },
    userExists: function (id) {
        return userMap.has(id);
    },
    toString: function (id) {
        if (userMap.get(id) === undefined) {
            return null;
        }
        var userLog = userMap.get(id).messages;
        if (userLog === null || userLog.length === 0) {
            return null;
        }
        userLog.resetCursor();
        var output = "";
        while (userLog.next()) {
            output += userLog.current;
            output += "\n";
        }
        return output;
    },
    score: function(id) {
        newUserCheck(id);
        return userMap.get(id).score;
    }
};

//Checks if a user's id already exists in the user map. If not, it will initialize a new user
//and map the user's id to it
function newUserCheck(id) {
    if (!userMap.has(id)) {
        var messages = new LinkedList();
        var newUser = new User(messages);
        userMap.set(id, newUser);
    }
}