const mongoose = require("mongoose");

const BoardItemSchema = new mongoose.Schema({
    type: { type: String, enum: ["note", "image"], required: true },
    content: { type: String }, // text for notes or image path for images
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 120 },
    height: { type: Number, default: 90 },
    rotation: { type: Number, default: 0 },
    zIndex: { type: Number, default: 0 }
}, { _id: true });

const BoardSchema = new mongoose.Schema(
    {
        idUser: { type: String, required: true },
        title: { type: String, default: "Untitled board" },
        items: [BoardItemSchema],
        images: [String],
        categories: [String],
        privacy: { type: String, enum: ["public", "private"], default: "private" },
        active: { type: Boolean, default: true },
        shareToken: {
            type: String,
            unique: true,
            sparse: true,
        },
        isShared: {
            type: Boolean,
            default: false,
        },
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment",
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Board", BoardSchema);