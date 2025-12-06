// --- 🔗 Navegación activa ---
const navItems = document.querySelectorAll(".nav-item, .category-item");
navItems.forEach((item) => {
  item.addEventListener("click", function () {
    const isNavItem = this.classList.contains("nav-item");
    const selector = isNavItem ? ".nav-item" : ".category-item";
    document
      .querySelectorAll(selector)
      .forEach((i) => i.classList.remove("active"));
    this.classList.add("active");
    console.log("Navigating to:", this.textContent.trim());
  });
});

// --- 🔗 Botón de conectar (compartir link del perfil) ---
let connectBtn = document.querySelector(".connect-btn");

function setConnectButtonState(isShared) {
  if (!connectBtn) connectBtn = document.querySelector(".connect-btn");
  if (!connectBtn) return;
  if (isShared) {
    connectBtn.textContent = "Profile link shared (click to disable)";
    connectBtn.classList.add("shared");
  } else {
    connectBtn.textContent = "Share profile link";
    connectBtn.classList.remove("shared");
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
}

// Cargar secciones para un userId dado (no requiere token)
async function loadSectionsForUser(userId) {
  window.sectionsMap = {};
  try {
    if (!userId) throw new Error("userId requerido");
    const res = await fetch(`/api/sections/${userId}`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const sections = await res.json();
    sections.forEach(sec => {
      window.sectionsMap[sec._id] = sec.title;
    });
    console.log("Sections loaded for user:", userId, window.sectionsMap);
  } catch (err) {
    console.error("Error loading sections for user:", err);
    throw err;
  }
}

const firstNavItem = document.querySelector(".nav-item");
if (firstNavItem) {
  firstNavItem.classList.add("active");
}

document.addEventListener("DOMContentLoaded", async () => {

  // Detectar token de perfil en la URL (vista pública)
  const urlParams = new URLSearchParams(window.location.search);
  const profileToken = urlParams.get("token");

  // Si hay token de perfil: decidir si es el owner (está logueado y coincide) o público
  if (profileToken) {
    const userToken = localStorage.getItem("token");
    if (userToken) {
      // Intentar identificar si el usuario logueado es el dueño del perfil compartido
      try {
        const payload = JSON.parse(atob(userToken.split(".")[1]));
        const myId = payload.id;

        // Obtener el usuario público asociado al profileToken
        const sharedRes = await fetch(`/api/users/shared/${profileToken}`);
        if (sharedRes.ok) {
          const sharedJson = await sharedRes.json();
          const sharedUser = sharedJson.user;
          // Si el sharedUser es el mismo que el usuario logueado → mostrar vista privada (owner)
          if (sharedUser && String(sharedUser._id) === String(myId)) {
            // quitar token de la URL para evitar confusión de flujos
            history.replaceState(null, "", window.location.pathname);
            // Continuar con el flujo privado (no return)
          } else {
            // No es el owner → mostrar perfil público y terminar el flujo privado
            await renderPublicProfile(profileToken);
            return;
          }
        } else {
          // Token inválido → mostrar vista pública (fallback) o mensaje
          await renderPublicProfile(profileToken);
          return;
        }
      } catch (e) {
        console.error("Error determining owner for profile token:", e);
        await renderPublicProfile(profileToken);
        return;
      }
    } else {
      // No logueado → vista pública
      await renderPublicProfile(profileToken);
      return;
    }
  }

  // --- Fluir normal privado (owner) a partir de aquí ---
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "/src/html/index.html";

  loadUserLatestComments();

  let userId = null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    userId = payload.id;

    const usernameEl = document.querySelector(".profile-info h1");
    if (usernameEl) usernameEl.textContent = payload.username;

    const avatarEl = document.querySelector(".avatar-large");
    if (avatarEl && payload.avatar) {
      avatarEl.style.backgroundImage = `url(/assets/uploads/${payload.avatar})`;
      avatarEl.style.backgroundSize = "cover";
      avatarEl.style.backgroundPosition = "center";
      avatarEl.textContent = "";
    }
  } catch (err) {
    console.error("Error reading token:", err);
    localStorage.removeItem("token");
    window.location.href = "/src/html/index.html";
    return;
  }

  if (!userId) return;

  try {
    const res = await fetch(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Error fetching user data");
    const data = await res.json();
    const emailEl = document.querySelector(".profile-info p");
    if (emailEl) emailEl.textContent = `Email: ${data.user.email}`;

    // Estado de compartir
    let isShared = !!data.user.isShared;
    let shareToken = data.user.shareToken || null;

    // Nuevo listener: manejar share/unshare con confirmaciones y renderizado de botones
    if (connectBtn) {
      // Reemplazamos por un clon para eliminar listeners anteriores y actualizamos la referencia
      const cloned = connectBtn.cloneNode(true);
      connectBtn.replaceWith(cloned);
      connectBtn = document.querySelector(".connect-btn");
      if (!connectBtn) return;

      // Si ya está compartido, renderizar los dos botones directamente
      if (isShared && shareToken) {
        renderSharedButtons(shareToken, userId, token);
      } else {
        // Si no está compartido, mostrar el botón simple de "Share profile link"
        setConnectButtonState(false);

        connectBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          // obtener token y userId desde localStorage (owner flow)
          const token = localStorage.getItem("token");
          let userId = null;
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            userId = payload.id;
          } catch (err) {
            console.error("No token or invalid token for share operation", err);
            Swal.fire("Error", "You must be logged in to share.", "error");
            return;
          }

          // pedir confirmación para generar link
          const confirm = await Swal.fire({
            title: "Share profile",
            text: "Generate a public link for your profile? Anyone with the link will see your public posts and boards.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Generate",
            cancelButtonText: "Cancel"
          });
          if (!confirm.isConfirmed) return;

          // llamar al backend para generar token
          connectBtn.disabled = true;
          try {
            const resp = await fetch(`/api/users/${userId}/share`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            const json = await resp.json();
            if (resp.ok && json.shareToken) {
              // mostrar success y renderizar botones Copy + Deactivate
              Swal.fire("Shared", "Public profile link created and copied to clipboard (if allowed).", "success");
              isShared = true;
              shareToken = json.shareToken;
              renderSharedButtons(json.shareToken, userId, token);
              // intentar copiar automáticamente
              try { await navigator.clipboard.writeText(`${window.location.origin}/src/html/perfil-usuario.html?token=${json.shareToken}`); } catch (_) { }
            } else {
              console.error("Error sharing profile", json);
              Swal.fire("Error", json.message || "Could not generate link.", "error");
            }
          } catch (err) {
            console.error("Error toggling share:", err);
            Swal.fire("Error", "Network error.", "error");
          } finally {
            connectBtn.disabled = false;
          }
        });
      }
    }

    // --- Inicialización que antes estaba en la IIFE: cargar secciones y contenido privado ---
    try {
      await loadSections(); // carga las secciones del owner (usa token desde localStorage)
    } catch (e) {
      console.warn("loadSections falló en init:", e);
    }
    await Promise.all([
      loadMostRecentBoard().catch(e => console.error("loadMostRecentBoard error:", e)),
      loadMostRecentPost().catch(e => console.error("loadMostRecentPost error:", e)),
      loadNavigationItems().catch(e => console.error("loadNavigationItems error:", e))
    ]);
  } catch (err) {
    console.error("Error fetching user email:", err);
    localStorage.removeItem("token");
    window.location.href = "/src/html/index.html";
  }
});

