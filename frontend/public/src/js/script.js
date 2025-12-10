document.addEventListener("DOMContentLoaded", () => {
  const HiddenElements = document.querySelectorAll(".Hidden");
  HiddenElements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add("Show");
    }, index * 200);
  });

  const Modal = document.getElementById("MainModal");
  const ModalTitle = document.getElementById("ModalTitle");
  const ModalForm = document.getElementById("ModalForm");
  const CloseBtn = document.getElementById("CloseButton");

  const SignUpBtn = document.getElementById("SignUpBtn");
  const StartTodayBtn = document.querySelector(".CTAButton");
  const LoginBtn = document.getElementById("LoginBtn");

  const ShowModal = (type) => {
    if (type === "Register") {
      ModalTitle.textContent = "Create an Account";
      ModalForm.innerHTML = `
        <div class="AvatarUpload">
          <label for="ProfileImage" class="AvatarLabel">
              <img id="PreviewImg" src="../../assets/avatar_icon.png" alt="Avatar">
              <input type="file" id="ProfileImage" accept="image/*" style="display: none;">
          </label>
        </div>

        <div class="FormRow">
          <div class="FormGroup">
              <label for="FullName">Full Name</label>
              <input type="text" id="FullName" placeholder="Enter your name" required>
          </div>

          <div class="FormGroup">
              <label for="Username">Username</label>
              <input type="text" id="Username" placeholder="Create a username" required>
          </div>
        </div>

        <div class="FormGroup">
          <label for="BirthDate">Birth Date</label>
          <input type="date" id="BirthDate" required>
        </div>

        <div class="FormGroup">
          <label for="Email">Email</label>
          <input type="email" id="Email" placeholder="Enter your email" required>
        </div>

        <div class="FormGroup">
          <label for="Password">Password</label>
          <input type="password" id="Password" placeholder="Create a password" required>
        </div>

        <button type="submit" class="SubmitButton">Sign Up</button>
      `;

      InitAvatarUpload();
    } else if (type === "Login") {
      ModalTitle.textContent = "Login";
      ModalForm.innerHTML = `
        <div class="FormGroup">
          <label for="LoginUser">Username</label>
          <input type="User" id="LoginUser" placeholder="Enter your username" required>
        </div>

        <div class="FormGroup">
          <label for="LoginPassword">Password</label>
          <input type="password" id="LoginPassword" placeholder="Enter your password" required>
        </div>

        <button type="submit" class="SubmitButton">Enter</button>
        <p class="ForgotPassword">
            <a href="/src/html/forgot-password.html">Did you forget your password?</a>
        </p>
      `;
    }

    Modal.style.display = "flex";
  };

  const CloseModal = () => {
    Modal.style.display = "none";
  };

  const showAlert = (result, isRegistration = false) => {
    // Caso especial: registro exitoso que requiere verificación
    if (isRegistration && result.requiresVerification) {
      Swal.fire({
        icon: "success",
        title: "Account Created!",
        html: `
          <p>Please check your email <strong>${result.email}</strong></p>
          <p>Click the verification link to activate your account.</p>
        `,
        confirmButtonText: "OK",
        allowOutsideClick: false
      }).then(() => {
        CloseModal();
      });
      return;
    }

    if (result.message) {
      Swal.fire({
        icon: "success",
        title: `Welcome ${result.user.username}`,
        text: result.message,
        confirmButtonText: "Come in!",
      }).then(() => {
        if (result.token) {
          localStorage.setItem("token", result.token);
        }
        window.location.href = "/src/html/posts.html";
      });
    } else {
      // Error general
      const errorConfig = {
        icon: "error",
        title: "Error",
        text: result.error,
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      };

      // Si el error es de verificación, mostrar opción de reenviar
      if (result.requiresVerification) {
        errorConfig.toast = false;
        errorConfig.position = "center";
        errorConfig.timer = null;
        errorConfig.showConfirmButton = true;
        errorConfig.showCancelButton = true;
        errorConfig.confirmButtonText = "Resend Email";
        errorConfig.cancelButtonText = "OK";
        errorConfig.html = `
          <p>${result.error}</p>
          <p style="margin-top: 10px; font-size: 14px; color: #666;">
            Check your email: <strong>${result.email}</strong>
          </p>
        `;

        Swal.fire(errorConfig).then((res) => {
          if (res.isConfirmed && result.email) {
            resendVerificationEmail(result.email);
          }
        });
        return;
      }

      Swal.fire(errorConfig);
    }
  };

  const resendVerificationEmail = async (email) => {
    Swal.fire({
      title: 'Sending...',
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Email Sent!',
          text: 'Please check your email for the verification link',
          confirmButtonText: 'OK'
        });
      } else {
        Swal.fire('Error', data.message || 'Could not send email', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'Could not send verification email', 'error');
    }
  };

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

  SignUpBtn?.addEventListener("click", () => ShowModal("Register"));
  StartTodayBtn?.addEventListener("click", () => ShowModal("Register"));
  LoginBtn?.addEventListener("click", () => ShowModal("Login"));

  CloseBtn?.addEventListener("click", CloseModal);

  window.addEventListener("click", (event) => {
    if (event.target === Modal) {
      CloseModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      CloseModal();
    }
  });

  document.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (
      e.target.classList.contains("SubmitButton") ||
      e.target.id === "ModalForm"
    ) {
      const formType = ModalTitle.textContent;

      if (formType.includes("Create")) {
        const formData = new FormData();
        formData.append("fullName", document.getElementById("FullName").value);
        formData.append("username", document.getElementById("Username").value);
        formData.append(
          "birthDate",
          document.getElementById("BirthDate").value
        );
        formData.append("email", document.getElementById("Email").value);
        formData.append("password", document.getElementById("Password").value);

        const fileInput = document.getElementById("ProfileImage");
        if (fileInput && fileInput.files.length > 0) {
          formData.append("avatar", fileInput.files[0]);
        }

        const res = await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();
        console.log("✅ Registro:", result);
        showAlert(result, true); // Indicar que es registro
        if (!result.requiresVerification) {
          CloseModal();
        }
      } else {
        const data = {
          username: document.getElementById("LoginUser").value,
          password: document.getElementById("LoginPassword").value,
        };

        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();
        console.log("✅ Login:", result);
        showAlert(result);
      }
    }
  });
});
