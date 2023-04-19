const mongoose = require("mongoose");

const BoardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    lists : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "List",
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

BoardSchema.pre("save", function (next) {
    const defaltLists = ["To Do", "In Progress", "In Review", "Done"];
    next();
});
module.exports = mongoose.model("Board", BoardSchema);