// Helper: crea el contenedor con los 2 botones (Copy + Deactivate) y lo retorna
function createSharedButtonsContainer(shareUrl, userId, token, onDeactivateCb) {
  const btnContainer = document.createElement("div");
  btnContainer.style.display = "flex";
  btnContainer.style.gap = "8px";
  btnContainer.style.alignItems = "center";

  const copyBtn = document.createElement("button");
  copyBtn.className = "connect-btn shared";
  copyBtn.textContent = "Copy link";
  copyBtn.style.flex = "1";

  const deactivateBtn = document.createElement("button");
  deactivateBtn.className = "connect-btn shared";
  deactivateBtn.textContent = "Deactivate link";
  deactivateBtn.style.flex = "1";

  // copiar
  copyBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const copied = await copyToClipboard(shareUrl);
    if (copied) {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = originalText; }, 1500);
    } else {
      alert("Enlace:\n" + shareUrl);
    }
  });

  // desactivar con confirmación
  deactivateBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: "Confirm",
      text: "Do you want to disable the public profile link?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, disable",
      cancelButtonText: "Cancel"
    });
    if (!result.isConfirmed) return;

    deactivateBtn.disabled = true;
    try {
      const resp = await fetch(`/api/users/${userId}/unshare`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json = await (resp.ok ? resp.json() : resp.text().then(t => ({ error: t })));
      if (resp.ok) {
        Swal.fire("Disabled", "Profile link has been disabled.", "success");
        // restaurar el botón original (si se pasó una cb, que la ejecute)
        if (typeof onDeactivateCb === "function") onDeactivateCb();
      } else {
        console.error("Error unsharing profile", json);
        Swal.fire("Error", "Could not disable link. Try again.", "error");
      }
    } catch (err) {
      console.error("Error al desactivar enlace:", err);
      Swal.fire("Error", "Network error.", "error");
    } finally {
      deactivateBtn.disabled = false;
    }
  });

  btnContainer.appendChild(copyBtn);
  btnContainer.appendChild(deactivateBtn);
  return btnContainer;
}

