const mongoose = require('mongoose');

const wordSchema = mongoose.Schema({
    word: { type: String, required: true },
    level: { type: Number, required: true },
    readingTime: { type: Number, required: true },
    level: { type: String, required: true }
});

module.exports = mongoose.model('word', wordSchema);