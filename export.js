const userMap = require("./userMap");
const sql = require("sqlite");
sql.open("./db/users.sqlite");

module.exports = {
    write: function (userID) {
        writeToSQL(userID);
    },

    backup: function () {
        backupToSQL();
    },

    importUser: function (userID) {
        importUser(userID);
    },

    importFile: function () {
        importFile();
    },

    shutdown: function () {
        shutdown();
    }
}

//Analyzes the message cache of a specific user and exports it to users.sqlite
function writeToSQL(userID) {
    //Message cache is not stored in the SQL database, so analyze it and update user class before writing to SQL
    userMap.updateUserScore(userID);
    return sql.get(`SELECT userID,points,score,totalMessages FROM users WHERE userID ="${userID}"`).then(row => {
        if (!row) {
            sql.run("INSERT INTO users (userID, points, score, totalMessages) VALUES (?, ?, ?, ?)", [userID, userMap.points(userID), userMap.score(userID), userMap.totalMessages(userID)]);
        } else {
            sql.run(`UPDATE users SET points = ${userMap.points(userID)}, score = ${userMap.score(userID)}, totalMessages = ${userMap.totalMessages(userID)} WHERE userID = ${userID}`);
        }
        console.log("SQL: User " + userID + " entered");
    }).catch(() => {
        console.error;
        sql.run("CREATE TABLE IF NOT EXISTS users (userID TEXT, points INTEGER, score INTEGER, totalMessages INTEGER)").then(() => {
            sql.run("INSERT INTO users (userID, points, score, totalMessages) VALUES (?, ?, ?, ?)", [userID, userMap.points(userID), userMap.score(userID), userMap.totalMessages(userID)]);
        });
    });
}

//Analyzes the message cache stored in userMap and exports the resulting users into users.sqlite
async function backupToSQL() {
    //Message cache is not stored in the SQL database, so analyze it and update user class before writing to SQL
    console.log("----- ANALYZING MESSAGE CACHE -----");
    userMap.updateAllScores();
    console.log("----- MESSAGE CACHE CLEARED, EXPORTING USERS -----");
    ids = userMap.getKeys();
    for (let userID of ids) {
        await writeToSQL(userID);
    }
    console.log("----- EXPORT COMPLETE -----");
}

//Imports a user with a given id from the SQL db if no user exists for that id, 
//or reverts the user to the database version if user already exists in userMap
function importUser(userID) {
    sql.get(`SELECT userID,points,score,totalMessages FROM users WHERE userID ="${userID}"`).then(row => {
        if (!row) {
            console.log("EXPORT.JS READUSER ERROR: readUser called on user not in database");
            return;
        }
        userMap.createUser(row.userID, row.points, row.score, row.totalMessages);
    });
}

//Initializes userMap data from users.sqlite
function importFile() {
    sql.all(`SELECT userID,points,score,totalMessages FROM users`).then(rows => {
        for (i = 0; i < rows.length; i++) {
            userMap.createUser(rows[i].userID, rows[i].points, rows[i].score, rows[i].totalMessages);
        }
    });
}

//Waits for backup to complete, and shuts down the bot
async function shutdown(user) {
    //Message cache is not stored in the SQL database, so analyze it and update user class before writing to SQL
    console.log("----- ANALYZING MESSAGE CACHE -----");
    userMap.updateAllScores();
    console.log("----- MESSAGE CACHE CLEARED, EXPORTING USERS -----");
    ids = userMap.getKeys();
    for (let userID of ids) {
        await writeToSQL(userID);
    }
    console.log("----- EXPORT COMPLETE -----");
    console.log("===== SHUTOFF COMPLETE =====");
    process.exit(0);
}