const express = require("express");
const { listUserSections, createSection, updateSection, deleteSection } = require("../controllers/sectionController");
const upload = require("../config/multer");

const router = express.Router();

router.get("/:idUser", listUserSections);
router.post("/create", upload.single("image"), createSection);
router.put("/update", updateSection);
router.delete("/:id", deleteSection);

module.exports = router;