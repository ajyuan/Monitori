const discord = require("discord.js");
const config = require("./config.json");
const token = require("./token.json");
const userMap = require("./userMap");
const guildMap = require("./guildMap");

const bot = new discord.Client();
let logging = true;

bot.on("message", (message) => {
    //reject bot messages and other messages that are outside the scope of the bot's purpose
    if (message.author.bot) return;

    //command processing
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    commandCheck(message, command, args);
})

/*This is the main message handing function
It will handle incoming messages and run the appropriate function if a command is detected*/
function commandCheck(message, command, args) {
    switch (command) {
        //------------------- USERMAP FUNCTIONS -------------------
        //Calculate a user's score
        case "points":
        case "score":
            payout(message);
            break;
        case "refresh":
            userMap.updateAllScores();
            break;
        //Shows all messages mapped to the senders user id
        case "seelog":
            let output = userMap.messagesToString(message.author.id);
            if (output === null) {
                message.channel.send(new discord.RichEmbed()
                    .setColor(0x5eecff)
                    .setTitle("Command: seelog")
                    .setDescription("Your log is currently empty!"));
                break;
            } else {
                message.channel.send(new discord.RichEmbed()
                    .setColor(0x5eecff)
                    .setTitle("Command: seelog")
                    .setDescription(output));
            }
            break;
        //Clears a user's log if argument = user, clears everyone's log if "all" is given as argument
        case "clearlog":
            //Require scope argument if none is given
            if (args[0] == null) {
                message.channel.send(new discord.RichEmbed()
                    .setTitle("Clearlog error")
                    .setDescription("Proper usage: clearlog <scope>")
                    .setColor(0xff6860)
                );
            } else if (args[0] === "user" || args[0] === "me") {
                userMap.clearUser(message.author.id);
                message.channel.send(new discord.RichEmbed()
                    .setTitle("Command: clearlog")
                    .setDescription("Cleared " + message.author + "'s log!")
                    .setColor(0x5eecff)
                )
            } else if (args[0] === "all" || args[0] === "everyone") {
                userMap.clearAll();
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

        //------------------- lEADERBOARD FUNCTIONS -------------------
        case "leaderboard":
            if (args[0] == null || args[0] == "points") {
                message.channel.send(new discord.RichEmbed()
                    .setTitle("Points Leaderboard")
                    .setDescription(guildMap.leaderboard(message.guild, "points"))
                    .setColor(0x5eecff)
                );
            } else if (args[0] == "positivity" || args[0] == "score") {
                message.channel.send(new discord.RichEmbed()
                    .setTitle("Score Leaderboard")
                    .setDescription(guildMap.leaderboard(message.guild, "score"))
                    .setColor(0x5eecff)
                );
            } else {
                message.channel.send(new discord.RichEmbed()
                    .setTitle("Leaderboard error")
                    .setDescription("Error: please define a valid scope. Options: <points, positivity>")
                    .setColor(0xff6860)
                );
            }
            break;

        //------------------- BOT FUNCTIONS -------------------
        //Log all messages that aren't recognized commands
        default:
            //console.log(message);
            if (logging) {
                userMap.add(message)
                guildMap.setActive(message.guild.id);
                break;
            }

        //Show logging status
        case "status":
            let myInfo = new discord.RichEmbed()
                .setTitle("Bot Status");
            if (logging) {
                myInfo.setColor(0x47ff96);
                myInfo.setDescription("Logging is currently active");
            } else {
                myInfo.setColor(0xff6860);
                myInfo.setDescription("Logging is currently inactive")
            }
            message.channel.send(myInfo);
            break;
        //Enable logging
        case "activate":
            if (args[0] === "global" && message.author.id === config.admin) {
                logging = true;
            }
            message.channel.send(new discord.RichEmbed()
                .setColor(0x47ff96)
                .setTitle("Command: activate")
                .setDescription("Logging is now active!"));
            break;
        //Disable logging
        case "deactivate":
            if (args[0] === "global" && message.author.id === config.admin) {
                logging = false;
            }
            message.channel.send(new discord.RichEmbed()
                .setColor(0xff6860)
                .setTitle("Command: deactivate")
                .setDescription("Logging has been deactivated!"));
            break;
    }
}

//Runs updateUserScore and outputs the result, also runs checks on edge cases since 
//this function can be called in some edge cases
function payout(message) {
    let id = message.author.id;
    const prevScore = userMap.prevscore(id);

    if (!userMap.updateUserScore(id)) {
        message.channel.send(new discord.RichEmbed()
            .setColor(0x5eecff)
            .setTitle("Command: score")
            .addField("Points:", "0 pts")
            .addField("Sentiment rating:",
                "0 (increased by 0 from 0)"));
        return;
    } else {
        let currScore = userMap.score(id);
        message.channel.send(new discord.RichEmbed()
            .setColor(0x5eecff)
            .setTitle("Command: score")
            .addField("Points:", userMap.points(id) + " pts")
            .addField("Sentiment rating:",
                (Math.round(currScore * 1000) / 1000) + " (" + ((currScore >= prevScore) ? "increased " : "decreased ")
                + Math.abs(currScore - prevScore) + " from " + Math.round(prevScore * 1000) / 1000 + ")"));
        userMap.shiftScore(id);
    }
}

bot.on("guildMemberAdd", (member) => {
    guildMap.flag(member.guild.id);
})

bot.on("guildMemberRemove", (member) => {
    guildMap.flag(member.guild.id);
})

bot.on("ready", () => {
    bot.user.setStatus("availible")
    bot.user.setPresence({
        game: {
            name: 'the numbers game'
        }
    })

    //Alert user if bot has been misconfigured, exit
    if (config.awardThreshold.length !== config.awardAmount.length) {
        console.log("ERROR: Please make sure awardThreshold and awardAmount have the same number of elements");
        process.exit(1);
    }
    console.log("----- INITIALIZING GUILDMAP -----");
    guildMap.init(bot);
    //Creates a guild class for all guilds Monitori is currently servicing upon startup
    bot.guilds.tap(guild => {
        guildMap.add(guild.id);
    });
    console.log("----- GUILDMAP INTIALIZED -----");
    console.log(`Monitori is now online, serving ${bot.users.size} users, in ${bot.channels.size} channels of ${bot.guilds.size} guilds.`);
})

bot.on("disconnected", function () {
    // alert the console
    console.log("Discord connection lost");
    process.exit(1);
});

//Creates a guild class upon entering a server
bot.on("guildCreate", guild => {
    console.log("Joined a new guild: " + guild.name);
    guildMap.add(guild.id);
    if (guild.channels.exists("name", "general")) {
        guild.channels.find("name", "general").send(new discord.RichEmbed()
            .setColor(0x5eecff)
            .setTitle("Monitori")
            .setDescription(config.onJoinDescription));
    }
})

//Removes a server from guildMap after leaving the server
bot.on("guildDelete", guild => {
    console.log("Left a guild: " + guild.name);
    guildMap.remove(guild.id);
})

bot.login(token.token);