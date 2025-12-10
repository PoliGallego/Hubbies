const express = require("express");
const {
    registerUser,
    loginUser,
    verifyEmail,
    resendVerificationEmail,
    requestPasswordReset,
    resetPassword
} = require("../controllers/authController");
const upload = require("../config/multer");

const router = express.Router();

router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

module.exports = router;