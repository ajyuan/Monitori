const userMap = require("./userMap");
const config = require("./config.json")

module.exports = {
    generate: function (ids) {
        ids.tap(user => {
            if (user.id !== config.botid) {
                console.log(user.id);
                userMap.updateUserScore(user.id);
            }
        });
    }
}