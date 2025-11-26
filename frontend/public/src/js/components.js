const token = localStorage.getItem("token");
let payload = null;

if (token) {
  try {
    payload = JSON.parse(atob(token.split(".")[1]));
  } catch (err) {
    console.error("Error parsing token:", err);
  }
}

// Theme Management Functions
function applyInitialTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

function initThemeToggle() {
  const toggleContainer = document.querySelector(".ToggleContainer");
  if (toggleContainer) {
    const currentTheme = localStorage.getItem("theme") || "light";
    if (currentTheme === "dark") {
      toggleContainer.classList.add("on");
    }

    toggleContainer.addEventListener("click", toggleTheme);
  }
}

function toggleTheme() {
  const toggleContainer = document.querySelector(".ToggleContainer");
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  if (toggleContainer) {
    toggleContainer.classList.toggle("on", newTheme === "dark");
  }
}

// Apply theme immediately before DOMContentLoaded
applyInitialTheme();

document.addEventListener("DOMContentLoaded", () => {
  fetch("../html/components/navbar.html")
    .then((res) => res.text())
    .then((html) => {
      document.getElementById("navbar").innerHTML = html;

      innitNavBar();
      initThemeToggle(); // Initialize theme toggle after navbar loads

      fetch("../html/components/sidebar.html")
        .then((res) => res.text())
        .then((html) => {
          document.getElementById("sidebar").innerHTML = html;

          const sidebar = document.getElementById("LeftSidebar");
          const toggleBtn = document.getElementById("SidebarToggleBtn");

          if (sidebar && toggleBtn) {
            document.body.appendChild(toggleBtn);

            const savedState = localStorage.getItem("leftSidebarCollapsed");
            const isCollapsed = savedState === "true";

            if (isCollapsed) {
              sidebar.classList.add("Collapsed");
              toggleBtn.classList.add("collapsed");
              toggleBtn.querySelector("span.material-icons").textContent =
                "chevron_right";
              toggleBtn.setAttribute("aria-expanded", "false");
            } else {
              sidebar.classList.remove("Collapsed");
              toggleBtn.classList.remove("collapsed");
              toggleBtn.querySelector("span.material-icons").textContent =
                "chevron_left";
              toggleBtn.setAttribute("aria-expanded", "true");
            }

            toggleBtn.addEventListener("click", () => {
              const collapsed = sidebar.classList.toggle("Collapsed");
              toggleBtn.classList.toggle("collapsed", collapsed);

              const icon = toggleBtn.querySelector("span.material-icons");
              icon.textContent = collapsed ? "chevron_right" : "chevron_left";

              toggleBtn.setAttribute("aria-expanded", String(!collapsed));

              try {
                localStorage.setItem(
                  "leftSidebarCollapsed",
                  collapsed ? "true" : "false"
                );
              } catch (err) {
                console.error("Error al guardar en localStorage:", err);
              }
            });
          }

          navEventListener();
          if (payload && payload.id) {
            innitCategories();
          }
        });
    });
});

function navEventListener() {
  const navList = document.querySelector(".Navigation > ul");
  if (!navList) return;

  navList.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    e.preventDefault();

    const postId = a.getAttribute("post-id");
    const boardId = a.getAttribute("board-id");

    // === 📌 Scroll para POSTS ===
    if (postId) {
      const post = document.querySelector(`.Publication[data-post-id="${postId}"]`);
      if (post) {
        window.scrollTo({
          top: post.getBoundingClientRect().top + window.scrollY - 100,
          behavior: "smooth",
        });
      }
      return;
    }

    // === 📌 Scroll para BOARDS ===
    if (boardId) {
      const board = document.querySelector(`.Publication[data-board-id="${boardId}"]`);
      if (board) {
        window.scrollTo({
          top: board.getBoundingClientRect().top + window.scrollY - 100,
          behavior: "smooth",
        });
      }
    }
  });
}

