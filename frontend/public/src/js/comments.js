async function fetchUserName(userId) {
  console.log("Intentando obtener nombre para userId:", userId);
  try {
    const token = localStorage.getItem("token");
    console.log("Token usado:", token ? "Presente" : "No encontrado");
    const response = await fetch(`/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log(
      "Respuesta de /api/users:",
      response.status,
      response.statusText
    );
    if (!response.ok) {
      throw new Error(`Error al obtener datos del usuario: ${response.status}`);
    }
    const data = await response.json();
    console.log("Datos del usuario:", data);
    return data.user.username || data.user.fullName || "Anónimo";
  } catch (error) {
    console.error("Error al obtener nombre del usuario:", error);
    return "Anónimo";
  }
}

async function loadComments(postId) {
  console.log("Cargando comentarios para postId:", postId);
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/posts/${postId}/comments`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Respuesta de carga de comentarios:", response.status);
    if (!response.ok) {
      throw new Error("Error al cargar comentarios");
    }

    const data = await response.json();
    if (data.success) {
      const currentUser = getCurrentUser();

      const userIds = [
        ...new Set(data.comments.map((c) => c.userId?._id).filter((id) => id)),
      ];

      const userNamesCache = {};
      await Promise.all(
        userIds.map(async (userId) => {
          userNamesCache[userId] = await fetchUserName(userId);
        })
      );

      const commentsWithNames = data.comments.map((comment) => ({
        ...comment,
        userName: comment.userId?._id
          ? userNamesCache[comment.userId._id]
          : "Anónimo",
      }));

      renderComments(postId, commentsWithNames, currentUser);
    }
  } catch (error) {
    console.error("Error cargando comentarios:", error);
    if (typeof Swal !== "undefined") {
      Swal.fire("Error", "No se pudieron cargar los comentarios", "error");
    }
  }
}

function renderComments(postId, comments, currentUser) {
  console.log(
    "Renderizando comentarios para postId:",
    postId,
    "Comentarios:",
    comments
  );
  const commentsList = document.getElementById(`comments-list-${postId}`);
  if (!commentsList) {
    console.error("No se encontró CommentsList para postId:", postId);
    return;
  }

  if (comments.length === 0) {
    commentsList.innerHTML =
      '<p style="color: #999; text-align: center; padding: 10px;">No comments yet</p>';
    const countSpan = document.querySelector(
      `.comments-count[data-post-id="${postId}"]`
    );
    if (countSpan) countSpan.textContent = "0";
    return;
  }

  const commentsHTML = comments
    .map(
      (comment) => `
    <div class="CommentItem" data-comment-id="${comment._id}">
      <div class="CommentHeader">
        <span class="CommentAuthor">${comment.userId?._id === currentUser.id
          ? currentUser.name
          : comment.userName
        }</span>
        <span class="CommentTime">${new Date(
          comment.createdAt
        ).toLocaleString()}</span>
        ${comment.userId?._id === currentUser.id
          ? `
          <div class="CommentControls">
            <button class="IconButton edit-comment-btn" data-comment-id="${comment._id}">
              <span class="material-icons">edit</span>
            </button>
            <button class="IconButton delete-comment-btn" data-comment-id="${comment._id}">
              <span class="material-icons">delete_outline</span>
            </button>
          </div>
        `
          : ""
        }
      </div>
      <p class="CommentContent">${comment.content}</p>
    </div>
  `
    )
    .join("");

  commentsList.innerHTML = commentsHTML;
  const countSpan = document.querySelector(
    `.comments-count[data-post-id="${postId}"]`
  );
  if (countSpan) {
    countSpan.textContent = comments.length;
  }

  setupCommentActionListeners(postId);
}

function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (token) {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id,
      name: payload.fullName || payload.username || "Usuario",
    };
  }
  return { id: null, name: "Anónimo" };
}

