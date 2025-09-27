const bcrypt = require("bcrypt");
const User = require("../models/user");
const UserPrototype = require("../prototypes/userPrototype");
const { generateToken, saveUserToken } = require("../config/session");

const registerUser = async (req, res) => {
  try {
    const { fullName, username, birthDate, email, password } = req.body;
    let avatarPath = req.file ? req.file.filename : "avatar_icon.png";

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(409).json({ error: "Username in use." });

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(409).json({ error: "Email in use." });

    if (!email.includes("@"))
      return res.status(400).json({ error: "Invalid email." });

    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    if (
      age < 18 ||
      (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))
    ) {
      return res.status(400).json({ error: "Must be over 18." });
    }

    const passwordRegex = /^(?=.*[0-9!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: "Password too weak." });
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

    res.status(201).json({ message: "User registered!", user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Incorrect credentials" });

    if (user.currentToken) {
      return res.status(403).json({
        error:
          "This account already has an active session. Please log out first.",
      });
    }

    let reactivatedMessage = null;
    if (user.active === false) {
      user.active = true;
      await user.save();
      reactivatedMessage =
        "Your account was deactivated and is now reactivated by login.";
    }

    const token = generateToken(user);
    await saveUserToken(user, token);

    res.status(200).json({
      message: reactivatedMessage || "Login successful!",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerUser, loginUser };
