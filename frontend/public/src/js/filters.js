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

      // Si se quitaron todos los filtros de categoría, también quitamos el ordenamiento activo
      if (filters.length === 0) {
        const dropdown = document.getElementById("FilterDropdown");
        if (dropdown) {
          const checked = dropdown.querySelector("input[type='checkbox']:checked");
          if (checked) {
            checked.checked = false;
            console.log("Filtro de categoría eliminado → limpiando ordenamiento activo.");
          }
        }
      }
      // --- Filtrar los posts ---
      filterAll();
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("FilterToggleBtn");
  const dropdown = document.getElementById("FilterDropdown");
  const searchBar = document.getElementById("SearchBar");
  const searchBtn = document.getElementById("SearchBtn");

  searchBtn.addEventListener("click", () => {
    searchBar.dataset.query = searchBar.value.trim();
    filterAll();
  });
  searchBar.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      searchBar.dataset.query = searchBar.value.trim();
      filterAll();
    }
  });

  searchBar.addEventListener("focusout", () => {
    if (searchBar.dataset.query !== searchBar.value.trim()) {
      searchBar.value = searchBar.dataset.query || "";
    }
  });

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

      filterAll();
    });
  });
});

async function fetchPosts() {
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

  return await res.json();
}

function filterByCat(posts) {
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

  return posts;
}

function orderBy(posts) {
  let filterType;
  const dropdown = document.getElementById("FilterDropdown");
  if (dropdown) {
    const checked = dropdown.querySelector("input[type='checkbox']:checked");
    if (checked && checked.checked) {
      filterType = checked.id.replace("filterBy", "").toLowerCase();
      console.log("Ordenar por:", filterType);
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

    case undefined:
      break;

    default:
      console.warn("Filtro desconocido:", filterType);
  }

  return posts;
}

function search(query, posts) {
  if (query && query !== "" && posts && posts.size !== 0) {
    posts = posts.filter((post) => post.title.includes(query));
    console.log("Query: ", query);
  }

  return posts;
}

async function filterAll() {
  const searchBar = document.getElementById("SearchBar");
  const query = searchBar.dataset.query || "";

  searchBar.value = query;

  try {
    let posts = await fetchPosts();
    posts = search(query, posts);
    posts = filterByCat(posts);
    posts = orderBy(posts);

    window.renderPosts(posts);
  } catch (error) {
    console.warn("Error en el fetch");
  }
}
