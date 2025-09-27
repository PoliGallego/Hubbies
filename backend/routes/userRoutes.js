const express = require("express");
const User = require("../models/user");
const { authMiddleware } = require("../config/session");
const bcrypt = require("bcrypt");
const upload = require("../config/multer");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "fullName username email avatar birthDate"
    );
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.put(
  "/:id/update",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const { fullName, username, email, birthDate, password } = req.body;
      const updates = {};

      if (fullName) updates.fullName = fullName;

      if (username) {
        const existingUser = await User.findOne({
          username,
          _id: { $ne: req.params.id },
        });
        if (existingUser) {
          return res
            .status(409)
            .json({ error: "The username is already in use." });
        }
        updates.username = username;
      }

      if (email) {
        if (!email.includes("@")) {
          return res.status(400).json({ error: "The email must contain '@'." });
        }
        const existingEmail = await User.findOne({
          email,
          _id: { $ne: req.params.id },
        });
        if (existingEmail) {
          return res
            .status(409)
            .json({ error: "The email is already in use." });
        }
        updates.email = email;
      }

      if (birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        if (age < 18) {
          return res
            .status(400)
            .json({ error: "You must be over 18 years old to register." });
        }
        updates.birthDate = birthDate;
      }

      if (password) {
        const passwordRegex = /^(?=.*[0-9!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(password)) {
          return res.status(400).json({
            error:
              "The password must be at least 8 characters long and contain a number or special character.",
          });
        }

        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(password, salt);
      }

      if (req.file) {
        updates.avatar = req.file.filename;
      }

      const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
      }).select("fullName username email avatar birthDate");

      const newToken = jwt.sign(
        {
          id: updatedUser._id,
          username: updatedUser.username,
          avatar: updatedUser.avatar,
        },
        "secretKey",
        { expiresIn: "2h" }
      );

      res.json({
        message: "Profile updated successfully",
        user: updatedUser,
        token: newToken,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.put("/:id/deactivate", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { active: false },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Account deactivated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: "Not authorized to delete this user." });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Account permanently deleted." });
  } catch (err) {
    res.status(500).json({ error: "Server error while deleting account." });
  }
});


module.exports = router;
