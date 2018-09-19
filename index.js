const discord = require("discord.js");
const config = require("./config.json");
const userMap = require("./userMap.js");

const bot = new discord.Client();
var logging = true;

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
            //console.log(message);
            userMap.add(message)
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
            var output = userMap.toString(message.author.id);
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
    var id = message.author.id;
    const prevScore = userMap.score(id);

    if (!userMap.updateScore(id)) {
        message.channel.send(new discord.RichEmbed()
            .setColor(0x5eecff)
            .setTitle("Command: score")
            .addField("Your score:", 0 + " (increased by 0 points from 0)"));
        return;
    } else {
        var currScore = userMap.score(id);
        message.channel.send(new discord.RichEmbed()
            .setColor(0x5eecff)
            .setTitle("Command: score")
            .addField("Your score:",
                (Math.round(currScore * 1000) / 1000) + " (" + ((currScore >= prevScore) ? "increased " : "decreased ")
                + Math.abs(currScore - prevScore) + " points from " + Math.round(prevScore * 1000) / 1000 + ")"));
    }
}

bot.login(config.token);