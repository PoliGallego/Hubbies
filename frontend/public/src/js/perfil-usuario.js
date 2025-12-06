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

// --- 🔗 Botón de conectar (copiar link del perfil) ---
const connectBtn = document.querySelector(".connect-btn");
if (connectBtn) {
  connectBtn.addEventListener("click", function () {
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        const originalText = this.textContent;
        const originalBg = this.style.background;
        this.textContent = "Link copied!";
        this.style.background = "#28a745";
        this.style.color = "white";
        setTimeout(() => {
          this.textContent = originalText;
          this.style.background = originalBg;
          this.style.color = "#495057";
        }, 2000);
      })
      .catch(() => {
        alert("Link: " + url);
      });
  });
}

const firstNavItem = document.querySelector(".nav-item");
if (firstNavItem) {
  firstNavItem.classList.add("active");
}

document.addEventListener("DOMContentLoaded", async () => {
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
  } catch (err) {
    console.error("Error fetching user email:", err);
    localStorage.removeItem("token");
    window.location.href = "/src/html/index.html";
  }
});

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

(async () => {
  try {
    await loadSections();
  } catch (err) {
    console.warn("loadSections falló:", err);
  }
  await Promise.all([
    loadMostRecentBoard().catch(e => console.error("loadMostRecentBoard error:", e)),
    loadMostRecentPost().catch(e => console.error("loadMostRecentPost error:", e)),
    loadNavigationItems().catch(e => console.error("loadNavigationItems error:", e))
  ]);
})();
