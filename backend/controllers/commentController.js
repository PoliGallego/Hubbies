const Comment = require('../models/comment');
const Notification = require('../models/notification');
const Post = require('../models/post');
const Board = require('../models/boards');

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

        // Crear notificación para el dueño del post (si no es el mismo usuario)
        const post = await Post.findById(postId);
        if (post && post.idUser !== userId) {
            const notification = new Notification({
                userId: post.idUser,
                type: 'comment_on_post',
                message: `${req.user.fullName || req.user.username} commented on your post`,
                postId: postId,
                commentId: newComment._id,
                commentAuthorId: userId
            });
            await notification.save();
        }

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

        // Crear notificación para el dueño del board (si no es el mismo usuario)
        const board = await Board.findById(boardId);
        if (board && board.idUser !== userId) {
            const notification = new Notification({
                userId: board.idUser,
                type: 'comment_on_board',
                message: `${req.user.fullName || req.user.username} commented on your board`,
                boardId: boardId,
                commentId: newComment._id,
                commentAuthorId: userId
            });
            await notification.save();
        }

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