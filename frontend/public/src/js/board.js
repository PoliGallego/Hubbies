let MaxZIndex = 10; // contador global
const boardNewFiles = [];

function openBoardModal() {
    closeBoardModal();
    const modal = document.getElementById("BoardModal");
    modal.classList.add("show");
    const saveBtn = document.getElementById("SaveBoardBtn");
    saveBtn.innerHTML = `<span class="material-icons">save</span> Save Board`;
}

function closeBoardModal() {
    const modal = document.getElementById("BoardModal");
    modal.classList.remove("show");

    // ⭐ RESETEAR TODO EL ESTADO DEL MODAL

    // 1. Limpiar el canvas
    const canvas = document.getElementById("BoardCanvas");
    canvas.innerHTML = "";

    // 2. Resetear campos del formulario
    document.getElementById("BoardTitleInput").value = "";

    // 3. Resetear las secciones seleccionadas
    const select = document.getElementById("BoardSectionsSelect");
    Array.from(select.options).forEach(opt => opt.selected = false);

    // 4. Resetear el botón de guardar a su estado original
    const saveBtn = document.getElementById("SaveBoardBtn");
    saveBtn.innerHTML = `<span class="material-icons">save</span> Save Board`;

    // 5. Limpiar variables globales
    window.currentBoardId = null;
    boardNewFiles.length = 0; // Limpiar archivos temporales

    // 6. Resetear estado de edición (si usas isEditing)
    if (typeof isEditing !== 'undefined') {
        isEditing = false;
    }
}

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("BoardModalOverlay")) {
        closeBoardModal();
    }

    if (e.target.closest(".CloseBoardModalBtn")) {
        closeBoardModal();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const modal = document.getElementById("BoardModal");
        if (modal?.classList.contains("show")) {
            closeBoardModal();
        }
    }
});

document.addEventListener("click", (e) => {
    if (e.target.closest("#AddNoteBtn")) addBoardItem("note");
    if (e.target.closest("#AddImageBtn")) {
        document.getElementById("BoardImagePicker").click();
    }
    const fullscreenBtn = e.target.closest('.fullscreen-board-btn');

    if (fullscreenBtn) {
        const boardId = fullscreenBtn.dataset.boardId;
        openBoardFullscreen(boardId);
    }
});

document.getElementById("BoardImagePicker").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // guardamos el File en memoria y obtenemos índice
    const idx = boardNewFiles.push(file) - 1;

    // leemos dataURL solo para previsualizar
    const reader = new FileReader();
    reader.onload = (ev) => {
        addBoardImage(ev.target.result, { newFileIndex: idx });
    };
    reader.readAsDataURL(file);

    // limpiar input
    e.target.value = "";
});

function addControlHandles(el) {
    const resize = document.createElement("div");
    resize.className = "ResizeHandle";

    const rotate = document.createElement("div");
    rotate.className = "RotateHandle";

    el.appendChild(resize);
    el.appendChild(rotate);

    enableResize(el, resize);
    enableRotate(el, rotate);
}

function addBoardItem(type) {
    const canvas = document.getElementById("BoardCanvas");

    const item = document.createElement("div");
    item.classList.add("BoardItem");

    if (type === "note") {
        item.contentEditable = true;
        item.textContent = "New Note";
    }

    if (type === "image") {
        item.classList.add("ImageItem");
        item.style.width = "120px";
        item.style.height = "auto";

        item.innerHTML = `<img src="/assets/default.png" class="BoardImage">`;
    }

    item.style.left = "60px";
    item.style.top = "60px";
    item.style.zIndex = ++MaxZIndex;

    addControlHandles(item);
    enableDrag(item);
    enableSelection(item);

    canvas.appendChild(item);
}

function addBoardImage(src, opts = {}) {
    const canvas = document.getElementById("BoardCanvas");

    const item = document.createElement("div");
    item.classList.add("BoardItem", "ImageItem");

    // Establecemos un tamaño inicial
    item.style.width = "120px";
    item.style.height = "auto";

    // Si viene newFileIndex -> imagen nueva (no tiene server path aún)
    if (typeof opts.newFileIndex === "number") {
        item.dataset.newFileIndex = String(opts.newFileIndex);
    }

    item.innerHTML = `<img src="${src}" class="BoardImage">`;

    item.style.left = "60px";
    item.style.top = "60px";
    item.style.zIndex = ++MaxZIndex;

    addControlHandles(item);
    enableDrag(item);
    enableSelection(item);

    canvas.appendChild(item);
}

function enableDrag(el) {
    const canvas = document.getElementById("BoardCanvas");
    let offsetX = 0, offsetY = 0;
    let dragging = false;

    el.addEventListener("mousedown", (e) => {

        // PERMITIR DRAG SI CLICK ES EN EL EL O EN SUS HIJOS (imagen)
        if (!el.contains(e.target)) return;

        dragging = true;

        const rect = el.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        function move(ev) {
            if (!dragging) return;

            let x = ev.clientX - canvasRect.left - offsetX;
            let y = ev.clientY - canvasRect.top - offsetY;

            x = Math.max(0, Math.min(x, canvasRect.width - el.offsetWidth));
            y = Math.max(0, Math.min(y, canvasRect.height - el.offsetHeight));

            el.style.left = x + "px";
            el.style.top = y + "px";
        }

        function stop() {
            dragging = false;
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", stop);
        }

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
    });
}

