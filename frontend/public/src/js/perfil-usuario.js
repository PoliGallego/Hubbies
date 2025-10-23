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

  const box = document.querySelector(".recent-posts-box");
  const listContainer = document.querySelector(".recent-posts-list");
  if (!box || !listContainer) return;

  let postsLoaded = false;

  box.addEventListener("click", async () => {
    const isOpen = box.classList.toggle("open");
    box.classList.toggle("closed", !isOpen);

    if (isOpen) {
      listContainer.classList.remove("hidden");
      listContainer.style.opacity = "0";
      setTimeout(() => {
        listContainer.style.opacity = "1";
        listContainer.style.transform = "translateY(0)";
      }, 200);

      if (postsLoaded) return;

      try {
        const response = await fetch("/api/posts/my-posts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Error fetching posts");

        const posts = await response.json();
        const lastFive = posts.slice(1, 6); // ← excluimos el más reciente

        listContainer.innerHTML =
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
                  🏷️ ${categories} • 📅 ${new Date(
                    post.createdAt
                  ).toLocaleDateString()}
                </small>
              </div>
            `;
                })
                .join("");

        listContainer.querySelectorAll(".recent-post-item").forEach((item) => {
          item.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = item.dataset.id;
            window.location.href = `/src/html/posts.html?id=${id}`;
          });
        });

        postsLoaded = true;
      } catch (error) {
        console.error("Error loading posts:", error);
        listContainer.innerHTML = `<p class="loading-text" style="color:#f55;">Error loading posts</p>`;
      }
    } else {
      listContainer.style.opacity = "0";
      listContainer.style.transform = "translateY(-10px)";
      setTimeout(() => {
        listContainer.classList.add("hidden");
      }, 400);
    }
  });
});


async function loadMostRecentPost() {
  const token = localStorage.getItem("token");
  const latestCard = document.querySelector(".latest-post-card");

  if (!latestCard) return;

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

    const mostRecent = posts[0];
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
        <p class="recent-date">📅 ${new Date(
          mostRecent.createdAt
        ).toLocaleDateString()}</p>
        <button class="go-to-post-btn">View Post</button>
      </div>
    `;

    latestCard
      .querySelector(".go-to-post-btn")
      .addEventListener("click", () => {
        window.location.href = `/src/html/posts.html?id=${mostRecent._id}`;
      });
  } catch (error) {
    console.error("Error loading most recent post:", error);
    latestCard.innerHTML = `<p class="loading-text" style="color:#f55;">Error loading post</p>`;
  }
}

async function loadUserLatestComments() {
  console.log("Cargando últimos comentarios del usuario...");
  const commentsGrid = document.getElementById("userCommentsGrid");

  if (!commentsGrid) {
    console.error("No se encontró el grid de comentarios");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const postsResponse = await fetch("/api/posts/my-posts", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!postsResponse.ok) {
      throw new Error("Error al cargar posts");
    }

    const posts = await postsResponse.json();

    const allCommentsPromises = posts.map((post) =>
        fetch(`/api/posts/${post._id}/comments`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
            .then((res) => res.json())
            .then((data) =>
                data.success
                    ? data.comments.map((c) => ({
                      ...c,
                      postTitle: post.title,
                      postId: post._id,
                    }))
                    : []
            )
            .catch(() => [])
    );

    const allCommentsArrays = await Promise.all(allCommentsPromises);
    const allComments = allCommentsArrays.flat();

    allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const latestComments = allComments.slice(0, 3);

    const userIds = [
      ...new Set(latestComments.map((c) => c.userId?._id).filter((id) => id)),
    ];
    const userNamesCache = {};

    await Promise.all(
        userIds.map(async (userId) => {
          userNamesCache[userId] = await fetchUserNameForComments(userId);
        })
    );

    const commentsWithNames = latestComments.map((comment) => ({
      ...comment,
      userName: comment.userId?._id
          ? userNamesCache[comment.userId._id]
          : "Anónimo",
    }));

    renderUserComments(commentsWithNames);
  } catch (error) {
    console.error("Error cargando comentarios:", error);
    commentsGrid.innerHTML = `
      <p style="color: #999; text-align: center; padding: 20px;">
        Error loading comments
      </p>
    `;
  }
}

async function fetchUserNameForComments(userId) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener datos del usuario: ${response.status}`);
    }

    const data = await response.json();
    return data.user.username || data.user.fullName || "Anónimo";
  } catch (error) {
    console.error("Error al obtener nombre del usuario:", error);
    return "Anónimo";
  }
}

function renderUserComments(comments) {
  const commentsGrid = document.getElementById("userCommentsGrid");

  if (!commentsGrid) return;

  if (comments.length === 0) {
    commentsGrid.innerHTML = `
      <p style="color: #999; text-align: center; padding: 20px;">
        No comments yet
      </p>
    `;
    return;
  }

  const commentsHTML = comments
      .map(
          (comment) => `
    <div class="comment-card" onclick="window.location.href='/src/html/posts.html?id=${
              comment.postId
          }'">
      <div class="comment-header">
        <div class="comment-avatar">${getInitial(comment.userName)}</div>
        <div class="comment-user">${comment.userName}</div>
        <div class="comment-time">${getTimeAgo(comment.createdAt)}</div>
      </div>
      <div class="comment-text">
        ${truncateText(comment.content, 100)}
      </div>
      <div class="comment-post-link">
        on "${truncateText(comment.postTitle, 30)}"
      </div>
    </div>
  `
      )
      .join("");

  commentsGrid.innerHTML = commentsHTML;
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



loadMostRecentPost();
