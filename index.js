const discord = require("discord.js");
const bot = new discord.Client();
const vader = require("vader-sentiment");

const config = require("./config.json");
const LinkedList = require("linkedlist");
const userMap = new Map();
var logging = true;

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

function commandCheck(message, command, args) {
    switch (command) {
        //Calculate a user's score
        case "score":
            payout(message);
            break;

        //Log all messages that aren't recognized commands
        default:
            addMessage(message);
            break;

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
        case "activate":
            logging = true;
            message.channel.send(new discord.RichEmbed()
                .setColor(0x5eecff)
                .setTitle("Command: activate")
                .setDescription("Logging is now active!"));
            break;
        case "deactivate":
            logging = false;
            message.channel.send(new discord.RichEmbed()
                .setColor(0x5eecff)
                .setTitle("Command: deactivate")
                .setDescription("Logging has been deactivated!"));
            break;

        //DEBUG COMMANDS
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

function payout(message) {
    newUserCheck(message);
    var User = userMap.get(message.author.id);
    var messagesProcessed = 0;
    var adjustment = 0;
    const prevScore = User.score;
    User.messages.resetCursor();
    while (User.messages.next()) {
        console.log(User.messages.current);

        /*
        Because most sentenances may not be easily identified as positive or negative sentiment,
        this bot will automatically filter out statements with relatively low compound scores
        to preserve consistency
        */
        if (Math.abs(vader.SentimentIntensityAnalyzer.polarity_scores(User.messages.current).compound) >= 0.5) {
            adjustment += vader.SentimentIntensityAnalyzer.polarity_scores(User.messages.current).compound;
            messagesProcessed++;
        }
    }
    if (User.totalMessages + messagesProcessed === 0) {
        message.channel.send(new discord.RichEmbed()
            .setColor(0x5eecff)
            .setTitle("Command: payout")
            .addField("Your score:", 0 + " (increased by 0 points from 0)"));
        return;
    } else {
        User.score = ((User.score * User.totalMessages) + adjustment) / (User.totalMessages + messagesProcessed);
        User.score = Math.round(User.score * 1000) / 1000;
    }

    User.messages = new LinkedList();
    User.totalMessages += messagesProcessed;

    message.channel.send(new discord.RichEmbed()
        .setColor(0x5eecff)
        .setTitle("Command: payout")
        .addField("Your score:",
            (Math.round(User.score * 1000) / 1000) + " (" + ((User.score >= prevScore) ? "increased " : "decreased ")
            + Math.abs(User.score - prevScore) + " points from " + Math.round(prevScore * 1000) / 1000 + ")"));
}

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
    //If a user does not exist in usermap, create a new user and place the first message in it
    newUserCheck(message);
    userMap.get(message.author.id).messages.push(message.content);
}

function newUserCheck(message) {
    if (!userMap.has(message.author.id)) {
        var messages = new LinkedList();
        var newUser = new User(messages);
        userMap.set(message.author.id, newUser);
    }
}

bot.login(config.token);