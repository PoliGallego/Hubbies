// Modificar handleNotificationClick para manejar redirección
window.handleNotificationClick = async function (notificationId, postId, boardId) {
    // Marcar como leída primero
    try {
        const token = localStorage.getItem('token');
        if (token) {
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        console.error('Error marking as read:', error);
    }

    // Cerrar modal
    const modal = document.getElementById('NotifModal');
    if (modal) modal.style.display = 'none';

    // Verificar si estamos en posts.html
    const isOnPostsPage = window.location.pathname.includes('posts.html');

    if (!isOnPostsPage) {
        // Si no estamos en posts.html, guardar el ID y redirigir
        if (postId) {
            sessionStorage.setItem('scrollToPost', postId);
            window.location.href = '/src/html/posts.html';
        } else if (boardId) {
            sessionStorage.setItem('scrollToBoard', boardId);
            window.location.href = '/src/html/posts.html';
        }
        return;
    }

    // Si ya estamos en posts.html, navegar directamente
    if (postId) {
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

    // Actualizar badge
    if (typeof updateNotificationBadge === 'function') {
        updateNotificationBadge();
    }
};
