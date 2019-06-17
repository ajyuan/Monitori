const vader = require("vader-sentiment");
const LinkedList = require("linkedlist");
const config = require("./config/config.json");
const userMap = new Map();

var awardThreshold = config.awardThreshold;
var awardAmount = config.awardAmount;

//This is the User object that each user id maps to
class User {
    constructor(messageLog) {
        this.points = 0;
        this.score = 0;
        this.prevscore = 0;
        this.totalMessages = 0;
        this.messages = messageLog;
    }
}
module.exports = {
    /*
    Adds a given message to its respective user's log
    Performs checks: User exists, message is not empty, message does not begin with filtered prefix
    */
    add: function (message) {
        //filters out messages that are not intended to be analyzed,
        //ex. captionless images, bot commands, etc.
        if (message.content === "") {
            return;
        }
        for (let i = 0; i < config.filters.length; i++) {
            if (message.content.startsWith(config.filters[i])) {
                return;
            }
        }

        const id = message.author.id;
        //If a user does not exist in usermap, create a new user.
        newUserCheck(id);
        userMap.get(id).messages.push(message.content);  //Inserts the message

        if (config.autopay > 0 && userMap.get(id).messages.length >= config.autopayThreshold) {
            updateScore(userMap.get(id));
            console.log(message.author + " was automatically paid")
        }
    },
    //Checks if a user with this id exists in the userMap
    //If it doesn't, create one
    idCheck: function (id) {
        newUserCheck(id);
    },
    // ------------------ SCORE FUNCTIONS ---------------------------

    //Calculates and updates the sentiment score of a user
    //Returns true if elligable messages to process were found, returns false otherwise
    updateUserScore: function (id) {
        return pay(id);
    },
    //Calculates and updates the sentiment scores of a given collection of users
    //Mainly used for updating scores of a specific server instead of the entire map
    //Returns true if elligable messages to process were found, returns false otherwise
    updateMemberScores: function (ids) {
        ids.tap(user => {
            if (user.id !== config.botid) {
                pay(user.id);
            }
        });
    },
    //Calculates and updates the sentiment scores of every user the bot serves
    //Returns true if elligable messages to process were found, returns false otherwise
    updateAllScores: function () {
        let keys = Array.from(userMap.keys());
        keys.forEach(function (key, index) {
            if (key !== config.botid) {
                pay(key);
            }
        });
    },

    //------------------- DATA RETRIEVAL FUNCTIONS --------------------------
    //Returns a User's points
    points: function (id) {
        newUserCheck(id);
        return userMap.get(id).points;
    },
    //Returns a User's current score
    score: function (id) {
        newUserCheck(id);
        return userMap.get(id).score;
    },
    //Returns a User's previous score
    prevscore: function (id) {
        newUserCheck(id);
        return userMap.get(id).prevscore;
    },
    //Discards a User's prevScore value and replaces it with it's current score value
    //Used for displaying a user's score change since last payout
    shiftScore: function (id) {
        newUserCheck(id);
        let User = userMap.get(id);
        User.prevscore = User.score;
    },
    totalMessages: function (id) {
        newUserCheck(id);
        return userMap.get(id).totalMessages;
    },

    // ----------------- DATA FUNCTIONS ---------------------------
    //Removes a user from the usermap
    clearUser: function (id) {
        userMap.delete(id);
    },
    //Clears the entire usermap
    clearAll: function () {
        userMap.clear();
    },
    //Returns true if a user exists in the usermap, returns false otherwise
    userExists: function (id) {
        return userMap.has(id);
    },
    //Creates a string representation of a user's message queue
    messagesToString: function (id) {
        if (userMap.get(id) === undefined) {
            return null;
        }
        let userLog = userMap.get(id).messages;
        if (userLog === null || userLog.length === 0) {
            return null;
        }
        userLog.resetCursor();
        let output = "";
        while (userLog.next()) {
            output += userLog.current;
            output += "\n";
        }
        return output;
    },
    //Returns a collection of all userIDs in the bot's userMap
    getKeys: function () {
        return userMap.keys();
    },

    //----- SQL FUNCTIONS -----
    createUser: function (userID, points, score, totalMessages) {
        let newUser = new User(new LinkedList());
        newUser.points = points;
        newUser.prevscore = score;
        newUser.score = score;
        newUser.totalMessages = totalMessages;
        userMap.set(userID, newUser);
    }
};

//Checks if a user's id already exists in the user map. If not, it will initialize a new user
//and map the user's id to it
function newUserCheck(id) {
    if (!userMap.has(id)) {
        let messages = new LinkedList();
        let newUser = new User(messages);
        userMap.set(id, newUser);
        console.log("USERMAP: Created new user for " + id);
    }
}

//Processes the message queue associated with a user id
//Returns false if user has a null score, returns true otherwise
function pay(id) {
    //console.log("USERMAP: Analyzing message log " + id);
    newUserCheck(id);
    let User = userMap.get(id);
    let messagesProcessed = 0;
    let adjustment = 0;
    let totalMessages = User.messages.length;

    User.messages.resetCursor();
    while (User.messages.next()) {
        /*
        Calculates cumulative sentiment of all messages in message queue
        Because most sentenances may not be easily identified as positive or negative sentiment,
        we will automatically filter out statements with relatively low compound scores
        to preserve consistency
        */
        if (Math.abs(vader.SentimentIntensityAnalyzer.polarity_scores(User.messages.current).compound) >= config.sentimentThreshold) {
            adjustment += vader.SentimentIntensityAnalyzer.polarity_scores(User.messages.current).compound;
            messagesProcessed++;
        }
    }
    if (User.totalMessages + messagesProcessed === 0) {
        return false;
    } else {
        //Calculate dynamic points
        const balancedAdjustment = adjustment / messagesProcessed;
        if (config.dynamicPoints && balancedAdjustment > awardThreshold[0]) {
            for (let i = awardThreshold.length - 1; i >= 0; i--) {
                if (balancedAdjustment >= awardThreshold[i]) {
                    console.log("         + " + messagesProcessed * awardAmount[i] + " points");
                    User.points += messagesProcessed * awardAmount[i];
                    break;
                }
            }
        } else {
            console.log("         + " + messagesProcessed * config.defaultAwardAmount + " points");
            User.points += totalMessages * config.defaultAwardAmount;
        }

        //Update user statistics and clears the user's message queue
        User.score = ((User.score * User.totalMessages) + adjustment) / (User.totalMessages + messagesProcessed);
        User.score = Math.round(User.score * 1000) / 1000;
        User.messages = new LinkedList();
        User.totalMessages += messagesProcessed;
        return true;
    }
}