// notification-redirect.js - Manejar redirección desde otras páginas

// Al cargar posts.html, verificar si hay navegación pendiente
document.addEventListener('DOMContentLoaded', function () {
    const scrollToPost = sessionStorage.getItem('scrollToPost');
    const scrollToBoard = sessionStorage.getItem('scrollToBoard');

    if (scrollToPost) {
        sessionStorage.removeItem('scrollToPost');

        // Cambiar a vista de posts
        const postsToggle = document.querySelector('input[name="feedView"][value="posts"]');
        if (postsToggle) postsToggle.checked = true;

        // Esperar a que los posts se carguen
        setTimeout(async () => {
            if (typeof loadUserPosts === 'function') {
                await loadUserPosts();
            }

            setTimeout(() => {
                const postElement = document.querySelector(`.Publication[data-post-id="${scrollToPost}"]`);
                if (postElement) {
                    postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        if (typeof toggleCommentBox === 'function') {
                            toggleCommentBox(scrollToPost);
                        }
                    }, 500);
                }
            }, 500);
        }, 500);
    } else if (scrollToBoard) {
        sessionStorage.removeItem('scrollToBoard');

        // Cambiar a vista de boards
        const boardsToggle = document.querySelector('input[name="feedView"][value="boards"]');
        if (boardsToggle) boardsToggle.checked = true;

        setTimeout(async () => {
            if (typeof loadUserBoards === 'function') {
                await loadUserBoards();
            }

            setTimeout(() => {
                const boardElement = document.querySelector(`.Publication[data-board-id="${scrollToBoard}"]`);
                if (boardElement) {
                    boardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        if (typeof toggleBoardCommentBox === 'function') {
                            toggleBoardCommentBox(scrollToBoard);
                        }
                    }, 500);
                }
            }, 500);
        }, 500);
    }
});
