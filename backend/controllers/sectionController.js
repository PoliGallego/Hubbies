const Section = require("../models/section");
const SectionPrototype = require("../lib/prototypes/sectionPrototype");

const listUserSections = async (req, res) => {
    try {
        const { idUser } = req.params;
        const sections = await Section.find({ idUser });
        res.status(200).json(sections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createSection = async (req, res) => {
    try {
        const { idUser, title, descrip, type, privacy, items } = req.body;
        let imagePath = req.file ? req.file.filename : "section_icon.png";

        const prototype = new SectionPrototype(
            idUser,
            title,
            descrip,
            type,
            imagePath,
            privacy,
            items ? JSON.parse(items) : []
        );
        const newSectionData = prototype.clone();

        const section = new Section(newSectionData);
        await section.save();

        res.status(201).json({ message: "Section created!", section });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const updateSection = async (req, res) => {
    try {
        const { id, title, descrip, type, privacy, items } = req.body;
        let updates = { title, descrip, type, privacy };

        if (items) {
            updates.items = JSON.parse(items);
        }

        if (req.file) {
            updates.image = req.file.filename;
        }

        const updatedSection = await Section.findByIdAndUpdate(id, updates, {
            new: true,
        });

        if (!updatedSection) {
            return res.status(404).json({ error: "Section not found" });
        }

        res.json({
            message: "Section updated successfully",
            section: updatedSection,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

const deleteSection = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedSection = await Section.findByIdAndDelete(id);

        if (!deletedSection) {
            return res.status(404).json({ error: "Section not found" });
        }
        res.status(200).json({ message: "Section deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { listUserSections, createSection, updateSection, deleteSection };