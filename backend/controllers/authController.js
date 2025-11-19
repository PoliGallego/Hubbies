const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const UserPrototype = require("../lib/prototypes/userPrototype");
const { generateToken, saveUserToken } = require("../lib/utils/generateToken");
const { sendEmail } = require("../config/emailConfig");

const JWT_SECRET = "secretKey";

const registerUser = async (req, res) => {
  try {
    const { fullName, username, birthDate, email, password } = req.body;
    let avatarPath = req.file ? req.file.filename : "avatar_icon.png";

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(409).json({ error: "Username in use." });

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(409).json({ error: "Email in use." });

    if (!email.includes("@"))
      return res.status(400).json({ error: "Invalid email." });

    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    if (
        age < 18 ||
        (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))
    ) {
      return res.status(400).json({ error: "Must be over 18." });
    }

    const passwordRegex = /^(?=.*[0-9!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: "Password too weak." });
    }

    const prototype = new UserPrototype(
        fullName,
        username,
        birthDate,
        email,
        password,
        avatarPath
    );
    const newUserData = prototype.clone();

    const salt = await bcrypt.genSalt(10);
    newUserData.password = await bcrypt.hash(password, salt);

    const user = new User(newUserData);
    await user.save();

    const token = generateToken(user);
    await saveUserToken(user, token);

    res.status(201).json({ message: "User registered!", user, token });
  } catch (error) {
    res.status(500).json({ error: `Error registering user: ${error.message}` });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user)
      return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Incorrect credentials" });

    if (user.currentToken) {
      return res.status(403).json({
        error:
            "This account already has an active session. Please log out first.",
      });
    }

    let reactivatedMessage = null;
    if (user.active === false) {
      user.active = true;
      await user.save();
      reactivatedMessage =
          "Your account was deactivated and is now reactivated by login.";
    }

    const token = generateToken(user);
    await saveUserToken(user, token);

    res.status(200).json({
      message: reactivatedMessage || "Login successful!",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: `Error logging in: ${error.message}` });
  }
};




const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Por seguridad, siempre responder éxito
            return res.json({
                success: true,
                message: "If the email exists, you will receive a password reset link"
            });
        }

        // Crear token JWT con expiración de 1 hora
        const resetToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                purpose: 'password-reset'
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Crear URL de reseteo
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/src/html/reset-password.html?token=${resetToken}`;

        // HTML del email
        const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #C49B9B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #C49B9B; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${user.fullName || user.username},</p>
            <p>Your username is: <strong>${user.username}</strong></p>
            <p>You requested to reset your password for your Hubbies account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #C49B9B;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Hubbies. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;


        const emailResult = await sendEmail(
            user.email,
            'Password Reset Request - Hubbies',
            emailHTML
        );

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                message: "Error sending email"
            });
        }

        res.json({
            success: true,
            message: "Password reset email sent successfully"
        });

    } catch (error) {
        console.error("Error in password reset request:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required"
            });
        }

        const passwordRegex = /^(?=.*[0-9!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters and contain a number or special character"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(400).json({
                    success: false,
                    message: "Reset link has expired. Please request a new one"
                });
            }
            return res.status(400).json({
                success: false,
                message: "Invalid reset link"
            });
        }

        if (decoded.purpose !== 'password-reset') {
            return res.status(400).json({
                success: false,
                message: "Invalid token purpose"
            });
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        const confirmationHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #C49B9B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed Successfully</h1>
          </div>
          <div class="content">
            <p>Hello ${user.fullName || user.username},</p>
            <p>Your password has been changed successfully.</p>
            <p>If you didn't make this change, please contact us immediately.</p>
            <p>You can now log in with your new password.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Hubbies. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await sendEmail(
            user.email,
            'Password Changed Successfully - Hubbies',
            confirmationHTML
        );

        res.json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = { registerUser,
                    loginUser,
                    requestPasswordReset,
                    resetPassword  };