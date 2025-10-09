const Post = require("../models/post");
const Section = require("../models/section");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const path = require('path');

const JWT_SECRET = "secretKey";

// ✅ AGREGAR: Función auxiliar para eliminar archivos físicos
const deleteImageFiles = (images) => {
  if (!images || images.length === 0) {
    console.log('ℹ️ No hay imágenes para eliminar');
    return;
  }
  
  console.log('🗑️ Iniciando eliminación de archivos:', images);
  
  images.forEach((imageName, index) => {
    // Saltar archivos por defecto del sistema
    if (imageName === 'avatar_icon.png' || imageName === 'section_icon.png') {
      console.log(`🛡️ Archivo protegido, no se elimina: ${imageName}`);
      return;
    }
    
    // Construir ruta completa del archivo
    const imagePath = path.join(__dirname, '../../frontend/public/assets/uploads', imageName);
    
    console.log(`🔍 Intentando eliminar archivo ${index + 1}/${images.length}: ${imagePath}`);
    
    // Verificar si el archivo existe antes de intentar eliminarlo
    fs.access(imagePath, fs.constants.F_OK, (accessErr) => {
      if (accessErr) {
        console.log(`⚠️ Archivo no encontrado: ${imageName} (puede que ya haya sido eliminado)`);
        return;
      }
      
      // Eliminar el archivo
      fs.unlink(imagePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error(`❌ Error al eliminar archivo ${imageName}:`, unlinkErr.message);
        } else {
          console.log(`✅ Imagen eliminada exitosamente: ${imageName}`);
        }
      });
    });
  });
};

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

// Crear post con una sola imagen
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

    console.log('Token decodificado correctamente:', { userId, username: decoded.username });

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

    // Procesar una sola imagen
    let images = [];
    if (req.file) {
      images = [req.file.filename];
      console.log('Imagen procesada:', req.file.filename);
    }

    console.log('Datos del post:', {
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
    console.log('Post guardado en BD:', savedPost._id);

    res.status(201).json({
      success: true,
      message: "Post creado exitosamente",
      post: savedPost
    });

  } catch (error) {
    console.error("Error completo al crear post:", error);
    
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

// ✅ MEJORAR: Función updatePost con eliminación de archivos antiguos
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, privacy, categories, removeImage } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    
    console.log('📝 Datos recibidos para actualizar:', {
      id,
      title,
      description,
      privacy,
      categories,
      removeImage,
      hasNewFile: !!req.file,
      fileName: req.file?.filename || 'Sin archivo'
    });
    
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

    console.log('📄 Post actual:', {
      id: post._id,
      title: post.title,
      currentImages: post.images,
      hasImages: post.images?.length > 0
    });

    // Actualizar campos básicos
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (privacy) updateData.privacy = privacy;
    if (categories) updateData.categories = Array.isArray(categories) ? categories : [categories];

    // ✅ MEJORAR: Manejo inteligente de imágenes con eliminación
    let currentImages = post.images || [];
    let imagesToDelete = []; // Tracking de imágenes a eliminar

    console.log('🖼️ Imágenes actuales:', currentImages);

    // Caso 1: Se solicita remover la imagen existente
    if (removeImage === 'true') {
      console.log('🗑️ Removiendo imagen existente');
      imagesToDelete = [...currentImages]; // Marcar para eliminar
      currentImages = [];
    }

    // Caso 2: Se sube una nueva imagen
    if (req.file) {
      console.log('📷 Nueva imagen subida:', req.file.filename);
      imagesToDelete = [...currentImages]; // Marcar imagen anterior para eliminar
      currentImages = [req.file.filename];
    }

    updateData.images = currentImages;
    console.log('💾 Imágenes finales a guardar:', updateData.images);

    // ✅ ELIMINAR: Archivos físicos de imágenes reemplazadas/removidas
    if (imagesToDelete.length > 0) {
      console.log('🗑️ Eliminando archivos antiguos:', imagesToDelete);
      deleteImageFiles(imagesToDelete);
    }

    const updatedPost = await Post.findByIdAndUpdate(id, updateData, { new: true });
    
    console.log('✅ Post actualizado exitosamente:', {
      id: updatedPost._id,
      title: updatedPost.title,
      finalImages: updatedPost.images
    });

    res.json({
      success: true,
      message: "Post actualizado exitosamente",
      post: updatedPost
    });

  } catch (error) {
    console.error("❌ Error al actualizar post:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token inválido" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error al actualizar post: " + error.message 
    });
  }
};

// ✅ MEJORAR: Función deletePost con eliminación automática de archivos
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

    // Obtener el post antes de eliminarlo para acceder a las imágenes
    const post = await Post.findOne({ _id: id, idUser: userId });
    
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: "Post no encontrado" 
      });
    }

    console.log('🗑️ Eliminando post:', {
      id: post._id,
      title: post.title,
      images: post.images
    });

    // ✅ ELIMINAR: Archivos de imagen físicos ANTES de eliminar el post
    if (post.images && post.images.length > 0) {
      console.log('🖼️ Eliminando imágenes del post:', post.images);
      deleteImageFiles(post.images);
    }

    // ✅ ELIMINAR: Post de la base de datos (eliminación real)
    await Post.findByIdAndDelete(id);

    console.log('✅ Post e imágenes eliminados correctamente');

    res.json({
      success: true,
      message: "Post eliminado exitosamente"
    });

  } catch (error) {
    console.error("❌ Error al eliminar post:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token inválido" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error al eliminar post: " + error.message 
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