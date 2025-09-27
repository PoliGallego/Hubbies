const express = require("express");
const { authMiddleware } = require("../config/session");
const router = express.Router();

router.get("/verify", authMiddleware, (req, res) => {
  res.json({
    user: req.user.username,
    avatar: req.user.avatar || "avatar_icon.png"
  });
});

module.exports = router;