function enableSelection(el) {
    el.addEventListener("click", (e) => {
        e.stopPropagation();

        // remover selección previa
        document.querySelectorAll(".BoardItem").forEach(n => n.classList.remove("selected"));

        // seleccionar este
        el.classList.add("selected");

        updateZIndexDisplay(el);
    });
}

function enableResize(item, handle) {
    let startX, startY, startW, startH;

    handle.addEventListener("mousedown", e => {
        e.stopPropagation();
        e.preventDefault();

        startX = e.clientX;
        startY = e.clientY;
        startW = item.offsetWidth;
        startH = item.offsetHeight;

        function move(ev) {
            const newW = startW + (ev.clientX - startX);
            const newH = startH + (ev.clientY - startY);

            item.style.width = Math.max(40, newW) + "px";
            item.style.height = Math.max(30, newH) + "px";
        }

        function stop() {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", stop);
        }

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
    });
}

function enableRotate(item, handle) {
    handle.addEventListener("mousedown", e => {
        e.stopPropagation();
        e.preventDefault();

        let rect = item.getBoundingClientRect();

        startX = e.clientX;
        startY = e.clientY;

        const current = item.style.transform.match(/rotate\(([-0-9.]+)deg\)/);
        startAngle = current ? parseFloat(current[1]) : parseFloat(item.dataset.rotation || 0);

        function move(ev) {
            rect = item.getBoundingClientRect();
            const dx = ev.clientX - rect.left - rect.width / 2;
            const dy = ev.clientY - rect.top - rect.height / 2;

            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            item.style.transform = `rotate(${angle}deg)`;
            item.dataset.rotation = angle;
        }

        function stop() {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", stop);

            const finalAngle = item.style.transform.match(/rotate\(([-0-9.]+)deg\)/);
            if (finalAngle) {
                item.dataset.rotation = parseFloat(finalAngle[1]);
            }
        }

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
    });
}

document.addEventListener("keydown", (e) => {
    const selected = document.querySelector(".BoardItem.selected");
    if (!selected) return;

    if (document.activeElement === selected) {
        return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
        selected.remove();
    }
});

document.getElementById("BringForwardBtn").addEventListener("click", () => {
    const selected = document.querySelector(".BoardItem.selected");
    if (!selected) return;

    selected.style.zIndex = (parseInt(selected.style.zIndex) || 1) + 1;
    MaxZIndex = Math.max(MaxZIndex, selected.style.zIndex);

    updateZIndexDisplay(selected);
});

document.getElementById("SendBackwardBtn").addEventListener("click", () => {
    const selected = document.querySelector(".BoardItem.selected");
    if (!selected) return;

    let current = parseInt(selected.style.zIndex) || 1;
    selected.style.zIndex = Math.max(1, current - 1);

    updateZIndexDisplay(selected);
});


function addBoardItemFromData(item) {
    const canvas = document.getElementById("BoardCanvas");
    const el = document.createElement("div");
    el.className = "BoardItem";

    if (item.type === "note") {
        el.textContent = item.content;
        el.contentEditable = true;
    } else {
        el.innerHTML = `<img src="${item.content}" width="120">`;
    }

    el.style.left = item.x;
    el.style.top = item.y;

    enableDrag(el);
    canvas.appendChild(el);
}

function updateZIndexDisplay(item) {
    const display = document.getElementById("ZIndexValue");
    display.textContent = item.style.zIndex || "0";
}

// Función collectBoardData CORREGIDA
function collectBoardData() {
    const items = [];

    document.querySelectorAll(".BoardItem").forEach(item => {
        const isImage = item.classList.contains("ImageItem");
        const img = item.querySelector("img");

        // ⭐ Extraer rotación del transform en lugar del dataset
        let rotation = 0;
        const transformMatch = item.style.transform.match(/rotate\(([-0-9.]+)deg\)/);
        if (transformMatch) {
            rotation = parseFloat(transformMatch[1]);
        } else if (item.dataset.rotation) {
            rotation = parseFloat(item.dataset.rotation);
        }

        // Datos comunes para todos los items
        const baseData = {
            x: parseInt(item.style.left) || 0,
            y: parseInt(item.style.top) || 0,
            width: item.offsetWidth,
            height: item.offsetHeight,
            rotation: rotation,
            zIndex: parseInt(item.style.zIndex || 1)
        };

        if (isImage) {
            // si tiene newFileIndex -> placeholder
            if (item.dataset.newFileIndex !== undefined) {
                const idx = parseInt(item.dataset.newFileIndex, 10);
                items.push({
                    type: "image",
                    content: `__FILE_${idx}__`, // placeholder
                    ...baseData
                });
            } else {
                // imagen ya con path en el servidor (serverPath)
                const serverPath = img?.dataset?.serverPath || img?.src || null;
                items.push({
                    type: "image",
                    content: serverPath,
                    ...baseData
                });
            }
        } else {
            // nota
            items.push({
                type: "note",
                content: item.innerText || "",
                ...baseData
            });
        }
    });

    return items;
}

