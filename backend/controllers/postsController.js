const Post = require("../models/post");
const Section = require("../models/section");
const jwt = require("jsonwebtoken");

// ✅ USAR EL MISMO SECRET que generateToken.js
const JWT_SECRET = "secretKey"; // Este es el valor correcto

// Verificar token para posts
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
    console.error("Error al verificar token:", error.message);
    res.status(401).json({ 
      valid: false, 
      message: "Token inválido" 
    });
  }
};

// Crear nuevo post
const createPost = async (req, res) => {
  try {
    const { title, description, privacy, categories } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Token requerido" 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    console.log('✅ Token decodificado correctamente:', { userId, username: decoded.username });

    // Validaciones
    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        message: "Título y descripción son requeridos" 
      });
    }

    if (!categories || categories.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Debe seleccionar al menos una sección" 
      });
    }

    // Procesar imagen si existe
    let images = [];
    if (req.file) {
      images.push(req.file.filename);
      console.log('📸 Imagen procesada:', req.file.filename);
    }

    console.log('📝 Datos del post:', {
      userId,
      title,
      description,
      privacy,
      categories,
      images
    });

    // Crear el post
    const newPost = new Post({
      idUser: userId,
      title: title.trim(),
      description: description.trim(),
      privacy: privacy || 'private',
      categories: Array.isArray(categories) ? categories : [categories],
      images: images
    });

    const savedPost = await newPost.save();
    console.log('✅ Post guardado en BD:', savedPost._id);

    res.status(201).json({
      success: true,
      message: "Post creado exitosamente",
      post: savedPost
    });

  } catch (error) {
    console.error("❌ Error completo al crear post:", error);
    
    // ✅ Manejar específicamente errores de JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token inválido - por favor inicia sesión nuevamente" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor: " + error.message 
    });
  }
};

// Obtener posts del usuario
const getUserPosts = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Token requerido" 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    // Buscar posts del usuario activos, ordenados por fecha (más recientes primero)
    const posts = await Post.find({ 
      idUser: userId, 
      active: true 
    }).sort({ createdAt: -1 });

    // Agregar información de las secciones
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
    console.error("Error al obtener posts:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token inválido" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error al cargar posts" 
    });
  }
};

// Obtener todos los posts públicos
const getPublicPosts = async (req, res) => {
  try {
    const posts = await Post.find({ 
      privacy: 'public', 
      active: true 
    }).sort({ createdAt: -1 });

    // Agregar información de las secciones
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
    console.error("Error al obtener posts públicos:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al cargar posts públicos" 
    });
  }
};

// Actualizar post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, privacy, categories } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Token requerido" 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    // Verificar que el post pertenece al usuario
    const post = await Post.findOne({ _id: id, idUser: userId });
    
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: "Post no encontrado" 
      });
    }

    // Actualizar campos
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (privacy) updateData.privacy = privacy;
    if (categories) updateData.categories = Array.isArray(categories) ? categories : [categories];

    const updatedPost = await Post.findByIdAndUpdate(id, updateData, { new: true });

    res.json({
      success: true,
      message: "Post actualizado exitosamente",
      post: updatedPost
    });

  } catch (error) {
    console.error("Error al actualizar post:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token inválido" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error al actualizar post" 
    });
  }
};

// Eliminar post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Token requerido" 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    // Verificar que el post pertenece al usuario
    const post = await Post.findOne({ _id: id, idUser: userId });
    
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: "Post no encontrado" 
      });
    }

    // Marcar como inactivo en lugar de eliminar
    await Post.findByIdAndUpdate(id, { active: false });

    res.json({
      success: true,
      message: "Post eliminado exitosamente"
    });

  } catch (error) {
    console.error("Error al eliminar post:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token inválido" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error al eliminar post" 
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