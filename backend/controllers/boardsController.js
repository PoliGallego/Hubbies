const Board = require("../models/boards");
const JWT_SECRET = "secretKey";
const jwt = require("jsonwebtoken");
const Comment = require("../models/comment");
const Section = require("../models/section");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = {
    verifyBoardToken: (req, res, next) => {
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
            if (!tokenUserId)
                return res.status(400).json({ success: false, message: "UserId missing" });

            const {
                title = "Untitled board",
                items = "[]",
                categories = "[]",
                privacy = "private",
                isShared = false,
                comments = []
            } = req.body;

            // FORZAR reglas como en posts
            let finalIsShared = isShared;
            let shareToken = null;

            if (privacy === "private") {
                finalIsShared = false;
            } else if (privacy === "public") {
                finalIsShared = true;
                shareToken = crypto.randomBytes(16).toString('hex');
            }

            // Parse items
            let parsedItems;
            try { parsedItems = JSON.parse(items); }
            catch { parsedItems = []; }

            // Parse categories
            let parsedCategories;
            try { parsedCategories = JSON.parse(categories); }
            catch {
                parsedCategories = typeof categories === "string" && categories.length
                    ? categories.split(",")
                    : [];
            }
            parsedCategories = parsedCategories.filter(c => c && c.length);

            // Procesar imágenes
            const files = req.files || [];
            const imagePaths = files.map(f => `/assets/uploads/${f.filename}`);

            let fileCounter = 0;
            parsedItems = parsedItems.map(it => {
                if (it.type === "image" && typeof it.content === "string" && it.content.startsWith("__FILE_")) {
                    const match = it.content.match(/__FILE_(\d+)__/);
                    if (match) {
                        const idx = parseInt(match[1], 10);
                        it.content = imagePaths[idx] || null;
                    } else {
                        it.content = imagePaths[fileCounter] || null;
                        fileCounter++;
                    }
                }
                return it;
            });

            const boardData = {
                idUser: String(tokenUserId),
                title,
                items: parsedItems,
                images: imagePaths,
                categories: parsedCategories,
                privacy,
                isShared: finalIsShared,
                comments
            };

            if (shareToken) boardData.shareToken = shareToken;

            const board = new Board(boardData);
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
            }).sort({
                pinned: -1,
                pinnedAt: -1,
                originalCreatedAt: -1
            }); // Últimos editados primero

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
            const { title, description, items = "[]", categories = "[]", privacy } = req.body;

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

            // Buscar board actual
            const currentBoard = await Board.findOne({ _id: boardId, idUser: String(userId) });
            if (!currentBoard) {
                return res.status(404).json({
                    success: false,
                    message: "Board not found or unauthorized"
                });
            }

            // ------------------------------
            // 🔥 MISMA LÓGICA QUE POSTS
            // ------------------------------
            let finalIsShared = currentBoard.isShared;
            let finalShareToken = currentBoard.shareToken;

            if (privacy) {
                if (privacy === "private") {
                    finalIsShared = false;
                } else if (privacy === "public") {
                    finalIsShared = true;
                    if (!finalShareToken)
                        finalShareToken = crypto.randomBytes(16).toString("hex");
                }
            }
            // ------------------------------

            // Procesar nuevas imágenes
            const newImages = [];
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    newImages.push(`/assets/uploads/${file.filename}`);
                });
            }

            // Reemplazar placeholders en items
            let fileCounter = 0;
            parsedItems = parsedItems.map(item => {
                if (item.type === "image" && typeof item.content === "string") {

                    // Placeholder
                    if (item.content.startsWith("__FILE_")) {
                        const m = item.content.match(/__FILE_(\d+)__/);
                        if (m) {
                            const idx = parseInt(m[1], 10);
                            item.content = newImages[idx] || item.content;
                        } else {
                            item.content = newImages[fileCounter] || item.content;
                            fileCounter++;
                        }
                    }

                    // Normalizar
                    if (item.content.startsWith("http://localhost:5000")) {
                        item.content = item.content.replace("http://localhost:5000", "");
                    }

                    if (!item.content.startsWith("/")) {
                        item.content = `/assets/uploads/${item.content}`;
                    }
                }
                return item;
            });

            // Normalizar imágenes existentes
            const existingImages = (currentBoard.images || []).map(img =>
                img.startsWith("/assets/") || img.startsWith("http") ? img : `/assets/uploads/${img}`
            );
            const allImages = [...new Set([...existingImages, ...newImages])];

            // Actualizar board
            const updatedBoard = await Board.findOneAndUpdate(
                { _id: boardId, idUser: String(userId) },
                {
                    title,
                    description,
                    items: parsedItems,
                    images: allImages,
                    categories: parsedCategories,
                    privacy: privacy || currentBoard.privacy,
                    isShared: finalIsShared,
                    shareToken: finalShareToken,
                    updatedAt: Date.now()
                },
                { new: true }
            );

            return res.json({ success: true, board: updatedBoard });

        } catch (err) {
            console.error("updateBoard error:", err);
            res.status(500).json({
                success: false,
                message: "Error updating board",
                error: err.message
            });
        }
    }
};

