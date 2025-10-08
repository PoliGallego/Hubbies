// Array para almacenar las secciones seleccionadas
let selectedSections = [];
let isCreatingPost = false;

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/src/html/index.html";
    return;
  }

  // ✅ Verificar token con endpoint correcto
  fetch("/api/posts/verify", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Sesión inválida");
      return res.json();
    })
    .then((data) => {
      console.log("✅ Usuario verificado:", data);
      const welcome = document.getElementById("welcomeUser");
      if (welcome) welcome.textContent = `Bienvenido ${data.user}`;
      
      // ✅ Cargar funcionalidades
      loadUserPosts();
      loadUserSections();
      setupModalEventListeners();
    })
    .catch((err) => {
      console.error("❌ Error de verificación:", err);
      localStorage.removeItem("token");
      window.location.href = "/src/html/index.html";
    });
});

// ✅ FUNCIÓN: Mostrar mensaje cuando no hay posts
function renderNoPosts() {
  const feedColumn = document.querySelector('.FeedColumn');
  if (!feedColumn) return;
  
  // Remover posts existentes PERO mantener ActionBar
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

// ✅ FUNCIÓN CORREGIDA:
async function loadUserSections() {
  try {
    console.log('📂 Cargando secciones del usuario...');
    const token = localStorage.getItem('token');
    
    // ✅ EXTRAER userId del token
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.id;
    
    // ✅ USAR endpoint correcto con userId
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
    console.log('📊 Secciones recibidas:', sections);
    
    renderSectionsList(sections);
  } catch (error) {
    console.error('❌ Error al cargar secciones:', error);
    renderSectionsList([]);
  }
}

// ✅ FUNCIÓN: Renderizar lista de secciones en el SELECT del modal (ARREGLADA)
function renderSectionsList(sections) {
  const categorySelect = document.getElementById('postCategory');
  if (!categorySelect) {
    console.error('❌ No se encontró el select de categorías');
    return;
  }

  // Limpiar opciones existentes excepto la primera
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

  // ✅ Agregar event listener al select
  categorySelect.onchange = function() {
    if (this.value) {
      const selectedText = this.options[this.selectedIndex].text;
      addSectionToPost(this.value, selectedText);
      this.value = ''; // Resetear select
    }
  };

  console.log('✅ Secciones cargadas en el select:', sections.length);
}

// ✅ FUNCIÓN: Agregar sección al post
function addSectionToPost(sectionId, sectionTitle) {
  // Verificar si ya está agregada
  if (selectedSections.find(s => s.id === sectionId)) {
    console.log('⚠️ Sección ya agregada');
    return;
  }

  selectedSections.push({
    id: sectionId,
    title: sectionTitle
  });

  updateSelectedTagsDisplay();
  console.log('✅ Sección agregada:', sectionTitle);
}

// ✅ FUNCIÓN: Actualizar display de tags seleccionados
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

// ✅ FUNCIÓN: Remover sección seleccionada
function removeSelectedSection(sectionId) {
  selectedSections = selectedSections.filter(s => s.id !== sectionId);
  updateSelectedTagsDisplay();
  console.log('❌ Sección removida');
}

// ✅ FUNCIÓN: Activar selector de archivos (NUEVA - FALTABA)
function triggerImageUpload() {
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.click();
  }
}

// ✅ FUNCIÓN: Manejar subida de imagen (ARREGLADA)
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
    console.log('📸 Imagen cargada:', file.name);
  }
}

// ✅ FUNCIÓN: Remover imagen
function removeImage() {
  const fileInput = document.getElementById('fileInput');
  const imagePreview = document.getElementById('imagePreview');
  const imageContainer = document.getElementById('imageContainer');
  
  if (fileInput) fileInput.value = '';
  if (imagePreview) imagePreview.src = '';
  if (imageContainer) imageContainer.style.display = 'none';
  
  console.log('🗑️ Imagen removida');
}

// ✅ FUNCIÓN: Cargar posts del usuario (NUEVA - FALTABA)
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
    console.log('📊 Posts recibidos:', posts);
    
    renderPosts(posts);
  } catch (error) {
    console.error('❌ Error al cargar posts:', error);
    renderNoPosts();
  }
}

// ✅ FUNCIÓN: Renderizar posts (NUEVA - FALTABA)
function renderPosts(posts) {
  const feedColumn = document.querySelector('.FeedColumn');
  if (!feedColumn) return;
  
  // Remover posts existentes PERO mantener ActionBar
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

// ✅ FUNCIÓN: Crear HTML del post (NUEVA - FALTABA)
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

// ✅ FUNCIÓN: Configurar event listeners de posts (NUEVA - FALTABA)
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

// ✅ FUNCIÓN: Activar modo edición (NUEVA - FALTABA)
async function enableEditMode(postId) {
  alert('Función de edición próximamente...');
}

// ✅ FUNCIÓN: Confirmar eliminación de post
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

// ✅ FUNCIÓN: Eliminar post
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
      console.log('✅ Post eliminado');
      
      if (typeof Swal !== 'undefined') {
        Swal.fire('Eliminado', 'Post eliminado exitosamente', 'success');
      }
      
      // Recargar posts
      loadUserPosts();
    }
  } catch (error) {
    console.error('❌ Error al eliminar post:', error);
    
    if (typeof Swal !== 'undefined') {
      Swal.fire('Error', 'No se pudo eliminar el post', 'error');
    } else {
      alert('Error al eliminar el post');
    }
  }
}

