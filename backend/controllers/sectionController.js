const Section = require("../models/section");
const Post = require("../models/post");
const Board = require("../models/boards");
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

        // Validar longitud del título (máximo 20 caracteres)
        const trimmedTitle = title.trim();
        if (trimmedTitle.length > 20) {
            return res.status(400).json({
                error: "Section name must not exceed 20 characters",
                success: false
            });
        }

        // CORRECCIÓN 1: Validar que no exista una categoría con el mismo nombre
        const existingSection = await Section.findOne({
            idUser: idUser,
            title: trimmedTitle
        });

        if (existingSection) {
            return res.status(400).json({
                error: "A section with this name already exists",
                success: false
            });
        }

        const prototype = new SectionPrototype(
            idUser,
            trimmedTitle,
            descrip,
            type,
            imagePath,
            privacy,
            items ? JSON.parse(items) : []
        );
        const newSectionData = prototype.clone();

        const section = new Section(newSectionData);
        await section.save();

        res.status(201).json({ message: "Section created!", section, success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
    }
}

const updateSection = async (req, res) => {
    try {
        const { id, title, descrip, type, privacy, items } = req.body;
        let updates = { title, descrip, type, privacy };

        // CORRECCIÓN: Validar que el nuevo nombre no exista (si se está cambiando el título)
        if (title) {
            // Validar longitud del título (máximo 20 caracteres)
            const trimmedTitle = title.trim();
            if (trimmedTitle.length > 20) {
                return res.status(400).json({
                    error: "Section name must not exceed 20 characters",
                    success: false
                });
            }

            const currentSection = await Section.findById(id);
            
            if (!currentSection) {
                return res.status(404).json({ 
                    error: "Section not found",
                    success: false 
                });
            }

            // Si el título es diferente al actual, verificar que no exista otro con ese nombre
            if (trimmedTitle !== currentSection.title) {
                const duplicateSection = await Section.findOne({
                    _id: { $ne: id }, // Excluir la sección actual
                    idUser: currentSection.idUser,
                    title: trimmedTitle
                });

                if (duplicateSection) {
                    return res.status(400).json({
                        error: "A section with this name already exists",
                        success: false
                    });
                }
            }

            updates.title = trimmedTitle;
        }

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
            return res.status(404).json({ error: "Section not found", success: false });
        }

        res.json({
            message: "Section updated successfully",
            section: updatedSection,
            success: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error", success: false });
    }
};

const deleteSection = async (req, res) => {
    try {
        const { id } = req.params;

        // CORRECCIÓN 2: Verificar si hay posts o boards asociados
        const postsWithSection = await Post.countDocuments({
            categories: id
        });

        const boardsWithSection = await Board.countDocuments({
            categories: id
        });

        if (postsWithSection > 0 || boardsWithSection > 0) {
            return res.status(400).json({
                error: `Cannot delete section. It has ${postsWithSection} posts and ${boardsWithSection} boards associated with it.`,
                success: false,
                hasElements: true
            });
        }

        const deletedSection = await Section.findByIdAndDelete(id);

        if (!deletedSection) {
            return res.status(404).json({ error: "Section not found", success: false });
        }
        res.status(200).json({ message: "Section deleted successfully", success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
    }
};

module.exports = { listUserSections, createSection, updateSection, deleteSection };