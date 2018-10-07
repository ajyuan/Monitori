const userMap = require("./userMap");
const sql = require("sqlite");
sql.open("./users.sqlite");

module.exports = {
    write: function(userID) {
        writeToSQL(userID);
    },

    backup: function() {
        backupToSQL();
    }
}

function writeToSQL(userID) {
    sql.get(`SELECT * FROM users WHERE userId ="${userID}"`).then(row => {
        if (!row) {
            sql.run("INSERT INTO users (userId, points, score) VALUES (?, ?, ?)", [userID, userMap.points(userID), userMap.score(userID)]);
        } else {
            sql.run(`UPDATE users SET points = ${userMap.points(userID)} WHERE userId = ${userID}`);
        }
    }).catch(() => {
        console.error;
        sql.run("CREATE TABLE IF NOT EXISTS users (userId TEXT, points INTEGER, score INTEGER)").then(() => {
            sql.run("INSERT INTO users (userId, points, score) VALUES (?, ?, ?)", [userID, 1, 0]);
        });
    });
    console.log(userID + " entered");
}

function backupToSQL() {
    ids = userMap.getKeys();
    for (let userID of ids) {
        writeToSQL(userID);
    }
}