function createBoardHTML(board) {
    const categoryTags = board.categories
        ?.map(id => `
            <div class="Tag TagReadOnly">
                ${window.sectionsMap?.[id] || "Unknown"}
            </div>
        `)
        .join("") || "";

    const commentsCount = board.comments?.length || 0;

    return `
    <div class="Publication BoardPublication" data-board-id="${board._id}">
      <article class="BoardCard">
        <header class="BoardCardHeader">
          <h2 class="BoardCardTitle">${board.title || "Untitled Board"}</h2>
          <div class="BoardCardActions">
            <span class="PrivacyDisplay ${board.privacy === "public" ? "PrivacyPublic" : "PrivacyPrivate"}">
              ${board.privacy === "public" ? "Public" : "Private"}
            </span>

            <button class="IconButton fullscreen-board-btn" data-board-id="${board._id}">
              <span class="material-icons">fullscreen</span>
            </button>

            <button class="IconButton edit-board-btn" data-board-id="${board._id}">
              <span class="material-icons">edit</span>
            </button>

            <button class="IconButton delete-board-btn" data-board-id="${board._id}">
              <span class="material-icons">delete_outline</span>
            </button>
          </div>
        </header>

        <!-- Mini Canvas Preview -->
        <div class="BoardCardCanvas BoardPreviewCanvas">
          ${renderBoardPreview(board.items)}
        </div>

        <footer class="BoardCardFooter">
          ${categoryTags}
        </footer>
      </article>

      <!-- Bottom bar igual a la de los posts 👇 -->
      <div class="BottomBar">
        <div style="display: flex; align-items: center; gap: 4px;">
          <button class="CommentsButton board-comments-btn" data-board-id="${board._id}">
            <span class="material-icons">message</span>
          </button>
          <span class="comments-count" data-board-id="${board._id}">
            ${commentsCount}
          </span>
        </div>
        <button class="IconButton share-board-btn" data-board-id="${board._id}">
          <span class="material-icons">share</span>
        </button>
      </div>
      
      <!-- Comments section -->
      <div class="CommentsSection board-comments-section" id="board-comments-section-${board._id}" style="display: none;">
        <div class="CommentsList" id="board-comments-list-${board._id}"></div>
        
        <div class="CommentBox">
          <textarea class="CommentInput board-comment-input" placeholder="Write a comment..." data-board-id="${board._id}"></textarea>
          <button class="SendCommentBtn send-board-comment-btn" data-board-id="${board._id}">
            <span class="material-icons">send</span>
          </button>
        </div>
      </div>
      
    </div>
  `;
}

function renderBoardPreview(items = []) {
    if (!items.length) {
        return '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);font-size:0.9em;">Empty board</div>';
    }

    return items.map(item => {
        const left = item.x || 0;
        const top = item.y || 0;
        const width = item.width || 120;
        const height = item.height || 90;
        const rotation = item.rotation || 0;
        const zIndex = item.zIndex || 0;

        const style = `
            left: ${left}px;
            top: ${top}px;
            width: ${width}px;
            height: ${height}px;
            transform: rotate(${rotation}deg);
            z-index: ${zIndex};
            position: absolute;
            box-sizing: border-box;
        `.replace(/\s+/g, ' ').trim();

        if (item.type === "note") {
            return `
                <div class="BoardPreviewItem PreviewNote" style="${style}">
                    ${escapeHtml(item.content || '')}
                </div>`;
        }

        if (item.type === "image") {
            return `
                <div class="BoardPreviewItem PreviewImg" style="${style}">
                    <img src="${item.content}" 
                         style="width:100%;height:100%;object-fit:contain;border-radius:6px;"
                         alt="Board image" />
                </div>`;
        }

        return "";
    }).join("");
}

function renderBoards(boards) {
    const feedColumn = document.querySelector(".FeedColumn");
    if (!feedColumn) return;

    const existingBoards = feedColumn.querySelectorAll(".BoardPublication");
    existingBoards.forEach(b => b.remove());

    if (!boards || boards.length === 0) {
        const msg = document.createElement("p");
        msg.style.textAlign = "center";
        msg.style.marginTop = "20px";
        msg.style.color = "#888";
        msg.textContent = "No boards found.";
        feedColumn.appendChild(msg);
        return;
    }

    boards.forEach(board => {
        feedColumn.insertAdjacentHTML("beforeend", createBoardHTML(board));
    });

    setupBoardEventListeners();
}

function openBoardFullscreen(boardId) {
    // Buscar el board en los boards cargados
    const board = window.userBoards?.find(b => b._id === boardId);

    if (!board) {
        console.error('Board no encontrado:', boardId);
        console.log('Boards disponibles:', window.userBoards);
        return;
    }

    const modal = document.getElementById('BoardFullscreenModal');
    const canvas = document.getElementById('BoardFullscreenCanvas');
    const title = document.getElementById('BoardFullscreenTitle');
    const categoriesContainer = document.getElementById('BoardFullscreenCategories');

    // Establecer título
    title.textContent = board.title || 'Untitled Board';

    // Renderizar items en el canvas
    canvas.innerHTML = renderBoardPreview(board.items);

    // Renderizar categorías
    const categoryTags = board.categories
        ?.map(id => `
            <div class="Tag TagReadOnly">
                ${window.sectionsMap?.[id] || "Unknown"}
            </div>
        `)
        .join("") || "";
    categoriesContainer.innerHTML = categoryTags;

    // Mostrar modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body
}