function createSectionCard(section) {
  const newLi = document.createElement("li");
  newLi.innerHTML = `
    <div class="CategoriesRow">
        <a href="/src/html/posts.html">${section.title}</a>
        <input type="hidden" value="${section._id}">
        <div class="ActionIcons">
            <button class="IconButton DeleteBtn"><span class="material-icons">delete_outline</span></button>
            <button class="IconButton UpdateBtn"><span class="material-icons">edit</span></button>
        </div>
    </div>`;

  const deleteBtn = newLi.querySelector(".DeleteBtn");
  const editBtn = newLi.querySelector(".UpdateBtn");

  deleteBtn.addEventListener("click", function (e) {
    e.preventDefault();
    fetch("/api/sections/" + section._id, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error deleting section");
        return res.json();
      })
      .then((data) => {
        console.log("Section deleted:", data);
        newLi.remove();
      })
      .catch((err) => {
        console.error("Error deleting section:", err);
      });
    console.log("Delete section:", section.title);
  });

  editBtn.addEventListener("click", function (e) {
    e.preventDefault();
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Update category title";
    input.value = section.title;
    input.className = "NewSectionInput";
    input.autofocus = true;
    newLi
      .querySelector(".CategoriesRow")
      .replaceChild(input, newLi.querySelector("a"));
    input.focus();

    input.addEventListener("keydown", function (e) {
      const categoryName = input.value.trim();
      const newA = document.createElement("a");
      newA.href = "#";

      if (
        e.key === "Enter" &&
        categoryName !== "" &&
        categoryName !== section.title
      ) {
        fetch("/api/sections/update", {
          method: "PUT",
          body: JSON.stringify({
            id: section._id,
            title: categoryName,
            descrip: section.descrip,
            type: section.type,
            privacy: section.privacy,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((res) => {
            if (!res.ok) throw new Error("Error creating category");
            return res.json();
          })
          .then((data) => {
            console.log("Section updated:", data);
            newA.textContent = data.section.title;
            newLi.querySelector(".CategoriesRow").replaceChild(newA, input);
            section.title = data.section.title;
          })
          .catch((err) => {
            console.error("Error updating category:", err);
          });
      } else if (e.key === "Escape" || e.key === "Enter") {
        newA.textContent = section.title;
        newLi.querySelector(".CategoriesRow").replaceChild(newA, input);
      }
    });
  });

  return newLi;
}

function innitCategories() {
  const AddSectionBtn = document.getElementById("AddCategory");
  const categoriesList = document.querySelector(".Categories > ul");
  const noCategoriesMsg = document.querySelector(".Categories .NotFound");
  const viewMoreBtn = document.querySelector(".Categories .ViewMoreButton");
  let expanded = false;

  if (categoriesList) {
    fetch("/api/sections/" + payload.id, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error fetching sections");
        return res.json();
      })
      .then((data) => {
        if (data.length === 0) {
          if (noCategoriesMsg) {
            noCategoriesMsg.style.display = "block";
          }
        } else {
          noCategoriesMsg.style.display = "none";
          for (let index = 0; index < data.length; index++) {
            const li = createSectionCard(data[index]);
            if (data.length - index >= 7) {
              li.classList.add("ExtraItem");
            }
            categoriesList.prepend(li);
          }
          const extraItems = document.querySelectorAll(
            ".Categories .ExtraItem"
          );
          if (viewMoreBtn) {
            console.log("Extras", extraItems);
            if (!extraItems || extraItems.length === 0) {
              viewMoreBtn.style.display = "none";
            } else {
              viewMoreBtn.style.display = "flex";
            }
            viewMoreBtn.addEventListener("click", function () {
              expanded = !expanded;
              extraItems.forEach(function (item) {
                item.setAttribute("class", expanded ? "" : "ExtraItem");
              });
              viewMoreBtn.querySelector("span").textContent = expanded
                ? "expand_less"
                : "expand_more";
              viewMoreBtn.childNodes[0].textContent = expanded
                ? "View less"
                : "View more";
            });
          }
        }
        document.dispatchEvent(new CustomEvent("categories:ready"));
      });
  }

  AddSectionBtn?.addEventListener("click", () => {
    if (!categoriesList) return;

    if (categoriesList.querySelector(".NewCategoryInput")) return;

    const li = document.createElement("li");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "New category title";
    input.className = "NewCategoryInput";
    input.autofocus = true;

    li.appendChild(input);
    categoriesList.prepend(li);
    input.focus();

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && input.value.trim() !== "") {
        if (input.value.trim().length > 2) {
          const categoryName = input.value.trim();

          fetch("/api/sections/create", {
            method: "POST",
            body: JSON.stringify({
              title: categoryName,
              idUser: payload?.id,
              type: "category",
              privacy: "private",
            }),
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((res) => {
              if (!res.ok) throw new Error("Error creating category");
              return res.json();
            })
            .then((data) => {
              console.log("Section created:", data);
              const newLi = createSectionCard(data.section);
              categoriesList.replaceChild(newLi, li);
              noCategoriesMsg.style.display = "none";
            })
            .catch((err) => {
              console.error("Error creating category:", err);
              categoriesList.removeChild(li);
            });
        } else {
          alert("Section name too short");
        }
      } else if (e.key === "Escape") {
        categoriesList.removeChild(li);
      }
    });
  });
}

window.renderNavPosts = function (posts) {
  const viewMoreBtn = document.querySelector(".Navigation .ViewMoreButton");
  const postsList = document.querySelector(".Navigation > ul");
  const noPostsMsg = document.querySelector(".Navigation .NotFound");
  let expanded = false;

  if (postsList) {
    postsList.innerHTML = ``;
    if (posts.length === 0) {
      if (noPostsMsg) {
        noPostsMsg.style.display = "block";
      }
    } else {
      noPostsMsg.style.display = "none";
      for (let i = 0; i < posts.length; i++) {
        const newLi = document.createElement("li");

        newLi.innerHTML = `
            <div class="NavigationRow">
            <a href="/src/html/posts.html" post-id="${posts[i]._id}">${posts[i].title}</a>
            </div>`;
        if (i > 7) {
          newLi.setAttribute("class", "ExtraItem");
        }

        navEventListener();
        postsList.appendChild(newLi);
      }

      const extraItems = document.querySelectorAll(".Navigation .ExtraItem");
      if (viewMoreBtn) {
        if (!extraItems || extraItems.length === 0) {
          viewMoreBtn.style.display = "none";
        } else {
          viewMoreBtn.style.display = "block";
        }
        viewMoreBtn.addEventListener("click", function () {
          expanded = !expanded;
          extraItems.forEach(function (item) {
            item.setAttribute("class", expanded ? "" : "ExtraItem");
          });
          viewMoreBtn.querySelector("span").textContent = expanded
            ? "expand_less"
            : "expand_more";
          viewMoreBtn.childNodes[0].textContent = expanded
            ? "View less"
            : "View more";
        });
      }
    }
  }
};

function innitNavBar() {
  const homeBtn = document.getElementById("HomeBtn");
  if (homeBtn && window.location.pathname.includes("posts.html")) {
    homeBtn.style.display = "none";
  }

  const optionsBtnImg = document.querySelector("#OptionsBtn .UserAvatar");
  if (token && optionsBtnImg) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.avatar) {
        optionsBtnImg.src = `/assets/uploads/${payload.avatar}`;
        optionsBtnImg.alt = `Avatar de ${payload.username}`;
      }
    } catch (err) {
      console.error("Error al leer avatar desde el token:", err);
    }
  }

  const optionsModal = document.getElementById("OptionsModal");
  if (optionsModal) {
    const profileOption = optionsModal.querySelector(
      "li a[href*='perfil-usuario.html']"
    );
    const configOption = optionsModal.querySelector(
      "li a[href*='configuracion.html']"
    );

    if (
      window.location.pathname.includes("perfil-usuario.html") &&
      profileOption
    ) {
      profileOption.parentElement.style.display = "none";
    }

    if (
      window.location.pathname.includes("configuracion.html") &&
      configOption
    ) {
      configOption.parentElement.style.display = "none";
    }
  }
}
