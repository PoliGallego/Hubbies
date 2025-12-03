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
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
    originalCreatedAt: {
      type: Date,
      default: () => new Date()
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Mongoose.model("Post", PostSchema);