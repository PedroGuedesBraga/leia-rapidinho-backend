const mongoose = require('mongoose');

const tokenSchema = mongoose.Schema({
    value: { type: String, required: true },
    email: { type: String, required: true },
    createdAt: { type: Date, required: true }
});

module.exports = {
    accountValidationTokenModel: mongoose.model('accountValidationToken', tokenSchema),
    resetPasswordTokenModel: mongoose.model('emailVerificationToken', tokenSchema)
};