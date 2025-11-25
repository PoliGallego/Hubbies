const Board = require("../models/boards");
const JWT_SECRET = "secretKey";
const jwt = require("jsonwebtoken");

module.exports = {
    verifyBoardToken: (req, res, next) => {
        console.log("verifyBoardToken llamado en:", req.method, req.path);
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: "Missing auth token" });
        }

        const token = authHeader.split(" ")[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            req.user = {
                id: decoded.id,
                username: decoded.username || decoded.fullName
            };

            next(); // 👈 Permite continuar con saveBoard
        } catch (err) {
            console.error("verifyBoardToken error:", err.message);
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }
    },

    // POST /api/boards/save
    saveBoard: async (req, res) => {
        try {
            const tokenUserId = req.user?.id || req.body.idUser || req.body.userId;
            if (!tokenUserId) return res.status(400).json({ success: false, message: "UserId missing" });

            const { title = "Untitled board", description = "", items = "[]", categories = "[]", privacy = "private" } = req.body;

            let parsedItems;
            try { parsedItems = JSON.parse(items); } catch (e) { parsedItems = []; }

            let parsedCategories;
            try { parsedCategories = JSON.parse(categories); } catch (e) {
                parsedCategories = typeof categories === "string" && categories.length ? categories.split(",") : [];
            }

            parsedCategories = parsedCategories.filter(c => c && c.length);

            const files = req.files || [];
            const imagePaths = files.map(f => `/assets/uploads/${f.filename}`);

            let fileCounter = 0;
            parsedItems = parsedItems.map(it => {
                if (it.type === "image" && typeof it.content === "string" && it.content.startsWith("__FILE_")) {
                    const m = it.content.match(/__FILE_(\d+)__/);
                    if (m) {
                        const idx = parseInt(m[1], 10);
                        it.content = imagePaths[idx] || null;
                    } else {
                        it.content = imagePaths[fileCounter] || null;
                        fileCounter++;
                    }
                }
                return it;
            });

            const board = new Board({
                idUser: String(tokenUserId),
                title,
                description,
                items: parsedItems,
                images: imagePaths,
                categories: parsedCategories,
                privacy
            });

            await board.save();

            res.json({ success: true, board });
        } catch (err) {
            console.error("saveBoard error:", err);
            res.status(500).json({ success: false, message: "Error saving board", error: err.message });
        }
    },
    getUserBoards: async (req, res) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            const boards = await Board.find({
                idUser: String(userId),
                active: true
            }).sort({ updatedAt: -1 }); // Últimos editados primero

            res.json({
                success: true,
                boards
            });
        } catch (err) {
            console.error("getUserBoards error:", err);
            res.status(500).json({
                success: false,
                message: "Error retrieving boards",
                error: err.message
            });
        }
    },
    deleteBoard: async (req, res) => {
        try {
            const boardId = req.params.id;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const deletedBoard = await Board.findOneAndDelete({
                _id: boardId,
                idUser: String(userId)
            });

            if (!deletedBoard) {
                return res.status(404).json({ success: false, message: "Board not found" });
            }

            return res.json({
                success: true,
                message: "Board permanently deleted"
            });

        } catch (err) {
            console.error("deleteBoard error:", err);
            return res.status(500).json({
                success: false,
                message: "Error deleting board",
                error: err.message
            });
        }
    },
    getBoardById: async (req, res) => {
        try {
            const boardId = req.params.id;
            const userId = req.user?.id;

            const board = await Board.findOne({
                _id: boardId,
                idUser: String(userId)
            });

            if (!board) {
                return res.status(404).json({ success: false, message: "Board not found" });
            }

            return res.json({ success: true, board });
        } catch (err) {
            console.error("getBoardById error:", err);
            res.status(500).json({ success: false, message: "Error retrieving board" });
        }
    },
    updateBoard: async (req, res) => {
        try {
            const boardId = req.params.id;
            const userId = req.user?.id;

            console.log("=== UPDATE BOARD DEBUG ===");
            console.log("Board ID:", boardId);
            console.log("User ID:", userId);
            console.log("Body:", req.body);
            console.log("Files:", req.files);
            console.log("========================");

            const { title, description, items = "[]", categories = "[]", privacy = "private" } = req.body;

            // Parse items y categories
            let parsedItems;
            try { parsedItems = JSON.parse(items); } catch { parsedItems = []; }

            let parsedCategories;
            try { parsedCategories = JSON.parse(categories); } catch {
                parsedCategories = typeof categories === "string" && categories.length
                    ? categories.split(",")
                    : [];
            }
            parsedCategories = parsedCategories.filter(c => c && c.length);

            // Procesar nuevas imágenes
            const newImages = [];
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    newImages.push(`/assets/uploads/${file.filename}`); // ✅ ruta completa
                });
            }

            // Reemplazar placeholders en items
            let fileCounter = 0;
            parsedItems = parsedItems.map(item => {
                if (item.type === "image" && typeof item.content === "string" && item.content.startsWith("__FILE_")) {
                    const m = item.content.match(/__FILE_(\d+)__/);
                    if (m) {
                        const idx = parseInt(m[1], 10);
                        item.content = newImages[idx] || item.content;
                    } else {
                        item.content = newImages[fileCounter] || item.content;
                        fileCounter++;
                    }
                }
                return item;
            });

            // Buscar board actual
            const currentBoard = await Board.findOne({ _id: boardId, idUser: String(userId) });
            if (!currentBoard) {
                return res.status(404).json({
                    success: false,
                    message: "Board not found or unauthorized"
                });
            }

            // Combinar imágenes existentes con nuevas
            const allImages = [...(currentBoard.images || []), ...newImages];

            // Actualizar board
            const updatedBoard = await Board.findOneAndUpdate(
                { _id: boardId, idUser: String(userId) },
                {
                    title,
                    description,
                    items: parsedItems,
                    images: allImages,
                    categories: parsedCategories,
                    privacy,
                    updatedAt: Date.now()
                },
                { new: true }
            );

            console.log("Board updated successfully:", updatedBoard._id);
            return res.json({ success: true, board: updatedBoard });

        } catch (err) {
            console.error("updateBoard error:", err);
            console.error("Stack:", err.stack);
            res.status(500).json({
                success: false,
                message: "Error updating board",
                error: err.message
            });
        }
    }

};