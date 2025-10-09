// Array para almacenar las secciones seleccionadas
let selectedSections = [];
let isCreatingPost = false;
let isEditMode = false;
let editingPostId = null;
let originalPostData = null;

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/src/html/index.html";
    return;
  }

  // Verificar token con endpoint correcto
  fetch("/api/posts/verify", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Sesión inválida");
      return res.json();
    })
    .then((data) => {
      console.log("Usuario verificado:", data);
      const welcome = document.getElementById("welcomeUser");
      if (welcome) welcome.textContent = `Bienvenido ${data.user}`;
      
      loadUserPosts();
      loadUserSections();
      setupModalEventListeners();
    })
    .catch((err) => {
      console.error("Error de verificación:", err);
      localStorage.removeItem("token");
      window.location.href = "/src/html/index.html";
    });
});

// FUNCIÓN: Mostrar mensaje cuando no hay posts
function renderNoPosts() {
  const feedColumn = document.querySelector('.FeedColumn');
  if (!feedColumn) return;
  
  const existingPosts = feedColumn.querySelectorAll('.Publication');
  existingPosts.forEach(post => post.remove());

  const noPostsHTML = `
    <div class="Publication">
      <article class="ContentCard">
        <div style="text-align: center; padding: 40px 20px;">
          <span class="material-icons" style="font-size: 4em; color: #ccc; margin-bottom: 20px;">post_add</span>
          <h3 style="color: #666; margin-bottom: 10px;">No tienes posts aún</h3>
          <p style="color: #999;">¡Crea tu primer post haciendo clic en "Crear Post"!</p>
        </div>
      </article>
    </div>
  `;
  
  feedColumn.insertAdjacentHTML('beforeend', noPostsHTML);
}