async function toggleCommentBox(postId) {
  console.log("Alternando CommentsSection para postId:", postId);
  const commentsSection = document.getElementById(`comments-section-${postId}`);
  if (!commentsSection) {
    console.error(
      `No se encontró CommentsSection con ID comments-section-${postId}`
    );
    const allCommentSections = document.querySelectorAll(".CommentsSection");
    console.log(
      "Secciones de comentarios en el DOM:",
      Array.from(allCommentSections).map((el) => el.id)
    );
    const allPublications = document.querySelectorAll(".Publication");
    console.log(
      "Publicaciones en el DOM:",
      Array.from(allPublications).map((el) => el.dataset.postId)
    );
    if (typeof Swal !== "undefined") {
      Swal.fire(
        "Error",
        "No se pudo abrir la sección de comentarios. La publicación no se encontró.",
        "error"
      );
    } else {
      alert(
        "No se pudo abrir la sección de comentarios. La publicación no se encontró."
      );
    }
    return;
  }

  const isVisible = commentsSection.style.display !== "none";
  console.log("CommentsSection encontrado, isVisible:", isVisible);

  document.querySelectorAll(".CommentsSection").forEach((section) => {
    section.style.display = "none";
  });

  if (!isVisible) {
    commentsSection.style.display = "block";
    await loadComments(postId);
    const textarea = commentsSection.querySelector(".CommentInput");
    if (textarea) {
      textarea.focus();
      console.log("Textarea enfocado");
    } else {
      console.error("No se encontró CommentInput dentro de CommentsSection");
    }
  }
}

async function sendComment(postId) {
  console.log("Enviando comentario para postId:", postId);
  const textarea = document.querySelector(
    `#comments-section-${postId} .CommentInput`
  );
  console.log("Textarea encontrado:", textarea);
  const content = textarea?.value.trim();
  console.log("Contenido del comentario:", content);

  if (!content) {
    console.log("Comentario vacío, mostrando alerta");
    if (typeof Swal !== "undefined") {
      Swal.fire("Error", "Please write a comment first.", "error");
    } else {
      alert("Please write a comment first.");
    }
    return;
  }

  try {
    const token = localStorage.getItem("token");
    console.log("Token:", token ? "Presente" : "No encontrado");

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postId: postId,
        content: content,
      }),
    });

    console.log(
      "Respuesta del servidor:",
      response.status,
      response.statusText
    );
    if (!response.ok) {
      throw new Error("Error al crear comentario");
    }

    const data = await response.json();
    console.log("Comentario creado:", data);

    textarea.value = "";
    await loadComments(postId);
    loadRecentComments();

    if (typeof Swal !== "undefined") {
      Swal.fire("Success", "Comment posted!", "success");
    } else {
      alert("Comment posted!");
    }
  } catch (error) {
    console.error("Error:", error);
    if (typeof Swal !== "undefined") {
      Swal.fire("Error", error.message, "error");
    } else {
      alert("Error: " + error.message);
    }
  }
}

async function editComment(commentId, postId) {
  console.log("Editando comentario:", commentId);
  const commentItem = document.querySelector(
    `[data-comment-id="${commentId}"]`
  );
  const commentContent =
    commentItem.querySelector(".CommentContent").textContent;

  const { value: newContent } = await Swal.fire({
    title: "Edit Comment",
    input: "textarea",
    inputValue: commentContent,
    showCancelButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
  });

  if (newContent && newContent.trim()) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newContent.trim() }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar comentario");
      }

      await loadComments(postId);
      loadRecentComments();
      if (typeof Swal !== "undefined") {
        Swal.fire("Sucess", "Updated comment!", "success");
      } else {
        alert("Updated comment!");
      }
    } catch (error) {
      console.error("Error:", error);
      if (typeof Swal !== "undefined") {
        Swal.fire("Error", error.message, "error");
      } else {
        alert("Error: " + error.message);
      }
    }
  }
}

