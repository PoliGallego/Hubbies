const User = require("../models/user");
const { generateToken, saveUserToken } = require("../lib/utils/generateToken");
const bcrypt = require("bcrypt");

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(
            "fullName username email avatar birthDate"
        );
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error del servidor" });
    }
};

const updateUser = async (req, res) => {
    try {
        const { fullName, username, email, birthDate, password } = req.body;
        const updates = {};

        if (fullName) updates.fullName = fullName;

        if (username) {
            const existingUser = await User.findOne({
                username,
                _id: { $ne: req.params.id },
            });
            if (existingUser) {
                return res
                    .status(409)
                    .json({ error: "El nombre de usuario ya está en uso." });
            }
            updates.username = username;
        }

        if (email) {
            if (!email.includes("@")) {
                return res
                    .status(400)
                    .json({ error: "El correo electrónico debe contener '@'." });
            }
            const existingEmail = await User.findOne({
                email,
                _id: { $ne: req.params.id },
            });
            if (existingEmail) {
                return res
                    .status(409)
                    .json({ error: "El correo electrónico ya está en uso." });
            }
            updates.email = email;
        }

        if (birthDate) {
            const birth = new Date(birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            if (age < 18) {
                return res
                    .status(400)
                    .json({ error: "Debes ser mayor de 18 años para registrarte." });
            }
            updates.birthDate = birthDate;
        }

        if (password) {
            const passwordRegex = /^(?=.*[0-9!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    error:
                        "La contraseña debe tener al menos 8 caracteres y contener un número o carácter especial.",
                });
            }

            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(password, salt);
        }

        if (req.file) {
            updates.avatar = req.file.filename;
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
            new: true,
        }).select("fullName username email avatar birthDate");

        const newToken = generateToken(updatedUser);
        await saveUserToken(updatedUser, newToken);

        res.json({
            message: "Perfil actualizado exitosamente",
            user: updatedUser,
            token: newToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error del servidor" });
    }
};

const deactivateUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findByIdAndUpdate(
            userId,
            { active: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json({ message: "Cuenta desactivada exitosamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error del servidor" });
    }
};

const deleteUser = async (req, res) => {
    try {
        if (req.user._id.toString() !== req.params.id) {
            return res
                .status(403)
                .json({ error: "No estás autorizado para eliminar este usuario." });
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Cuenta eliminada permanentemente." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error del servidor al eliminar la cuenta." });
    }
};

module.exports = {
    getUserById,
    updateUser,
    deactivateUser,
    deleteUser,
};