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
        description: { type: String, default: "" },
        items: [BoardItemSchema],
        images: [String], // paths saved by multer
        categories: [String],
        privacy: { type: String, enum: ["public", "private"], default: "private" },
        active: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Board", BoardSchema);