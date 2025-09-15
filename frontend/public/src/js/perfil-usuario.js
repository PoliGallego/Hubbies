// Funcionalidad para expandir/contraer el menú
const expandBtn = document.querySelector('.expand-btn');
if (expandBtn) {
    expandBtn.addEventListener('click', function() {
        if (this.textContent === '▼ Ver más') {
            this.textContent = '▲ Ver menos';
        } else {
            this.textContent = '▼ Ver más';
        }
    });
}
// Funcionalidad para el botón de eliminar post
const deleteBtn = document.querySelector('.delete-btn');
if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
        if (confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
            this.closest('.post-card').style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            this.closest('.post-card').style.opacity = '0';
            this.closest('.post-card').style.transform = 'scale(0.9)';
            setTimeout(() => {
                this.closest('.post-card').remove();
            }, 300);
        }
    });
}
// Funcionalidad para cambiar privacidad del post
const privacySelect = document.querySelector('.privacy-select');
if (privacySelect) {
    privacySelect.addEventListener('change', function() {
        console.log('Privacidad cambiada a:', this.value);
    });
}
// Funcionalidad para items del menú lateral
const navItems = document.querySelectorAll('.nav-item, .category-item');
navItems.forEach(item => {
    item.addEventListener('click', function() {
        // Remover clase activa de otros items del mismo tipo
        const isNavItem = this.classList.contains('nav-item');
        const selector = isNavItem ? '.nav-item' : '.category-item';
        document.querySelectorAll(selector).forEach(i => i.classList.remove('active'));
        // Agregar clase activa al item clickeado
        this.classList.add('active');
        console.log('Navegando a:', this.textContent.trim());
    });
});
// Funcionalidad para el botón de conectar
const connectBtn = document.querySelector('.connect-btn');
if (connectBtn) {
    connectBtn.addEventListener('click', function() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            const originalText = this.textContent;
            const originalBg = this.style.background;
            this.textContent = '¡Enlace copiado!';
            this.style.background = '#28a745';
            this.style.color = 'white';
            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = originalBg;
                this.style.color = '#495057';
            }, 2000);
        }).catch(() => {
            alert('Enlace: ' + url);
        });
    });
}
// Funcionalidad para el botón de editar avatar
const editAvatarBtn = document.querySelector('.edit-avatar');
if (editAvatarBtn) {
    editAvatarBtn.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const avatar = document.querySelector('.avatar-large');
                    avatar.style.backgroundImage = `url(${e.target.result})`;
                    avatar.style.backgroundSize = 'cover';
                    avatar.style.backgroundPosition = 'center';
                    avatar.textContent = '';
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });
}
// Inicializar primer item como activo
const firstNavItem = document.querySelector('.nav-item');
if (firstNavItem) {
    firstNavItem.classList.add('active');
}
