const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Obtener notificaciones del usuario
router.get('/', authMiddleware, notificationController.getUserNotifications);

// Obtener contador de no leídas (debe estar antes de /:id/read)
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);

// Marcar todas como leídas
router.put('/mark-all-read', authMiddleware, notificationController.markAllAsRead);

// Marcar una notificación como leída
router.put('/:id/read', authMiddleware, notificationController.markAsRead);

// SOLO PARA DESARROLLO - Eliminar todas las notificaciones
router.delete('/delete-all', authMiddleware, notificationController.deleteAllNotifications);

module.exports = router;