async function deleteComment(commentId, postId) {
  console.log("Eliminando comentario:", commentId);
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You will not be able to undo this action.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
  });

  if (result.isConfirmed) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar comentario");
      }

      await loadComments(postId);
      updateCommentCount(postId, -1);
      loadRecentComments();
      Swal.fire("Deleted!", "Comment successfully deleted", "success");
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", error.message, "error");
    }
  }
}

async function loadRecentComments() {
  console.log("Cargando comentarios recientes...");
  try {
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    // Obtener posts y boards del usuario (usa los endpoints que ya tienes)
    const [postsRes, boardsRes] = await Promise.allSettled([
      fetch("/api/posts/my-posts", { headers }),
      fetch("/api/boards/my", { headers })
    ]);

    const posts = (postsRes.status === "fulfilled" && postsRes.value.ok)
      ? await postsRes.value.json()
      : [];
    const boards = (boardsRes.status === "fulfilled" && boardsRes.value.ok)
      ? await boardsRes.value.json()
      : [];

    // Si tu endpoint devuelve { success: true, boards } o directamente array:
    const userPosts = Array.isArray(posts) ? posts : (posts.success ? posts : []);
    const userBoards = Array.isArray(boards) ? boards : (boards.success ? boards.boards || [] : []);

    // peticiones a comentarios (posts)
    const postCommentPromises = (userPosts || []).map(post =>
      fetch(`/api/posts/${post._id}/comments`, { headers })
        .then(res => res.ok ? res.json() : Promise.reject({ status: res.status, res }))
        .then(data => {
          const comments = data && data.success ? data.comments : (Array.isArray(data) ? data : []);
          return comments.map(c => ({
            ...c,
            parentType: "post",
            parentId: post._id,
            parentTitle: post.title || ""
          }));
        })
        .catch(err => {
          console.warn("No se pudieron cargar comentarios de post", post._id, err);
          return [];
        })
    );

    // peticiones a comentarios (boards)
    const boardCommentPromises = (userBoards || []).map(board =>
      fetch(`/api/boards/${board._id}/comments`, { headers })
        .then(res => res.ok ? res.json() : Promise.reject({ status: res.status, res }))
        .then(data => {
          const comments = data && data.success ? data.comments : (Array.isArray(data) ? data : []);
          return comments.map(c => ({
            ...c,
            parentType: "board",
            parentId: board._id,
            parentTitle: board.title || ""
          }));
        })
        .catch(err => {
          console.warn("No se pudieron cargar comentarios de board", board._id, err);
          return [];
        })
    );

    // Ejecutar todas las promesas y aplanar resultados
    const settled = await Promise.allSettled([
      ...postCommentPromises,
      ...boardCommentPromises
    ]);

    const arrays = settled
      .filter(r => r.status === "fulfilled")
      .map(r => r.value)
      .flat();

    // Ahora arrays es la lista de todos los comentarios (normalizados)
    arrays.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recent = arrays.slice(0, 5);

    // Resolver nombres (opcional, pero mantiene tu UX)
    const userIds = [...new Set(recent.map(c => c.userId?._id).filter(Boolean))];
    const userNamesCache = {};
    await Promise.all(userIds.map(async id => {
      userNamesCache[id] = await fetchUserName(id).catch(() => "Anónimo");
    }));

    const commentsWithNames = recent.map(c => ({
      ...c,
      userName: c.userId?._id ? (userNamesCache[c.userId.__id] || userNamesCache[c.userId._id] || "Anónimo") : "Anónimo"
    }));

    renderRecentComments(commentsWithNames);
  } catch (err) {
    console.error("Error cargando comentarios recientes:", err);
    renderRecentComments([]);
  }
}

