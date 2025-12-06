const Mongoose = require("mongoose");

const UserSchema = new Mongoose.Schema({
  fullName: String,
  username: String,
  email: String,
  password: String,
  avatar: String,
  birthDate: Date,
  active: { type: Boolean, default: true },
  shareToken: { type: String, default: null },
  isShared: { type: Boolean, default: false }
},
  { timestamps: true }
);

module.exports = Mongoose.model("User", UserSchema);