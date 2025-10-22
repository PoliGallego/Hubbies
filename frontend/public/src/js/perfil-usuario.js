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

loadMostRecentPost();
