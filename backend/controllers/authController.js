const bcrypt = require("bcrypt");
const User = require("../models/user");
const UserPrototype = require("../lib/prototypes/userPrototype");
const { generateToken, saveUserToken } = require("../lib/utils/generateToken");

const registerUser = async (req, res) => {
  try {
    const { fullName, username, birthDate, email, password } = req.body;
    let avatarPath = req.file ? req.file.filename : "avatar_icon.png";

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(409).json({ error: "Nombre de usuario en uso." });

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(409).json({ error: "Correo electrónico en uso." });

    if (!email.includes("@"))
      return res.status(400).json({ error: "Correo electrónico inválido." });

    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    if (
        age < 18 ||
        (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))
    ) {
      return res.status(400).json({ error: "Debes ser mayor de 18 años." });
    }

    const passwordRegex = /^(?=.*[0-9!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: "Contraseña demasiado débil." });
    }

    const prototype = new UserPrototype(
        fullName,
        username,
        birthDate,
        email,
        password,
        avatarPath
    );
    const newUserData = prototype.clone();

    const salt = await bcrypt.genSalt(10);
    newUserData.password = await bcrypt.hash(password, salt);

    const user = new User(newUserData);
    await user.save();

    const token = generateToken(user);
    await saveUserToken(user, token);

    res.status(201).json({ message: "¡Usuario registrado!", user, token });
  } catch (error) {
    res.status(500).json({ error: `Error al registrar usuario: ${error.message}` });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Credenciales incorrectas" });

    if (user.currentToken) {
      return res.status(403).json({
        error:
            "Esta cuenta ya tiene una sesión activa. Por favor, cierra sesión primero.",
      });
    }

    let reactivatedMessage = null;
    if (user.active === false) {
      user.active = true;
      await user.save();
      reactivatedMessage =
          "Tu cuenta estaba desactivada y ahora se ha reactivado al iniciar sesión.";
    }

    const token = generateToken(user);
    await saveUserToken(user, token);

    res.status(200).json({
      message: reactivatedMessage || "¡Inicio de sesión exitoso!",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: `Error al iniciar sesión: ${error.message}` });
  }
};

module.exports = { registerUser, loginUser };