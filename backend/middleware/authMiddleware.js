const jwt = require("jsonwebtoken");
const User = require("../models/user");

async function authMiddleware(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No se proporcionó un token" });

    try {
        const decoded = jwt.verify(token, "secretKey");

        const user = await User.findById(decoded.id);

        if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido o expirado" });
    }
}

module.exports = { authMiddleware };