function renderRecentComments(comments) {
  const sidebar =
    document.getElementById("RightSidebar") ||
    document.querySelector(".RightSidebar");
  const toggleBtn =
    document.getElementById("RightSidebarToggleBtn") ||
    document.querySelector(".RightSidebarToggleBtn");

  if (!sidebar || !toggleBtn) return;

  // Asegura inner wrapper
  let inner = sidebar.querySelector(".RightSidebarInner");
  if (!inner) {
    inner = document.createElement("div");
    inner.className = "RightSidebarInner";
    while (sidebar.firstChild) inner.appendChild(sidebar.firstChild);
    sidebar.appendChild(inner);
  }

  // estado collapsed guardado
  const saved = localStorage.getItem("rightSidebarCollapsed");
  if (saved === "true") {
    sidebar.classList.add("Collapsed");
    toggleBtn.classList.add("collapsed");
    toggleBtn.setAttribute("aria-expanded", "false");
  } else {
    toggleBtn.setAttribute("aria-expanded", "true");
  }

  toggleBtn.replaceWith(toggleBtn.cloneNode(true)); // evitar múltiples handlers
  const newToggle = document.getElementById("RightSidebarToggleBtn") || document.querySelector(".RightSidebarToggleBtn");
  newToggle.addEventListener("click", (e) => {
    const nowCollapsed = sidebar.classList.toggle("Collapsed");
    newToggle.classList.toggle("collapsed", nowCollapsed);
    newToggle.setAttribute("aria-expanded", String(!nowCollapsed));
    try { localStorage.setItem("rightSidebarCollapsed", nowCollapsed ? "true" : "false"); } catch (err) { }
  });

  if (!comments || comments.length === 0) {
    sidebar.innerHTML = `
      <h3>Recent Comments</h3>
      <p style="color: #999; text-align: center; padding: 20px;">No comments yet</p>
    `;
    return;
  }

  // render items con data attributes para tipo e id
  const commentsHTML = comments
    .map(comment => `
      <div class="RecentCommentItem" data-parent-type="${comment.parentType}" data-parent-id="${comment.parentId}">
        <div class="RecentCommentHeader">
          <span class="RecentCommentAuthor">${escapeHtml(comment.userName || "Anónimo")}</span>
          <span class="RecentCommentTime">${getTimeAgo(comment.createdAt)}</span>
        </div>
        <p class="RecentCommentContent">${escapeHtml(truncateText(comment.content || "", 60))}</p>
        <span class="RecentCommentLink" style="cursor:pointer">
          on "${escapeHtml(truncateText(comment.parentTitle || "", 30))}"
        </span>
      </div>
    `).join("");

  sidebar.innerHTML = `
    <h3>Recent Comments</h3>
    <div class="RecentCommentsList">
      ${commentsHTML}
    </div>
  `;

  const recentList = document.querySelector(".RecentCommentsList");
  if (recentList) {
    recentList.removeEventListener("click", handleRecentCommentClick);
    recentList.addEventListener("click", handleRecentCommentClick);
  } else {
    document.removeEventListener("click", handleRecentCommentClick);
    document.addEventListener("click", handleRecentCommentClick);
  }

  // handler reutilizable
  async function handleRecentCommentClick(e) {
    const item = e.target.closest(".RecentCommentItem");
    if (!item) return;
    const parentType = item.dataset.parentType;
    const parentId = item.dataset.parentId;
    if (!parentType || !parentId) return;

    if (parentType === "post") {
      // asegurar vista posts y cargar
      const postsToggle = document.querySelector('input[name="feedView"][value="posts"]');
      if (postsToggle) postsToggle.checked = true;
      await loadUserPosts();
      setTimeout(() => {
        const postEl = document.querySelector(`.Publication[data-post-id="${parentId}"]`);
        if (postEl) {
          postEl.scrollIntoView({ behavior: "smooth", block: "center" });
          toggleCommentBox(parentId);
        } else {
          console.warn("Post no encontrado:", parentId);
        }
      }, 200);
      return;
    }

    if (parentType === "board") {
      const boardsToggle = document.querySelector('input[name="feedView"][value="boards"]');
      if (boardsToggle) boardsToggle.checked = true;
      await loadUserBoards();
      setTimeout(() => {
        const boardEl = document.querySelector(`.Publication[data-board-id="${parentId}"]`);
        if (boardEl) {
          boardEl.scrollIntoView({ behavior: "smooth", block: "center" });
          toggleBoardCommentBox(parentId);
        } else {
          console.warn("Board no encontrado:", parentId);
        }
      }, 200);
      return;
    }
  }
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function updateCommentCount(postId, delta = 1) {
  console.log("Actualizando contador para postId:", postId, "Delta:", delta);
  const countSpan = document.querySelector(
    `.comments-count[data-post-id="${postId}"]`
  );
  if (countSpan) {
    const currentCount = parseInt(countSpan.textContent) || 0;
    countSpan.textContent = currentCount + delta;
  }
}

async function updateAllPostCommentCounts(posts) {
  const token = localStorage.getItem("token");

  for (const post of posts) {
    try {
      const response = await fetch(`/api/posts/${post._id}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        console.error("Error HTTP", response.status, "al obtener comentarios de", post._id);
        continue;
      }

      const data = await response.json();
      if (!data.success) continue;

      const countSpan = document.querySelector(
        `.comments-count[data-post-id="${post._id}"]`
      );

      if (countSpan) {
        countSpan.textContent = data.count;
      }

    } catch (error) {
      console.error("Error obteniendo comentarios para:", post._id, error);
    }
  }
}

async function updateAllBoardCommentCounts(boards) {
  if (!boards || !boards.length) return;
  const token = localStorage.getItem("token");

  // Construimos todas las promesas
  const promises = boards.map(board =>
    fetch(`/api/boards/${board._id}/comments`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    }).then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { boardId: board._id, data };
    })
  );

  // Ejecutar en paralelo y procesar resultados sin romper todo si uno falla
  const results = await Promise.allSettled(promises);

  for (const result of results) {
    if (result.status !== "fulfilled") {
      console.warn("No se pudo obtener comentarios para un board:", result.reason);
      continue;
    }

    const { boardId, data } = result.value;

    // Acepta tanto { success, count } como respuesta directa con comments array
    let count = 0;
    if (data && typeof data.count === "number") {
      count = data.count;
    } else if (data && Array.isArray(data.comments)) {
      count = data.comments.length;
    } else {
      // caso por si el backend devolviera la lista directamente
      count = Array.isArray(data) ? data.length : 0;
    }

    // actualizar DOM (si el elemento existe)
    const counter = document.querySelector(`.comments-count[data-board-id="${boardId}"]`);
    if (counter) counter.textContent = String(count);
  }
}

function setupCommentActionListeners(postId) {
  console.log(
    "Configurando listeners de acciones para comentarios, postId:",
    postId
  );
  document
    .querySelectorAll(`#comments-list-${postId} .edit-comment-btn`)
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const commentId = btn.dataset.commentId;
        editComment(commentId, postId);
      });
    });

  document
    .querySelectorAll(`#comments-list-${postId} .delete-comment-btn`)
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const commentId = btn.dataset.commentId;
        deleteComment(commentId, postId);
      });
    });
}