module.exports.shareBoard = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const board = await Board.findOne({ _id: id, idUser: String(userId) });
        if (!board) return res.status(404).json({ success: false, message: "Board not found" });

        if (!board.shareToken) board.shareToken = crypto.randomBytes(16).toString("hex");
        board.isShared = true;
        await board.save();

        res.json({ success: true, shareToken: board.shareToken });
    } catch (error) {
        console.error("Error sharing board:", error);
        res.status(500).json({ success: false, message: "Error sharing board" });
    }
};

module.exports.unshareBoard = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const board = await Board.findOne({ _id: id, idUser: String(userId) });
        if (!board) return res.status(404).json({ success: false, message: "Board not found" });

        board.isShared = false;
        await board.save();

        res.json({ success: true, message: "Link disabled" });
    } catch (error) {
        console.error("Error unsharing board:", error);
        res.status(500).json({ success: false, message: "Error unsharing board" });
    }
};

module.exports.getSharedBoard = async (req, res) => {
    try {
        const { token } = req.params;

        const board = await Board.findOne({ shareToken: token, isShared: true, active: true });
        if (!board) return res.status(404).json({ success: false, message: "Board not found or link disabled" });

        const sectionsInfo = await Section.find({
            _id: { $in: board.categories },
            active: true
        }).select("title");

        // Contar comentarios por board
        const commentCount = await Comment.countDocuments({ boardId: board._id });

        const boardData = {
            ...board.toObject(),
            categories: sectionsInfo,
            commentCount
        };

        res.json({ success: true, board: boardData });
    } catch (error) {
        console.error("Error getting shared board:", error);
        res.status(500).json({ success: false, message: "Error loading shared board" });
    }
};

module.exports.togglePinBoard = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const board = await Board.findOne({ _id: id, idUser: userId });

        if (!board) {
            return res.status(404).json({ success: false, message: "Board not found" });
        }

        board.pinned = !board.pinned;
        board.pinnedAt = board.pinned ? new Date() : null;
        await board.save();

        res.json({
            success: true,
            pinned: board.pinned,
            message: board.pinned ? "Board pinned" : "Board unpinned",
        });
    } catch (error) {
        console.error("Error toggling pin board:", error);
        res.status(500).json({ success: false, message: "Error updating board" });
    }
};

module.exports.getPublicBoards = async (req, res) => {
    try {
        const boards = await Board.find({ privacy: 'public', active: true }).sort({ createdAt: -1 });
        // opcional: mapear commentCount, sections etc.
        // para simplicidad devolverlos tal cual; frontend filtrará por idUser
        res.json(boards);
    } catch (err) {
        console.error("getPublicBoards error:", err);
        res.status(500).json({ success: false, message: "Error loading public boards" });
    }
};

module.exports.getPublicBoardById = async (req, res) => {
    try {
        const boardId = req.params.id;
        const board = await Board.findOne({ _id: boardId, privacy: 'public', active: true });
        if (!board) return res.status(404).json({ success: false, message: "Board not found or not public" });

        // puedes agregar commentCount, section titles, etc. si lo deseas
        res.json({ success: true, board });
    } catch (err) {
        console.error("getPublicBoardById error:", err);
        res.status(500).json({ success: false, message: "Error loading board" });
    }
};