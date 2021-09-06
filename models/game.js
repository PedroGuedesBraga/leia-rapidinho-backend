const mongoose = require('mongoose');

const gameSchema = mongoose.Schema({
    participantEmail: { type: String, required: true },
    wordsRead: { type: Array, required: true },
    difficulty: { type: Number, required: true },
    date: { type: Date, required: true, default: new Date() }
});

module.exports = mongoose.model('game', gameSchema);