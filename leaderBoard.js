const userMap = require("./userMap");

module.exports = {
    generate: function(ids) {
        ids.tap(user => console.log(user.id));
        
        let keys = Array.from(userMap.getKeys() );
        keys.forEach(function (key, index) {
            console.log(key);
            userMap.updateUserScore(key);
        });
    }
}