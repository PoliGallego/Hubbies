document.addEventListener('DOMContentLoaded', () => {
    // Opciones de configuración
    document.querySelectorAll('.config-option').forEach(option => {
        option.addEventListener('click', function() {
            console.log('Opción seleccionada:', this.textContent);
            // Aquí puedes agregar la funcionalidad específica para cada opción
        });
    });

    // Botón desactivar cuenta
    document.getElementById('deactivateBtn').addEventListener('click', function() {
        if (confirm('¿Estás seguro de que quieres desactivar tu cuenta? Esta acción se puede revertir más tarde.')) {
            alert('Cuenta desactivada temporalmente. Puedes reactivarla iniciando sesión nuevamente.');
            console.log('Cuenta desactivada');
        }
    });

    // Botón eliminar cuenta
    document.getElementById('deleteBtn').addEventListener('click', function() {
        const confirmText = '¿Estás seguro de que quieres eliminar permanentemente tu cuenta? Esta acción NO se puede deshacer.';
        if (confirm(confirmText)) {
            const doubleConfirm = confirm('ÚLTIMA ADVERTENCIA: Todos tus datos serán eliminados permanentemente. ¿Continuar?');
            if (doubleConfirm) {
                alert('Cuenta eliminada permanentemente. Serás redirigido a la página principal.');
                console.log('Cuenta eliminada');
                // Aquí normalmente redirigirías a la página principal o de logout
            }
        }
    });
});