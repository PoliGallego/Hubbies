const Notification = require('../models/notification');

// Obtener notificaciones del usuario autenticado
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 5;

        // Filtrar solo notificaciones de los últimos 7 días
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const notifications = await Notification.find({
            userId,
            createdAt: { $gte: sevenDaysAgo } // Solo de los últimos 7 días
        })
            .populate('commentAuthorId', 'username fullName avatar')
            .populate('postId', 'title')
            .populate('boardId', 'title')
            .sort({ createdAt: -1 })
            .limit(limit);

        console.log(`📬 Notificaciones encontradas para usuario ${userId}:`, notifications.length);
        if (notifications.length > 0) {
            console.log('Primera notificación:', {
                author: notifications[0].commentAuthorId,
                post: notifications[0].postId,
                message: notifications[0].message
            });
        }

        res.status(200).json({
            success: true,
            notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Obtener contador de notificaciones no leídas
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await Notification.countDocuments({
            userId,
            read: false
        });

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Marcar una notificación como leída
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notificación no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Marcar todas las notificaciones como leídas
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            { userId, read: false },
            { read: true }
        );

        res.status(200).json({
            success: true,
            message: 'Todas las notificaciones marcadas como leídas'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// SOLO PARA DESARROLLO/TESTING - Eliminar todas las notificaciones
exports.deleteAllNotifications = async (req, res) => {
    try {
        const result = await Notification.deleteMany({});

        res.status(200).json({
            success: true,
            message: `Eliminadas ${result.deletedCount} notificaciones`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
