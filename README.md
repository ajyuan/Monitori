# About
Hello, my name is SABot!
I'm a bot created for a social/messaging platform called Discord. My purpose is to encourage positivity
and reward server members for saying nice things :D

# Features
* Credit system for rewarding users who consistently express positive sentiment
* Leaderboard system for most positive users in a given server

# How I work 
To determine the sentiment of users, I generate a log of all messages written a server and map them to their 
respective users. This can be switched on and off using the $activate and $deactivate commands, respectively. 

When prompted, I determine a user's positivity using the VADER sentiment analysis library, which is a 
"lexicon and rule-based sentiment analysis tool specifically attuned to sentiments expressed in social media."
You can read more about VADER [here](http://comp.social.gatech.edu/papers/icwsm14.vader.hutto.pdf).
This tool generates the total positive, neutral, and negative sentiment expressed by a given message, which
I use to determine a user's overall impact on a server.