// Renderiza los botones compartidos en el DOM (reemplaza el botón original)
function renderSharedButtons(shareToken, userId, token) {
  const shareUrl = `${window.location.origin}/src/html/perfil-usuario.html?token=${shareToken}`;
  const originalBtn = document.querySelector(".connect-btn");
  const btnContainer = createSharedButtonsContainer(shareUrl, userId, token, () => {
    // callback al desactivar: restaurar el botón original simple
    const currentContainer = document.querySelector(".connect-btn")?.parentElement ||
      document.querySelector(".connect-btn");

    // Crear nuevo botón simple
    const newBtn = document.createElement("button");
    newBtn.className = "connect-btn";
    newBtn.textContent = "Share profile link";

    // Si el contenedor actual es un div (los dos botones), reemplazarlo
    if (currentContainer && currentContainer.style.display === "flex") {
      currentContainer.replaceWith(newBtn);
    } else if (currentContainer) {
      currentContainer.replaceWith(newBtn);
    } else if (originalBtn) {
      originalBtn.replaceWith(newBtn);
    }

    connectBtn = newBtn;
    setConnectButtonState(false);

    // Reattach listener para volver a compartir
    newBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      let userId = null;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.id;
      } catch (err) {
        console.error("No token or invalid token for share operation", err);
        Swal.fire("Error", "You must be logged in to share.", "error");
        return;
      }

      const confirm = await Swal.fire({
        title: "Share profile",
        text: "Generate a public link for your profile? Anyone with the link will see your public posts and boards.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Generate",
        cancelButtonText: "Cancel"
      });
      if (!confirm.isConfirmed) return;

      newBtn.disabled = true;
      try {
        const resp = await fetch(`/api/users/${userId}/share`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        const json = await resp.json();
        if (resp.ok && json.shareToken) {
          Swal.fire("Shared", "Public profile link created and copied to clipboard (if allowed).", "success");
          renderSharedButtons(json.shareToken, userId, token);
          try { await navigator.clipboard.writeText(`${window.location.origin}/src/html/perfil-usuario.html?token=${json.shareToken}`); } catch (_) { }
        } else {
          console.error("Error sharing profile", json);
          Swal.fire("Error", json.message || "Could not generate link.", "error");
        }
      } catch (err) {
        console.error("Error toggling share:", err);
        Swal.fire("Error", "Network error.", "error");
      } finally {
        newBtn.disabled = false;
      }
    });
  });

  if (originalBtn && originalBtn.parentElement) {
    originalBtn.parentElement.replaceChild(btnContainer, originalBtn);
    connectBtn = btnContainer.querySelector(".connect-btn");
  }
}

