const token = localStorage.getItem("token");
const payload = JSON.parse(atob(token.split(".")[1]));

document.addEventListener("DOMContentLoaded", () => {
  fetch("../html/components/navbar.html")
    .then((res) => res.text())
    .then((html) => {
      document.getElementById("navbar").innerHTML = html;

      innitNavBar();

      fetch("../html/components/sidebar.html")
        .then((res) => res.text())
        .then((html) => {
          document.getElementById("sidebar").innerHTML = html;

          if (payload && payload.id) {
            innitCategories();
            innitNavigation();
          }
        });
    });
});

function createSectionCard(section) {
  const newLi = document.createElement("li");
  newLi.innerHTML = `
    <div class="CategoriesRow">
        <a href="#">${section.title}</a>
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
      headers: { "Content-Type": "application/json" }
    }).then((res) => {
      if (!res.ok) throw new Error("Error deleting section");
      return res.json();
    }).then((data) => {
      console.log("Section deleted:", data);
      newLi.remove();
    }).catch((err) => {
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
    newLi.querySelector(".CategoriesRow").replaceChild(input, newLi.querySelector("a"));
    input.focus();

    input.addEventListener("keydown", function (e) {
      const categoryName = input.value.trim();
      const newA = document.createElement("a");
      newA.href = "#";

      if (e.key === "Enter" && categoryName !== "" && categoryName !== section.title) {

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
            "Content-Type": "application/json"
          }
        }).then((res) => {
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
  const AddSectionBtn = document.getElementById("AddSection");
  const categoriesList = document.querySelector(".Categories > ul");
  const noCategoriesMsg = document.querySelector(".Categories .NotFound");

  if (categoriesList) {
    fetch("/api/sections/" + payload.id, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    }).then((res) => {
      if (!res.ok) throw new Error("Error fetching sections");
      return res.json();
    }).then((data) => {
      if (data.length === 0) {
        if (noCategoriesMsg) {
          noCategoriesMsg.style.display = "block";
        }
      } else {
        noCategoriesMsg.style.display = "none";
        for (let index = 0; index < data.length; index++) {
          const li = createSectionCard(data[index]);
          if (index >= 7) {
            li.classList.add("ExtraItem");
          }
          categoriesList.appendChild(li);
        }
      }
    });
  }

  AddSectionBtn?.addEventListener("click", () => {
    if (!categoriesList) return;

    if (categoriesList.querySelector(".NewSectionInput")) return;

    const li = document.createElement("li");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "New category title";
    input.className = "NewSectionInput";
    input.autofocus = true;

    li.appendChild(input);
    categoriesList.appendChild(li);
    input.focus();

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && input.value.trim() !== "") {
        const categoryName = input.value.trim();

        fetch("/api/sections/create", {
          method: "POST",
          body: JSON.stringify({
            title: categoryName,
            idUser: payload?.id,
            type: "category",
            privacy: "private"
          }),
          headers: {
            "Content-Type": "application/json"
          }
        }).then((res) => {
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

      } else if (e.key === "Escape") {
        categoriesList.removeChild(li);
      }
    });
  });
}

function innitNavigation() {
  const viewMoreBtn = document.querySelector(".ViewMoreButton");
  const postsList = document.querySelector(".Navigation > ul");
  const noPostsMsg = document.querySelector(".Navigation .NotFound");
  let expanded = false;

  if (postsList) {
    fetch('/api/posts/my-posts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).then((res) => {
      if (!res.ok) throw new Error("Error fetching posts");
      return res.json();
    }).then((data) => {
      if (data.length === 0) {
        if (noPostsMsg) {
          noPostsMsg.style.display = "block";
        }
      } else {
        noPostsMsg.style.display = "none";
        for (let i = 0; i < data.length; i++) {
          const newLi = document.createElement("li");

          if (i <= 7) {
            newLi.innerHTML = `
              <div class="NavigationRow">
              <a href="/src/html/posts.html" post-id="${data[i]._id}">${data[i].title}</a>
              </div>`;
          } else {
            newLi.innerHTML = `
              <div class="ExtraItem">
              <a href="/src/html/posts.html" post-id="${data[i]._id}">${data[i].title}</a>
              </div>`;
          }

          const btn = newLi.querySelector("a");
          btn.addEventListener("click", e => {
            e.preventDefault();
            if (!window.location.pathname.includes("posts.html")) {
              window.location.assign("/src/html/posts.html");
            }
            const post = document.getElementById(btn.getAttribute("post-id"));
            if (post) window.scrollTo({
              top: post.getBoundingClientRect().top + window.scrollY - 100, 
              behavior: 'smooth' 
            });
          });
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
              item.style.display = expanded ? "list-item" : "none";
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
    });
  }
}

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
    const profileOption = optionsModal.querySelector("li a[href*='perfil-usuario.html']");
    const configOption = optionsModal.querySelector("li a[href*='configuracion.html']");

    if (window.location.pathname.includes("perfil-usuario.html") && profileOption) {
      profileOption.parentElement.style.display = "none";
    }

    if (window.location.pathname.includes("configuracion.html") && configOption) {
      configOption.parentElement.style.display = "none";
    }
  }
}
