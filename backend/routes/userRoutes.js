const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
    getUserById,
    updateUser,
    deactivateUser,
    deleteUser,
    shareUser,       
    unshareUser,     
    getSharedUser
} = require("../controllers/userController");
const upload = require("../config/multer");

const router = express.Router();

router.get("/:id", authMiddleware, getUserById);

router.put("/:id/update", authMiddleware, upload.single("avatar"), updateUser);

router.put("/:id/deactivate", authMiddleware, deactivateUser);

router.delete("/:id", authMiddleware, deleteUser);

router.post("/:id/share", authMiddleware, shareUser);

router.post("/:id/unshare", authMiddleware, unshareUser);

router.get("/shared/:token", getSharedUser);

module.exports = router;