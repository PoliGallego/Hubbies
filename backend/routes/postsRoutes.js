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

// Ruta para verificar token
router.get("/verify", verifyPostToken);

// ✅ REVERTIR: Una sola imagen en creación
router.post("/", upload.single("image"), createPost);

// Ruta para obtener posts del usuario
router.get("/my-posts", getUserPosts);

// Ruta para obtener posts públicos
router.get("/public", getPublicPosts);

// ✅ REVERTIR: Una sola imagen en actualización
router.put("/:id", upload.single("image"), updatePost);

// Ruta para eliminar post
router.delete("/:id", deletePost);

module.exports = router;