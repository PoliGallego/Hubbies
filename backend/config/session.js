const jwt = require("jsonwebtoken");
const User = require("../models/user");

function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username,avatar: user.avatar },
    "secretKey",
    { expiresIn: "2h" }
  );
}

async function authMiddleware(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, "secretKey");

    const user = await User.findById(decoded.id);
    
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function saveUserToken(user, token) {
  user.currentToken = token;
  await user.save();
}

module.exports = { generateToken, saveUserToken, authMiddleware };