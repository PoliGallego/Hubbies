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

      // ⭐ APLICAR FILTRO SEGÚN LA VISTA ACTUAL
      applyCurrentViewWithFilters();
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

async function fetchBoards() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/src/html/index.html";
    return;
  }

  const res = await fetch("/api/boards/my", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error("Error fetching boards");

  const data = await res.json();
  console.log("fetchBoards response:", res);
  console.log("Boards recibidos:", data);
  return data.success ? data.boards : [];


}

// ⭐ NUEVA FUNCIÓN: Aplicar la vista actual con filtros
function applyCurrentViewWithFilters() {
  const currentView = document.querySelector('input[name="feedView"]:checked')?.value || 'all';

  if (currentView === 'posts') {
    loadUserPosts();
  } else if (currentView === 'boards') {
    loadUserBoards();
  } else if (currentView === 'all') {
    loadUserFeedAll();
  }
}

function filterPostsByCat(posts) {
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
      console.log("Posts filtrados por categorías:", filters);
    }
  }
  return posts;
}

function filterBoardsByCat(boards) {
  const catList = document.querySelector(".Categories > ul");
  if (catList && catList.dataset.filters) {
    const filters = JSON.parse(catList.dataset.filters || "[]");
    if (filters.length > 0) {
      boards = boards.filter(
        (board) =>
          board.categories &&
          board.categories.length > 0 &&
          filters.every((catTitle) => {
            // Convertir IDs de categorías del board a títulos usando sectionsMap
            const boardCategoryTitles = board.categories.map(
              (catId) => window.sectionsMap?.[catId] || ""
            );
            return boardCategoryTitles.includes(catTitle);
          })
      );
      console.log("Boards filtrados por categorías:", filters);
    }
  }
  return boards;
}

function orderBy(items, type) {
  const dropdown = document.getElementById("FilterDropdown");
  const checked = dropdown?.querySelector("input:checked");
  const filterType = checked?.id?.replace("filterBy", "").toLowerCase();

  if (!items || !Array.isArray(items)) return items;

  // Función para obtener el título de la categoría
  const getCategoryTitle = (obj) => {
    if (!obj.categories || obj.categories.length === 0) return "";
    if (type === "post") {
      return obj.categories[0]?.title || "";
    }
    if (type === "board") {
      return window.sectionsMap?.[obj.categories[0]] || "";
    }
    return "";
  };

  switch (filterType) {
    case "date":
      return items.sort(
        (a, b) =>
          new Date(a.updatedAt || a.createdAt) -
          new Date(b.updatedAt || b.createdAt)
      );
    case "title":
      return items.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    case "section":
      return items.sort((a, b) =>
        getCategoryTitle(a).localeCompare(getCategoryTitle(b))
      );
    default:
      return items;
  }
}

function search(query, items, type) {
  if (!query) return items;
  if (!items) return [];

  return items.filter(item => {
    if (type === "post") return item.title?.toLowerCase().includes(query.toLowerCase());
    if (type === "board") return item.title?.toLowerCase().includes(query.toLowerCase());
    return false;
  });
}

async function filterAll() {
  const searchBar = document.getElementById("SearchBar");
  const query = searchBar.dataset.query || "";
  searchBar.value = query;

  const currentView = document.querySelector('input[name="feedView"]:checked')?.value || "all";

  try {
    if (currentView === "posts") {
      let posts = await fetchPosts();
      posts = search(query, posts, "post");
      posts = filterPostsByCat(posts);
      posts = orderBy(posts, "post");

      window.renderPosts(posts);
    }

    else if (currentView === "boards") {
      let boards = await fetchBoards();
      boards = search(query, boards, "board");
      boards = filterBoardsByCat(boards);
      boards = orderBy(boards, "board");

      renderBoards(boards);
    }

    else { // VISTA "ALL"
      let [posts, boards] = await Promise.all([fetchPosts(), fetchBoards()]);

      posts = search(query, posts, "post");
      posts = filterPostsByCat(posts);
      posts = orderBy(posts, "post");

      boards = search(query, boards, "board");
      boards = filterBoardsByCat(boards);
      boards = orderBy(boards, "board");

      const dropdown = document.getElementById("FilterDropdown");
      const checked = dropdown?.querySelector("input:checked");
      const filterType = checked?.id?.replace("filterBy", "").toLowerCase();

      let unifiedFeed = [];

      if (filterType === "date") {
        // MÁS ANTIGUO → MÁS RECIENTE
        unifiedFeed = [
          ...posts.map(p => ({ type: "post", data: p, date: new Date(p.updatedAt || p.createdAt) })),
          ...boards.map(b => ({ type: "board", data: b, date: new Date(b.updatedAt || b.createdAt) }))
        ].sort((a, b) => a.date - b.date); // <-- Cambio aquí, ascendente
      } else if (filterType === "title") {
        unifiedFeed = [
          ...posts.map(p => ({ type: "post", data: p, title: p.title })),
          ...boards.map(b => ({ type: "board", data: b, title: b.title }))
        ].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      } else if (filterType === "section") {
        const getCategoryTitle = obj =>
          obj.type === "post"
            ? obj.data.categories?.[0]?.title || ""
            : window.sectionsMap?.[obj.data.categories?.[0]] || "";

        unifiedFeed = [
          ...posts.map(p => ({ type: "post", data: p })),
          ...boards.map(b => ({ type: "board", data: b }))
        ].sort((a, b) => getCategoryTitle(a).localeCompare(getCategoryTitle(b)));
      } else {
        // Default: posts primero, boards después
        unifiedFeed = [
          ...posts.map(p => ({ type: "post", data: p, date: new Date(p.updatedAt || p.createdAt) })),
          ...boards.map(b => ({ type: "board", data: b, date: new Date(b.updatedAt || b.createdAt) }))
        ];
      }

      renderUnifiedFeed(unifiedFeed);
    }

  } catch (err) {
    console.error("Error al filtrar:", err);
  }
}