function loadAllComments() {
  console.log("Cargando comentarios para todas las publicaciones visibles");
  const publications = document.querySelectorAll(".Publication");
  publications.forEach((pub) => {
    const postId = pub.dataset.postId;
    if (postId) {
      loadComments(postId);
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded disparado, configurando listeners");
  setupCommentListeners();
  loadRecentComments();
});

const observer = new MutationObserver((mutations) => {
  let newPublications = false;
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      mutation.addedNodes.forEach((node) => {
        if (node.classList && node.classList.contains("Publication")) {
          newPublications = true;
        }
      });
    }
  });
  if (newPublications) {
    console.log("Nuevas publicaciones detectadas");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const targetNode = document.querySelector("body") || document;
  observer.observe(targetNode, { childList: true, subtree: true });
});

function setupCommentListeners() {
  console.log("Configurando listeners de comentarios...");

  // Elimina posibles duplicados antes de volver a agregar
  document.removeEventListener("click", handleCommentClick);
  document.addEventListener("click", handleCommentClick);
}

function handleCommentClick(e) {
  const clickedElement = e.target;
  console.log("Clic detectado en:", clickedElement);

  // 🟦 Boards → Abrir comentario
  const boardBtn = clickedElement.closest(".board-comments-btn");
  if (boardBtn) {
    e.stopPropagation();
    console.log("Board comment click:", boardBtn.dataset.boardId);
    return toggleBoardCommentBox(boardBtn.dataset.boardId);
  }

  // 🟥 Posts → Abrir comentario
  const postBtn = clickedElement.closest(".CommentsButton");
  if (postBtn) {
    e.stopPropagation();
    console.log("Post comment click:", postBtn.dataset.postId);
    return toggleCommentBox(postBtn.dataset.postId);
  }

  // 🟩 Boards → Enviar comentario
  const sendBoardBtn = clickedElement.closest(".send-board-comment-btn");
  if (sendBoardBtn) {
    e.stopPropagation();
    console.log("Send board comment:", sendBoardBtn.dataset.boardId);
    return sendBoardComment(sendBoardBtn.dataset.boardId);
  }

  // 🔶 Posts → Enviar comentario
  const sendPostBtn = clickedElement.closest(".SendCommentBtn");
  if (sendPostBtn) {
    e.stopPropagation();
    console.log("Send post comment:", sendPostBtn.dataset.postId);
    return sendComment(sendPostBtn.dataset.postId);
  }
}