// FUNCIÓN: Cargar secciones del usuario
async function loadUserSections() {
  try {
    console.log('Cargando secciones del usuario...');
    const token = localStorage.getItem('token');
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.id;
    
    const response = await fetch(`/api/sections/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const sections = await response.json();
    console.log('Secciones recibidas:', sections);
    
    renderSectionsList(sections);
  } catch (error) {
    console.error('Error al cargar secciones:', error);
    renderSectionsList([]);
  }
}

// FUNCIÓN: Renderizar lista de secciones en el SELECT del modal
function renderSectionsList(sections) {
  const categorySelect = document.getElementById('postCategory');
  if (!categorySelect) {
    console.error('No se encontró el select de categorías');
    return;
  }

  categorySelect.innerHTML = '<option value="">+ Agregar sección...</option>';

  if (!sections || sections.length === 0) {
    categorySelect.innerHTML += '<option value="" disabled>No tienes secciones creadas</option>';
    return;
  }

  sections.forEach(section => {
    const option = document.createElement('option');
    option.value = section._id;
    option.textContent = section.title;
    categorySelect.appendChild(option);
  });

  categorySelect.onchange = function() {
    if (this.value) {
      const selectedText = this.options[this.selectedIndex].text;
      addSectionToPost(this.value, selectedText);
      this.value = '';
    }
  };

  console.log('Secciones cargadas en el select:', sections.length);
}

// FUNCIÓN: Agregar sección al post
function addSectionToPost(sectionId, sectionTitle) {
  if (selectedSections.find(s => s.id === sectionId)) {
    console.log('Sección ya agregada');
    return;
  }

  selectedSections.push({
    id: sectionId,
    title: sectionTitle
  });

  updateSelectedTagsDisplay();
  console.log('Sección agregada:', sectionTitle);
}

// FUNCIÓN: Actualizar display de tags seleccionados
function updateSelectedTagsDisplay() {
  const selectedTagsContainer = document.getElementById('selectedTags');
  if (!selectedTagsContainer) return;

  if (selectedSections.length === 0) {
    selectedTagsContainer.innerHTML = '<p style="color: #999; text-align: center;">No has seleccionado secciones</p>';
    return;
  }

  const tagsHTML = selectedSections.map(section => `
    <div class="Tag">
      ${section.title}
      <span class="material-icons" onclick="removeSelectedSection('${section.id}')">close</span>
    </div>
  `).join('');

  selectedTagsContainer.innerHTML = tagsHTML;
}

// FUNCIÓN: Remover sección seleccionada
function removeSelectedSection(sectionId) {
  selectedSections = selectedSections.filter(s => s.id !== sectionId);
  updateSelectedTagsDisplay();
  console.log('Sección removida');
}

// ✅ REVERTIR: Funciones simples de imagen
function triggerImageUpload() {
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.click();
  }
}

function handleImageUpload(event) {
  const fileInput = event ? event.target : document.getElementById('fileInput');
  const imagePreview = document.getElementById('imagePreview');
  const imageContainer = document.getElementById('imageContainer');
  
  if (fileInput && fileInput.files[0]) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
      if (imagePreview && imageContainer) {
        imagePreview.src = e.target.result;
        imageContainer.style.display = 'block';
      }
    };
    
    reader.readAsDataURL(file);
    console.log('Imagen cargada:', file.name);
  }
}

function removeImage() {
  const fileInput = document.getElementById('fileInput');
  const imagePreview = document.getElementById('imagePreview');
  const imageContainer = document.getElementById('imageContainer');
  
  if (fileInput) fileInput.value = '';
  if (imagePreview) imagePreview.src = '';
  if (imageContainer) imageContainer.style.display = 'none';
  
  console.log('✅ Imagen removida del formulario');
}

// FUNCIÓN: Cargar posts del usuario
async function loadUserPosts() {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('/api/posts/my-posts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const posts = await response.json();
    console.log('Posts recibidos:', posts);
    
    renderPosts(posts);
  } catch (error) {
    console.error('Error al cargar posts:', error);
    renderNoPosts();
  }
}

// FUNCIÓN: Renderizar posts
function renderPosts(posts) {
  const feedColumn = document.querySelector('.FeedColumn');
  if (!feedColumn) return;
  
  const existingPosts = feedColumn.querySelectorAll('.Publication');
  existingPosts.forEach(post => post.remove());

  if (!posts || posts.length === 0) {
    renderNoPosts();
    return;
  }

  posts.forEach(post => {
    const postHTML = createPostHTML(post);
    feedColumn.insertAdjacentHTML('beforeend', postHTML);
  });

  setupPostEventListeners();
}

// ✅ REVERTIR: Función simple para crear HTML del post
function createPostHTML(post) {
  const categoryTags = post.categories ? post.categories.map(category => `
    <div class="Tag TagReadOnly">
      ${category.title || category}
    </div>
  `).join('') : '';

  const imageHTML = post.images && post.images.length > 0 ? `
    <img class="CardImage" src="/assets/uploads/${post.images[0]}" alt="${post.title}">
  ` : '';

  const privacyText = post.privacy === 'public' ? 'Público' : 'Privado';
  const privacyClass = post.privacy === 'public' ? 'PrivacyPublic' : 'PrivacyPrivate';

  return `
    <div class="Publication" data-post-id="${post._id}">
      <article class="ContentCard">
        <div class="CardHeader">
          <h2 class="PostTitleReadOnly">"${post.title}"</h2>
          <div class="CardControls">
            <span class="PrivacyDisplay ${privacyClass}">${privacyText}</span>
            <button class="IconButton delete-post-btn" data-post-id="${post._id}">
              <span class="material-icons">delete_outline</span>
            </button>
            <button class="IconButton edit-post-btn" data-post-id="${post._id}">
              <span class="material-icons">edit</span>
            </button>
          </div>
        </div>
        <p class="CardDescription DescriptionReadOnly">${post.description}</p>
        ${imageHTML}
        <div class="CardFooter">
          ${categoryTags}
        </div>
      </article>
      <div class="BottomBar">
        <button class="IconButton"><span class="material-icons">message</span></button>
        <span>${post.comments?.length || 0}</span>
        <button class="IconButton"><span class="material-icons">share</span></button>
      </div>
    </div>
  `;
}

// FUNCIÓN: Configurar event listeners de posts
function setupPostEventListeners() {
  document.querySelectorAll('.delete-post-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const postId = e.target.closest('.delete-post-btn').dataset.postId;
      confirmDeletePost(postId);
    });
  });

  document.querySelectorAll('.edit-post-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const postId = e.target.closest('.edit-post-btn').dataset.postId;
      enableEditMode(postId);
    });
  });
}

// FUNCIÓN: Activar modo edición
async function enableEditMode(postId) {
  console.log('Iniciando edición del post:', postId);
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/posts/my-posts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Error al cargar posts');
    }

    const posts = await response.json();
    const postToEdit = posts.find(post => post._id === postId);

    if (!postToEdit) {
      throw new Error('Post no encontrado');
    }

    console.log('Post encontrado para editar:', postToEdit);

    isEditMode = true;
    editingPostId = postId;
    originalPostData = postToEdit;

    openCreatePostModal();

    setTimeout(() => {
      fillModalForEdit(postToEdit);
    }, 300);

  } catch (error) {
    console.error('Error al iniciar edición:', error);
    
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el post para editar'
      });
    } else {
      alert('Error al cargar el post para editar');
    }
  }
}

// ✅ ACTUALIZAR: Función para rellenar modal en edición con imagen simple
function fillModalForEdit(postData) {
  console.log('Rellenando modal para edición');

  const modalTitle = document.querySelector('#MainModal .ModalTitle');
  if (modalTitle) {
    modalTitle.textContent = 'Editar Post';
  }

  const titleInput = document.getElementById('postTitle');
  const descInput = document.getElementById('postDescription');
  const privacySelect = document.getElementById('postPrivacy');
  
  if (titleInput) titleInput.value = postData.title || '';
  if (descInput) descInput.value = postData.description || '';
  if (privacySelect) privacySelect.value = postData.privacy || 'private';

  selectedSections = [];
  if (postData.categories && Array.isArray(postData.categories)) {
    postData.categories.forEach(category => {
      if (category._id && category.title) {
        selectedSections.push({
          id: category._id,
          title: category.title
        });
      }
    });
  }
  updateSelectedTagsDisplay();

  // ✅ SIMPLIFICAR: Mostrar imagen existente si la hay
  const imagePreview = document.getElementById('imagePreview');
  const imageContainer = document.getElementById('imageContainer');
  
  if (postData.images && postData.images.length > 0) {
    if (imagePreview && imageContainer) {
      imagePreview.src = `/assets/uploads/${postData.images[0]}`;
      imageContainer.style.display = 'block';
    }
  } else {
    if (imageContainer) {
      imageContainer.style.display = 'none';
    }
  }

  const submitBtn = document.querySelector('#MainModal .EditableSubmitButton');
  if (submitBtn) {
    submitBtn.innerHTML = '<span class="material-icons">save</span>Guardar Cambios';
  }

  console.log('Modal configurado para edición');
}

// Función para abrir modal
function openCreatePostModal() {
  console.log('Abriendo modal:', isEditMode ? 'EDITAR' : 'CREAR');
  
  const modal = document.getElementById('MainModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.classList.remove('hidden');
    modal.classList.add('show');
    
    if (!isEditMode) {
      console.log('Limpiando modal para crear nuevo post');
      
      const titleInput = document.getElementById('postTitle');
      const descInput = document.getElementById('postDescription');
      const privacySelect = document.getElementById('postPrivacy');
      
      if (titleInput) titleInput.value = '';
      if (descInput) descInput.value = '';
      if (privacySelect) privacySelect.value = 'private';
      
      selectedSections = [];
      updateSelectedTagsDisplay();
      removeImage();
      
      const modalTitle = document.querySelector('#MainModal .ModalTitle');
      if (modalTitle) modalTitle.textContent = 'Crear Nuevo Post';
      
      const submitBtn = document.querySelector('#MainModal .EditableSubmitButton');
      if (submitBtn) {
        submitBtn.innerHTML = '<span class="material-icons">send</span>Publicar';
      }
    }
    
    loadUserSections();

    setTimeout(() => {
      setupModalCloseListeners();
    }, 100);
  }
}

// Función para cerrar modal
function closeCreatePostModal() {
  console.log('Cerrando modal');
  
  const modal = document.getElementById('MainModal');
  if (modal) {
    modal.style.display = 'none';
    
    if (isEditMode) {
      console.log('Saliendo del modo edición');
      isEditMode = false;
      editingPostId = null;
      originalPostData = null;
    }
    
    setTimeout(() => {
      const titleInput = document.getElementById('postTitle');
      const descInput = document.getElementById('postDescription');
      const privacySelect = document.getElementById('postPrivacy');
      
      if (titleInput) titleInput.value = '';
      if (descInput) descInput.value = '';
      if (privacySelect) privacySelect.value = 'private';
      
      selectedSections = [];
      updateSelectedTagsDisplay();
      removeImage();
      
      const modalTitle = document.querySelector('#MainModal .ModalTitle');
      if (modalTitle) modalTitle.textContent = 'Crear Nuevo Post';
      
      const submitBtn = document.querySelector('#MainModal .EditableSubmitButton');
      if (submitBtn) {
        submitBtn.innerHTML = '<span class="material-icons">send</span>Publicar';
      }
    }, 100);
  }
}

// ✅ ACTUALIZAR: Función crear/editar post con mejor manejo de imágenes
async function createPost() {
  if (isCreatingPost) {
    console.log('Ya se está procesando, ignorando...');
    return;
  }
  
  isCreatingPost = true;
  
  const actionText = isEditMode ? 'EDITANDO' : 'CREANDO';
  console.log(`${actionText} post...`);
  
  const title = document.getElementById('postTitle')?.value?.trim();
  const description = document.getElementById('postDescription')?.value?.trim();
  const privacy = document.getElementById('postPrivacy')?.value;
  const fileInput = document.getElementById('fileInput');

  console.log(`Datos del formulario (${actionText}):`, {
    title,
    description,
    privacy,
    selectedSections: selectedSections.length,
    hasNewImage: fileInput?.files[0] ? 'Sí' : 'No',
    postId: isEditMode ? editingPostId : 'Nuevo'
  });

  if (!title || !description) {
    isCreatingPost = false;
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Campos incompletos',
        text: 'Por favor completa el título y la descripción'
      });
    } else {
      alert('Por favor completa el título y la descripción');
    }
    return;
  }
  
  if (selectedSections.length === 0) {
    isCreatingPost = false;
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Sin secciones',
        text: 'Debes seleccionar al menos una sección'
      });
    } else {
      alert('Debes seleccionar al menos una sección');
    }
    return;
  }

  const submitBtn = document.querySelector('#MainModal .EditableSubmitButton');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="material-icons">hourglass_empty</span>${isEditMode ? 'Guardando...' : 'Creando...'}`;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('privacy', privacy || 'private');
  
  selectedSections.forEach(section => {
    formData.append('categories', section.id);
  });
  
  // ✅ MEJORAR: Manejo de imágenes en edición
  if (isEditMode) {
    const imageContainer = document.getElementById('imageContainer');
    const imagePreview = document.getElementById('imagePreview');
    const hasNewImage = fileInput?.files[0];
    
    console.log('Estado de imagen en edición:', {
      hasOriginalImage: originalPostData?.images?.length > 0,
      hasNewImage: !!hasNewImage,
      imageContainerVisible: imageContainer?.style.display !== 'none',
      imagePreviewSrc: imagePreview?.src || 'sin src'
    });

    if (hasNewImage) {
      // Si hay una nueva imagen, la enviamos
      formData.append('image', hasNewImage);
      console.log('✅ Enviando nueva imagen:', hasNewImage.name);
    } else {
      // Verificar si se removió la imagen existente
      const hadOriginalImage = originalPostData?.images?.length > 0;
      const imageStillVisible = imageContainer?.style.display !== 'none' && imagePreview?.src;
      
      if (hadOriginalImage && !imageStillVisible) {
        // Tenía imagen pero ya no se muestra = se removió
        formData.append('removeImage', 'true');
        console.log('✅ Marcando imagen para remover');
      } else if (hadOriginalImage && imageStillVisible) {
        // Tenía imagen y sigue visible = mantener imagen actual
        console.log('✅ Manteniendo imagen existente');
      }
    }
  } else {
    // Modo crear: simplemente agregar imagen si existe
    if (fileInput?.files[0]) {
      formData.append('image', fileInput.files[0]);
      console.log('✅ Agregando imagen al crear post');
    }
  }

  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    console.log('Enviando petición al servidor...');
    
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: isEditMode ? 'Guardando cambios...' : 'Creando post...',
        text: 'Por favor espera',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    }

    const url = isEditMode ? `/api/posts/${editingPostId}` : '/api/posts';
    const method = isEditMode ? 'PUT' : 'POST';

    console.log(`${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    console.log('Respuesta del servidor:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Datos recibidos:', data);

    if (data.success) {
      const successText = isEditMode ? 'actualizado' : 'creado';
      console.log(`Post ${successText} exitosamente`);
      
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: isEditMode ? 'Post actualizado!' : 'Post creado!',
          text: `Tu post se ha ${successText} exitosamente`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        alert(`¡Post ${successText} exitosamente!`);
      }
      
      closeCreatePostModal();
      
      setTimeout(() => {
        loadUserPosts();
      }, 500);
      
    } else {
      throw new Error(data.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el post`);
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message
      });
    } else {
      alert('Error: ' + error.message);
    }
  } finally {
    isCreatingPost = false;
    
    if (submitBtn) {
      submitBtn.disabled = false;
      if (isEditMode) {
        submitBtn.innerHTML = '<span class="material-icons">save</span>Guardar Cambios';
      } else {
        submitBtn.innerHTML = '<span class="material-icons">send</span>Publicar';
      }
    }
  }
}

