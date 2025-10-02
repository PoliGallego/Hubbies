const Mongoose = require("mongoose");

const SectionSchema = new Mongoose.Schema({
  idUser: String,
  title: String,
  descrip: String,
  type: String,
  image: String,
  privacy: String,
  items: [],
  active: { type: Boolean, default: true }
},
  { timestamps: true }
);

module.exports = Mongoose.model("Section", SectionSchema);