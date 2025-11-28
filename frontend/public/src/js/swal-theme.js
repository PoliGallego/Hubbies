// swal-theme.js — Tema personalizado de SweetAlert2 (claro + oscuro)
document.addEventListener("DOMContentLoaded", () => {
    const applySwalTheme = () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";

        const colors = {
            primary: isDark ? "#d4a574" : "#8b5a3c",     // --accent-primary
            hover: isDark ? "#e0b386" : "#754832",     // --accent-hover
            bg: isDark ? "#1e1e1e" : "#ffffff",
            text: isDark ? "#e0e0e0" : "#212121",
            border: isDark ? "#3a3a3a" : "#e0e0e0"
        };

        // Eliminamos estilo anterior si existe
        const oldStyle = document.getElementById("swal-custom-theme");
        if (oldStyle) oldStyle.remove();

        // Creamos el nuevo estilo
        const style = document.createElement("style");
        style.id = "swal-custom-theme";
        style.innerHTML = `
      /* Fondo y texto del modal */
      .swal2-popup {
        background: ${colors.bg} !important;
        color: ${colors.text} !important;
        border: 1px solid ${colors.border} !important;
        border-radius: 16px !important;
        box-shadow: 0 12px 40px rgba(0,0,0,${isDark ? "0.6" : "0.15"}) !important;
        font-family: inherit !important;
      }
      .swal2-title, .swal2-html-container {
        color: ${colors.text} !important;
      }

      /* Botón principal (Confirm / OK) */
      .swal2-confirm {
        background: ${colors.primary} !important;
        border-radius: 12px !important;
        padding: 10px 28px !important;
        font-weight: 600 !important;
        min-width: 100px;
      }
      .swal2-confirm:hover {
        background: ${colors.hover} !important;
        transform: translateY(-2px) !important;
      }

      /* Botón Cancelar */
      .swal2-cancel {
        background: ${isDark ? "#333" : "#f5f5f5"} !important;
        color: ${colors.text} !important;
        border: 1px solid ${colors.border} !important;
        border-radius: 12px !important;
      }

      /* Toasts */
      .swal2-toast {
        background: ${isDark ? "#2a2a2a" : "#ffffff"} !important;
        color: ${colors.text} !important;
        border-radius: 12px !important;
        box-shadow: 0 6px 16px rgba(0,0,0,${isDark ? "0.5" : "0.12"}) !important;
      }
    `;
        document.head.appendChild(style);
    };

    // Aplicar al cargar la página
    applySwalTheme();

    // Reaplicar si cambia el tema (claro ↔ oscuro)
    new MutationObserver(() => {
        if (document.documentElement.hasAttribute("data-theme")) {
            applySwalTheme();
        }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
});