document.addEventListener("DOMContentLoaded", () => {
  const EditProfileModal = document.getElementById("EditProfileModal");
  const CloseBtn = EditProfileModal?.querySelector(".CloseButton");

  const token = localStorage.getItem("token");
  if (!token) window.location.href = "/src/html/index.html";

  const CloseModal = () => {
    if (EditProfileModal) EditProfileModal.style.display = "none";
  };

  if (CloseBtn) {
    CloseBtn.addEventListener("click", CloseModal);
  }

  window.addEventListener("click", (e) => {
    if (e.target === EditProfileModal) CloseModal();
  });

  const InitAvatarUpload = () => {
    const FileInput = document.getElementById("ProfileImage");
    const PreviewImg = document.getElementById("PreviewImg");

    if (FileInput && PreviewImg) {
      FileInput.addEventListener("change", () => {
        const file = FileInput.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            PreviewImg.src = e.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  InitAvatarUpload();

  document.querySelectorAll(".config-option").forEach((option) => {
    option.addEventListener("click", async () => {
      if (!EditProfileModal) return;
      const token = localStorage.getItem("token");
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!token) return;

      fetch(`/api/users/${payload.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error retrieving user data");
          return res.json();
        })
        .then((data) => {
          const user = data.user;
          document.getElementById("FullName").value = user.fullName || "";
          document.getElementById("Username").value = user.username || "";
          document.getElementById("BirthDate").value = user.birthDate
            ? user.birthDate.slice(0, 10)
            : "";
          document.getElementById("Email").value = user.email || "";
          if (user.avatar) {
            document.getElementById(
              "PreviewImg"
            ).src = `/assets/uploads/${user.avatar}`;
          }
        })
        .catch((err) => console.error(err));

      EditProfileModal.style.display = "flex";
    });
  });

  document
    .getElementById("EditProfileForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const token = localStorage.getItem("token");
      if (!token) return alert("No autorizado");

      const payload = JSON.parse(atob(token.split(".")[1]));
      const formData = new FormData();

      formData.append(
        "fullName",
        document.getElementById("FullName").value.trim()
      );
      formData.append(
        "username",
        document.getElementById("Username").value.trim()
      );
      formData.append("email", document.getElementById("Email").value.trim());
      formData.append("birthDate", document.getElementById("BirthDate").value);
      const password = document.getElementById("Password").value.trim();
      if (password) formData.append("password", password);

      const avatarFile = document.getElementById("ProfileImage").files[0];
      if (avatarFile) formData.append("avatar", avatarFile);

      try {
        const res = await fetch(`/api/users/${payload.id}/update`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error saving");

        if (data.token) localStorage.setItem("token", data.token);
        Swal.fire({
          icon: "success",
          title: "Updated profile",
          text: "Your changes have been saved successfully.",
        }).then(() => {
          location.reload();
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message,
        });
      }
    });
});

document.addEventListener("click", async (e) => {
  if (e.target && e.target.id === "deactivateBtn") {
    Swal.fire({
      title: "Deactivate account?",
      text: "Are you sure you want to deactivate your account? This action can be reversed later.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f39c12",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, deactivate",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          const payload = JSON.parse(atob(token.split(".")[1]));
          const userId = payload.id;

          const res = await fetch(`/api/users/${userId}/deactivate`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) throw new Error("Failed to deactivate");

          localStorage.removeItem("token");
          Swal.fire({
            icon: "success",
            title: "Account Deactivated",
            text: "You can reactivate it by logging in again.",
            timer: 2500,
            showConfirmButton: false,
          }).then(() => {
            window.location.href = "/src/html/index.html";
          });
        } catch (err) {
          Swal.fire("Error", "Something went wrong. Try again later.", "error");
        }
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "deleteBtn") {
      Swal.fire({
        title: "Permanently delete account",
        text: "Are you sure you want to delete your account? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e74c3c",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "FINAL WARNING",
            text: "All your data will be permanently deleted. Do you want to continue?",
            icon: "error",
            showCancelButton: true,
            confirmButtonColor: "#c0392b",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
          }).then(async (finalResult) => {
            if (finalResult.isConfirmed) {
              try {
                const token = localStorage.getItem("token");
                const userId = JSON.parse(atob(token.split(".")[1])).id;

                const res = await fetch(`/api/users/${userId}`, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });

                if (!res.ok) {
                  const err = await res.json();
                  throw new Error(err.error || "Failed to delete account");
                }

                Swal.fire({
                  icon: "success",
                  title: "Account deleted",
                  text: "Your account has been permanently deleted. You will be redirected to the home page.",
                  timer: 2500,
                  showConfirmButton: false,
                });

                localStorage.removeItem("token");
                setTimeout(() => {
                  window.location.href = "/src/html/index.html";
                }, 2500);
              } catch (error) {
                Swal.fire("Error", error.message, "error");
              }
            }
          });
        }
      });
    }
  });
});
