const Mongoose = require("mongoose");

const UserSchema = new Mongoose.Schema({
  fullName: String,
  username: String,
  email: String,
  password: String,
  avatar: String,
  birthDate: Date,
  active: { type: Boolean, default: true }   
},
  { timestamps: true }
);

module.exports = Mongoose.model("User", UserSchema);