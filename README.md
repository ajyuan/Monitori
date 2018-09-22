# About
Hello, my name is Monitori! <br />
<br />
I'm a sentiment analysis bot built for a social/messaging platform called Discord. My purpose is to increase
user engagement while encouraging positivity and rewarding server members for saying nice things :D

# Features
* Message caching system for logging and adaptive score calculation
* Credit system for rewarding users who consistently express positive sentiment
* Leaderboard system to remind members who the most positive users in the server are :p

# Configuration
**token:** This is Monitori's login token <br />
**botid:** This is the Monitori's user id. It's used for ignoring bot messages in userMap.
**prefix:** Sets the character that commands must be preceded by in ordered to be recognized as a command by Monitori <br />
**filters:** Any messages with these prefixes will be ignored. This is useful for ignoring bot commands, etc. <br />
**autopayThreshold:** Monitori will automatically process all messages in a user's log after it reaches this number of messages.
Set to 0 to disable (score must be manually calculated using $score or $refresh) <br />

# How I work 
To determine the sentiment of users, I generate a log of all messages written a server and map them to their 
respective users. This can be switched on and off using the $activate and $deactivate commands, respectively. 

When prompted, I determine a user's positivity using the VADER sentiment analysis library, which is a 
"lexicon and rule-based sentiment analysis tool specifically attuned to sentiments expressed in social media."
You can read more about VADER [here](http://comp.social.gatech.edu/papers/icwsm14.vader.hutto.pdf).
This tool generates the total positive, neutral, and negative sentiment expressed by a given message, which
I use to determine a user's overall impact on a server.