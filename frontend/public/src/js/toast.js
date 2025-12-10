// toast.js - Sistema de notificaciones toast

let toastCheckInterval = null;
let lastNotificationId = null;

// Inicializar el contenedor de toasts
function initToastContainer() {
    if (!document.querySelector('.ToastContainer')) {
        const container = document.createElement('div');
        container.className = 'ToastContainer';
        document.body.appendChild(container);
    }
}

// Mostrar toast notification
function showToast(notification) {
    initToastContainer();

    const container = document.querySelector('.ToastContainer');
    const toast = document.createElement('div');
    toast.className = 'Toast';
    toast.dataset.notificationId = notification._id;

    const authorName = notification.commentAuthorId?.fullName ||
        notification.commentAuthorId?.username ||
        'Someone';
    const postTitle = notification.postId?.title || notification.boardId?.title || 'your content';

    toast.innerHTML = `
        <div class="ToastIcon">
            <span class="material-icons">comment</span>
        </div>
        <div class="ToastContent">
            <div class="ToastTitle">${escapeHtml(authorName)} commented</div>
            <div class="ToastMessage">on "${escapeHtml(postTitle)}"</div>
        </div>
        <button class="ToastClose" onclick="closeToast(this)">
            <span class="material-icons">close</span>
        </button>
    `;

    // Click en el toast para ir al post y abrir comentarios
    toast.addEventListener('click', async (e) => {
        if (!e.target.closest('.ToastClose')) {
            const postId = notification.postId?._id;
            const boardId = notification.boardId?._id;

            if (postId) {
                // Ir a vista de posts
                const postsToggle = document.querySelector('input[name="feedView"][value="posts"]');
                if (postsToggle) postsToggle.checked = true;

                if (typeof loadUserPosts === 'function') {
                    await loadUserPosts();
                }

                setTimeout(() => {
                    const postElement = document.querySelector(`.Publication[data-post-id="${postId}"]`);
                    if (postElement) {
                        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => {
                            if (typeof toggleCommentBox === 'function') {
                                toggleCommentBox(postId);
                            }
                        }, 500);
                    }
                }, 300);
            } else if (boardId) {
                const boardsToggle = document.querySelector('input[name="feedView"][value="boards"]');
                if (boardsToggle) boardsToggle.checked = true;

                if (typeof loadUserBoards === 'function') {
                    await loadUserBoards();
                }

                setTimeout(() => {
                    const boardElement = document.querySelector(`.Publication[data-board-id="${boardId}"]`);
                    if (boardElement) {
                        boardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => {
                            if (typeof toggleBoardCommentBox === 'function') {
                                toggleBoardCommentBox(boardId);
                            }
                        }, 500);
                    }
                }, 300);
            }

            closeToast(toast.querySelector('.ToastClose'));
        }
    });

    container.appendChild(toast);

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        closeToast(toast.querySelector('.ToastClose'));
    }, 5000);
}

// Cerrar toast con animación
function closeToast(closeBtn) {
    const toast = closeBtn.closest('.Toast');
    if (toast) {
        toast.classList.add('fadeOut');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
}

// Verificar nuevas notificaciones periódicamente
async function checkForNewNotifications() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/notifications?limit=1', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.success && data.notifications.length > 0) {
            const latestNotification = data.notifications[0];

            // Si es una notificación nueva que no hemos mostrado
            if (latestNotification._id !== lastNotificationId && !latestNotification.read) {
                lastNotificationId = latestNotification._id;
                showToast(latestNotification);

                // Actualizar badge
                if (typeof updateNotificationBadge === 'function') {
                    updateNotificationBadge();
                }
            }
        }
    } catch (error) {
        console.error('Error checking for new notifications:', error);
    }
}

// Función auxiliar para escapar HTML
function escapeHtml(str = "") {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    initToastContainer();

    // Verificar nuevas notificaciones cada 10 segundos
    if (toastCheckInterval) {
        clearInterval(toastCheckInterval);
    }
    toastCheckInterval = setInterval(checkForNewNotifications, 10000);

    // Primera verificación inmediata
    checkForNewNotifications();
});

// Limpiar intervalo al cerrar la página
window.addEventListener('beforeunload', function () {
    if (toastCheckInterval) {
        clearInterval(toastCheckInterval);
    }
});
