document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/src/html/index.html";
  }

  fetch("/api/posts/verify", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Sesión inválida");
      return res.json();
    })
    .then((data) => {
      const welcome = document.getElementById("welcomeUser");
      if (welcome) welcome.textContent = `Bienvenido ${data.user}`;
    })
    .catch((err) => {
      localStorage.removeItem("token");
      window.location.href = "/src/html/index.html";
    });



  document
    .querySelectorAll(".Tag .material-icons")
    .forEach(function (closeBtn) {
      closeBtn.addEventListener("click", function () {
        this.closest(".Tag").style.display = "none";
      });
    });
});
