const Post = require("../models/post");
const Section = require("../models/section");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const path = require('path');

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

module.exports = {
  verifyPostToken,
  createPost,
  getUserPosts,
  getPublicPosts,
  updatePost,
  deletePost
};