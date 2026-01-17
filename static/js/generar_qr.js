/**
 * QR-Asist - Módulo de Generación de QR
 * Lógica específica para la generación de códigos QR
 */

// Estado de la aplicación
const AppState = {
    alumnos: [],
    nivel: 'Primaria',
    grado: '1',
    seccion: ''
};

// Elementos del DOM
const elementos = {
    csvFile: document.getElementById('csvFile'),
    fileName: document.getElementById('fileName'),
    nivelRadios: document.getElementsByName('nivel'),
    gradoSelect: document.getElementById('grado'),
    seccionInput: document.getElementById('seccion'),
    alumnoId: document.getElementById('alumnoId'),
    alumnoNombre: document.getElementById('alumnoNombre'),
    btnAgregarAlumno: document.getElementById('btnAgregarAlumno'),
    listaAlumnos: document.getElementById('listaAlumnos'),
    totalAlumnos: document.getElementById('totalAlumnos'),
    btnGenerarQR: document.getElementById('btnGenerarQR'),
    btnGenerarPDF: document.getElementById('btnGenerarPDF'),
    btnLimpiar: document.getElementById('btnLimpiar'),
    estadoSeccion: document.getElementById('estadoSeccion'),
    estadoTitulo: document.getElementById('estadoTitulo'),
    estadoContenido: document.getElementById('estadoContenido')
};

// ==================== EVENTOS ==================== //

// Cambio de archivo CSV
elementos.csvFile.addEventListener('change', handleCSVUpload);

// Radio buttons de nivel
elementos.nivelRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        AppState.nivel = e.target.value;
        actualizarGrados();
    });
});

// Validación de sección (solo 1 letra mayúscula)
elementos.seccionInput.addEventListener('input', (e) => {
    // Convertir a mayúscula
    e.target.value = e.target.value.toUpperCase();
    
    // Solo permitir 1 carácter
    if (e.target.value.length > 1) {
        e.target.value = e.target.value.charAt(0);
    }
    
    // Solo letras A-Z
    e.target.value = e.target.value.replace(/[^A-Z]/g, '');
    
    AppState.seccion = e.target.value;
    actualizarBotones();
});

// Botón agregar alumno
elementos.btnAgregarAlumno.addEventListener('click', agregarAlumno);

// Enter en inputs de alumno
elementos.alumnoId.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') agregarAlumno();
});
elementos.alumnoNombre.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') agregarAlumno();
});

// Botones de acción
elementos.btnGenerarQR.addEventListener('click', generarCodigosQR);
elementos.btnGenerarPDF.addEventListener('click', generarPDF);
elementos.btnLimpiar.addEventListener('click', limpiarLista);

// ==================== FUNCIONES ==================== //

/**
 * Actualizar opciones de grado según nivel
 */
function actualizarGrados() {
    const maxGrado = AppState.nivel === 'Primaria' ? 6 : 5;
    elementos.gradoSelect.innerHTML = '';
    
    for (let i = 1; i <= maxGrado; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i === 1 ? '1ro' : i === 2 ? '2do' : i === 3 ? '3ro' : `${i}to`;
        elementos.gradoSelect.appendChild(option);
    }
}

/**
 * Manejar carga de archivo CSV
 */
async function handleCSVUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    elementos.fileName.textContent = file.name;
    
    const formData = new FormData();
    formData.append('archivo', file);
    
    try {
        const response = await fetch('/api/cargar-csv', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.error) {
            Utils.showNotification(`Error: ${result.error}`, 'error');
            return;
        }
        
        // Cargar alumnos en el estado
        AppState.alumnos = result.alumnos;
        actualizarListaAlumnos();
        Utils.showNotification(`✓ ${result.total} alumnos cargados`, 'success');
        
    } catch (error) {
        Utils.showNotification(`Error al cargar CSV: ${error.message}`, 'error');
    }
}

/**
 * Agregar alumno individual
 */
function agregarAlumno() {
    const id = Utils.sanitize(elementos.alumnoId.value);
    const nombre = Utils.sanitize(elementos.alumnoNombre.value);
    
    // Validaciones
    if (Utils.isEmpty(id)) {
        Utils.showNotification('El ID no puede estar vacío', 'error');
        elementos.alumnoId.focus();
        return;
    }
    
    if (Utils.isEmpty(nombre)) {
        Utils.showNotification('El nombre no puede estar vacío', 'error');
        elementos.alumnoNombre.focus();
        return;
    }
    
    if (nombre.length < 3) {
        Utils.showNotification('El nombre debe tener al menos 3 caracteres', 'error');
        elementos.alumnoNombre.focus();
        return;
    }
    
    // Verificar si el ID ya existe
    if (AppState.alumnos.some(a => a.id === id)) {
        Utils.showNotification(`El ID "${id}" ya existe`, 'error');
        return;
    }
    
    // Agregar alumno
    AppState.alumnos.push({ id, nombre });
    actualizarListaAlumnos();
    
    // Limpiar inputs
    elementos.alumnoId.value = '';
    elementos.alumnoNombre.value = '';
    elementos.alumnoId.focus();
    
    Utils.showNotification(`✓ Alumno agregado: ${nombre}`, 'success');
}

/**
 * Eliminar alumno de la lista
 */
