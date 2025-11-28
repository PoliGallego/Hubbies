let currentPost = null;
let currentUserId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("SharedPostContainer");

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const shareToken = urlParams.get("token");
  const type = urlParams.get("type") || "post"; // por default post

  if (!shareToken) {
    showError("Invalid link");
    return;
  }

  // Check if user is logged in
  const userToken = localStorage.getItem("token");
  const isLoggedIn = !!userToken;

  if (isLoggedIn) {
    try {
      const payload = JSON.parse(atob(userToken.split(".")[1]));
      currentUserId = payload.id;
    } catch (e) {
      console.error("Error parsing token:", e);
    }
  }

  let data;

  try {
    if (type === "post") {
      const response = await fetch(`/api/posts/shared/${shareToken}`);
      data = await response.json();
      if (data.success) {
        currentPost = data.post;
        renderPost(data.post, isLoggedIn);

        if (isLoggedIn) {
          await loadComments(data.post._id);
          setupCommentListeners(data.post._id);
        }
      }
      else showError(data.message || "Post not available");
    } else if (type === "board") {
      const response = await fetch(`/api/boards/shared/${shareToken}`);
      data = await response.json();
      if (data.success) renderBoardShared(data.board, isLoggedIn);
      else showError(data.message || "Board not available");
    }
  } catch (error) {
    console.error("Error loading shared content:", error);
    showError("Error loading content");
  }

  function renderPost(post, isLoggedIn) {
    const imageUrl = post.images && post.images.length > 0
      ? `/assets/uploads/${post.images[0]}`
      : null;

    const categoriesHtml = post.categories.map(cat =>
      `<span class="CategoryTag">${cat.title}</span>`
    ).join("");

    const isOwner = isLoggedIn && currentUserId === post.idUser;

    const commentsSection = isLoggedIn ? `
      <div class="CommentsSection">
        <div class="CommentsHeader">
          <span class="material-icons">chat_bubble</span>
          <span><span id="commentCount">${post.commentCount || 0}</span> Comments</span>
        </div>

        <div class="CommentsList" id="comments-list">
          <p style="color: #999; text-align: center; padding: 20px;">Loading comments...</p>
        </div>
        
        <div class="CommentBox">
          <textarea
            class="CommentInput"
            id="commentInput"
            placeholder="Write a comment..."
          ></textarea>
          <button class="SendCommentBtn" id="sendCommentBtn">
            <span class="material-icons">send</span>
            Send
          </button>
        </div>
      </div>
    ` : `
      <div class="GuestCTA">
        <p>Want to see comments and interact?</p>
        <a href="/src/html/index.html" class="PrimaryBtn">Join Hubbies</a>
      </div>
    `;

    const ownerActions = isOwner ? `
      <div class="OwnerActionsBar">
        <a href="/src/html/posts.html" class="ViewMyPostsBtn">
          <span class="material-icons">article</span>
          View in My Posts
        </a>
      </div>
    ` : '';

    const html = `
      <div class="SharedCard">
        <div class="PostHeader">
          <div class="PostInfo">
            <h2 class="PostTitle">${post.title}</h2>
            <span class="PostDate">Posted on ${new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div class="PostContent">
          <p class="PostDescription">${post.description}</p>
          ${imageUrl ? `
          <div class="PostImageContainer">
            <img src="${imageUrl}" alt="Post Image" class="PostImage">
          </div>
          ` : ''}
        </div>

        <div class="PostFooter">
          <div class="Categories">
            ${categoriesHtml}
          </div>
        </div>

        ${ownerActions}
        ${commentsSection}
      </div>
    `;

    container.innerHTML = html;
  }

  function createSharedBoardHTML(board, isLoggedIn = false, currentUserId = null) {
    const categoryTags = board.categories
      ?.map(cat => `<div class="Tag TagReadOnly">${cat.title || cat.name || "Unknown"}</div>`)
      .join("") || "";

    const commentsCount = board.commentCount || 0;
    const isOwner = isLoggedIn && currentUserId === board.idUser;

    const ownerActions = isOwner ? `
    <div class="OwnerActionsBar">
      <a href="/src/html/posts.html" class="ViewMyPostsBtn">
        <span class="material-icons">dashboard</span>
        View My Boards
      </a>
    </div>
  ` : '';

    const commentsSection = isLoggedIn ? `
    <div class="CommentsSection">
      <div class="CommentsHeader">
        <span class="material-icons">chat_bubble</span>
        <span><span id="boardCommentCount">${commentsCount}</span> Comments</span>
      </div>

      <div class="CommentsList" id="board-comments-list-${board._id}">
        <p style="color: var(--text-secondary); text-align: center; padding: 20px;">Loading comments...</p>
      </div>

      <div class="CommentBox">
        <textarea
          class="CommentInput"
          id="boardCommentInput-${board._id}"
          placeholder="Write a comment about this board..."
          rows="2"
        ></textarea>
        <button class="SendCommentBtn" id="sendBoardCommentBtn-${board._id}">
          <span class="material-icons">send</span>
          Send
        </button>
      </div>
    </div>
  ` : `
    <div class="GuestCTA">
      <p>Want to comment and interact with boards?</p>
      <a href="/src/html/index.html" class="PrimaryBtn">
        <span class="material-icons">login</span>
        Join Hubbies
      </a>
    </div>
  `;

    return `
    <div class="SharedBoardPublication" data-board-id="${board._id}">
      <article class="BoardCard">
        <header class="BoardCardHeader">
          <div style="flex: 1;">
            <h2 class="BoardCardTitle">${escapeHtml(board.title || "Untitled Board")}</h2>
            <div class="BoardMeta">
              <span class="PostDate">
                <span class="material-icons" style="font-size: 16px;">calendar_today</span>
                ${new Date(board.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div class="BoardCardActions">
            <button class="IconButton fullscreen-board-btn" data-board-id="${board._id}" title="Fullscreen">
              <span class="material-icons">fullscreen</span>
            </button>
          </div>
        </header>

        <div class="BoardPreviewCanvas">
          <div class="BoardPreviewWrapper">
            ${renderBoardPreview(board.items || [])}
          </div>
        </div>

        <footer class="BoardCardFooter">
          ${categoryTags}
        </footer>

        ${ownerActions}

        ${commentsSection}
      </article>
    </div>
  `;
  }

  function renderBoardShared(board, isLoggedIn = false, currentUser = null) {
    const container = document.getElementById("SharedPostContainer");
    if (!container) return;

    // Esto es clave para que openBoardFullscreen funcione
    window.sharedBoard = board;
    window.userBoards = [board];  // ← ¡¡ESTO HACE QUE FUNCIONE!!

    const currentUserId = currentUser?._id || null;
    const boardHtml = createSharedBoardHTML(board, isLoggedIn, currentUserId);

    container.innerHTML = `
    <div style="max-width: 1400px; margin: 0 auto; padding: 20px;">
      ${boardHtml}
    </div>
  `;

    setupSharedBoardListeners(board._id);
    loadBoardComments(board._id);
  }

  function setupSharedBoardListeners(boardId) {
    const fullscreenBtn = document.querySelector('.fullscreen-board-btn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        openBoardFullscreen(boardId);
      });
    }

    // ... resto de listeners (comentarios, etc.)

    // Send comment button
    const sendBtn = document.getElementById(`sendBoardCommentBtn-${boardId}`);
    const input = document.getElementById(`boardCommentInput-${boardId}`);

    if (sendBtn && input) {
      const sendComment = () => sendBoardComment(boardId);

      sendBtn.addEventListener("click", sendComment);

      // Enviar con Enter (pero Shift+Enter = nueva línea)
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendComment();
        }
      });

      // Auto-resize del textarea (opcional pero bonito)
      input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = input.scrollHeight + "px";
      });
    }
  }

  // ⭐ Función renderBoardPreview (si no la tienes ya)
  function renderBoardPreview(items = []) {
    if (!items || items.length === 0) {
      return `<div class="BoardPreviewInner" style="--board-original-width:1000px;--board-original-height:600px;">
              <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--text-secondary);font-size:1.4rem;opacity:0.7;">
                This board is empty
              </div>
            </div>`;
    }

    // Calcular tamaño real del board
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;

    items.forEach(item => {
      const x = Number(item.x || 0);
      const y = Number(item.y || 0);
      const w = Number(item.width || 180);
      const h = Number(item.height || 120);

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });

    // Normalizar y dar margen extra bonito
    const padding = 100;
    const boardWidth = Math.max(1000, (maxX - minX) + padding * 2);
    const boardHeight = Math.max(600, (maxY - minY) + padding * 2);

    const normalizedItems = items.map(item => {
      const left = (item.x || 0) - minX + padding;
      const top = (item.y || 0) - minY + padding;
      const width = item.width || 180;
      const height = item.height || 120;
      const rotation = item.rotation || 0;
      const zIndex = item.zIndex || 0;

      const style = `left:${left}px;top:${top}px;width:${width}px;height:${height}px;transform:rotate(${rotation}deg);z-index:${zIndex};`;

      if (item.type === 'note') {
        return `<div class="BoardPreviewItem PreviewNote" style="${style}">${escapeHtml(item.content || 'New Note')}</div>`;
      }
      if (item.type === 'image') {
        return `<div class="BoardPreviewItem PreviewImg" style="${style}">
                <img src="${escapeHtml(item.content)}" loading="lazy" alt="board image" />
              </div>`;
      }
      return '';
    }).join('');

    return `
    <div class="BoardPreviewInner" 
         style="--board-original-width:${boardWidth}px; --board-original-height:${boardHeight}px;">
      ${normalizedItems}
    </div>
  `;
  }

  // Función helper para escapar HTML
  function escapeHtml(text = "") {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  // ⭐ Función para cargar comentarios del board
  async function loadBoardComments(boardId) {
    const commentsList = document.getElementById(`board-comments-list-${boardId}`);
    if (!commentsList) return;

    const currentUserId = JSON.parse(atob(localStorage.getItem("token").split('.')[1])).id;
    // o si guardas el user en localStorage: localStorage.getItem("userId")

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/boards/${boardId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to load comments");

      const { comments = [] } = await response.json();

      if (comments.length === 0) {
        commentsList.innerHTML = `
        <div class="EmptyComments">
          <span class="material-icons">forum</span>
          <p>No comments yet. Be the first!</p>
        </div>`;
        return;
      }

      commentsList.innerHTML = comments.map(comment => {
        const username = comment.userId?.username || comment.userId?.fullName || "Anonymous";
        const initial = username.charAt(0).toUpperCase();
        const time = formatTimeAgo(comment.createdAt);
        const isMine = comment.userId?._id === currentUserId || comment.userId === currentUserId;

        const deleteBtn = isMine ? `
        <button class="delete-comment-btn" data-comment-id="${comment._id}" title="Delete comment">
          <span class="material-icons">delete</span>
        </button>
      ` : '';

        return `
        <div class="CommentItem" data-comment-id="${comment._id}">
          <div class="CommentHeader">
            <div class="CommentAvatar">${escapeHtml(initial)}</div>
            <div class="CommentAuthor">${escapeHtml(username)}</div>
            <div class="CommentTime">${time}</div>
            ${deleteBtn}
          </div>
          <div class="CommentContent">${escapeHtml(comment.content)}</div>
        </div>
      `;
      }).join("");

      // Añadir listeners a los botones de eliminar
      document.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const commentId = btn.dataset.commentId;
          deleteBoardComment(commentId, boardId);
        });
      });

    } catch (error) {
      console.error("Error loading board comments:", error);
      commentsList.innerHTML = `<p style="color: #f55; text-align:center;">Error loading comments</p>`;
    }
  }

  function getInitial(name) {
    if (!name) return '?';
    return String(name).trim().charAt(0).toUpperCase();
  }


  // Helper: Formatear tiempo
  function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }

    return 'Just now';
  }


  async function loadComments(postId) {
    try {
      const userToken = localStorage.getItem("token");
      const response = await fetch(`/api/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      const data = await response.json();
      const commentsList = document.getElementById("comments-list");

      if (!commentsList) return;

      if (!data.comments || data.comments.length === 0) {
        commentsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No comments yet. Be the first to comment!</p>';
        return;
      }

      const commentsHtml = data.comments.map(comment => {
        const isCommentOwner = currentUserId === comment.userId._id;
        const deleteBtn = isCommentOwner ? `
          <button class="IconButton delete-comment-btn" data-comment-id="${comment._id}" style="padding: 4px;">
            <span class="material-icons" style="font-size: 18px;">delete_outline</span>
          </button>
        ` : '';

        return `
          <div class="CommentItem" style="padding: 12px; margin-bottom: 10px; border-radius: 8px; background: var(--bg-secondary);">
            <div class="CommentHeader" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div>
                <span class="CommentAuthor" style="font-weight: 600; color: var(--text-primary);">
                  ${comment.userId.username || comment.userId.fullName || comment.userId.name}
                </span>
                <span class="CommentTime" style="color: var(--text-secondary); font-size: 0.85em; margin-left: 8px;">
                  ${new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              ${deleteBtn}
            </div>
            <div class="CommentContent" style="color: var(--text-primary);">
              ${comment.content}
            </div>
          </div>
        `;
      }).join('');

      commentsList.innerHTML = commentsHtml;

      // Setup delete listeners
      document.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const commentId = e.currentTarget.dataset.commentId;
          await deleteComment(commentId, postId);
        });
      });

    } catch (error) {
      console.error("Error loading comments:", error);
      const commentsList = document.getElementById("comments-list");
      if (commentsList) {
        commentsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Error loading comments</p>';
      }
    }
  }

  function setupCommentListeners(postId) {
    const sendBtn = document.getElementById("sendCommentBtn");
    const commentInput = document.getElementById("commentInput");

    if (sendBtn && commentInput) {
      sendBtn.addEventListener("click", async () => {
        await sendComment(postId);
      });

      commentInput.addEventListener("keypress", async (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          await sendComment(postId);
        }
      });
    }
  }


  async function sendComment(postId) {
    const commentInput = document.getElementById("commentInput");
    const content = commentInput.value.trim();

    if (!content) {
      if (typeof Swal !== 'undefined') {
        Swal.fire("Error", "Comment cannot be empty", "error");
      } else {
        alert("Comment cannot be empty");
      }
      return;
    }

    try {
      const userToken = localStorage.getItem("token");
      const response = await fetch(`/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}`
        },
        body: JSON.stringify({
          postId: postId,
          content: content
        })
      });

      const data = await response.json();

      if (data.success) {
        commentInput.value = "";
        await loadComments(postId);

        // Update comment count
        const countEl = document.getElementById("commentCount");
        if (countEl) {
          countEl.textContent = parseInt(countEl.textContent) + 1;
        }

        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'success',
            title: 'Comment posted!',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
          });
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      if (typeof Swal !== 'undefined') {
        Swal.fire("Error", "Could not post comment", "error");
      } else {
        alert("Could not post comment");
      }
    }
  }

  async function sendBoardComment(boardId) {
    const input = document.getElementById(`boardCommentInput-${boardId}`);
    const content = input.value.trim();

    if (!content) {
      Swal.fire("Oops", "You can't send an empty comment", "warning");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/boards/${boardId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        input.value = "";
        input.style.height = "auto"; // reset height if using auto-resize

        // Actualizar contadores
        const countEl = document.getElementById("boardCommentCount");
        const summaryEl = document.getElementById("boardSummaryCount");
        if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + 1;
        if (summaryEl) summaryEl.textContent = parseInt(summaryEl.textContent || 0) + 1;

        // Recargar comentarios
        await loadBoardComments(boardId);

        Swal.fire({
          icon: "success",
          title: "Comment posted!",
          toast: true,
          position: "top-end",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(result.message || "Failed to post comment");
      }
    } catch (err) {
      console.error("Error sending board comment:", err);
      Swal.fire("Error", "Could not send comment. Try again.", "error");
    }
  }

  async function deleteComment(commentId, postId) {
    const confirmDelete = typeof Swal !== 'undefined'
      ? await Swal.fire({
        title: 'Delete comment?',
        text: "This action cannot be undone",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it'
      })
      : confirm('Are you sure you want to delete this comment?');

    if (typeof Swal !== 'undefined' && !confirmDelete.isConfirmed) return;
    if (typeof Swal === 'undefined' && !confirmDelete) return;

    try {
      const userToken = localStorage.getItem("token");
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${userToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await loadComments(postId);

        // Update comment count
        const countEl = document.getElementById("commentCount");
        if (countEl) {
          countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
        }

        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'success',
            title: 'Comment deleted',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
          });
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      if (typeof Swal !== 'undefined') {
        Swal.fire("Error", "Could not delete comment", "error");
      } else {
        alert("Could not delete comment");
      }
    }
  }

  async function deleteBoardComment(commentId, boardId) {
    const confirm = await Swal.fire({
      title: "Delete comment?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, delete it",
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");

      // Usa EXACTAMENTE la misma ruta que funciona en posts.html
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Server error");
      }

      // Recargar comentarios del board
      await loadBoardComments(boardId);

      // Actualizar contadores
      const countEl = document.getElementById("boardCommentCount");
      const summaryEl = document.getElementById("boardSummaryCount");
      if (countEl) countEl.textContent = Math.max(0, (parseInt(countEl.textContent || 0) - 1));
      if (summaryEl) summaryEl.textContent = Math.max(0, (parseInt(summaryEl.textContent || 0) - 1));

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Comment removed",
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false,
      });

    } catch (err) {
      console.error("Error deleting board comment:", err);
      Swal.fire("Error", "Could not delete comment. Try again.", "error");
    }
  }

  function showError(message) {
    container.innerHTML = `
      <div class="ErrorContainer">
        <span class="material-icons" style="font-size: 48px; color: #ccc;">error_outline</span>
        <p class="ErrorMessage">${message}</p>
        <a href="/src/html/index.html" class="PrimaryBtn" style="margin-top: 20px; text-decoration: none;">Go to Home</a>
      </div>
    `;
  }
});

window.renderBoardPreviewForFullscreen = function (items) {
  return renderBoardPreview(items); // Usa la misma lógica que en shared
};

const originalOpenBoardFullscreen = window.openBoardFullscreen;

window.openBoardFullscreen = function (boardId) {
  const board = window.sharedBoard || window.userBoards?.find(b => b._id === boardId);
  if (!board) {
    console.error("Board no encontrado para fullscreen");
    return;
  }

  const modal = document.getElementById('BoardFullscreenModal');
  const titleEl = document.getElementById('BoardFullscreenTitle');
  const canvasEl = document.getElementById('BoardFullscreenCanvas');
  const categoriesEl = document.getElementById('BoardFullscreenCategories');

  if (!modal || !titleEl || !canvasEl || !categoriesEl) {
    console.error("Modal fullscreen no encontrado");
    return;
  }

  // Título
  titleEl.textContent = board.title || "Untitled Board";

  // Canvas: usamos la misma función que ya funciona perfectamente en shared
  canvasEl.innerHTML = renderBoardPreview(board.items || []);

  // Tags: usamos directamente los datos del board (sin depender de sectionsMap)
  const categoryTags = (board.categories || [])
    .map(cat => {
      const name = cat.title || cat.name || cat || "Unknown";
      return `<div class="Tag TagReadOnly">${escapeHtml(name)}</div>`;
    })
    .join("");

  categoriesEl.innerHTML = categoryTags || '<span style="color:#999;">No categories</span>';

  // Mostrar modal
  modal.classList.add('show');
  document.body.classList.add('modal-open');

  // === RE-ENGANCHAR EVENTO DE CERRAR (esto soluciona el botón X) ===
  const closeBtn = document.querySelector('#BoardFullscreenModal .CloseFullscreenBtn');
  const overlay = document.querySelector('#BoardFullscreenModal .BoardFullscreenOverlay');

  const closeModal = () => {
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  };

  // Limpiar listeners anteriores para evitar duplicados
  closeBtn?.replaceWith(closeBtn.cloneNode(true));
  overlay?.replaceWith(overlay.cloneNode(true));

  // Re-asignar
  document.querySelector('#BoardFullscreenModal .CloseFullscreenBtn')?.addEventListener('click', closeModal);
  document.querySelector('#BoardFullscreenModal .BoardFullscreenOverlay')?.addEventListener('click', closeModal);

  // ESC también cierra
  const escHandler = (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);
};
