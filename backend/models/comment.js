// models/comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    },
    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    }
}, {
    timestamps: true
});

// Índices para rendimiento
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ boardId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);