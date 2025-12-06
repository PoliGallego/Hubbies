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
          initCollapsibleSections();
          if (payload && payload.id) {
            innitCategories();
          }
        });
    });
});

function initCollapsibleSections() {
  const collapseNavigationBtn = document.getElementById("CollapseNavigationBtn");
  const collapseCategoriesBtn = document.getElementById("CollapseCategoriesBtn");
  const navigationContent = document.getElementById("NavigationContent");
  const categoriesContent = document.getElementById("CategoriesContent");

  // Load saved states
  const navCollapsed = localStorage.getItem("navigationCollapsed") === "true";
  const catCollapsed = localStorage.getItem("categoriesCollapsed") === "true";

  // Apply saved states
  if (navCollapsed && navigationContent) {
    navigationContent.classList.add("collapsed");
    if (collapseNavigationBtn) {
      collapseNavigationBtn.querySelector("span").textContent = "expand_more";
    }
  }

  if (catCollapsed && categoriesContent) {
    categoriesContent.classList.add("collapsed");
    if (collapseCategoriesBtn) {
      collapseCategoriesBtn.querySelector("span").textContent = "expand_more";
    }
  }

  // Navigation collapse toggle
  collapseNavigationBtn?.addEventListener("click", () => {
    const isCollapsed = navigationContent.classList.toggle("collapsed");
    collapseNavigationBtn.querySelector("span").textContent = isCollapsed ? "expand_more" : "expand_less";
    localStorage.setItem("navigationCollapsed", isCollapsed ? "true" : "false");
  });

  // Categories collapse toggle
  collapseCategoriesBtn?.addEventListener("click", () => {
    const isCollapsed = categoriesContent.classList.toggle("collapsed");
    collapseCategoriesBtn.querySelector("span").textContent = isCollapsed ? "expand_more" : "expand_less";
    localStorage.setItem("categoriesCollapsed", isCollapsed ? "true" : "false");
  });
}