// FUNCIÓN: Confirmar eliminación de post
async function confirmDeletePost(postId) {
  if (typeof Swal !== 'undefined') {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await deletePost(postId);
    }
  } else {
    if (confirm('¿Estás seguro de que quieres eliminar este post?')) {
      await deletePost(postId);
    }
  }
}

// FUNCIÓN: Eliminar post
async function deletePost(postId) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Error al eliminar post');
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('Post eliminado');
      
      if (typeof Swal !== 'undefined') {
        Swal.fire('Eliminado', 'Post eliminado exitosamente', 'success');
      }
      
      loadUserPosts();
    }
  } catch (error) {
    console.error('Error al eliminar post:', error);
    
    if (typeof Swal !== 'undefined') {
      Swal.fire('Error', 'No se pudo eliminar el post', 'error');
    } else {
      alert('Error al eliminar el post');
    }
  }
}

// Configurar event listeners del modal
function setupModalEventListeners() {
  console.log('Configurando event listeners del modal...');
  
  const createPostBtn = document.getElementById('CreatePostBtn');
  if (createPostBtn) {
    createPostBtn.addEventListener('click', openCreatePostModal);
    console.log('Botón crear post configurado');
  }

  setTimeout(() => {
    setupModalCloseListeners();
  }, 500);
  
  console.log('Event listeners del modal configurados');
}

// Configurar listeners de cerrar
function setupModalCloseListeners() {
  const closeBtn = document.querySelector('#MainModal .CloseButton');
  const cancelBtn = document.querySelector('#MainModal .EditableCancelButton');
  const submitBtn = document.querySelector('#MainModal .EditableSubmitButton');
  
  if (closeBtn) {
    closeBtn.onclick = closeCreatePostModal;
  }
  
  if (cancelBtn) {
    cancelBtn.onclick = closeCreatePostModal;
  }
  
  if (submitBtn) {
    submitBtn.onclick = createPost;
  }
}

// Hacer funciones globales
window.addSectionToPost = addSectionToPost;
window.removeSelectedSection = removeSelectedSection;
window.handleImageUpload = handleImageUpload;
window.removeImage = removeImage;
window.triggerImageUpload = triggerImageUpload;
window.enableEditMode = enableEditMode;
window.confirmDeletePost = confirmDeletePost;
window.deletePost = deletePost;
window.setupModalEventListeners = setupModalEventListeners;
window.setupModalCloseListeners = setupModalCloseListeners;
window.openCreatePostModal = openCreatePostModal;
window.closeCreatePostModal = closeCreatePostModal;
window.createPost = createPost;
