# About
Hello, my name is Monitori! <br />
I'm a sentiment analysis bot built for a social/messaging platform called Discord. My purpose is to increase user engagement while encouraging positivity and rewarding server members for saying nice things :D. I am currently hosted on a Raspberry Pi B+, althought I also have the built in functionality to run on Glitch.io. To support hosting on Raspberry Pi, I use VADER to perform efficient sentiment analysis.

# Features
* Message caching system for adaptive score calculation and more accurate sentiment analysis
* Automatic garbage collection for inactive users to reduce memory usage
* Dynamic credit system that rewards users based on the sentiment rating of their messages
* Detailed leaderboard system (to remind members who the most positive users in the server are :p)
* Dynamic message queue processing that analyze messages once the bot detects a conversation has ended
* Built-in SQLite importing and exporting for easy backup and modification

# How I work 
To determine the sentiment of users, I internally cache all messages written a server and map them to their respective users. Massage caching is used to improve my sentiment analysis accuracy, since analyzing a series of messages in a single conversation at once will allow me to better determine a user's overall sentiment in a conversation, as opposed to analysis on a per message basis. Automatic message caching can be switched on and off using the $activate and $deactivate commands, respectively. If you would like me to run without automatic caching, you can set set autopayThreshold to 1 in config.json. While I store the majority of my database internally for fastest response time, I can also automatically back up to an SQL database and import/export my database in SQL in order to preserve data when the bot goes offline. You can read more about my settings in the configuration section.

When prompted or when I detect a conversation has ended, I determine a user's positivity using the VADER sentiment analysis library, which is a "lexicon and rule-based sentiment analysis tool specifically attuned to sentiments expressed in social media." You can read more about VADER [here](http://comp.social.gatech.edu/papers/icwsm14.vader.hutto.pdf). This tool generates the total positive, neutral, and negative sentiment expressed by a given message, which I use to determine a user's overall impact on a server. You can read more about my internal structure in the files section.

# Files
**index.js:** The main file for the discord bot. It handles the bots interaction with Discord, such as login, message handling, and disconnection. <br />

**userMap.js** This file acts as the main database for storing information about each discord user. Information stored in here is global, meaning user statistics will be preserved across guilds. It does the following operations: <br />
* Maps the ID of every Discord user to a User class, which stores important user information such as score history, points, and total messages. <br />
* Stores the bot's message cache, since messages must be mapped to each user. <br /> 
* Performs operations on users, such as analyzing message cache, calculating points and sentiment, and returning values. <br />
<a/>

**guildMap.js** This file contains the ranking system for each guild Monitori serves. Leaderboard is required to be a seperate data structure because, unlike userMap (which is a global database), leaderBoard must be server specific, (i.e., a user can be 1st place in one server but 5th place in another). It performs the following operations. <br />
* Creates update calls to userMap for memebers of a guild.<br />
* Sorts members of a guild by a given type, (ex. score or points). <br />
* Stores the bot's Guild classes, which cache generated leaderboards for more efficient sorting. If a new leaderboard is requested for a guild where a previous one had been generated, it may feed a previously sorted array to generate the leaderboard more efficiently, based on certain conditions. <br /> 
<a/>

**export.js:** This file is responsible for handling the SQL database. It handles importing and exporting users to/from users.sqlite and userMap.js. It is also responsible for automatically backing up userMap and data storage on shutdown.<br />

**config.json** This file contains variables that allow you to configure the bot easily. You can read more about each variable in the configuration section. <br />

# Configuration
In order for Monitori to function, it must be provided a bot token. Create a .env file with token="token". Config file options:<br />

* **botid:** This is the Monitori's user id. It's used for ignoring bot messages. <br />
* **admin:** This is the user id of the bot admin. Monitori will only accept certain commands if the sender's user ID matches this.
* **prefix:** Sets the character that commands must be preceded by in ordered to be recognized as a command by Monitori. <br />
* **filters:** Any messages with these prefixes will be ignored. This is useful for ignoring bot commands, etc. <br />
* **dynamicPoints:** Enables or disables Monitori's seniment based point system, which rewards points dynamically based on the determined sentiment of a user's messages. Disable to have points rewarded purely on a message volume basis. (1pt awarded for every message sent). <br />
* **awardThreshold:** Used for Dynamic Points. Monitori will calculate the cumulative sentiment of queued messages and compare it to each award threshold to determine how many points to award per message. Each threshold is a lower bound. *Note: This value must be given specified in sorted order, from least to greatest. This array must be the same size as awardAmount*<br />
* **awardAmount:** Used for Dynamic Points. If a given user's message queue is lower bounded by a given award threshold, Monitori will use the index of that threshold to map to this array. *Note: This array must be the same size as awardThreshold* <br />
* **autopayOnInactivityTime:** Amount of time in seconds that Monitori will wait before declaring a conversation as over before analyzing cache for participants. Set to 0 to disable. <br />
* **autopayThreshold:** Monitori will automatically process all messages in a user's log after it reaches this number of messages. Higher threshold is recommended for more accurate seniment analysis. Lower threshold is recommended if you want to reduce memory usage. Set to 0 to disable (score must be manually calculated using $score or $refresh). <br />
* **autobackupTime:** Monitori will analyze the message cache and write user data to its SQL database every x minutes.
* **sortThreshold:** This number defines the guild size at which Monitori will switch from Insertion Sort to Merge Sort for generating leaderboard. <br />
* **onJoinDescription:** This is the message that is sent when Monitori joins a guild

# Notes
* While Monitori is capable of analyzing text emoticons, it is not able to analyze emojis. Because of this, it is recommended to disable automatic emoticon to emoji conversion (located in Settings > Text & Images) for best results.

# Support
[Discord Server](https://discord.gg/s45pCZC)
