const originalCreatePostHTML = window.createPostHTML;

function defineCreatePostHTML() {
  window.createPostHTML = function (post) {
    console.log("Generando HTML para post (comments.js):", post._id);
    const categoryTags = post.categories
      ? post.categories
          .map(
            (category) => `
      <div class="Tag TagReadOnly">
        ${category.title || category}
      </div>
    `
          )
          .join("")
      : "";

    const imageHTML =
      post.images && post.images.length > 0
        ? `
      <img class="CardImage" src="/assets/uploads/${post.images[0]}" alt="${post.title}">
    `
        : "";

    const privacyText = post.privacy === "public" ? "Public" : "Private";
    const privacyClass =
      post.privacy === "public" ? "PrivacyPublic" : "PrivacyPrivate";

    return `
      <div class="Publication" data-post-id="${post._id}">
        <article class="ContentCard">
          <div class="CardHeader">
            <h2 class="PostTitleReadOnly">"${post.title}"</h2>
            <div class="CardControls">
              <span class="PrivacyDisplay ${privacyClass}">${privacyText}</span>
              <button class="IconButton delete-post-btn" data-post-id="${
                post._id
              }">
                <span class="material-icons">delete_outline</span>
              </button>
              <button class="IconButton edit-post-btn" data-post-id="${
                post._id
              }">
                <span class="material-icons">edit</span>
              </button>
            </div>
          </div>
          <p class="CardDescription DescriptionReadOnly">${post.description}</p>
          ${imageHTML}
          <div class="CardFooter">
            ${categoryTags}
          </div>
        </article>
        <div class="BottomBar">
          <button class="CommentsButton" data-post-id="${post._id}">
            <span class="material-icons">message</span>
          </button>
          <span class="comments-count">${post.comments?.length || 0}</span>
          <button class="IconButton"><span class="material-icons">share</span></button>
        </div>
        
        <div class="CommentsSection" id="comments-section-${
          post._id
        }" style="display: none;">
          <div class="CommentsList" id="comments-list-${post._id}">
            <!-- Comentarios se cargarán aquí -->
          </div>
          <div class="CommentBox">
            <textarea 
              class="CommentInput" 
              placeholder="Write a comment..."
              data-post-id="${post._id}"
            ></textarea>
            <button class="SendCommentBtn" data-post-id="${post._id}">
              <span class="material-icons">send</span>
            </button>
          </div>
        </div>
      </div>
    `;
  };
}

defineCreatePostHTML();

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
    return data.user.fullName || data.user.username || "Anónimo";
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

      const userIds = [...new Set(
          data.comments
              .map(c => c.userId?._id)
              .filter(id => id)
      )];

      const userNamesCache = {};
      await Promise.all(
          userIds.map(async (userId) => {
            userNamesCache[userId] = await fetchUserName(userId);
          })
      );

      const commentsWithNames = data.comments.map(comment => ({
        ...comment,
        userName: comment.userId?._id
            ? userNamesCache[comment.userId._id]
            : "Anónimo"
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
    const countSpan = document.querySelector(`.comments-count[data-post-id="${postId}"]`);
    if (countSpan) countSpan.textContent = '0';
    return;
  }

  const commentsHTML = comments
    .map(
      (comment) => `
    <div class="CommentItem" data-comment-id="${comment._id}">
      <div class="CommentHeader">
        <span class="CommentAuthor">${
          comment.userId?._id === currentUser.id
            ? currentUser.name
            : comment.userName
        }</span>
        <span class="CommentTime">${new Date(
          comment.createdAt
        ).toLocaleString()}</span>
        ${
          comment.userId?._id === currentUser.id
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
  const countSpan = document.querySelector(`.comments-count[data-post-id="${postId}"]`);
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
    updateCommentCount(postId);

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
      Swal.fire("Deleted!", "Comment successfully deleted", "success");
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", error.message, "error");
    }
  }
}

function updateCommentCount(postId, delta = 1) {
  console.log("Actualizando contador para postId:", postId, "Delta:", delta);
  const countSpan = document.querySelector(`.comments-count[data-post-id="${postId}"]`);
  if (countSpan) {
    const currentCount = parseInt(countSpan.textContent) || 0;
    countSpan.textContent = currentCount + delta;
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
  document.removeEventListener("click", handleCommentClick);
  document.addEventListener("click", handleCommentClick);
}

function handleCommentClick(e) {
  console.log("Clic detectado en:", e.target);
  if (e.target.closest(".CommentsButton")) {
    e.stopPropagation();
    const postId = e.target.closest(".CommentsButton").dataset.postId;
    console.log("Clic en CommentsButton, postId:", postId);
    toggleCommentBox(postId);
  }

  if (e.target.closest(".SendCommentBtn")) {
    e.stopPropagation();
    const postId = e.target.closest(".SendCommentBtn").dataset.postId;
    console.log("Clic en SendCommentBtn, postId:", postId);
    sendComment(postId);
  }
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
  `;

  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}


injectCommentStyles();

window.toggleCommentBox = toggleCommentBox;
window.sendComment = sendComment;
window.loadComments = loadComments;
window.editComment = editComment;
window.deleteComment = deleteComment;
