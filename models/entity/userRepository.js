var database = require("../common/database"),
    mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var UserModel = mongoose.model('User', new Schema({
    id: Number,
    name: String,
    email: String
}));

module.exports = {
    findUserById: function(id, callback) {
        database.connect(function() {
            UserModel.find({'id': id}, function(err, user) {
                database.close();
                callback(user);
            });
        });
    },
    findUserByEmail: function(email, callback) {
        database.connect(function() {
            UserModel.find({'email': email}, function(err, user) {
                database.close();
                callback(user);
            });
        });
    }
};