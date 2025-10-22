document.addEventListener("categories:ready", () => {
  const catList = document.querySelector(".Categories > ul");
  if (catList) {
    catList.dataset.filters = JSON.stringify([]);

    catList.addEventListener("click", async function (e) {
      const a = e.target.closest("a");
      if (!a) return;
      e.preventDefault();

      if (!window.location.pathname.includes("posts.html")) {
        window.location.assign("/src/html/posts.html");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        window.location.assign("/src/html/index.html");
        return;
      }

      const res = await fetch("/api/posts/my-posts", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Error fetching posts");

      let posts = await res.json();
      let filters = JSON.parse(catList.dataset.filters || "[]");

      // --- Añadir o quitar categoría del filtro ---
      if (!filters.includes(a.textContent)) {
        a.style.backgroundColor = "#e2d1d1";
        filters.push(a.textContent);
      } else {
        a.style.backgroundColor = "";
        filters = filters.filter((f) => f !== a.textContent);
      }
      catList.dataset.filters = JSON.stringify(filters);

      // --- Filtrar los posts ---
      if (filters.length > 0) {
        posts = posts.filter((post) => {
          return (
            post.categories &&
            filters.every((cat) => post.categories.some((c) => c.title === cat))
          );
        });
      } else {
        // ✅ Si se quitaron todos los filtros de categoría, también quitamos el ordenamiento activo
        const dropdown = document.getElementById("FilterDropdown");
        if (dropdown) {
          const checked = dropdown.querySelector(
            "input[type='checkbox']:checked"
          );
          if (checked) {
            checked.checked = false;
            console.log(
              "🧹 Filtro de categoría eliminado → limpiando ordenamiento activo."
            );

            // --- Recargamos todos los posts sin orden ---
            const token = localStorage.getItem("token");
            const res = await fetch("/api/posts/my-posts", {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            if (res.ok) {
              posts = await res.json();
            }
          }
        }
      }

      window.renderPosts(posts);
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("FilterToggleBtn");
  const dropdown = document.getElementById("FilterDropdown");

  if (!toggleBtn || !dropdown) return;

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== toggleBtn) {
      dropdown.classList.remove("show");
    }
  });

  const checkboxes = dropdown.querySelectorAll("input[type='checkbox']");
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", async () => {
      checkboxes.forEach((other) => {
        if (other !== cb) other.checked = false;
      });

      const filterType = cb.id.replace("filterBy", "").toLowerCase();

      if (cb.checked) {
        console.log("🔹 Ordenar por:", filterType);

        try {
          const token = localStorage.getItem("token");
          if (!token) {
            window.location.href = "/src/html/index.html";
            return;
          }

          const res = await fetch("/api/posts/my-posts", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) throw new Error("Error fetching posts");

          let posts = await res.json();

          const catList = document.querySelector(".Categories > ul");
          if (catList && catList.dataset.filters) {
            const filters = JSON.parse(catList.dataset.filters || "[]");
            if (filters.length > 0) {
              posts = posts.filter(
                (post) =>
                  post.categories &&
                  filters.every((cat) =>
                    post.categories.some((c) => c.title === cat)
                  )
              );
              console.log("Aplicando orden a posts filtrados:", filters);
            }
          }

          switch (filterType) {
            case "date":
              posts.sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
              );
              break;

            case "title":
              posts.sort((a, b) => a.title.localeCompare(b.title));
              break;

            case "section":
              posts.sort((a, b) => {
                const aCat =
                  a.categories?.[0]?.title || a.categories?.[0] || "";
                const bCat =
                  b.categories?.[0]?.title || b.categories?.[0] || "";
                return aCat.localeCompare(bCat);
              });
              break;

            default:
              console.warn("Filtro desconocido:", filterType);
          }

          window.renderPosts(posts);
        } catch (error) {
          console.error("Error al aplicar filtro:", error);
        }
      } else {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("/api/posts/my-posts", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) throw new Error("Error fetching posts");
          let posts = await res.json();

          const catList = document.querySelector(".Categories > ul");
          if (catList && catList.dataset.filters) {
            const filters = JSON.parse(catList.dataset.filters || "[]");
            if (filters.length > 0) {
              posts = posts.filter(
                (post) =>
                  post.categories &&
                  filters.every((cat) =>
                    post.categories.some((c) => c.title === cat)
                  )
              );
            }
          }

          window.renderPosts(posts);
        } catch (error) {
          console.error("Error al recargar posts:", error);
        }
      }
    });
  });
});
