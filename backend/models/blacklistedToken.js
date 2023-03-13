const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BlacklistedTokenSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
});

module.exports = BlacklistedToken = mongoose.model("blacklistedToken", BlacklistedTokenSchema);