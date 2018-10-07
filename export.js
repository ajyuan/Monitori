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

function writeToSQL(userID) {
    //Message cache is not stored in the SQL database, so analyze it and update user class before writing to SQL
    userMap.updateUserScore(userID);
    return sql.get(`SELECT * FROM users WHERE userID ="${userID}"`).then(row => {
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


function importUser(userID) {
    sql.get(`SELECT ALL FROM users WHERE userID ="${userID}"`).then(row => {
        if (!row) {
            console.log("EXPORT.JS READUSER ERROR: readUser called on user not in database");
            return;
        }
        userMap.createUser(row.userID, row.points, row.score, row.totalMessages);
    });
}

async function importFile() {
    await sql.get(`SELECT * FROM users`).then(row => {
        userMap.createUser(row.userID, row.points, row.score, row.totalMessages);
    });
}

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