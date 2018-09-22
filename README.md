# About
Hello, my name is Monitori! <br />
I'm a sentiment analysis bot built for a social/messaging platform called Discord. My purpose is to increase
user engagement while encouraging positivity and rewarding server members for saying nice things :D

# Features
* Message caching system for adaptive score calculation and more accurate sentiment analysis
* Automatic garbage collection for inactive users to reduce memory usage
* Dynamic credit system that rewards users based on the sentiment rating of their messages
* Leaderboard system to remind members who the most positive users in the server are :p

# How I work 
To determine the sentiment of users, I generate a log of all messages written a server and map them to their 
respective users. This can be switched on and off using the $activate and $deactivate commands, respectively. 

When prompted, I determine a user's positivity using the VADER sentiment analysis library, which is a 
"lexicon and rule-based sentiment analysis tool specifically attuned to sentiments expressed in social media."
You can read more about VADER [here](http://comp.social.gatech.edu/papers/icwsm14.vader.hutto.pdf).
This tool generates the total positive, neutral, and negative sentiment expressed by a given message, which
I use to determine a user's overall impact on a server. You can read more about my internal structure in the files
section.

#Files
**Index.js:** The main file for the discord bot. It handles the bots interaction with Discord, such as login, message handling, and disconnection. <br />
**userMap.js** The main file acts as the main database for storing information about each discord user. It maps the ID of every discord user to a user 
class, which stores information such as current score, total messages, and queued messages to be processed. Information stored in here is global, meaning
user statistics will be preserved across guilds. <br />
**leaderBoard.js** This file contains the ranking system for each guild Monitori serves. It maps the guild id of each server to an array of user IDs,
which are sorted from highest score to lowest using Merge Sort. Leaderboard is required to be a seperate data structure because, unlike userMap (which is
a global database), leaderBoard must be server specific, (i.e., a user can be 1st place in one server but 5th place in another). <br />
**config.json** This file contains variables that allow you to configure the bot easily. You can read more about each variable in the configuration section. <br />


# Configuration
**token:** This is Monitori's login token. <br />
**botid:** This is the Monitori's user id. It's used for ignoring bot messages in userMap. <br />
**prefix:** Sets the character that commands must be preceded by in ordered to be recognized as a command by Monitori. <br />
**filters:** Any messages with these prefixes will be ignored. This is useful for ignoring bot commands, etc. <br />
**dynamicPoints** Enables or disables Monitori's seniment based point system, which rewards points dynamically based on
the determined sentiment of a user's messages. Disable to have points rewarded purely on a message volume basis. (1pt awarded for every message sent). <br />
**awardThreshold** Used for Dynamic Points. Monitori will calculate the cumulative sentiment of queued messages and compare it to each award threshold to determine how many points to award per message. Each threshold is a lower bound. *Note: This value must be given specified in sorted order, from least to greatest. This array must be the same size as awardAmount*<br />
**awardAmount** Used for Dynamic Points. If a given user's message queue is lower bounded by a given award threshold, Monitori will use the index of that threshold to map to this array. *Note: This array must be the same size as awardThreshold*
**autopayThreshold:** Monitori will automatically process all messages in a user's log after it reaches this number of messages. Higher threshold
is recommended for more accurate seniment analysis. Lower threshold is recommended if you want to reduce memory usage.
Set to 0 to disable (score must be manually calculated using $score or $refresh). <br />
**sortThreshold** This number defines the guild size at which Monitori will switch from Insertion Sort to Merge Sort for generating leaderboard. <br />