const express = require("express");
const {
  verifyPostToken,
  createPost,
  getUserPosts,
  getPublicPosts,
  updatePost,
  deletePost
} = require("../controllers/postsController");
const upload = require("../config/multer");

const router = express.Router();

router.get("/verify", verifyPostToken);
router.post("/", upload.single("image"), createPost);
router.get("/my-posts", getUserPosts);
router.get("/public", getPublicPosts);
router.put("/:id", upload.single("image"), updatePost);
router.delete("/:id", deletePost);

module.exports = router;