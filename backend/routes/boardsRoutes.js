const express = require("express");
const router = express.Router();
const controller = require("../controllers/boardsController");
const upload = require("../config/multer");

// ⭐ Rutas públicas PRIMERO (antes de /:id)
router.get("/public", controller.getPublicBoards);
router.get("/public/:id", controller.getPublicBoardById);

// Rutas autenticadas y compartidas
router.post("/save", controller.verifyBoardToken, upload.array("images"), controller.saveBoard);
router.get("/my", controller.verifyBoardToken, controller.getUserBoards);
router.delete("/:id", controller.verifyBoardToken, controller.deleteBoard);
router.get("/:id", controller.verifyBoardToken, controller.getBoardById);
router.put("/:id", controller.verifyBoardToken, upload.array("images"), controller.updateBoard);
router.post("/:id/share", controller.verifyBoardToken, controller.shareBoard);
router.post("/:id/unshare", controller.verifyBoardToken, controller.unshareBoard);
router.get("/shared/:token", controller.getSharedBoard);
router.post("/:id/pin", controller.verifyBoardToken, controller.togglePinBoard);

module.exports = router;