const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const upload = require("../config/multer");

const router = express.Router();

router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);

module.exports = router;