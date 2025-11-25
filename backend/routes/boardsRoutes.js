const express = require("express");
const router = express.Router();
const controller = require("../controllers/boardsController");
const upload = require("../config/multer");
// Crear un board
router.post("/save", controller.verifyBoardToken, upload.array("images"), controller.saveBoard);
router.get("/my",controller.verifyBoardToken, controller.getUserBoards);
router.delete("/:id", controller.verifyBoardToken, controller.deleteBoard);
router.get("/:id", controller.verifyBoardToken, controller.getBoardById);
router.put("/:id",controller.verifyBoardToken,upload.array("images"),  controller.updateBoard);
module.exports = router;