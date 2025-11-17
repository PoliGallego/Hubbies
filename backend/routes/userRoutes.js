const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
    getUserById,
    updateUser,
    deactivateUser,
    deleteUser,
} = require("../controllers/userController");
const upload = require("../config/multer");

const router = express.Router();

router.get("/:id", authMiddleware, getUserById);

router.put("/:id/update", authMiddleware, upload.single("avatar"), updateUser);

router.put("/:id/deactivate", authMiddleware, deactivateUser);

router.delete("/:id", authMiddleware, deleteUser);

module.exports = router;