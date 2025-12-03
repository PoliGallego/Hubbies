document.addEventListener("categories:ready", () => {
  const catList = document.querySelector(".Categories .SectionContent > ul");
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
    executeSearch();
  });

  searchBar.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      executeSearch();
    }
  });

  searchBar.addEventListener("input", () => {
    if (searchBar.value.trim() === "") {
      searchBar.setAttribute("list", "");
    } else {
      searchBar.setAttribute("list", "SearchList");
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

document.addEventListener("DOMContentLoaded", async () => {
  await loadInitialSearchSuggestions();
});

async function loadInitialSearchSuggestions() {
  const currentView = document.querySelector('input[name="feedView"]:checked')?.value || "all";

  if (currentView === "posts") {
    const posts = await fetchPosts();
    fillSearchSuggestions(posts, []);
  }

  else if (currentView === "boards") {
    const boards = await fetchBoards();
    fillSearchSuggestions([], boards);
  }

  else { // ALL
    const [posts, boards] = await Promise.all([
      fetchPosts(),
      fetchBoards()
    ]);
    fillSearchSuggestions(posts, boards);
  }
}

function executeSearch() {
  const searchBar = document.getElementById("SearchBar");
  searchBar.dataset.query = searchBar.value.trim();
  filterAll();
}

function fillSearchSuggestions(posts = [], boards = []) {
  const datalist = document.getElementById("SearchList");
  if (!datalist) return;

  datalist.innerHTML = "";

  // Agregar posts
  posts.forEach(post => {
    const option = document.createElement('option');
    option.value = post.title;
    datalist.appendChild(option);
  });

  // Agregar boards
  boards.forEach(board => {
    const option = document.createElement('option');
    option.value = board.title;
    datalist.appendChild(option);
  });
}

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
  const catList = document.querySelector(".Categories .SectionContent > ul");
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
  const catList = document.querySelector(".Categories .SectionContent > ul");
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

  // Orden base: primero pinned, luego normales
  items = items.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (a.pinned && b.pinned) {
      return new Date(b.pinnedAt || 0) - new Date(a.pinnedAt || 0);
    }
    const dateA = new Date(a.originalCreatedAt || a.createdAt);
    const dateB = new Date(b.originalCreatedAt || b.createdAt);
    return dateB - dateA;
  });

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

  // Aplicar filtros de dropdown
  switch (filterType) {
    case "date":
      return items.sort(
        (a, b) =>
          new Date(a.originalCreatedAt || a.createdAt) -
          new Date(b.originalCreatedAt || b.createdAt)
      );

    case "title":
      return items.sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    case "section":
      return items.sort((a, b) =>
        getCategoryTitle(a).localeCompare(getCategoryTitle(b))
      );

    default:
      // Por defecto ya devolvemos orden con pinned arriba
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
      window.renderNavPosts(posts);

      fillSearchSuggestions(posts, []);
    }

    else if (currentView === "boards") {
      let boards = await fetchBoards();
      boards = search(query, boards, "board");
      boards = filterBoardsByCat(boards);
      boards = orderBy(boards, "board");

      renderBoards(boards);
      fillSearchSuggestions([], boards);
    }

    else { // VISTA "ALL"
      let [posts, boards] = await Promise.all([fetchPosts(), fetchBoards()]);

      // Aplicar búsqueda y filtros (SIN ordenar todavía)
      posts = search(query, posts, "post");
      posts = filterPostsByCat(posts);

      boards = search(query, boards, "board");
      boards = filterBoardsByCat(boards);

      // ⭐ Unificar SIN ordenar previamente
      const unifiedFeed = [
        ...posts.map(p => ({ type: "post", data: p })),
        ...boards.map(b => ({ type: "board", data: b }))
      ];

      // ⭐ ÚNICO ordenamiento: aquí se aplica a posts y boards juntos
      const dropdown = document.getElementById("FilterDropdown");
      const checked = dropdown?.querySelector("input:checked");
      const filterType = checked?.id?.replace("filterBy", "").toLowerCase();

      unifiedFeed.sort((a, b) => {
        const aData = a.data;
        const bData = b.data;

        // 1. Pineados van primero
        if (aData.pinned && !bData.pinned) return -1;
        if (!aData.pinned && bData.pinned) return 1;

        // 2. Entre pineados, por fecha de pinned (más reciente primero)
        if (aData.pinned && bData.pinned) {
          return new Date(bData.pinnedAt || 0) - new Date(aData.pinnedAt || 0);
        }

        // 3. Entre NO pineados, aplicar el filtro activo
        switch (filterType) {
          case "date":
            const dateA = new Date(aData.originalCreatedAt || aData.createdAt);
            const dateB = new Date(bData.originalCreatedAt || bData.createdAt);
            return dateA - dateB; // Ascendente

          case "title":
            return (aData.title || "").localeCompare(bData.title || "");

          case "section":
            const getCategoryTitle = (item) => {
              if (!item.data.categories || item.data.categories.length === 0) return "";
              if (item.type === "post") {
                return item.data.categories[0]?.title || "";
              }
              return window.sectionsMap?.[item.data.categories[0]] || "";
            };
            return getCategoryTitle(a).localeCompare(getCategoryTitle(b));

          default:
            // Sin filtro: más recientes primero
            const defaultDateA = new Date(aData.originalCreatedAt || aData.createdAt);
            const defaultDateB = new Date(bData.originalCreatedAt || bData.createdAt);
            return defaultDateB - defaultDateA; // Descendente
        }
      });

      fillSearchSuggestions(posts, boards);
      renderUnifiedFeed(unifiedFeed);

      await updateAllPostCommentCounts(posts);
      await updateAllBoardCommentCounts(boards);
    }
  } catch (err) {
    console.error("Error al filtrar:", err);
  }
}