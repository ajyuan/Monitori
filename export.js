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

    import: function () {
        readFile();
    },
}

function writeToSQL(userID) {
    sql.get(`SELECT * FROM users WHERE userId ="${userID}"`).then(row => {
        if (!row) {
            sql.run("INSERT INTO users (userId, points, score, totalMessages) VALUES (?, ?, ?, ?)", [userID, userMap.points(userID), userMap.score(userID), userMap.totalMessages(userID)]);
        } else {
            sql.run(`UPDATE users SET points = ${userMap.points(userID)}, score = ${userMap.score(userID)}, totalMessages = ${userMap.totalMessages(userID)} WHERE userId = ${userID}`);
        }
    }).catch(() => {
        console.error;
        sql.run("CREATE TABLE IF NOT EXISTS users (userId TEXT, points INTEGER, score INTEGER, totalMessages INTEGER)").then(() => {
            sql.run("INSERT INTO users (userId, points, score, totalMessages) VALUES (?, ?, ?, ?)", [userID, userMap.points(userID), userMap.score(userID), userMap.totalMessages(userID)]);
        });
    });
    console.log("SQL: User " + userID + " entered");
}

function backupToSQL() {
    console.log("----- BACKING UP USERS -----");
    ids = userMap.getKeys();
    for (let userID of ids) {
        writeToSQL(userID);
    }
    console.log("----- BACKUP COMPLETE -----");
}

/*
function readUser(userID) {
    sql.get(`SELECT * FROM users WHERE userId ="${userID}"`).then(row => {
        if (!row) {
            sql.run("INSERT INTO users (userId, points, score) VALUES (?, ?, ?)", [userID, userMap.points(userID), userMap.score(userID)]);
        } else {
            sql.run(`UPDATE users SET points = ${userMap.points(userID)}, score = ${userMap.score(userID)} WHERE userId = ${userID}`);
        }
    }).catch(() => {
        console.log("EXPORT.JS READUSER ERROR: readUser called on nonexistant userID");
        process.exit(1);
    });
    console.log("SQL: User " + userID + " imported");
}
*/
function readFile() {
    let db = new sql.Database('db/users.sqlite');

    let id = `SELECT DISTINCT userId userID FROM users`;

    db.all(id, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            console.log(row.userId);
        });
    });

    // close the database connection
    db.close();
}