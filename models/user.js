const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: String,
    lastName: String,
    email: String,
    password: String,
    validated: Boolean
});

module.exports = mongoose.model('user', userSchema);