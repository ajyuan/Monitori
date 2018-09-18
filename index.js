const discord = require("discord.js");
const bot = new discord.Client();
const vader = require("vader-sentiment");

const config = require("./config.json");
const LinkedList = require("linkedlist");
const userMap = new Map();
var logging = true;

//This is the User object that each user id maps to
function User(messageLog) {
    this.score = 0;
    this.totalMessages = 0;
    this.messages = messageLog;
}

bot.on("ready", () => {
    bot.user.setStatus("availible")
    bot.user.setPresence({
        game: {
            name: 'the numbers game'
        }
    })
    console.log(`SABOT is now online, serving ${bot.users.size} users, in ${bot.channels.size} channels of ${bot.guilds.size} guilds.`);
})

bot.on("message", (message) => {
    //reject bot messages and other messages that are outside the scope of the bot's purpose
    if (message.author.bot) return;
    if (message.content.indexOf(config.prefix) !== 0 && !logging) return;

    //command processing
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    commandCheck(message, command, args);
})

/*This is the main message handing function
It will handle incoming messages and run the appropriate function if a command is detected*/
function commandCheck(message, command, args) {
    switch (command) {
        //Calculate a user's score
        case "score":
            payout(message);
            break;

        //Log all messages that aren't recognized commands
        default:
            console.log(message);
            addMessage(message);
            break;

        //Show logging status
        case "status":
            var myInfo = new discord.RichEmbed()
                .setTitle("Bot Status")
            if (logging) {
                myInfo.setColor(0x47ff96)
                myInfo.setDescription("Logging is currently active");
            } else {
                myInfo.setColor(0xff6860)
                myInfo.setDescription("Logging is currently inactive")
            }
            message.channel.send(myInfo);
            break;
        //Enable logging
        case "activate":
            logging = true;
            message.channel.send(new discord.RichEmbed()
                .setColor(0x5eecff)
                .setTitle("Command: activate")
                .setDescription("Logging is now active!"));
            break;
        //Disable logging
        case "deactivate":
            logging = false;
            message.channel.send(new discord.RichEmbed()
                .setColor(0x5eecff)
                .setTitle("Command: deactivate")
                .setDescription("Logging has been deactivated!"));
            break;

        //Shows all messages mapped to the senders user id
        case "seelog":
            if (userMap.get(message.author.id) === undefined) {
                message.channel.send(new discord.RichEmbed()
                    .setColor(0x5eecff)
                    .setTitle("Command: seelog")
                    .setDescription("Your log is currently empty!"));
                break;
            }
            var userLog = userMap.get(message.author.id).messages;
            if (userLog === null || userLog.length === 0) {
                message.channel.send(new discord.RichEmbed()
                    .setColor(0x5eecff)
                    .setTitle("Command: seelog")
                    .setDescription("Your log is currently empty!"));
                break;
            }
            message.channel.send(" --- " + message.author + "'s Log ---");
            userLog.resetCursor();
            //console.log("Current length is: " + temp.length);
            while (userLog.next()) {
                message.channel.send(userLog.current);
            }
            break;
        //Clears a user's log if argument = user, clears everyone's log if "all" is given as argument
        case "clearlog":
            if (args[0] == "null") {
                message.channel.send(new discord.RichEmbed()
                    .setTitle("Clearlog error")
                    .setDescription("Proper usage: clearlog <scope>")
                    .setColor(0xff6860)
                );
            } else if (args[0] === "user" || args[0] === "me") {
                userMap.delete(message.author.id);
                message.channel.send(new discord.RichEmbed()
                    .setTitle("Command: clearlog")
                    .setDescription("Cleared " + message.author + "'s log!")
                    .setColor(0x5eecff)
                )
            } else if (args[0] === "all" || args[0] === "everyone") {
                userMap.clear();
                message.channel.send(new discord.RichEmbed()
                    .setTitle("Command: clearlog")
                    .setDescription("Log wiped!")
                    .setColor(0x5eecff)
                )
            } else {
                message.channel.send(new discord.RichEmbed()
                    .setTitle("Clearlog error")
                    .setDescription("Error: please define a valid scope. Options: <user, all>")
                    .setColor(0xff6860)
                );
            }
            break;
    }
}

//Runs updateScore and outputs the result, also runs checks on edge cases since 
//this function can be called in some edge cases
function payout(message) {
    newUserCheck(message.author.id);
    var User = userMap.get(message.author.id);
    const prevScore = User.score;
    User.messages.resetCursor();

    if (!updateScore(User)) {
        message.channel.send(new discord.RichEmbed()
            .setColor(0x5eecff)
            .setTitle("Command: score")
            .addField("Your score:", 0 + " (increased by 0 points from 0)"));
        return;
    } else {
        message.channel.send(new discord.RichEmbed()
            .setColor(0x5eecff)
            .setTitle("Command: score")
            .addField("Your score:",
                (Math.round(User.score * 1000) / 1000) + " (" + ((User.score >= prevScore) ? "increased " : "decreased ")
                + Math.abs(User.score - prevScore) + " points from " + Math.round(prevScore * 1000) / 1000 + ")"));
    }
}

/*
Calculates and updates the sentiment score of a user
Returns true if elligable messages to process were found, returns false otherwise
*/
function updateScore(User) {
    var messagesProcessed = 0;
    var adjustment = 0;

    User.messages.resetCursor();
    while (User.messages.next()) {
        console.log(User.messages.current);

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
        return false;
    } else {
        User.score = ((User.score * User.totalMessages) + adjustment) / (User.totalMessages + messagesProcessed);
        User.score = Math.round(User.score * 1000) / 1000;
        User.messages = new LinkedList();
        User.totalMessages += messagesProcessed;
        return true;
    }
}

/*
Adds a given message to its respective user's log
Performs checks: User exists, message is not empty, message does not begin with filtered prefix
*/
function addMessage(message) {
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
    const User = message.author.id;
    newUserCheck(User);  //If a user does not exist in usermap, create a new user
    userMap.get(User).messages.push(message.content);  //Inserts the message

    //
    if (config.autopay && userMap.get(User).messages.length >= config.autopayThreshold) {
        updateScore(userMap.get(User));
        console.log(message.author + " was automatically paid")
    }
}

//Checks if a user's id already exists in the user map. If not, it will initialize a new user
//and map the user's id to it
function newUserCheck(id) {
    if (!userMap.has(id)) {
        var messages = new LinkedList();
        var newUser = new User(messages);
        userMap.set(id, newUser);
    }
}

bot.login(config.token);