async function loadSections() {
  window.sectionsMap = {};
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No hay token de usuario");

    // Obtener userId desde token
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.id;

    const res = await fetch(`/api/sections/${userId}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const sections = await res.json();

    sections.forEach(sec => {
      window.sectionsMap[sec._id] = sec.title;
    });
    console.log("Sections loaded:", window.sectionsMap);
  } catch (err) {
    console.error("Error loading sections:", err);
  }
}

async function loadMostRecentBoard() {
  const token = localStorage.getItem("token");
  const latestBoardCard = document.querySelector(".latest-board-card");
  const recentBoardsBox = document.querySelector(".recent-boards-box");
  const recentBoardsList = document.querySelector(".recent-boards-list");

  if (!token || !latestBoardCard || !recentBoardsBox || !recentBoardsList) return;

  try {
    const res = await fetch("/api/boards/my", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const boards = data.boards || [];
    if (boards.length === 0) {
      latestBoardCard.innerHTML = `<p class="loading-text">No boards yet.</p>`;
      return;
    }

    const sortedByDate = boards.sort((a, b) =>
      new Date(b.originalCreatedAt || b.createdAt) - new Date(a.originalCreatedAt || a.createdAt)
    );

    // Mostrar el más reciente
    const mostRecent = sortedByDate[0];
    const categoryText = (mostRecent.categories || [])
      .map(getCategoryTitleFromIdOrObj)
      .filter(Boolean)
      .join(", ") || "Uncategorized";

    latestBoardCard.innerHTML = `
      <div class="most-recent-board-card" data-id="${mostRecent._id}">
        <h3>${mostRecent.title}</h3>
        <p class="recent-category">🏷️ ${categoryText}</p>
        <p class="recent-date">📅 ${new Date(mostRecent.createdAt).toLocaleDateString()}</p>
        <button class="go-to-post-btn">View Board</button>
      </div>
    `;
    latestBoardCard.querySelector(".go-to-post-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      navigateToBoard(mostRecent._id, false);
    });

    // Funcionalidad de More Boards
    let boardsLoaded = false;
    recentBoardsBox.addEventListener("click", () => {
      const isOpen = recentBoardsBox.classList.toggle("open");
      recentBoardsBox.classList.toggle("closed", !isOpen);

      if (isOpen) {
        recentBoardsList.classList.remove("hidden");
        recentBoardsList.style.opacity = "0";
        setTimeout(() => {
          recentBoardsList.style.opacity = "1";
          recentBoardsList.style.transform = "translateY(0)";
        }, 200);

        if (boardsLoaded) return;

        // Tomar los siguientes 5 boards
        const lastFive = sortedByDate.slice(1, 6);
        recentBoardsList.innerHTML =
          lastFive.length === 0
            ? `<p class="loading-text">No more boards.</p>`
            : lastFive
              .map(
                (board) => `
          <div class="recent-board-item" data-id="${board._id}">
            <strong>${board.title}</strong>
              <small>
      🏷️ ${board.categories?.map(catId => window.sectionsMap[catId] || "Unknown").join(", ") || "Uncategorized"} 
      • 📅 ${new Date(board.createdAt).toLocaleDateString()}
            </small>
          </div>
        `
              )
              .join("");

        recentBoardsList.querySelectorAll(".recent-board-item").forEach((item) => {
          item.addEventListener("click", (e) => {
            e.stopPropagation();
            const boardId = item.dataset.id;
            navigateToBoard(boardId, false);
          });
        });

        boardsLoaded = true;
      } else {
        recentBoardsList.style.opacity = "0";
        recentBoardsList.style.transform = "translateY(-10px)";
        setTimeout(() => {
          recentBoardsList.classList.add("hidden");
        }, 400);
      }
    });
  } catch (err) {
    console.error("Error loading boards:", err);
    latestBoardCard.innerHTML = `<p class="loading-text" style="color:#f55;">Error loading boards</p>`;
  }
}

function navigateToBoard(boardId, openComments = false) {
  const navigationData = {
    type: "board",
    id: boardId,
    scrollTo: true,
    openComments // true solo si viene de comentario
  };
  localStorage.setItem("pendingNavigation", JSON.stringify(navigationData));

  // Redirigir a posts.html
  window.location.href = "/src/html/posts.html";
}

async function loadMostRecentPost() {
  const token = localStorage.getItem("token");
  const latestCard = document.querySelector(".latest-post-card");
  const recentPostsBox = document.querySelector(".recent-posts-box");
  const recentPostsList = document.querySelector(".recent-posts-list");

  if (!token || !latestCard || !recentPostsBox || !recentPostsList) return;

  try {
    const response = await fetch("/api/posts/my-posts", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Error fetching posts");

    const posts = await response.json();

    if (!posts || posts.length === 0) {
      latestCard.innerHTML = `<p class="loading-text">No posts yet.</p>`;
      return;
    }

    const sortedByDate = posts.sort((a, b) =>
      new Date(b.originalCreatedAt || b.createdAt) - new Date(a.originalCreatedAt || a.createdAt)
    );

    const mostRecent = sortedByDate[0];
    const categories =
      mostRecent.categories && mostRecent.categories.length > 0
        ? mostRecent.categories
          .map((cat) =>
            typeof cat === "string"
              ? cat
              : cat.title || cat.name || "Uncategorized"
          )
          .join(", ")
        : "Uncategorized";

    latestCard.innerHTML = `
      <div class="most-recent-card" data-id="${mostRecent._id}">
        <h3>${mostRecent.title}</h3>
        <p class="recent-category">🏷️ ${categories}</p>
        <p class="recent-date">📅 ${new Date(mostRecent.createdAt).toLocaleDateString()}</p>
        <button class="go-to-post-btn">View Post</button>
      </div>
    `;

    latestCard.querySelector(".go-to-post-btn").addEventListener("click", () => {
      window.location.href = `/src/html/posts.html?id=${mostRecent._id}`;
    });

    // Funcionalidad de More Posts
    let postsLoaded = false;
    recentPostsBox.addEventListener("click", async () => {
      const isOpen = recentPostsBox.classList.toggle("open");
      recentPostsBox.classList.toggle("closed", !isOpen);

      if (isOpen) {
        recentPostsList.classList.remove("hidden");
        recentPostsList.style.opacity = "0";
        setTimeout(() => {
          recentPostsList.style.opacity = "1";
          recentPostsList.style.transform = "translateY(0)";
        }, 200);

        if (postsLoaded) return;

        // Tomar los siguientes 5 posts (excluyendo el más reciente)
        const lastFive = sortedByDate.slice(1, 6);
        recentPostsList.innerHTML =
          lastFive.length === 0
            ? `<p class="loading-text">No more posts.</p>`
            : lastFive
              .map((post) => {
                const categories =
                  post.categories && post.categories.length > 0
                    ? post.categories
                      .map((cat) =>
                        typeof cat === "string"
                          ? cat
                          : cat.title || cat.name || "Unknown"
                      )
                      .join(", ")
                    : "Uncategorized";

                return `
              <div class="recent-post-item" data-id="${post._id}">
                <strong>${post.title}</strong>
                <small>
                  🏷️ ${categories} • 📅 ${new Date(post.createdAt).toLocaleDateString()}
                </small>
              </div>
            `;
              })
              .join("");

        recentPostsList.querySelectorAll(".recent-post-item").forEach((item) => {
          item.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = item.dataset.id;
            window.location.href = `/src/html/posts.html?id=${id}`;
          });
        });

        postsLoaded = true;
      } else {
        recentPostsList.style.opacity = "0";
        recentPostsList.style.transform = "translateY(-10px)";
        setTimeout(() => {
          recentPostsList.classList.add("hidden");
        }, 400);
      }
    });

  } catch (error) {
    console.error("Error loading most recent post:", error);
    latestCard.innerHTML = `<p class="loading-text" style="color:#f55;">Error loading post</p>`;
  }
}

async function loadUserLatestComments() {
  console.log("Cargando últimos comentarios del usuario...");
  const commentsGrid = document.getElementById("userCommentsGrid");
  const currentUserString = localStorage.getItem("user");
  let currentUser = null;

  try {
    currentUser = currentUserString ? JSON.parse(currentUserString) : null;
  } catch (e) {
    console.warn("User info corrupta en localStorage");
  }

  if (!commentsGrid) return;

  try {
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    // Obtener mis posts y mis boards
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

    const userPosts = Array.isArray(posts) ? posts : (posts.success ? posts : []);
    const userBoards = Array.isArray(boards) ? boards : (boards.success ? boards.boards || [] : []);

    // Comentarios de posts
    const postPromises = userPosts.map(post =>
      fetch(`/api/posts/${post._id}/comments`, { headers })
        .then(res => res.ok ? res.json() : { comments: [] })
        .then(data => {
          const comments = data.comments || data;
          return comments.map(c => {
            const isMine =
              c.userId?._id === currentUser?._id ||
              c.userId === currentUser?._id;

            const authorName = isMine
              ? currentUser?.username || currentUser?.name || "Tú"
              : c.userId?.username || c.userName || "Anónimo";

            return {
              ...c,
              parentType: "post",
              parentId: post._id,
              parentTitle: post.title || "",
              userName: authorName
            };
          });
        })
        .catch(() => [])
    );

    // Comentarios de boards
    const boardPromises = userBoards.map(board =>
      fetch(`/api/boards/${board._id}/comments`, { headers })
        .then(res => res.ok ? res.json() : { comments: [] })
        .then(data => {
          const comments = data.comments || data;
          return comments.map(c => {
            const isMine =
              c.userId?._id === currentUser?._id ||
              c.userId === currentUser?._id;

            const authorName = isMine
              ? currentUser?.username || currentUser?.name || "Tú"
              : c.userId?.username || c.userName || "Anónimo";

            return {
              ...c,
              parentType: "board",
              parentId: board._id,
              parentTitle: board.title || "",
              userName: authorName
            };
          });
        })
        .catch(() => [])
    );

    const results = await Promise.allSettled([...postPromises, ...boardPromises]);
    let comments = results
      .filter(r => r.status === "fulfilled")
      .flatMap(r => r.value);

    // Ordenar → tomar solo 3
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    comments = comments.slice(0, 3);

    renderUserComments(comments);
  } catch (error) {
    console.error("Error:", error);
    commentsGrid.innerHTML = `<p style="color:#999; text-align:center;">Error loading comments</p>`;
  }
}

function renderUserComments(comments) {
  const commentsGrid = document.getElementById("userCommentsGrid");
  if (!commentsGrid) return;

  if (comments.length === 0) {
    commentsGrid.innerHTML = `
      <p style="color: #999; text-align: center; padding: 20px;">
        No comments yet
      </p>`;
    return;
  }

  const commentsHTML = comments
    .map((comment) => {
      const isBoardComment = comment.parentType === "board";
      const typeText = isBoardComment ? "on board" : "on post";
      const title = truncateText(comment.parentTitle || (isBoardComment ? "Board" : "Post"), 30);

      return `
        <div class="comment-card" 
             data-parent-type="${comment.parentType}" 
             data-parent-id="${comment.parentId}">
          <div class="comment-header">
            <div class="comment-avatar">${getInitial(comment.userName)}</div>
            <div class="comment-user">${escapeHtml(comment.userName)}</div>
            <div class="comment-time">${getTimeAgo(comment.createdAt)}</div>
          </div>

          <div class="comment-text">
            ${escapeHtml(truncateText(comment.content, 100))}
          </div>

          <div class="comment-post-link">
            ${typeText} "${escapeHtml(title)}"
          </div>
        </div>
      `;
    })
    .join("");

  commentsGrid.innerHTML = commentsHTML;

  // Agregar event listener para navegación
  commentsGrid.removeEventListener("click", handleCommentNavigation);
  commentsGrid.addEventListener("click", handleCommentNavigation);
}

function handleCommentNavigation(e) {
  const card = e.target.closest(".comment-card");
  if (!card) return;

  const parentType = card.dataset.parentType;
  const parentId = card.dataset.parentId;

  if (!parentType || !parentId) return;

  // Guardar en localStorage para que posts.html sepa qué hacer
  const navigationData = {
    type: parentType,
    id: parentId,
    scrollTo: true,
    openComments: true
  };

  localStorage.setItem("pendingNavigation", JSON.stringify(navigationData));

  // Redirigir a posts.html
  window.location.href = "/src/html/posts.html";
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : "?";
}

function getTimeAgo(date) {
  const now = new Date();
  const commentDate = new Date(date);
  const diffInSeconds = Math.floor((now - commentDate) / 1000);

  if (diffInSeconds < 60) return "now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return commentDate.toLocaleDateString();
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getCategoryTitleFromIdOrObj(cat) {
  // cat puede ser: "id", {_id: "...", title: "X"}, o {_id: "...", name: "X"}
  if (!cat) return "Unknown";
  if (typeof cat === "string") {
    return window.sectionsMap?.[cat] || "Unknown";
  }
  // objeto
  if (typeof cat === "object") {
    return cat.title || cat.name || window.sectionsMap?.[cat._id] || "Unknown";
  }
  return "Unknown";
}

// ============ LLENAR NAVIGATION CON POSTS Y BOARDS ============
async function loadNavigationItems() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    // Cargar posts
    const postsRes = await fetch("/api/posts/my-posts", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const posts = postsRes.ok ? await postsRes.json() : [];

    // Cargar boards
    const boardsRes = await fetch("/api/boards/my", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const boardsData = boardsRes.ok ? await boardsRes.json() : {};
    const boards = boardsData.boards || [];

    // Combinar y ordenar por fecha
    const allItems = [
      ...posts.map(p => ({ ...p, type: 'post' })),
      ...boards.map(b => ({ ...b, type: 'board' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Tomar solo los 7 más recientes para Navigation
    const navItems = allItems.slice(0, 7);

    // Renderizar en Navigation
    const navList = document.querySelector(".Navigation .SectionContent > ul");
    if (navList) {
      navList.innerHTML = '';

      // Ocultar el mensaje "No posts"
      const notFoundMsg = document.querySelector(".Navigation .SectionContent .NotFound");
      if (notFoundMsg) {
        notFoundMsg.style.display = "none";
      }

      navItems.forEach((item) => {
        const li = document.createElement("li");
        const icon = item.type === 'post' ? 'article' : 'dashboard';

        li.innerHTML = `
          <div class="NavigationRow">
            <a href="#" data-type="${item.type}" data-id="${item._id}">
              <span class="material-icons" style="font-size: 18px; margin-right: 8px; vertical-align: middle;">${icon}</span>
              ${item.title}
            </a>
          </div>
        `;
        navList.appendChild(li);
      });

      // Event listeners para navegación
      navList.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const type = e.currentTarget.dataset.type;
          const id = e.currentTarget.dataset.id;

          const navigationData = {
            type: type,
            id: id,
            scrollTo: true,
            openComments: false
          };
          localStorage.setItem("pendingNavigation", JSON.stringify(navigationData));
          window.location.href = "/src/html/posts.html";
        });
      });

      // Si hay más de 7, mostrar el botón "Ver más"
      if (allItems.length > 7) {
        const viewMoreBtn = document.querySelector(".Navigation .SectionContent .ViewMoreButton");
        if (viewMoreBtn) {
          viewMoreBtn.style.display = "flex";

          let expanded = false;
          viewMoreBtn.addEventListener("click", () => {
            expanded = !expanded;
            navList.innerHTML = '';

            const itemsToShow = expanded ? allItems : allItems.slice(0, 7);
            itemsToShow.forEach((item) => {
              const li = document.createElement("li");
              const icon = item.type === 'post' ? 'article' : 'dashboard';

              li.innerHTML = `
                <div class="NavigationRow">
                  <a href="#" data-type="${item.type}" data-id="${item._id}">
                    <span class="material-icons" style="font-size: 18px; margin-right: 8px; vertical-align: middle;">${icon}</span>
                    ${item.title}
                  </a>
                </div>
              `;
              navList.appendChild(li);
            });

            navList.querySelectorAll("a").forEach(link => {
              link.addEventListener("click", (e) => {
                e.preventDefault();
                const type = e.currentTarget.dataset.type;
                const id = e.currentTarget.dataset.id;

                const navigationData = {
                  type: type,
                  id: id,
                  scrollTo: true,
                  openComments: true
                };
                localStorage.setItem("pendingNavigation", JSON.stringify(navigationData));
                window.location.href = "/src/html/posts.html";
              });
            });


            viewMoreBtn.querySelector("span").textContent = expanded ? "expand_less" : "expand_more";
            viewMoreBtn.childNodes[0].textContent = expanded ? "View less" : "View more";
          });
        }
      }

      // Re-inicializar el event listener de navigation
      navEventListener();
    }
  } catch (error) {
    console.error("Error loading navigation items:", error);
  }
}

//VISTA PUBLICA DE PERFIL 

async function renderPublicProfile(profileToken) {
  try {
    // Obtener info del usuario compartido
    const res = await fetch(`/api/users/shared/${profileToken}`);
    if (!res.ok) {
      showUnavailableProfileMessage();
      return;
    }
    const { user } = await res.json();

    if (!user) {
      showUnavailableProfileMessage();
      return;
    }

    // Mostrar nombre y avatar (no requiere autenticación)
    const usernameEl = document.querySelector(".profile-info h1");
    if (usernameEl) usernameEl.textContent = user.username || user.fullName || "User";
    const avatarEl = document.querySelector(".avatar-large");
    if (avatarEl && user.avatar) {
      avatarEl.style.backgroundImage = `url(/assets/uploads/${user.avatar})`;
      avatarEl.style.backgroundSize = "cover";
      avatarEl.style.backgroundPosition = "center";
      avatarEl.textContent = "";
    }
    const emailEl = document.querySelector(".profile-info p");
    if (emailEl) emailEl.textContent = `Email: ${user.email || "Not available"}`;

    // Ocultar sidebar si el visitante no está logueado
    const sidebarEl = document.getElementById("sidebar");
    if (sidebarEl) sidebarEl.style.display = "none";

    const togglesidebarEl = document.getElementById("SidebarToggleBtn");
    if (togglesidebarEl) togglesidebarEl.style.display = "none";

    // Ajustar navbar para visitante no logueado: mostrar StartHere, ocultar Home/Notif/Options
    const homeBtn = document.getElementById("HomeBtn");
    const notifBtn = document.getElementById("NotifBtn");
    const optionsBtn = document.getElementById("OptionsBtn");
    const startHereBtn = document.getElementById("StartHereBtn");
    if (!localStorage.getItem("token")) {
      if (homeBtn) homeBtn.style.display = "none";
      if (notifBtn) notifBtn.style.display = "none";
      if (optionsBtn) optionsBtn.style.display = "none";
      if (startHereBtn) startHereBtn.style.display = "block";
    } else {
      if (homeBtn) homeBtn.style.display = "block";
      if (notifBtn) notifBtn.style.display = "block";
      if (optionsBtn) optionsBtn.style.display = "block";
      if (startHereBtn) startHereBtn.style.display = "none";
    }

    // Ocultar secciones del owner que no correspondan a la vista pública
    const commentsSection = document.querySelector(".comments-section");
    if (commentsSection) commentsSection.style.display = "none";

    // Opcional: ocultar botón de compartir (porque no es el owner)
    const btn = document.querySelector(".connect-btn");
    if (btn) btn.style.display = "none";

    // Asegurarnos de cargar secciones para resolver nombres
    try { await loadSectionsForUser(user._id); } catch (e) { console.warn("No se pudo cargar sections para el perfil público:", e); }

    // Cargar posts y boards públicos del usuario
    await Promise.all([
      loadPublicMostRecentPost(user._id, profileToken),
      loadPublicMostRecentBoard(user._id, profileToken)
    ]);
  } catch (err) {
    console.error("Error rendering public profile:", err);
  }
}

// --- Helpers para vista pública (perfil compartido) ---
function isSameObjectId(a, b) {
  return String(a) === String(b);
}


async function loadPublicMostRecentPost(userId, profileToken = null) {
  const latestCard = document.querySelector(".latest-post-card");
  const recentPostsBox = document.querySelector(".recent-posts-box");
  const recentPostsList = document.querySelector(".recent-posts-list");
  if (!latestCard || !recentPostsBox || !recentPostsList) return;

  try {
    const res = await fetch(`/api/posts/public`);
    if (!res.ok) throw new Error("Error fetching public posts");
    const posts = await res.json();

    // posts vienen ya con categories transformadas por backend
    const userPosts = (Array.isArray(posts) ? posts : []).filter(p => isSameObjectId(p.idUser, userId));
    if (userPosts.length === 0) {
      latestCard.innerHTML = `<p class="loading-text">No public posts.</p>`;
      return;
    }

    const sortedByDate = userPosts.sort((a, b) => new Date(b.originalCreatedAt || b.createdAt) - new Date(a.originalCreatedAt || a.createdAt));
    const mostRecent = sortedByDate[0];

    const categories =
      mostRecent.categories && mostRecent.categories.length > 0
        ? mostRecent.categories
          .map((cat) => typeof cat === "string" ? (window.sectionsMap?.[cat] || cat) : (cat.title || cat.name || "Uncategorized"))
          .join(", ")
        : "Uncategorized";

    latestCard.innerHTML = `
      <div class="most-recent-card" data-id="${mostRecent._id}">
        <h3>${mostRecent.title}</h3>
        <p class="recent-category">🏷️ ${categories}</p>
        <p class="recent-date">📅 ${new Date(mostRecent.createdAt).toLocaleDateString()}</p>
        <button class="go-to-post-btn">View Post</button>
      </div>
    `;

    latestCard.querySelector(".go-to-post-btn").addEventListener("click", () => {
      // Si existe shareToken usarlo, si no usar id param
      if (mostRecent.shareToken) {
        window.location.href = `/src/html/post-shared.html?token=${mostRecent.shareToken}`;
      } else {
        window.location.href = `/src/html/post-shared.html?id=${mostRecent._id}&type=post`;
      }
    });

    // More posts
    let postsLoaded = false;
    recentPostsBox.addEventListener("click", () => {
      const isOpen = recentPostsBox.classList.toggle("open");
      recentPostsBox.classList.toggle("closed", !isOpen);

      if (isOpen) {
        recentPostsList.classList.remove("hidden");
        recentPostsList.style.opacity = "0";
        setTimeout(() => {
          recentPostsList.style.opacity = "1";
          recentPostsList.style.transform = "translateY(0)";
        }, 200);
        if (postsLoaded) return;

        const allPosts = sortedByDate.slice(1);
        recentPostsList.innerHTML = allPosts.length === 0
          ? `<p class="loading-text">No more posts.</p>`
          : allPosts.map(post => {
            const categories = post.categories && post.categories.length > 0
              ? post.categories.map(cat => typeof cat === "string" ? (window.sectionsMap?.[cat] || cat) : (cat.title || cat.name || "Unknown")).join(", ")
              : "Uncategorized";
            return `
                <div class="recent-post-item" data-id="${post._id}" data-token="${post.shareToken || ""}">
                  <strong>${post.title}</strong>
                  <small>🏷️ ${categories} • 📅 ${new Date(post.createdAt).toLocaleDateString()}</small>
                </div>
              `;
          }).join("");

        recentPostsList.querySelectorAll(".recent-post-item").forEach(item => {
          item.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = item.dataset.id;
            const tkn = item.dataset.token;
            if (tkn) window.location.href = `/src/html/post-shared.html?token=${tkn}`;
            else window.location.href = `/src/html/post-shared.html?id=${id}&type=post`;
          });
        });

        postsLoaded = true;
      } else {
        recentPostsList.style.opacity = "0";
        recentPostsList.style.transform = "translateY(-10px)";
        setTimeout(() => recentPostsList.classList.add("hidden"), 400);
      }
    });

  } catch (err) {
    console.error("Error loading public most recent post:", err);
    latestCard.innerHTML = `<p class="loading-text" style="color:#f55;">Error loading posts</p>`;
  }
}

// Reemplaza la función showUnavailableProfileMessage (línea ~1192)
function showUnavailableProfileMessage() {
  // Ocultar sidebar y navbar innecesarios
  const sidebarEl = document.getElementById("sidebar");
  if (sidebarEl) sidebarEl.style.display = "none";

  const togglesidebarEl = document.getElementById("SidebarToggleBtn");
  if (togglesidebarEl) togglesidebarEl.style.display = "none";

  const homeBtn = document.getElementById("HomeBtn");
  const notifBtn = document.getElementById("NotifBtn");
  const optionsBtn = document.getElementById("OptionsBtn");
  const startHereBtn = document.getElementById("StartHereBtn");

  // Verificar si el usuario está logueado
  const isLoggedIn = !!localStorage.getItem("token");

  if (isLoggedIn) {
    // Si está logueado: mostrar Home/Notif/Options, ocultar StartHere
    if (homeBtn) homeBtn.style.display = "block";
    if (notifBtn) notifBtn.style.display = "block";
    if (optionsBtn) optionsBtn.style.display = "block";
    if (startHereBtn) startHereBtn.style.display = "none";
  } else {
    // Si NO está logueado: ocultar Home/Notif/Options, mostrar StartHere
    if (homeBtn) homeBtn.style.display = "none";
    if (notifBtn) notifBtn.style.display = "none";
    if (optionsBtn) optionsBtn.style.display = "none";
    if (startHereBtn) startHereBtn.style.display = "block";
  }

  // Crear HTML usando clases CSS
  const unavailableHTML = `
    <div class="unavailable-profile-container">
      <span class="material-icons unavailable-profile-icon">lock</span>
      <h1 class="unavailable-profile-title">Profile Not Available</h1>
      <p class="unavailable-profile-text">
        The profile link has been deactivated or is no longer available.
      </p>
      <a href="/src/html/index.html" class="unavailable-profile-link">
        Back to Home
      </a>
    </div>
  `;

  // Limpiar y mostrar el mensaje
  const profileSection = document.querySelector(".profile-container") ||
    document.querySelector(".ProfileContainer") ||
    document.querySelector("main");
  if (profileSection) {
    profileSection.innerHTML = unavailableHTML;
  } else {
    const mainContent = document.querySelector(".main-container") || document.body;
    mainContent.innerHTML = unavailableHTML;
  }
}

async function loadPublicMostRecentBoard(userId, profileToken = null) {
  const latestBoardCard = document.querySelector(".latest-board-card");
  const recentBoardsBox = document.querySelector(".recent-boards-box");
  const recentBoardsList = document.querySelector(".recent-boards-list");
  if (!latestBoardCard || !recentBoardsBox || !recentBoardsList) return;

  try {
    const res = await fetch(`/api/boards/public`);
    if (!res.ok) throw new Error("Error fetching public boards");
    const json = await res.json();
    const boards = Array.isArray(json) ? json : (json.boards || []);

    const userBoards = boards.filter(b => isSameObjectId(b.idUser, userId));
    if (userBoards.length === 0) {
      latestBoardCard.innerHTML = `<p class="loading-text">No public boards.</p>`;
      return;
    }

    const sortedByDate = userBoards.sort((a, b) => new Date(b.originalCreatedAt || b.createdAt) - new Date(a.originalCreatedAt || a.createdAt));
    const mostRecent = sortedByDate[0];

    const categoryText = (mostRecent.categories || []).map(cat => typeof cat === "string" ? (window.sectionsMap?.[cat] || cat) : (cat.title || cat.name || "Uncategorized")).join(", ") || "Uncategorized";

    latestBoardCard.innerHTML = `
      <div class="most-recent-board-card" data-id="${mostRecent._id}">
        <h3>${mostRecent.title}</h3>
        <p class="recent-category">🏷️ ${categoryText}</p>
        <p class="recent-date">📅 ${new Date(mostRecent.createdAt).toLocaleDateString()}</p>
        <button class="go-to-post-btn">View Board</button>
      </div>
    `;
    latestBoardCard.querySelector(".go-to-post-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (mostRecent.shareToken) {
        window.location.href = `/src/html/post-shared.html?token=${mostRecent.shareToken}&type=board`;
      } else {
        window.location.href = `/src/html/post-shared.html?id=${mostRecent._id}&type=board`;
      }
    });

    let boardsLoaded = false;
    recentBoardsBox.addEventListener("click", () => {
      const isOpen = recentBoardsBox.classList.toggle("open");
      recentBoardsBox.classList.toggle("closed", !isOpen);

      if (isOpen) {
        recentBoardsList.classList.remove("hidden");
        recentBoardsList.style.opacity = "0";
        setTimeout(() => {
          recentBoardsList.style.opacity = "1";
          recentBoardsList.style.transform = "translateY(0)";
        }, 200);
        if (boardsLoaded) return;

        const allBoards = sortedByDate.slice(1);
        recentBoardsList.innerHTML = allBoards.length === 0
          ? `<p class="loading-text">No more boards.</p>`
          : allBoards.map(board => {
            const cats = board.categories?.map(cat => typeof cat === "string" ? (window.sectionsMap?.[cat] || cat) : (cat.title || cat.name || "Unknown")).join(", ") || "Uncategorized";
            return `
                <div class="recent-board-item" data-id="${board._id}" data-token="${board.shareToken || ""}">
                  <strong>${board.title}</strong>
                    <small>🏷️ ${cats} • 📅 ${new Date(board.createdAt).toLocaleDateString()}</small>
                </div>
              `;
          }).join("");

        recentBoardsList.querySelectorAll(".recent-board-item").forEach(item => {
          item.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = item.dataset.id;
            const tkn = item.dataset.token;
            if (tkn) window.location.href = `/src/html/post-shared.html?token=${tkn}&type=board`;
            else window.location.href = `/src/html/post-shared.html?id=${id}&type=board`;
          });
        });

        boardsLoaded = true;
      } else {
        recentBoardsList.style.opacity = "0";
        recentBoardsList.style.transform = "translateY(-10px)";
        setTimeout(() => recentBoardsList.classList.add("hidden"), 400);
      }
    });

  } catch (err) {
    console.error("Error loading public boards:", err);
    latestBoardCard.innerHTML = `<p class="loading-text" style="color:#f55;">Error loading boards</p>`;
  }
}
