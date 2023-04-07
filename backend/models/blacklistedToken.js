const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BlacklistedTokenSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
        // expires after 7 days
        expires: Date.now() + 60 * 60 * 24 * 7,
    },
});

module.exports = BlacklistedToken = mongoose.model("blacklistedToken", BlacklistedTokenSchema);