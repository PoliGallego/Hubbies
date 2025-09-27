// Funcionalidad para el botón de eliminar post
const deleteBtn = document.querySelector(".delete-btn");
if (deleteBtn) {
  deleteBtn.addEventListener("click", function () {
    Swal.fire({
      title: "Delete post?",
      text: "Are you sure you want to delete this post?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete?",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        const postCard = this.closest(".post-card");
        postCard.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        postCard.style.opacity = "0";
        postCard.style.transform = "scale(0.9)";
        setTimeout(() => {
          postCard.remove();
          Swal.fire({
            icon: "success",
            title: "Post deleted",
            showConfirmButton: false,
            timer: 1200,
          });
        }, 300);
      }
    });
  });
}

const privacySelect = document.querySelector(".privacy-select");
if (privacySelect) {
  privacySelect.addEventListener("change", function () {
    console.log("Privacidad cambiada a:", this.value);
  });
}
const navItems = document.querySelectorAll(".nav-item, .category-item");
navItems.forEach((item) => {
  item.addEventListener("click", function () {
    const isNavItem = this.classList.contains("nav-item");
    const selector = isNavItem ? ".nav-item" : ".category-item";
    document
      .querySelectorAll(selector)
      .forEach((i) => i.classList.remove("active"));
    this.classList.add("active");
    console.log("Navegando a:", this.textContent.trim());
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
        this.textContent = "¡Link copied!";
        this.style.background = "#28a745";
        this.style.color = "white";
        setTimeout(() => {
          this.textContent = originalText;
          this.style.background = originalBg;
          this.style.color = "#495057";
        }, 2000);
      })
      .catch(() => {
        alert("Enlace: " + url);
      });
  });
}

const firstNavItem = document.querySelector(".nav-item");
if (firstNavItem) {
  firstNavItem.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
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

    const editAvatarBtn = document.querySelector(".edit-avatar");
    if (editAvatarBtn) editAvatarBtn.style.display = "none";
  } catch (err) {
    console.error("Error al leer token:", err);
    localStorage.removeItem("token");
    window.location.href = "/src/html/index.html";
    return;
  }

  if (!userId) return;

  fetch(`/api/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Error al obtener datos del usuario");
      return res.json();
    })
    .then((data) => {
      const emailEl = document.querySelector(".profile-info p");
      if (emailEl) emailEl.textContent = `Email: ${data.user.email}`;
    })
    .catch((err) => {
      console.error("Error al obtener email del usuario:", err);
      localStorage.removeItem("token");
      window.location.href = "/src/html/index.html";
    });
});