function closeBoardFullscreen() {
    const modal = document.getElementById('BoardFullscreenModal');
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Restaurar scroll
}


// Función helper para escapar HTML y prevenir XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Función mejorada para renderizar en el modal de edición
function renderBoardItemsInCanvas(canvasElement, items = []) {
    if (!canvasElement) return;

    canvasElement.innerHTML = "";

    items.forEach((item) => {
        const div = document.createElement("div");
        div.classList.add("BoardItem", item.type === "note" ? "TextItem" : "ImageItem");

        // Dataset para rotación y zIndex ✔
        div.dataset.rotation = item.rotation || 0;
        div.dataset.zIndex = item.zIndex || 1;

        // Posicionamiento
        div.style.position = "absolute";
        div.style.left = `${item.x || 0}px`;
        div.style.top = `${item.y || 0}px`;
        div.style.width = `${item.width || 120}px`;
        div.style.height = `${item.height || 90}px`;
        div.style.zIndex = div.dataset.zIndex;
        div.style.transform = `rotate(${div.dataset.rotation}deg)`;

        if (item.type === "note") {
            div.textContent = item.content || "";
            div.contentEditable = true;
        }
        else if (item.type === "image") {
            const img = document.createElement("img");
            img.src = item.content.startsWith("/assets/")
                ? item.content
                : `/assets/uploads/${item.content}`;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            img.dataset.serverPath = img.src;
            div.appendChild(img);
        }

        // Handles de edición
        const resizeHandle = document.createElement("div");
        resizeHandle.classList.add("ResizeHandle");
        div.appendChild(resizeHandle);

        const rotateHandle = document.createElement("div");
        rotateHandle.classList.add("RotateHandle");
        div.appendChild(rotateHandle);

        canvasElement.appendChild(div);

        // 🔥 Reconexión a lógica existente
        enableDrag(div);
        enableResize(div, resizeHandle);
        enableRotate(div, rotateHandle);

        div.addEventListener("mousedown", () => {
            document.querySelectorAll(".BoardItem").forEach(el => el.classList.remove("selected"));
            div.classList.add("selected");
        });
    });
}

function setupBoardEventListeners() {
    document.querySelectorAll(".delete-board-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const boardId = e.target.closest(".delete-board-btn").dataset.boardId;
            confirmDeleteBoard(boardId);
        });
    });

    document.querySelectorAll(".edit-board-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const boardId = btn.dataset.boardId;
            openBoardEditor(boardId);
        });
    });
}

function confirmDeleteBoard(boardId) {
    Swal.fire({
        icon: "warning",
        title: "Delete Board?",
        text: "This action cannot be undone",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
    }).then(async (result) => {
        if (!result.isConfirmed) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`/api/boards/${boardId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();
            loadRecentComments();

            if (!res.ok || !data.success) throw new Error(data.message);

            // Remover la tarjeta visualmente
            document.querySelector(`[data-board-id="${boardId}"]`).remove();

            Swal.fire("Deleted!", "The board has been removed.", "success");

        } catch (err) {
            console.error("Delete board error:", err);
            Swal.fire("Error", err.message, "error");
        }
    });
}

async function openBoardEditor(boardId) {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`/api/boards/${boardId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const board = data.board;

        // Mostrar modal
        const modal = document.getElementById("BoardModal");
        modal.classList.add("show");

        // Establecer que estamos editando
        window.currentBoardId = board._id;

        // Título del board
        document.getElementById("BoardTitleInput").value = board.title;

        // Secciones
        preselectSections(board.categories || []);


        // Canvas limpio
        const canvas = document.getElementById("BoardCanvas");
        canvas.innerHTML = "";
        window.currentBoardId = board._id;

        // 🎨 Renderizar TODOS los items guardados
        renderBoardItemsInCanvas(canvas, board.items || []);

        // Cambiar a modo edición
        const saveBtn = document.getElementById("SaveBoardBtn");
        saveBtn.innerHTML = `<span class="material-icons">update</span> Update Board`;

    } catch (err) {
        console.error("Open editor error:", err);
        Swal.fire("Error", err.message, "error");
    }
}

document.getElementById("SaveBoardBtn").addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Necesitas iniciar sesión");
        return;
    }


    const title = document.getElementById("BoardTitleInput")?.value || "Untitled board";
    const privacy = document.querySelector("input[name='boardPrivacy']:checked")?.value || "private";
    // si tienes selección de secciones:
    const selectedSections = getSelectedSections();

    const items = collectBoardData();

    // === VALIDACIONES DE CANTIDAD DE ITEMS ===
    if (items.length === 0) {
        return Swal.fire({
            icon: "warning",
            title: "No items in board",
            text: "You must add at least 1 item to save the board."
        });
    }

    if (items.length > 10) {
        return Swal.fire({
            icon: "error",
            title: "Too many items!",
            text: "You can only have up to 10 items on a board."
        });
    }

    // === VALIDACIÓN: al menos una categoría ===
    if (!selectedSections || selectedSections.length === 0) {
        return Swal.fire({
            icon: "warning",
            title: "Choose a category",
            text: "Please select at least one section before saving."
        });
    }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("privacy", privacy);
    fd.append("categories", JSON.stringify(selectedSections));
    fd.append("items", JSON.stringify(items));

    const url = window.currentBoardId
        ? `/api/boards/${window.currentBoardId}`
        : `/api/boards/save`;

    const method = window.currentBoardId ? "PUT" : "POST";

    // añadir files (si los hay) con nombre 'images' (multer.array('images') en backend)
    for (let i = 0; i < boardNewFiles.length; i++) {
        fd.append("images", boardNewFiles[i]);
    }

    try {
        const res = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: fd
        });

        const text = await res.text(); // leer todo, aunque no sea JSON

        const data = JSON.parse(text);

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Error saving board");
        }

        console.log("Board saved:", data.board);
        Swal.fire({
            icon: "success",
            title: `Sucess!`,
            text: "Board saved successfully!",
            confirmButtonText: "Continue!",
        })

        closeBoardModal();

        refreshFeedAfterUpdate();
        boardNewFiles.length = 0;

    } catch (err) {
        console.error("Save board error", err);
        alert("Error guardando board: " + err.message);
    }
});

