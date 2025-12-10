// notifications.js - Manejo de notificaciones

let notificationUpdateInterval = null;

// Cargar notificaciones del usuario
async function loadNotifications() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar notificaciones');
        }

        const data = await response.json();
        console.log('Notifications data:', data); // Debug log
        if (data.success) {
            renderNotifications(data.notifications);
        }
    } catch (error) {
        console.error('Error cargando notificaciones:', error);
    }
}

// Renderizar notificaciones en el modal
function renderNotifications(notifications) {
    const notificationsContainer = document.querySelector('.Notifications');
    if (!notificationsContainer) return;

    if (!notifications || notifications.length === 0) {
        notificationsContainer.innerHTML = `
            <div class="NoNotifications" style="padding: 40px; text-align: center; color: #999;">
                <span class="material-icons" style="font-size: 48px; opacity: 0.5;">notifications_none</span>
                <p style="margin-top: 10px;">No notifications yet</p>
            </div>
        `;
        return;
    }

    const notificationsHTML = notifications.map(notification => {
        const isRead = notification.read;
        const authorName = notification.commentAuthorId?.fullName ||
            notification.commentAuthorId?.username ||
            'Someone';
        const postTitle = notification.postId?.title || notification.boardId?.title || 'your content';
        const timeAgo = getTimeAgo(notification.createdAt);

        return `
            <div class="Notification ${isRead ? 'read' : 'unread'}" data-notification-id="${notification._id}">
                <div class="NotificationContent">
                    <div class="NotificationHeader">
                        <span class="NotificationAuthor">${escapeHtml(authorName)}</span>
                        <span class="NotificationTime">${timeAgo}</span>
                    </div>
                    <p class="NotificationMessage">${escapeHtml(notification.message)}</p>
                    <p class="NotificationPost">on "${escapeHtml(truncateText(postTitle, 40))}"</p>
                </div>
                <button class="NotificationClose" onclick="markNotificationAsRead('${notification._id}')" title="Mark as read">
                    <span class="material-icons">close</span>
                </button>
            </div>
        `;
    }).join('');

    notificationsContainer.innerHTML = notificationsHTML;
}

// Marcar notificación como leída
async function markNotificationAsRead(notificationId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al marcar notificación como leída');
        }

        // Recargar notificaciones y actualizar badge
        await loadNotifications();
        await updateNotificationBadge();
    } catch (error) {
        console.error('Error marcando notificación como leída:', error);
    }
}

// Actualizar badge con contador de no leídas
async function updateNotificationBadge() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/notifications/unread-count', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener contador de notificaciones');
        }

        const data = await response.json();
        if (data.success) {
            const badge = document.getElementById('NotificationBadge');
            if (badge) {
                // Mostrar u ocultar el punto azul según haya notificaciones
                if (data.count > 0) {
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error actualizando badge de notificaciones:', error);
    }
}

// Funciones auxiliares
function escapeHtml(str = "") {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
}

function getTimeAgo(date) {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notificationDate.toLocaleDateString();
}

// Inicializar en DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    // Actualizar badge al cargar la página
    updateNotificationBadge();

    // Actualizar badge cada 30 segundos
    if (notificationUpdateInterval) {
        clearInterval(notificationUpdateInterval);
    }
    notificationUpdateInterval = setInterval(updateNotificationBadge, 30000);
});

// Limpiar intervalo al cerrar la página
window.addEventListener('beforeunload', function () {
    if (notificationUpdateInterval) {
        clearInterval(notificationUpdateInterval);
    }
});