function navEventListener() {
  const navList = document.querySelector(".Navigation .SectionContent > ul");
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
        <div class="ActionIcons category-actions" style="display: none;">
            <button class="IconButton DeleteBtn"><span class="material-icons">delete_outline</span></button>
            <button class="IconButton UpdateBtn"><span class="material-icons">edit</span></button>
        </div>
    </div>`;

  const deleteBtn = newLi.querySelector(".DeleteBtn");
  const editBtn = newLi.querySelector(".UpdateBtn");

  deleteBtn.addEventListener("click", function (e) {
    e.preventDefault();

    // CORRECCIÓN 3: Verificar si la categoría está en los filtros activos
    const catList = document.querySelector(".Categories .SectionContent > ul");
    const currentFilters = catList ? JSON.parse(catList.dataset.filters || "[]") : [];

    if (currentFilters.includes(section.title)) {
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "warning",
          title: "Cannot Delete",
          text: "This category is currently selected in the filters. Remove it from filters first."
        });
      } else {
        alert("This category is currently selected in the filters. Remove it from filters first.");
      }
      return;
    }

    // Proceder con la eliminación
    fetch("/api/sections/" + section._id, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (!res.ok) return res.json().then(err => Promise.reject(err));
        return res.json();
      })
      .then((data) => {
        console.log("Section deleted:", data);
        newLi.remove();
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Category deleted successfully",
            timer: 1500,
            showConfirmButton: false
          });
        }
      })
      .catch((err) => {
        console.error("Error deleting section:", err);
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: err.error || "Error deleting category"
          });
        } else {
          alert("Error: " + (err.error || "Error deleting category"));
        }
      });
  });

  editBtn.addEventListener("click", function (e) {
    e.preventDefault();

    // Verificar si ya hay un input de edición activo en esta categoría
    const existingInput = newLi.querySelector(".NewCategoryInput");
    if (existingInput) {
      // Si existe input, cancelar la edición
      const categoryName = section.title;
      const newA = document.createElement("a");
      newA.href = "/src/html/posts.html";
      newA.textContent = categoryName;

      newLi.querySelector(".CategoriesRow").replaceChild(newA, existingInput);
      newLi.dataset.editingInput = "false";
      delete newLi.dataset.originalName;
      console.log("Edición cancelada para:", categoryName);
      return;
    }

    // Si no hay input activo, crear uno nuevo
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Update category title";
    input.value = section.title;
    input.className = "NewCategoryInput"; // Mismo estilo que crear
    input.autofocus = true;

    // Guardar referencia del input en la tarjeta para poder cancelarlo luego
    newLi.dataset.editingInput = "true";
    newLi.dataset.originalName = section.title;

    newLi
      .querySelector(".CategoriesRow")
      .replaceChild(input, newLi.querySelector("a"));
    input.focus();

    input.addEventListener("keydown", function (e) {
      const categoryName = input.value.trim();
      const newA = document.createElement("a");
      newA.href = "/src/html/posts.html";
      newA.textContent = section.title;

      if (
        e.key === "Enter" &&
        categoryName !== "" &&
        categoryName !== section.title
      ) {

        // Validar longitud
        if (categoryName.length > 20) {
          if (typeof Swal !== "undefined") {
            Swal.fire({
              icon: "warning",
              title: "Name too long",
              text: "Section name must not exceed 20 characters",
              timer: 2000,
              showConfirmButton: false
            });
          }
          return;
        }

        // Validar que no sea muy corto
        if (categoryName.length < 3) {
          if (typeof Swal !== "undefined") {
            Swal.fire({
              icon: "warning",
              title: "Name too short",
              text: "Section name must be at least 3 characters",
              timer: 2000,
              showConfirmButton: false
            });
          }
          return;
        }

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
            if (!res.ok) return res.json().then(err => Promise.reject(err));
            return res.json();
          })
          .then((data) => {
            console.log("Section updated:", data);
            newA.textContent = data.section.title;
            newLi.querySelector(".CategoriesRow").replaceChild(newA, input);
            newLi.dataset.editingInput = "false";
            section.title = data.section.title;
            filterAll();

            // Éxito con SweetAlert
            if (typeof Swal !== "undefined") {
              Swal.fire({
                icon: "success",
                title: "Updated!",
                text: "Category updated successfully",
                timer: 1500,
                showConfirmButton: false
              });
            }
          })
          .catch((err) => {
            console.error("Error updating category:", err);

            // Mostrar error con SweetAlert
            if (typeof Swal !== "undefined") {
              Swal.fire({
                icon: "error",
                title: "Error",
                text: err.error || "Error updating category"
              });
            } else {
              alert("Error: " + (err.error || "Error updating category"));
            }

            // Volver a mostrar el input para reintentar
            newLi.querySelector(".CategoriesRow").replaceChild(input, newA);
            input.focus();
          });
      } else if (e.key === "Escape") {
        newA.textContent = section.title;
        newLi.querySelector(".CategoriesRow").replaceChild(newA, input);
        newLi.dataset.editingInput = "false";
      } else if (e.key === "Enter" && categoryName === "") {
        // Si presiona Enter sin contenido, cancelar
        newA.textContent = section.title;
        newLi.querySelector(".CategoriesRow").replaceChild(newA, input);
        newLi.dataset.editingInput = "false";
      }
    });
  });

  return newLi;
}

function innitCategories() {
  const AddSectionBtn = document.getElementById("AddCategory");
  const EditCategoriesBtn = document.getElementById("EditCategoriesBtn");
  const categoriesList = document.querySelector(".Categories .SectionContent > ul");
  const noCategoriesMsg = document.querySelector(".Categories .SectionContent .NotFound");
  const viewMoreBtn = document.querySelector(".Categories .SectionContent .ViewMoreButton");
  let expanded = false;
  let editMode = false;
  let viewMoreListener = null; // Guardar referencia del listener

  // Toggle edit mode for categories
  EditCategoriesBtn?.addEventListener("click", () => {
    console.log("Edit button clicked!");
    editMode = !editMode;
    const actionIcons = document.querySelectorAll(".Categories .category-actions");
    console.log("Found action icons:", actionIcons.length);
    actionIcons.forEach(icon => {
      icon.style.display = editMode ? "flex" : "none";
      console.log("Setting display to:", editMode ? "flex" : "none");
    });

    // Si se desactiva el modo edición, cancelar cualquier edición en curso
    if (!editMode) {
      const categoryList = document.querySelector(".Categories .SectionContent > ul");
      if (categoryList) {
        const editingItems = categoryList.querySelectorAll("[data-editing-input='true']");
        editingItems.forEach(item => {
          const input = item.querySelector(".NewCategoryInput");
          if (input) {
            // Obtener el nombre original del atributo data que guardamos
            const originalName = item.dataset.originalName || input.value;
            const newA = document.createElement("a");
            newA.href = "/src/html/posts.html";
            newA.textContent = originalName;

            const categoriesRow = item.querySelector(".CategoriesRow");
            categoriesRow.replaceChild(newA, input);
            item.dataset.editingInput = "false";
            delete item.dataset.originalName; // Limpiar el atributo

            console.log("Cancelada edición en curso para:", originalName);
          }
        });
      }
    }

    // Change button appearance
    if (editMode) {
      EditCategoriesBtn.classList.add("active");
    } else {
      EditCategoriesBtn.classList.remove("active");
    }
  });

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

          // Invertir el array para mostrar los más recientes primero
          data.reverse();

          // Crear los elementos con appendChild
          for (let index = 0; index < data.length; index++) {
            const li = createSectionCard(data[index]);
            // Los primeros 6 items (índices 0-5) se muestran, a partir del 6 se ocultan
            if (index >= 4) {
              li.classList.add("ExtraItem");
            }
            categoriesList.appendChild(li);
          }
          const extraItems = document.querySelectorAll(
            ".Categories .SectionContent .ExtraItem"
          );
          if (viewMoreBtn) {
            console.log("Extras", extraItems);
            if (!extraItems || extraItems.length === 0) {
              viewMoreBtn.style.display = "none";
            } else {
              viewMoreBtn.style.display = "flex";

              // Remover listener anterior si existe
              if (viewMoreListener) {
                viewMoreBtn.removeEventListener("click", viewMoreListener);
              }

              // Crear nuevo listener
              viewMoreListener = function () {
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
              };

              // Agregar nuevo listener
              viewMoreBtn.addEventListener("click", viewMoreListener);
            }
          }
        }
        document.dispatchEvent(new CustomEvent("categories:ready"));
      });
  }

  AddSectionBtn?.addEventListener("click", () => {
    if (!categoriesList) return;

    // Check if input already exists
    const existingInput = categoriesList.querySelector(".NewCategoryInput");
    if (existingInput) {
      // Remove the input if it already exists (toggle behavior)
      existingInput.parentElement.remove();
      return;
    }

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
        const trimmedValue = input.value.trim();

        // CORRECCIÓN 1: Validar longitud máxima PRIMERO
        if (trimmedValue.length > 20) {
          if (typeof Swal !== "undefined") {
            Swal.fire({
              icon: "warning",
              title: "Name too long",
              text: "Section name must not exceed 20 characters",
              timer: 2000,
              showConfirmButton: false
            });
          }
          return;
        }

        // CORRECCIÓN 1: Validar longitud MÍNIMA ANTES de enviar
        if (trimmedValue.length < 3) {
          if (typeof Swal !== "undefined") {
            Swal.fire({
              icon: "warning",
              title: "Name too short",
              text: "Section name must be at least 3 characters",
              timer: 2000,
              showConfirmButton: false
            });
          }
          return;
        }

        const categoryName = trimmedValue;

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
            if (!res.ok) return res.json().then(err => Promise.reject(err));
            return res.json();
          })
          .then((data) => {
            console.log("Section created:", data);
            const newLi = createSectionCard(data.section);

            // CORRECCIÓN: Mostrar botones de edición si estamos en modo edición
            const actionIcons = newLi.querySelector(".category-actions");
            if (actionIcons && editMode) {
              actionIcons.style.display = "flex";
            }

            categoriesList.replaceChild(newLi, li);
            noCategoriesMsg.style.display = "none";
            if (typeof Swal !== "undefined") {
              Swal.fire({
                icon: "success",
                title: "Created!",
                text: "Category created successfully",
                timer: 1500,
                showConfirmButton: false
              });
            }
          })
          .catch((err) => {
            console.error("Error creating category:", err);
            categoriesList.removeChild(li);
            if (typeof Swal !== "undefined") {
              Swal.fire({
                icon: "error",
                title: "Error",
                text: err.error || "Error creating category"
              });
            } else {
              alert("Error: " + (err.error || "Error creating category"));
            }
          });
      } else if (e.key === "Escape") {
        categoriesList.removeChild(li);
      }
    });
  });
}

window.renderNavPosts = function (posts) {
  const viewMoreBtn = document.querySelector(".Navigation .SectionContent .ViewMoreButton");
  const postsList = document.querySelector(".Navigation .SectionContent > ul");
  const noPostsMsg = document.querySelector(".Navigation .SectionContent .NotFound");
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
        const icon = "article";

        newLi.innerHTML = `
            <div class="NavigationRow">
            <a href="/src/html/posts.html" post-id="${posts[i]._id}">
            <span class="material-icons" style="font-size: 18px; margin-right: 8px; vertical-align: middle;">${icon}</span>
            ${posts[i].title}</a>
            </div>`;
        if (i > 7) {
          newLi.setAttribute("class", "ExtraItem");
        }

        navEventListener();
        postsList.appendChild(newLi);
      }

      const extraItems = document.querySelectorAll(".Navigation .SectionContent .ExtraItem");
      if (viewMoreBtn) {
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
  }
};

function innitNavBar() {
  const homeBtn = document.getElementById("HomeBtn");

  if (homeBtn) {
    if (window.location.pathname.includes("posts.html")) {
      // Desactivar en posts.html
      homeBtn.classList.add("disabled");
      homeBtn.onclick = null;
      homeBtn.style.cursor = "default";

    } else {
      // Activar en otras páginas
      homeBtn.classList.remove("disabled");
      homeBtn.onclick = function () {
        window.location.href = '/src/html/posts.html';
      };
      homeBtn.style.cursor = "pointer";
    }
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
