const Post = require("../models/post");
const Section = require("../models/section");
const Comment = require("../models/comment");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const JWT_SECRET = "secretKey";

const deleteImageFiles = (images) => {
  if (!images || images.length === 0) return;

  images.forEach((imageName) => {
    if (imageName === 'avatar_icon.png' || imageName === 'section_icon.png') {
      return;
    }

    const imagePath = path.join(__dirname, '../../frontend/public/assets/uploads', imageName);

    fs.access(imagePath, fs.constants.F_OK, (accessErr) => {
      if (accessErr) return;

      fs.unlink(imagePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error(`Error deleting file ${imageName}:`, unlinkErr.message);
        }
      });
    });
  });
};

const verifyPostToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        valid: false,
        message: "No token provided"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      valid: true,
      user: decoded.username || decoded.fullName,
      userId: decoded.id
    });
  } catch (error) {
    console.error("Error verifying token:", error.message);
    res.status(401).json({
      valid: false,
      message: "Invalid token"
    });
  }
};

const createPost = async (req, res) => {
  try {
    const { title, description, privacy, categories } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token required"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required"
      });
    }

    if (!categories || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "You must select at least one section"
      });
    }

    let images = [];
    if (req.file) {
      images = [req.file.filename];
    }

    const newPost = new Post({
      idUser: userId,
      title: title.trim(),
      description: description.trim(),
      privacy: privacy || 'private',
      categories: Array.isArray(categories) ? categories : [categories],
      images: images
    });

    const savedPost = await newPost.save();

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: savedPost
    });

  } catch (error) {
    console.error("Error creating post:", error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token required"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const posts = await Post.find({
      idUser: userId,
      active: true
    }).sort({
      pinned: -1,
      pinnedAt: -1,
      originalCreatedAt: -1
    });

    const postsWithSections = await Promise.all(
      posts.map(async (post) => {
        const sectionsInfo = await Section.find({
          _id: { $in: post.categories },
          active: true
        }).select('title');

        return {
          ...post.toObject(),
          categories: sectionsInfo
        };
      })
    );

    res.json(postsWithSections);

  } catch (error) {
    console.error("Error getting posts:", error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error loading posts"
    });
  }
};

const getPublicPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      privacy: 'public',
      active: true
    }).sort({ createdAt: -1 });

    const postsWithSections = await Promise.all(
      posts.map(async (post) => {
        const sectionsInfo = await Section.find({
          _id: { $in: post.categories },
          active: true
        }).select('title');

        return {
          ...post.toObject(),
          categories: sectionsInfo
        };
      })
    );

    res.json(postsWithSections);

  } catch (error) {
    console.error("Error getting public posts:", error);
    res.status(500).json({
      success: false,
      message: "Error loading public posts"
    });
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, privacy, categories, removeImage } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token required"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const post = await Post.findOne({ _id: id, idUser: userId });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (privacy) updateData.privacy = privacy;
    if (categories) updateData.categories = Array.isArray(categories) ? categories : [categories];

    let currentImages = post.images || [];
    let imagesToDelete = [];

    if (removeImage === 'true') {
      imagesToDelete = [...currentImages];
      currentImages = [];
    }

    if (req.file) {
      imagesToDelete = [...currentImages];
      currentImages = [req.file.filename];
    }

    updateData.images = currentImages;

    if (imagesToDelete.length > 0) {
      deleteImageFiles(imagesToDelete);
    }

    const updatedPost = await Post.findByIdAndUpdate(id, updateData, { new: true });

    res.json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost
    });

  } catch (error) {
    console.error("Error updating post:", error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating post: " + error.message
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token required"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const post = await Post.findOne({ _id: id, idUser: userId });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    if (post.images && post.images.length > 0) {
      deleteImageFiles(post.images);
    }

    await Post.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Post deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting post:", error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error deleting post: " + error.message
    });
  }
};

const sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findOne({ _id: id, idUser: userId });

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Verificar si el post es privado
    if (post.privacy === "private") {
      return res.status(403).json({ 
        success: false, 
        message: "Private posts cannot be shared. Please change the post to public first." 
      });
    }

    if (!post.shareToken) {
      post.shareToken = crypto.randomBytes(16).toString('hex');
    }
    post.isShared = true;
    await post.save();

    res.json({ success: true, shareToken: post.shareToken });
  } catch (error) {
    console.error("Error sharing post:", error);
    res.status(500).json({ success: false, message: "Error sharing post" });
  }
};

const unsharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findOne({ _id: id, idUser: userId });

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    post.isShared = false;
    await post.save();

    res.json({ success: true, message: "Link disabled" });
  } catch (error) {
    console.error("Error unsharing post:", error);
    res.status(500).json({ success: false, message: "Error unsharing post" });
  }
};

const getSharedPost = async (req, res) => {
  try {
    const { token } = req.params;

    const post = await Post.findOne({ shareToken: token, isShared: true, active: true });

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found or link disabled" });
    }

    // Verificar si el post es privado
    if (post.privacy === "private") {
      return res.status(403).json({ 
        success: false, 
        message: "This post is private and cannot be shared" 
      });
    }

    const sectionsInfo = await Section.find({
      _id: { $in: post.categories },
      active: true
    }).select('title');

    // Contar comentarios directamente desde la colección Comment
    const commentCount = await Comment.countDocuments({ postId: post._id });

    const postData = {
      ...post.toObject(),
      categories: sectionsInfo,
      commentCount: commentCount
    };

    res.json({ success: true, post: postData });
  } catch (error) {
    console.error("Error getting shared post:", error);
    res.status(500).json({ success: false, message: "Error loading shared post" });
  }
};

const togglePinPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findOne({ _id: id, idUser: userId });

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Toggle
    post.pinned = !post.pinned;

    if (post.pinned) {
      post.pinned = true;
      post.pinnedAt = new Date();
    } else {
      post.pinned = false;
      post.pinnedAt = null;
    }

    await post.save();

    res.json({
      success: true,
      pinned: post.pinned,
      message: post.pinned ? "Post pinned successfully" : "Post unpinned successfully"
    });

  } catch (error) {
    console.error("Error toggling pin post:", error);
    res.status(500).json({ success: false, message: "Error updating post" });
  }
};

module.exports = {
  verifyPostToken,
  createPost,
  getUserPosts,
  getPublicPosts,
  updatePost,
  deletePost,
  sharePost,
  unsharePost,
  getSharedPost,
  togglePinPost
};