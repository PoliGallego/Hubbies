document.addEventListener("DOMContentLoaded", () => {
  fetch("../html/components/navbar.html")
    .then((res) => res.text())
    .then((html) => {
      document.getElementById("navbar").innerHTML = html;

      const homeBtn = document.getElementById("HomeBtn");
      if (homeBtn && window.location.pathname.includes("posts.html")) {
        homeBtn.style.display = "none";
      }

      const optionsBtnImg = document.querySelector("#OptionsBtn .UserAvatar");
      const token = localStorage.getItem("token");
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

      fetch("../html/components/sidebar.html")
        .then((res) => res.text())
        .then((html) => {
          document.getElementById("sidebar").innerHTML = html;

          const viewMoreBtn = document.querySelector(".ViewMoreButton");
          const extraItems = document.querySelectorAll(".extra-item");
          let expanded = false;

          if (viewMoreBtn) {
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
        });
    });
});