function eliminarAlumno(index) {
    const alumno = AppState.alumnos[index];
    if (confirm(`¿Eliminar a ${alumno.nombre}?`)) {
        AppState.alumnos.splice(index, 1);
        actualizarListaAlumnos();
        Utils.showNotification('Alumno eliminado', 'success');
    }
}

/**
 * Actualizar la lista visual de alumnos
 */
function actualizarListaAlumnos() {
    elementos.totalAlumnos.textContent = AppState.alumnos.length;
    
    if (AppState.alumnos.length === 0) {
        elementos.listaAlumnos.innerHTML = '<p class="empty-state">No hay alumnos cargados. Carga un CSV o agrega alumnos individualmente.</p>';
    } else {
        elementos.listaAlumnos.innerHTML = AppState.alumnos.map((alumno, index) => `
            <div class="alumno-item">
                <div class="alumno-info">
                    <span class="alumno-id">${alumno.id}</span>
                    <span class="alumno-nombre">${alumno.nombre}</span>
                </div>
                <div class="alumno-actions">
                    <button class="btn btn-danger btn-small" onclick="eliminarAlumno(${index})">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    actualizarBotones();
}

/**
 * Actualizar estado de botones
 */
function actualizarBotones() {
    const tieneAlumnos = AppState.alumnos.length > 0;
    const tieneSeccion = AppState.seccion.length > 0;
    
    elementos.btnGenerarQR.disabled = !(tieneAlumnos && tieneSeccion);
    elementos.btnGenerarPDF.disabled = !(tieneAlumnos && tieneSeccion);
}

/**
 * Generar códigos QR
 */
async function generarCodigosQR() {
    if (AppState.alumnos.length === 0) {
        Utils.showNotification('No hay alumnos para generar QR', 'error');
        return;
    }
    
    if (!AppState.seccion) {
        Utils.showNotification('Debes ingresar una sección', 'error');
        return;
    }
    
    mostrarEstado('Generando códigos QR...', 'info');
    elementos.btnGenerarQR.disabled = true;
    
    try {
        const response = await fetch('/api/generar-qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nivel: AppState.nivel,
                grado: elementos.gradoSelect.value,
                seccion: AppState.seccion,
                alumnos: AppState.alumnos
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            mostrarEstado(`Error: ${result.error}`, 'error');
            Utils.showNotification(`Error: ${result.error}`, 'error');
        } else {
            const mensaje = `✓ ${result.generados.length} códigos QR generados exitosamente`;
            mostrarEstado(mensaje, 'success');
            Utils.showNotification(mensaje, 'success');
        }
        
    } catch (error) {
        mostrarEstado(`Error: ${error.message}`, 'error');
        Utils.showNotification(`Error: ${error.message}`, 'error');
    } finally {
        elementos.btnGenerarQR.disabled = false;
    }
}

/**
 * Generar PDF
 */
async function generarPDF() {
    if (AppState.alumnos.length === 0) {
        Utils.showNotification('No hay alumnos para generar PDF', 'error');
        return;
    }
    
    if (!AppState.seccion) {
        Utils.showNotification('Debes ingresar una sección', 'error');
        return;
    }
    
    mostrarEstado('Generando PDF...', 'info');
    elementos.btnGenerarPDF.disabled = true;
    
    try {
        const response = await fetch('/api/generar-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nivel: AppState.nivel,
                grado: elementos.gradoSelect.value,
                seccion: AppState.seccion,
                alumnos: AppState.alumnos
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al generar PDF');
        }
        
        // Descargar PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${AppState.nivel}_${elementos.gradoSelect.value}_${AppState.seccion}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        mostrarEstado('✓ PDF generado y descargado', 'success');
        Utils.showNotification('✓ PDF descargado exitosamente', 'success');
        
    } catch (error) {
        mostrarEstado(`Error: ${error.message}`, 'error');
        Utils.showNotification(`Error: ${error.message}`, 'error');
    } finally {
        elementos.btnGenerarPDF.disabled = false;
    }
}

/**
 * Limpiar lista de alumnos
 */
function limpiarLista() {
    if (AppState.alumnos.length === 0) {
        return;
    }
    
    if (confirm('¿Seguro que quieres limpiar la lista de alumnos?')) {
        AppState.alumnos = [];
        actualizarListaAlumnos();
        ocultarEstado();
        Utils.showNotification('Lista limpiada', 'success');
    }
}

/**
 * Mostrar sección de estado
 */
function mostrarEstado(mensaje, tipo) {
    elementos.estadoSeccion.style.display = 'block';
    elementos.estadoTitulo.textContent = tipo === 'success' ? '✓ Éxito' : tipo === 'error' ? '✗ Error' : 'ℹ️ Información';
    elementos.estadoContenido.innerHTML = `<p class="estado-${tipo}">${mensaje}</p>`;
}

/**
 * Ocultar sección de estado
 */
function ocultarEstado() {
    elementos.estadoSeccion.style.display = 'none';
}

// ==================== INICIALIZACIÓN ==================== //

// Inicializar grados según nivel inicial
actualizarGrados();
actualizarBotones();

// Hacer función eliminarAlumno disponible globalmente
window.eliminarAlumno = eliminarAlumno;