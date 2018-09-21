# About
Hello, my name is Monitori!
I'm a sentiment analysis bot built for a social/messaging platform called Discord. My purpose is to increase
user engagement while encouraging positivity and reward server members for saying nice things :D

# Features
* Message caching system for logging and adaptive score calculation
* Credit system for rewarding users who consistently express positive sentiment
* Leaderboard system for most positive users in a given server

# Configuration
**prefix:** Sets the character that commands must be preceded by. Ex:($status, prefix = $, command = status) <br />
**filters:** Bot will ignore any messages with these prefixes. This is useful for ignoring bot commands, etc. <br />
**autopayThreshold:** Bot will automatically process all messages in a user's log after it reaches this number of messages.
Set to 0 to disable. Users will instead have their scores updated when the $score function is run. <br />

# How I work 
To determine the sentiment of users, I generate a log of all messages written a server and map them to their 
respective users. This can be switched on and off using the $activate and $deactivate commands, respectively. 

When prompted, I determine a user's positivity using the VADER sentiment analysis library, which is a 
"lexicon and rule-based sentiment analysis tool specifically attuned to sentiments expressed in social media."
You can read more about VADER [here](http://comp.social.gatech.edu/papers/icwsm14.vader.hutto.pdf).
This tool generates the total positive, neutral, and negative sentiment expressed by a given message, which
I use to determine a user's overall impact on a server.