function getTimeAgo(date) {
  const now = new Date();
  const commentDate = new Date(date);
  const diffInSeconds = Math.floor((now - commentDate) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return commentDate.toLocaleDateString();
}
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function injectCommentStyles() {
  const styles = `
    .CommentsSection {
      padding: 15px;
      background: #F7F5F5;
      border-top: 2px solid #E5D6D6;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        max-height: 0;
        padding: 0 15px;
      }
      to {
        opacity: 1;
        max-height: 500px;
        padding: 15px;
      }
    }

    .CommentsList {
      max-height: 300px;
      overflow-y: auto;
      margin-bottom: 10px;
    }

    .CommentItem {
      padding: 10px;
      border-bottom: 1px solid #E5D6D6;
      position: relative;
      background-color: #FFFFFF;
      border-radius: 8px;
      margin-bottom: 6px;
    }

    .CommentHeader {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 5px;
    }

    .CommentAuthor {
      font-weight: 600;
      color: #2D2A2A;
    }

    .CommentTime {
      font-size: 12px;
      color: #9B8F8F;
    }

    .CommentContent {
      margin: 5px 0;
      color: #3E3A3A;
    }

    .CommentControls {
      margin-left: auto;
      display: flex;
      gap: 5px;
    }

    .CommentBox {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      flex-direction: column;
      width: 100%;
    }

    .CommentInput {
      flex: 1;
      padding: 12px 14px;
      border: 1px solid #D8CACA;
      border-radius: 10px;
      resize: vertical;
      min-height: 44px;
      max-height: 120px;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      font-size: 14px;
      color: #2D2A2A;
      background-color: #FFFFFF;
      transition: all 0.2s ease;
      width: 100%;
    }

    .CommentInput::placeholder {
      color: #B8AAAA;
    }

    .CommentInput:focus {
      outline: none;
      border-color: #C49B9B;
      background-color: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(196, 155, 155, 0.2);
    }

    .CommentInput:hover:not(:focus) {
      border-color: #E0CFCF;
    }

    .SendCommentBtn {
      background: #C49B9B;
      color: #FFFFFF;
      border: none;
      border-radius: 10px;
      padding: 12px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      font-weight: 600;
      width: 100%;
      font-family: 'Inter', sans-serif;
    }

    .SendCommentBtn:hover {
      background: #B88D8D;
      box-shadow: 0 4px 8px rgba(196, 155, 155, 0.3);
    }

    .SendCommentBtn:active {
      transform: scale(0.96);
      background: #A67F7F;
    }

    .SendCommentBtn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: #D5C4C4;
    }

    .SendCommentBtn .material-icons {
      font-size: 20px;
    }

    .CommentsButton {
      background: none;
      border: none;
      cursor: pointer;
      color: #9B8F8F;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      border-radius: 8px;
    }

    .CommentsButton:hover {
      color: #C49B9B;
      background: rgba(196, 155, 155, 0.15);
    }

    .CommentsButton:active {
      transform: scale(0.95);
    }

    .CommentsButton .material-icons {
      font-size: 22px;
    }

    @media (max-width: 768px) {
      .CommentsSection {
        padding: 12px;
      }

      .CommentBox {
        padding: 12px;
        gap: 8px;
        flex-direction: column;
      }

      .CommentInput {
        min-height: 40px;
        font-size: 16px;
      }

      .SendCommentBtn {
        width: 100%;
        min-width: unset;
      }
    }

    .RecentCommentsList {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .RecentCommentItem {
      padding: 12px;
      background: #FFFFFF;
      border: 1px solid #E5D6D6;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .RecentCommentItem:hover {
      background: #F7F5F5;
      border-color: #C49B9B;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(196, 155, 155, 0.2);
    }

    .RecentCommentHeader {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .RecentCommentAuthor {
      font-weight: 600;
      font-size: 13px;
      color: #2D2A2A;
    }

    .RecentCommentTime {
      font-size: 11px;
      color: #9B8F8F;
    }

    .RecentCommentContent {
      font-size: 13px;
      color: #3E3A3A;
      margin: 6px 0;
      line-height: 1.4;
    }

    .RecentCommentLink {
      font-size: 12px;
      color: #C49B9B;
      text-decoration: none;
      display: block;
      margin-top: 6px;
      font-style: italic;
    }

    .RecentCommentLink:hover {
      color: #B88D8D;
      text-decoration: underline;
    }

    @media (max-width: 1024px) {
      .RightSidebar {
        display: none;
      }
    }
  `;

  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

async function loadBoardComments(boardId) {
  console.log("Cargando comentarios para boardId:", boardId);
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`/api/boards/${boardId}/comments`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Respuesta carga comments board:", response.status);
    if (!response.ok) throw new Error("Error al cargar comentarios");

    const data = await response.json();
    const comments = data.comments || [];
    const currentUser = getCurrentUser();

    renderBoardComments(boardId, comments, currentUser);

    updateBoardCommentsCount(boardId, comments.length);

  } catch (err) {
    console.error("Error cargando comentarios de board:", err);
    Swal.fire("Error", "No se pudieron cargar los comentarios", "error");
  }
}

function renderBoardComments(boardId, comments, currentUser) {
  const list = document.getElementById(`board-comments-list-${boardId}`);
  if (!list) return;

  if (!comments || comments.length === 0) {
    list.innerHTML = `
      <p style="color:#999; text-align:center; padding:10px;">
        No comments yet
      </p>
    `;
    updateBoardCommentsCount(boardId, 0);
    return;
  }

  const commentsHTML = comments
    .map((c) => {
      const isMine =
        c.userId?._id === currentUser?.id ||
        c.userId?._id === currentUser?._id;
      const authorName = isMine
        ? currentUser.username || currentUser.name
        : c.userId?.username || c.userName || "Anónimo";
      const createdAt = new Date(c.createdAt).toLocaleString();

      return `
        <div class="CommentItem" data-comment-id="${c._id}">
          <div class="CommentHeader">
            <span class="CommentAuthor">${authorName}</span>
            <span class="CommentTime">${createdAt}</span>

            ${isMine ? `
            <div class="CommentControls">
              <button class="IconButton edit-board-comment-btn" 
                data-comment-id="${c._id}" data-board-id="${boardId}">
                <span class="material-icons">edit</span>
              </button>
              <button class="IconButton delete-board-comment-btn" 
                data-comment-id="${c._id}" data-board-id="${boardId}">
                <span class="material-icons">delete_outline</span>
              </button>
            </div>
            ` : ""}
          </div>

          <p class="CommentContent">${c.content}</p>
        </div>
      `;
    })
    .join("");

  list.innerHTML = commentsHTML;

  updateBoardCommentsCount(boardId, comments.length);
  setupBoardCommentActionListeners(boardId);
}

async function sendBoardComment(boardId) {
  const input = document.querySelector(
    `.board-comment-input[data-board-id="${boardId}"]`
  );
  if (!input || !input.value.trim()) {
    Swal.fire("Error", "Please write a comment first.", "error");
    return;
  }

  const commentText = input.value.trim();

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`/api/boards/${boardId}/comments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: commentText }),
    });

    if (!response.ok) throw new Error("Error HTTP " + response.status);

    const data = await response.json();

    // Limpiar caja de texto
    input.value = "";

    // Recargar comentarios visuales del board
    await loadBoardComments(boardId);

    // Actualizar contador del board en pantalla
    updateBoardCommentsCount(boardId, data.newCount ?? 1);

    // Recargar Recent Comments del sidebar
    loadRecentComments();

    // Sweet Alert de éxito 🎉
    Swal.fire("Success", "Comment posted!", "success");

  } catch (err) {
    console.error("Error al enviar comentario:", err);
    Swal.fire("Error", "No se pudo enviar el comentario", "error");
  }
}

async function editBoardComment(commentId, boardId) {
  const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
  const currentContent = commentItem.querySelector(".CommentContent").innerText;

  const { value: newContent } = await Swal.fire({
    title: "Edit Comment",
    input: "textarea",
    inputValue: currentContent,
    showCancelButton: true,
  });

  if (!newContent) return;

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`/api/comments/${commentId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: newContent }),
    });

    if (!response.ok) throw new Error();

    await loadBoardComments(boardId);
    Swal.fire("Success", "Comment updated!", "success");

  } catch {
    Swal.fire("Error", "Error updating comment", "error");
  }
}

