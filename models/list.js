const mongoose = require("mongoose");

const ListSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Board",
        required: true,
    },
    cards : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Card",
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("List", ListSchema);