function refreshFeedAfterUpdate() {
    const currentView = document.querySelector('input[name="feedView"]:checked')?.value;

    clearFeed();

    if (currentView === 'posts') {
        loadUserPosts();
    } else if (currentView === 'boards') {
        loadUserBoards();
    } else if (currentView === 'all') {
        loadUserFeedAll();
    }
}

async function loadSections() {
    window.sectionsMap = {}; // diccionario global
    try {
        const select = document.getElementById("BoardSectionsSelect");
        const chipsContainer = document.getElementById("BoardSectionsChips");
        select.innerHTML = ""; // limpiar opciones previas
        chipsContainer.innerHTML = "";

        const token = localStorage.getItem("token");
        if (!token) throw new Error("No hay token de usuario");

        // Obtener userId desde el token JWT
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.id;

        // Traer secciones del usuario
        const response = await fetch(`/api/sections/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const sections = await response.json();

        // Renderizar en el select
        sections.forEach(sec => {
            window.sectionsMap[sec._id] = sec.title;

            // Opción en el select oculto (para compatibilidad)
            const opt = document.createElement("option");
            opt.value = sec._id;
            opt.textContent = sec.title;
            select.appendChild(opt);

            // ⭐ Crear chip visual
            const chip = document.createElement("div");
            chip.className = "SectionChip";
            chip.dataset.sectionId = sec._id;
            chip.innerHTML = `
                <span class="material-icons">check_circle</span>
                ${sec.title}
            `;

            // ⭐ Click para seleccionar/deseleccionar
            chip.addEventListener("click", () => {
                chip.classList.toggle("selected");

                // Sincronizar con el select oculto
                const option = select.querySelector(`option[value="${sec._id}"]`);
                if (option) {
                    option.selected = chip.classList.contains("selected");
                }
            });

            chipsContainer.appendChild(chip);
        });

    } catch (error) {
        console.error("Error al cargar secciones:", error);

        // En caso de error, dejar el select vacío
        const select = document.getElementById("BoardSectionsSelect");
        select.innerHTML = "";
    }
}

function getSelectedSections() {
    const chips = document.querySelectorAll(".SectionChip.selected");
    return Array.from(chips).map(chip => chip.dataset.sectionId);
}

function preselectSections(sectionIds) {
    const chips = document.querySelectorAll(".SectionChip");
    chips.forEach(chip => {
        if (sectionIds.includes(chip.dataset.sectionId)) {
            chip.classList.add("selected");

            // Sincronizar con select oculto
            const select = document.getElementById("BoardSectionsSelect");
            const option = select.querySelector(`option[value="${chip.dataset.sectionId}"]`);
            if (option) option.selected = true;
        }
    });
}

function clearSectionSelection() {
    document.querySelectorAll(".SectionChip").forEach(chip => {
        chip.classList.remove("selected");
    });

    const select = document.getElementById("BoardSectionsSelect");
    Array.from(select.options).forEach(opt => opt.selected = false);
}

async function loadUserBoards() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch("/api/boards/my", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const filteredBoards = filterBoardsByCat(data.boards);

    window.userBoards = filteredBoards;

    const feedColumn = document.querySelector(".FeedColumn");
    if (!feedColumn) return;

    clearFeed(); // limpieza correcta del feed

    filteredBoards.forEach(board => {
        const boardHTML = createBoardHTML(board);
        feedColumn.insertAdjacentHTML("beforeend", boardHTML);
    });

    setupBoardEventListeners();
    window.renderNavBoards(filteredBoards);
    console.log("Boards filtrados del usuario:", filteredBoards);
    updateAllBoardCommentCounts(filteredBoards);
    return filteredBoards;
}

function initFeedTogglePill() {
    const radioInputs = document.querySelectorAll('input[name="feedView"]');

    radioInputs.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const view = e.target.value;

            if (view === 'posts') {
                loadUserPosts();
            } else if (view === 'boards') {
                loadUserBoards();
            } else if (view === 'all') {
                loadUserFeedAll();
            }
        });
    });
}

// ⭐ FUNCIÓN MODIFICADA: Cargar feed completo con filtros
async function loadUserFeedAll() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        // Pedimos posts y boards al mismo tiempo
        const [postsRes, boardsRes] = await Promise.all([
            fetch("/api/posts/my-posts", {
                headers: { Authorization: `Bearer ${token}` }
            }),
            fetch("/api/boards/my", {
                headers: { Authorization: `Bearer ${token}` }
            })
        ]);

        const posts = await postsRes.json();
        const boardsData = await boardsRes.json();

        const boards = boardsData.success ? boardsData.boards : [];

        // ⭐ APLICAR FILTROS DE CATEGORÍAS
        const filteredPosts = filterPostsByCat(posts);
        const filteredBoards = filterBoardsByCat(boards);

        window.userPosts = filteredPosts;
        window.userBoards = filteredBoards;

        window.renderNavFeedAll(filteredPosts, filteredBoards);

        // Normalizamos estructura para mezclarlos correctamente
        const unifiedItems = combineAndSortAll(filteredPosts, filteredBoards);

        renderUnifiedFeed(unifiedItems);
        updateAllPostCommentCounts(filteredPosts);
        updateAllBoardCommentCounts(filteredBoards);

        console.log("Feed All filtrado cargado:", {
            posts: filteredPosts.length,
            boards: filteredBoards.length,
            total: unifiedItems.length
        });

    } catch (error) {
        console.error("Error al cargar feed completo:", error);
    }
}

function combineAndSortAll(posts, boards) {
    const mapped = [
        ...posts.map(p => ({
            type: "post",
            date: new Date(p.updatedAt || p.createdAt),
            data: p
        })),
        ...boards.map(b => ({
            type: "board",
            date: new Date(b.updatedAt || b.createdAt),
            data: b
        }))
    ];

    return mapped.sort((a, b) => b.date - a.date);
}


function renderUnifiedFeed(items) {
    clearFeed();
    const feed = document.querySelector(".FeedColumn");
    if (!feed) return;

    items.forEach(item => {
        if (item.type === "post") {
            feed.insertAdjacentHTML("beforeend", createPostHTML(item.data));
        } else {
            feed.insertAdjacentHTML("beforeend", createBoardHTML(item.data));
        }
    });

    setupPostEventListeners();
    setupBoardEventListeners();
}

function clearFeed() {
    const feedColumn = document.querySelector(".FeedColumn");
    if (!feedColumn) return;
    feedColumn.querySelectorAll(".Publication").forEach(el => el.remove());
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOMContentLoaded disparado");

    loadSections();
    initFeedTogglePill();

    const modal = document.getElementById('BoardFullscreenModal');
    const closeBtn = document.querySelector('.CloseFullscreenBtn');
    const overlay = document.querySelector('.BoardFullscreenOverlay');

    closeBtn?.addEventListener('click', closeBoardFullscreen);
    overlay?.addEventListener('click', closeBoardFullscreen);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('show')) closeBoardFullscreen();
    });

    const params = new URLSearchParams(window.location.search);
    const postId = params.get("id");
    const boardId = params.get("board");

    // ================================================
    // FUNCIÓN QUE RENDERIZA EL SIDEBAR SEGÚN EL TOGGLE
    // Usa los nombres REALES que tú usas: userPosts y userBoards
    // ================================================
    const renderSidebarNow = () => {
        console.log("renderSidebarNow() ejecutado");
        console.log("  → window.userPosts:", window.userPosts);
        console.log("  → window.userBoards:", window.userBoards);

        const toggle = document.querySelector('input[name="feedView"]:checked');
        const view = toggle ? toggle.value : "all";
        console.log(`  → Toggle actual: "${view}"`);

        if (view === "all") {
            console.log("  → Ejecutando renderNavFeedAll()");
            renderNavFeedAll(window.userPosts || [], window.userBoards || []);
        } else if (view === "posts") {
            console.log("  → Ejecutando renderNavPosts()");
            renderNavPosts(window.userPosts || []);
        } else if (view === "boards") {
            console.log("  → Ejecutando renderNavBoards()");
            renderNavBoards(window.userBoards || []);
        }
    };

    // Primera ejecución (probablemente vacío, pero sin error)
    renderSidebarNow();

    // ================================================
    // SOBREESCRIBIMOS loadUserFeedAll PARA QUE RENDERICE AL FINAL
    // (por si acaso alguien llama a la función sin await)
    // ================================================
    const originalLoadUserFeedAll = window.loadUserFeedAll;
    window.loadUserFeedAll = async function (...args) {
        console.log("loadUserFeedAll() iniciada");
        await originalLoadUserFeedAll.apply(this, args);
        console.log("loadUserFeedAll() terminada → renderizando sidebar");
        renderSidebarNow(); // ← Esta es la clave
    };

    // ================================================
    // EJECUCIÓN SEGÚN URL
    // ================================================

    if (boardId) {
        console.log("Entrando por ?board=", boardId);
        const boardsToggle = document.querySelector('input[name="feedView"][value="boards"]');
        if (boardsToggle) {
            boardsToggle.checked = true;
            boardsToggle.dispatchEvent(new Event('change'));
        }
        await loadUserBoards();
        // ... resto del scroll ...
    }
    else if (postId) {
        console.log("Entrando por ?id=", postId);
        const postsToggle = document.querySelector('input[name="feedView"][value="posts"]');
        if (postsToggle) {
            postsToggle.checked = true;
            postsToggle.dispatchEvent(new Event('change'));
        }
        await loadUserPosts();
        // ... resto del scroll ...
    }
    else {
        console.log("Entrando sin parámetros → carga normal");
        const def = document.querySelector('input[name="feedView"]:checked')?.value || "all";
        console.log("Vista por defecto:", def);

        if (def === "boards") await loadUserBoards();
        else if (def === "all") await loadUserFeedAll();  // ← Aquí se llamará nuestro wrapper con render
        else await loadUserPosts();
    }

    await handlePendingNavigation();
});

async function handlePendingNavigation() {
    const pendingNav = localStorage.getItem("pendingNavigation");

    if (!pendingNav) return;

    try {
        const navData = JSON.parse(pendingNav);
        localStorage.removeItem("pendingNavigation");

        const { type, id, scrollTo, openComments } = navData;

        if (type === "post") {
            // Cambiar a vista de posts
            const postsToggle = document.querySelector('input[name="feedView"][value="posts"]');
            if (postsToggle) postsToggle.checked = true;

            // Cargar posts
            await loadUserPosts();

            // Esperar un momento para que se renderice
            setTimeout(() => {
                const postEl = document.querySelector(`.Publication[data-post-id="${id}"]`);
                if (postEl) {
                    if (scrollTo) {
                        postEl.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                    if (openComments) {
                        toggleCommentBox(id);
                    }
                } else {
                    console.warn("Post no encontrado:", id);
                }
            }, 300);
        }
        else if (type === "board") {
            // Cambiar a vista de boards
            const boardsToggle = document.querySelector('input[name="feedView"][value="boards"]');
            if (boardsToggle) boardsToggle.checked = true;

            // Cargar boards
            await loadUserBoards();

            // Esperar un momento para que se renderice
            setTimeout(() => {
                const boardEl = document.querySelector(`.Publication[data-board-id="${id}"]`);
                if (boardEl) {
                    if (scrollTo) {
                        boardEl.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                    if (openComments) {
                        setTimeout(() => toggleBoardCommentBox(id), 200);
                    }
                } else {
                    console.warn("Board no encontrado:", id);
                }
            }, 600);
        }
    } catch (error) {
        console.error("Error manejando navegación pendiente:", error);
        localStorage.removeItem("pendingNavigation");
    }
}

window.renderNavBoards = function (boards) {
    const viewMoreBtn = document.querySelector(".Navigation .ViewMoreButton");
    const list = document.querySelector(".Navigation .SectionContent > ul");
    const noMsg = document.querySelector(".Navigation .NotFound");
    let expanded = false;

    if (!list) return;

    list.innerHTML = ``;

    if (!boards || boards.length === 0) {
        noMsg.style.display = "block";
        return;
    }

    noMsg.style.display = "none";

    boards.forEach((board, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
      <div class="NavigationRow">
        <a href="/src/html/boards.html" board-id="${board._id}">
          ${board.title || "Untitled Board"}
        </a>
      </div>
    `;

        if (i > 7) li.classList.add("ExtraItem");

        list.appendChild(li);
    });

    const extraItems = document.querySelectorAll(".Navigation .ExtraItem");
    if (!viewMoreBtn) return;

    viewMoreBtn.style.display = extraItems.length ? "block" : "none";

    viewMoreBtn.onclick = () => {
        expanded = !expanded;
        extraItems.forEach(item =>
            item.classList.toggle("ExtraItem", !expanded)
        );

        viewMoreBtn.querySelector("span").textContent =
            expanded ? "expand_less" : "expand_more";
        viewMoreBtn.childNodes[0].textContent = expanded
            ? "View less"
            : "View more";
    };
};


