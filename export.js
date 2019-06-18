const userMap = require("./userMap");
const config = require("./config/config.json");
const sql = require("sqlite");

try {
    process.chdir(config.dbStoreDirectory);
} catch (err) {
    console.log('Directory not available')
}

sql.open("./users.sqlite");

module.exports = {
    startAutobackup: function () {
        setTimeout(function run() {
            console.log("RUNNING AUTOBACKUP...");
            writeAllToSQL();
            setTimeout(run, config.autobackupTime * 60000);
        }, config.autobackupTime * 60000);
    },

    write: function (userID) {
        writeUserToSQL(userID);
    },

    backup: function () {
        writeAllToSQL();
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
function writeUserToSQL(userID) {
    //Message cache is not stored in the SQL database, so analyze it and update user class before writing to SQL
    userMap.updateUserScore(userID);
    return sql.get(`SELECT userID,points,score,totalMessages FROM users WHERE userID ="${userID}"`).then(row => {
        if (!row) {
            sql.run("INSERT INTO users (userID, points, score, totalMessages) VALUES (?, ?, ?, ?)", [userID, userMap.points(userID), userMap.score(userID), userMap.totalMessages(userID)]);
        } else {
            sql.run(`UPDATE users SET points = ${userMap.points(userID)}, score = ${userMap.score(userID)}, totalMessages = ${userMap.totalMessages(userID)} WHERE userID = ${userID}`);
        }
        //console.log("SQL: User " + userID + " entered");
    }).catch(() => {
        console.error;
        sql.run("CREATE TABLE IF NOT EXISTS users (userID TEXT, points INTEGER, score INTEGER, totalMessages INTEGER)").then(() => {
            sql.run("INSERT INTO users (userID, points, score, totalMessages) VALUES (?, ?, ?, ?)", [userID, userMap.points(userID), userMap.score(userID), userMap.totalMessages(userID)]);
        });
    });
}

//Analyzes the message cache stored in userMap and exports the resulting users into users.sqlite
async function writeAllToSQL() {
    //Message cache is not stored in the SQL database, so analyze it and update user class before writing to SQL
    /*
    console.log("----- ANALYZING MESSAGE CACHE -----");
    userMap.updateAllScores();
    */
    console.log("----- EXPORTING USERS -----");
    ids = userMap.getKeys();
    let promises = [];
    for (let userID of ids) {
        promises.push(writeUserToSQL(userID));
    }
    Promise.all(promises)
        .then(() => {
            console.log("----- EXPORT COMPLETE -----");
        })
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
        console.log("SQL: Imported user " + row.userID);
    }).catch(() => {
        console.error;
        sql.run("CREATE TABLE IF NOT EXISTS users (userID TEXT, points INTEGER, score INTEGER, totalMessages INTEGER)").then(() => {
            sql.run("INSERT INTO users (userID, points, score, totalMessages) VALUES (?, ?, ?, ?)", [userID, userMap.points(userID), userMap.score(userID), userMap.totalMessages(userID)]);
        });
    });
}

//Initializes userMap data from users.sqlite
function importFile() {
    sql.all(`SELECT userID,points,score,totalMessages FROM users`).then(rows => {
        for (i = 0; i < rows.length; i++) {
            userMap.createUser(rows[i].userID, rows[i].points, rows[i].score, rows[i].totalMessages);
        }
    }).catch(() => {
        console.error;
        sql.run("CREATE TABLE IF NOT EXISTS users (userID TEXT, points INTEGER, score INTEGER, totalMessages INTEGER)").then(() => {
            sql.run("INSERT INTO users (userID, points, score, totalMessages) VALUES (?, ?, ?, ?)", [userID, userMap.points(userID), userMap.score(userID), userMap.totalMessages(userID)]);
        });
    });
}

//Waits for backup to complete, and shuts down the bot
async function shutdown() {
    //Message cache is not stored in the SQL database, so analyze it and update user class before writing to SQL
    console.log("----- EXPORTING USERS -----");
    ids = userMap.getKeys();
    let promises = [];
    for (let userID of ids) {
        promises.push(writeUserToSQL(userID));
    }
    Promise.all(promises)
        .then(() => {
            console.log("----- EXPORT COMPLETE -----");
            setTimeout(() => {
                console.log("===== SHUTOFF COMPLETE =====");
                process.exit(0);
            }, 2000);
        })
}