// ✅ Configurar event listeners del modal
function setupModalEventListeners() {
  console.log('🔧 Configurando event listeners del modal...');
  
  const createPostBtn = document.getElementById('CreatePostBtn');
  if (createPostBtn) {
    createPostBtn.addEventListener('click', openCreatePostModal);
    console.log('✅ Botón crear post configurado');
  }

  // Configurar event listeners del modal
  setTimeout(() => {
    setupModalCloseListeners();
  }, 500);
  
  console.log('✅ Event listeners del modal configurados');
}

// ✅ Configurar listeners de cerrar
function setupModalCloseListeners() {
  console.log('🔧 Configurando listeners de cerrar modal...');
  
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

// ✅ Función para abrir modal (crear)
function openCreatePostModal() {
  console.log('🚀 Abriendo modal de crear post');
  
  const modal = document.getElementById('MainModal');
  if (modal) {
    // Mostrar modal
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.classList.remove('hidden');
    modal.classList.add('show');
    
    // Resetear formulario
    const titleInput = document.getElementById('postTitle');
    const descInput = document.getElementById('postDescription');
    const privacySelect = document.getElementById('postPrivacy');
    
    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    if (privacySelect) privacySelect.value = 'private';
    
    selectedSections = [];
    updateSelectedTagsDisplay();
    removeImage();
    loadUserSections();

    // Configurar event listeners
    setTimeout(() => {
      setupModalCloseListeners();
    }, 100);
  }
}

// ✅ Función para cerrar modal
function closeCreatePostModal() {
  console.log('❌ Cerrando modal');
  
  const modal = document.getElementById('MainModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ✅ FUNCIÓN: Crear post real (con prevención de duplicados)
async function createPost() {
  // ✅ PREVENIR múltiples envíos
  if (isCreatingPost) {
    console.log('⚠️ Ya se está creando un post, ignorando...');
    return;
  }
  
  isCreatingPost = true;
  
  console.log('🚀 Iniciando creación de post...');
  
  const title = document.getElementById('postTitle')?.value?.trim();
  const description = document.getElementById('postDescription')?.value?.trim();
  const privacy = document.getElementById('postPrivacy')?.value;
  const fileInput = document.getElementById('fileInput');

  console.log('📝 Datos del formulario:', {
    title,
    description,
    privacy,
    selectedSections: selectedSections.length,
    hasImage: fileInput?.files[0] ? 'Sí' : 'No'
  });

  // Validaciones
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
        text: 'Debes seleccionar al menos una sección para tu post'
      });
    } else {
      alert('Debes seleccionar al menos una sección');
    }
    return;
  }

  // ✅ DESHABILITAR botón de envío
  const submitBtn = document.querySelector('#MainModal .EditableSubmitButton');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span>Creando...';
  }

  // Crear FormData
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('privacy', privacy || 'private');
  
  // Agregar categorías (secciones seleccionadas)
  selectedSections.forEach(section => {
    formData.append('categories', section.id);
  });
  
  // Agregar imagen si existe
  if (fileInput?.files[0]) {
    formData.append('image', fileInput.files[0]);
  }

  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ No hay token de autenticación');
      alert('Error: No hay sesión activa');
      return;
    }

    console.log('📡 Enviando petición al servidor...');
    
    // Mostrar loading
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Creando post...',
        text: 'Por favor espera mientras se procesa tu post',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    }

    // ✅ ENDPOINT CORRECTO
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    console.log('📊 Respuesta del servidor:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Datos recibidos:', data);

    if (data.success) {
      console.log('🎉 Post creado exitosamente');
      
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: '¡Post creado!',
          text: 'Tu post se ha creado exitosamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        alert('¡Post creado exitosamente!');
      }
      
      // ✅ IMPORTANTE: Cerrar modal PRIMERO
      closeCreatePostModal();
      
      // Luego recargar posts
      setTimeout(() => {
        loadUserPosts();
      }, 500);
      
    } else {
      console.error('❌ Error en la respuesta:', data);
      
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Error al crear el post'
        });
      } else {
        alert('Error al crear el post: ' + (data.message || 'Error desconocido'));
      }
    }
  } catch (error) {
    console.error('❌ Error completo:', error);
    
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: `No se pudo conectar con el servidor: ${error.message}`,
        footer: 'Verifica que el servidor esté ejecutándose en el puerto correcto'
      });
    } else {
      alert(`Error de conexión: ${error.message}`);
    }
  } finally {
    // ✅ SIEMPRE resetear el flag y rehabilitar botón
    isCreatingPost = false;
    
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="material-icons">send</span>Publicar';
    }
  }
}

// ✅ Hacer funciones globales
window.addSectionToPost = addSectionToPost;
window.removeSelectedSection = removeSelectedSection;
window.handleImageUpload = handleImageUpload;
window.removeImage = removeImage;
window.triggerImageUpload = triggerImageUpload;
window.enableEditMode = enableEditMode;
