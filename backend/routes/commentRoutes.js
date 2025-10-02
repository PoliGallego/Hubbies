const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/comments', authMiddleware, commentController.createComment);

router.get('/posts/:postId/comments', commentController.getCommentsByPost);

router.put('/comments/:commentId', authMiddleware, commentController.updateComment);

router.delete('/comments/:commentId', authMiddleware, commentController.deleteComment);

module.exports = router;