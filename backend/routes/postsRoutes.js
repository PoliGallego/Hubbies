const express = require("express");
const {
  verifyPostToken,
  createPost,
  getUserPosts,
  getPublicPosts,
  updatePost,
  deletePost,
  sharePost,
  unsharePost,
  getSharedPost,
  togglePinPost
} = require("../controllers/postsController");
const upload = require("../config/multer");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/verify", authMiddleware, verifyPostToken);
router.post("/", authMiddleware, upload.single("image"), createPost);
router.get("/my-posts", authMiddleware, getUserPosts);
router.get("/public", getPublicPosts);
router.put("/:id", authMiddleware, upload.single("image"), updatePost);
router.delete("/:id", authMiddleware, deletePost);
router.post("/:id/share", authMiddleware, sharePost);
router.post("/:id/unshare", authMiddleware, unsharePost);
router.post("/:id/pin", authMiddleware, togglePinPost);
router.get("/shared/:token", getSharedPost);

module.exports = router;