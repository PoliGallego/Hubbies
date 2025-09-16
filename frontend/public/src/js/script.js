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

        <!-- Contenedor para FullName y UserName en la misma fila -->
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
        <p class="ForgotPassword"><a href="#">Did you forget your password?</a></p>
      `;
    }

    Modal.style.display = "flex";
  };

  const CloseModal = () => {
    Modal.style.display = "none";
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
});