async function deleteBoardComment(commentId, boardId) {
  const confirm = await Swal.fire({
    title: "Delete comment?",
    icon: "warning",
    showCancelButton: true,
  });

  if (!confirm.isConfirmed) return;

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error();

    await loadBoardComments(boardId);
    Swal.fire("Deleted!", "Comment removed", "success");

  } catch {
    Swal.fire("Error", "Error deleting comment", "error");
  }
}

async function toggleBoardCommentBox(boardId) {
  const section = document.getElementById(`board-comments-section-${boardId}`);
  if (!section) return console.error("No existe sección comentarios board");

  const visible = section.style.display === "block";

  // Oculta todas las demás secciones
  document.querySelectorAll(".board-comments-section").forEach(el => {
    el.style.display = "none";
  });

  if (!visible) {
    section.style.display = "block";
    await loadBoardComments(boardId);
    section.querySelector(".CommentInput")?.focus();
  }
}

function setupBoardCommentActionListeners(boardId) {
  document.querySelectorAll(`.edit-board-comment-btn[data-board-id="${boardId}"]`)
    .forEach(btn => {
      btn.onclick = () => editBoardComment(btn.dataset.commentId, boardId);
    });

  document.querySelectorAll(`.delete-board-comment-btn[data-board-id="${boardId}"]`)
    .forEach(btn => {
      btn.onclick = () => deleteBoardComment(btn.dataset.commentId, boardId);
    });
}

function updateBoardCommentsCount(boardId, count) {
  const counter = document.querySelector(
    `.comments-count[data-board-id="${boardId}"]`
  );
  if (counter) counter.textContent = count;
}

injectCommentStyles();

window.toggleCommentBox = toggleCommentBox;
window.sendComment = sendComment;
window.loadComments = loadComments;
window.editComment = editComment;
window.deleteComment = deleteComment;
window.loadRecentComments = loadRecentComments;
