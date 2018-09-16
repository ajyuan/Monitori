About ------------------------------------------------------------------------------------------------------
Hello, my name is SABot!
I'm a discord bot that encourages positivity by rewarding server members for saying nice things :D

Features ---------------------------------------------------------------------------------------------------
- Credit system for members who say positive things in any given server
- Leaderboard for most positive people in a given server

How I work -------------------------------------------------------------------------------------------------
To determine the sentiment of users, I generate a log of all messages written a server. This can be switched
on and off using the $activate and $deactivate commands, respectively. 

I determine the positivity of someone's message using the VADER sentiment analysis library, which is a 
"lexicon and rule-based sentiment analysis tool specifically attuned to sentiments expressed in social media."

TODO:
Credit system
Filters
Create user class