window.renderNavFeedAll = function (posts, boards) {
    const tryRender = () => {
        const list = document.querySelector(".Navigation .SectionContent > ul");
        if (!list) {
            setTimeout(tryRender, 100);
            return;
        }

        list.innerHTML = "";
        document.querySelector(".Navigation .NotFound")?.style.setProperty("display", "none");

        const combined = [
            ...posts.map(p => ({ ...p, type: "post" })),
            ...boards.map(b => ({ ...b, type: "board" }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (!combined.length) {
            document.querySelector(".Navigation .NotFound")?.style.removeProperty("display");
            return;
        }

        combined.forEach((item, i) => {
            const li = document.createElement("li");
            const typeAttr = item.type === "post" ? "post-id" : "board-id";

            li.innerHTML = `
                <div class="NavigationRow">
                    <a href="#" ${typeAttr}="${item._id}">
                        ${item.title || (item.type === "board" ? "Untitled Board" : "Untitled Post")}
                    </a>
                </div>
            `;

            if (i > 7) li.classList.add("ExtraItem");
            list.appendChild(li);
        });

        navEventListener();

        // Configuramos el botón View more (con espera si no existe aún)
        const setupViewMoreButton = () => {
            const viewMoreBtn = document.querySelector(".Navigation .ViewMoreButton");
            const extraItems = document.querySelectorAll(".Navigation .ExtraItem");

            if (!viewMoreBtn) {
                setTimeout(setupViewMoreButton, 100);
                return;
            }

            viewMoreBtn.style.display = extraItems.length ? "block" : "none";

            let expanded = false;
            viewMoreBtn.onclick = () => {
                expanded = !expanded;
                extraItems.forEach(el => el.classList.toggle("ExtraItem", !expanded));
                viewMoreBtn.querySelector("span").textContent = expanded ? "expand_less" : "expand_more";
                viewMoreBtn.childNodes[0].textContent = expanded ? "View less" : "View more";
            };
        };

        setupViewMoreButton();
    };

    tryRender();
};

// ====================================================
// SISTEMA DE COMPARTIR BOARD - VERSIÓN SEPARADA Y 100% FUNCIONAL
// ====================================================

const feedColumn = document.querySelector(".FeedColumn");

feedColumn.addEventListener("click", (e) => {
    const shareBtn = e.target.closest(".share-board-btn");
    if (!shareBtn) return;

    const boardId = shareBtn.dataset.boardId;
    openShareBoardModal(boardId);
});

// ====== VARIABLES GLOBALES (una sola para todo) ======
let currentShareItem = { id: null, type: null }; // 'post' o 'board'

// ====== ABRIR MODAL PARA POST (tu función original, solo cambia la variable) ======
async function openShareModal(postId) {
    currentShareItem = { id: postId, type: 'post' };
    await openShareModalUniversal();
}

// ====== ABRIR MODAL PARA BOARD ======
async function openShareBoardModal(boardId) {
    currentShareItem = { id: boardId, type: 'board' };
    await openShareModalUniversal();
}

// ====== LÓGICA COMÚN (una sola función para los dos) ======
async function openShareModalUniversal() {
    const modal = document.getElementById("ShareModal");
    const linkInput = document.getElementById("shareLinkInput");
    const revokeBtn = document.getElementById("revokeLinkBtn");
    const titleEl = document.getElementById("shareModalTitle");
    const descEl = document.getElementById("shareModalDescription");

    // Cambia textos según sea post o board
    if (currentShareItem.type === 'board') {
        titleEl.textContent = "Share Board";
        descEl.textContent = "Anyone with this link can view this board.";
    } else {
        titleEl.textContent = "Share Post";
        descEl.textContent = "Anyone with this link can view this post.";
    }

    try {
        const endpoint = currentShareItem.type === 'board'
            ? `/api/boards/${currentShareItem.id}/share`
            : `/api/posts/${currentShareItem.id}/share`;

        const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

        if (!response.ok) throw new Error("Server error");

        const data = await response.json();
        if (!data.success) throw new Error(data.message);

        const baseUrl = `${window.location.origin}/src/html/post-shared.html`;
        const shareUrl = currentShareItem.type === 'board'
            ? `${baseUrl}?token=${data.shareToken}&type=board`
            : `${baseUrl}?token=${data.shareToken}`;

        linkInput.value = shareUrl;
        modal.style.display = "flex";
        revokeBtn.style.display = "flex";

    } catch (error) {
        console.error("Error generating share link:", error);
        Swal.fire("Error", "Could not generate link", "error");
    }
}

// ====== DESHABILITAR LINK (una sola función para ambos) ======
async function revokeShareLink() {
    if (!currentShareItem.id) return;

    const endpoint = currentShareItem.type === 'board'
        ? `/api/boards/${currentShareItem.id}/unshare`
        : `/api/posts/${currentShareItem.id}/unshare`;

    try {
        const res = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
        const data = await res.json();

        if (data.success) {
            closeShareModal();
            Swal.fire({ icon: "success", title: "Link disabled", toast: true, position: "top-end", timer: 2000 });
        } else {
            throw new Error(data.message);
        }
    } catch (err) {
        Swal.fire("Error", "Could not disable link", "error");
    }
}

// ====== CERRAR MODAL (universal) ======
function closeShareModal() {
    document.getElementById("ShareModal").style.display = "none";
    document.getElementById("revokeLinkBtn").style.display = "none";
    currentShareItem = { id: null, type: null };
}

// ====== COPIAR LINK (ya la tenías) ======
function copyShareLink() {
    const input = document.getElementById("shareLinkInput");
    input.select();
    document.execCommand("copy");
    Swal.fire({ icon: 'success', title: 'Copied!', toast: true, position: 'top-end', timer: 1500 });
}

document.getElementById("OpenBoardCreatorBtn").addEventListener("click", () => {
    loadSections();
    openBoardModal();
});


