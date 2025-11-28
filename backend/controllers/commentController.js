const Comment = require('../models/comment');

exports.createComment = async (req, res) => {
    try {
        const { postId, content } = req.body;
        const userId = req.user.id;

        const newComment = new Comment({
            postId,
            userId,
            content
        });

        await newComment.save();

        await newComment.populate('userId', 'username fullName email avatar');

        res.status(201).json({
            success: true,
            comment: newComment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getCommentsByPost = async (req, res) => {
    try {
        const { postId } = req.params;

        const comments = await Comment.find({ postId })
            .populate('userId', 'username fullName email avatar') // Trae datos del usuario
            .sort({ createdAt: -1 }); // Más recientes primero

        res.status(200).json({
            success: true,
            count: comments.length,
            comments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const comment = await Comment.findOne({ _id: commentId, userId });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado o no tienes permiso'
            });
        }

        comment.content = content;
        await comment.save();

        res.status(200).json({
            success: true,
            comment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findOneAndDelete({
            _id: commentId,
            userId
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado o no tienes permiso'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Comentario eliminado'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.createCommentForBoard = async (req, res) => {
    try {
        const { boardId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const newComment = new Comment({
            boardId,
            userId,
            content
        });

        await newComment.save();
        await newComment.populate('userId', 'username fullName email avatar');

        res.status(201).json({
            success: true,
            comment: newComment
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getCommentsByBoard = async (req, res) => {
    try {
        const { boardId } = req.params;

        const comments = await Comment.find({ boardId })
            .populate('userId', 'username fullName email avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: comments.length,
            comments
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};