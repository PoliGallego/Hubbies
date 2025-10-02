const jwt = require("jsonwebtoken");

function generateToken(user) {
    return jwt.sign(
        { id: user._id.toString(), username: user.username, avatar: user.avatar },
        "secretKey",
        { expiresIn: "2h" }
    );
}

async function saveUserToken(user, token) {
    user.currentToken = token;
    await user.save();
}

module.exports = { generateToken, saveUserToken };