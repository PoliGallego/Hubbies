const Mongoose = require("mongoose");

const PostSchema = new Mongoose.Schema(
  {
    idUser: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: [String],
    categories: [String],
    privacy: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        type: Mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Mongoose.model("Post", PostSchema);