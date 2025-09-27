function OpenModal(Type) {
  var Modal;
  const NotifBtn = document.getElementById("NotifBtn").getBoundingClientRect();
  const NotifDiv = document.getElementsByClassName("Notifications")[0];

  if (Type === "Notif") {
    Modal = document.getElementById("NotifModal");
    NotifDiv.style.top = NotifBtn.bottom + "px";
    NotifDiv.style.right = "120px";
  } else if (Type === "Options") {
    Modal = document.getElementById("OptionsModal");
  }
  Modal.style.display = "block";
  window.onclick = function (event) {
    if (event.target == Modal) {
      Modal.style.display = "none";
    }
  };
}

document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelectorAll(".Notification .material-icons")
    .forEach(function (closeBtn) {
      closeBtn.addEventListener("click", function () {
        this.closest(".Notification").style.display = "none";
      });
    });

  const logoutBtn = document.getElementById("LogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/src/html/index.html";
    });
  }
});

document.addEventListener("click", function (e) {

  const ToggleContainer = document.querySelector(".ToggleContainer");
  let IsToggledOn = false;

  ToggleContainer.addEventListener("click", () => {
    IsToggledOn = !IsToggledOn;
    ToggleContainer.classList.toggle("on");
    if (IsToggledOn) {
      //accion
    } else {
      //otra accion
    }
  });
  
  if (e.target && e.target.id === "LogoutBtn") {
    Swal.fire({
      title: "Log out?",
      text: "Your current session will be closed and you will be returned to the home page.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, go out",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token");
        Swal.fire({
          icon: "success",
          title: "Closed session",
          text: "You have successfully logged out.",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          window.location.href = "/src/html/index.html";
        });
      }
    });
  }
});
