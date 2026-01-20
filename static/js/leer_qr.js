/**
 * QR-Asist - Módulo de Lectura de QR
 * Lógica para escanear QR y registrar asistencias
 */

// Estado de la aplicación
const AppState = {
    camaraActiva: false,
    procesando: false,
    stream: null,
    archivosDisponibles: [],
    archivosSeleccionados: []
};

// Elementos del DOM
const elementos = {
    video: document.getElementById('video'),
    canvas: document.getElementById('canvas'),
    camaraBox: document.getElementById('camaraBox'),
    camaraEstado: document.getElementById('camaraEstado'),
    
    // Feedback
    feedbackVacio: document.getElementById('feedbackVacio'),
    feedbackExito: document.getElementById('feedbackExito'),
    feedbackDuplicado: document.getElementById('feedbackDuplicado'),
    
    // Feedback éxito
    feedbackHora: document.getElementById('feedbackHora'),
    feedbackFecha: document.getElementById('feedbackFecha'),
    feedbackNombre: document.getElementById('feedbackNombre'),
    feedbackSeccion: document.getElementById('feedbackSeccion'),
    
    // Feedback duplicado
    feedbackMensajeDup: document.getElementById('feedbackMensajeDup'),
    feedbackNombreDup: document.getElementById('feedbackNombreDup'),
    feedbackSeccionDup: document.getElementById('feedbackSeccionDup'),
    
    // Estadísticas
    totalHoy: document.getElementById('totalHoy'),
    laptopId: document.getElementById('laptopId'),
    ultimosRegistros: document.getElementById('ultimosRegistros'),
    
    // Red
    redEstado: document.getElementById('redEstado'),
    redInfo: document.getElementById('redInfo'),
    btnEnviarArchivos: document.getElementById('btnEnviarArchivos'),
    btnDetener: document.getElementById('btnDetener'),
    
    // Modales
    modalEnviar: document.getElementById('modalEnviar'),
    modalResultado: document.getElementById('modalResultado'),
    listaArchivosEnviar: document.getElementById('listaArchivosEnviar'),
    rutaDestino: document.getElementById('rutaDestino'),
    contadorSeleccionados: document.getElementById('contadorSeleccionados'),
    resultadoTitulo: document.getElementById('resultadoTitulo'),
    resultadoContenido: document.getElementById('resultadoContenido'),
    btnConfirmarEnvio: document.getElementById('btnConfirmarEnvio')
};

// Sonido de beep (usando Web Audio API)
function reproducirBeep() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// ==================== CÁMARA ====================

async function iniciarCamara() {
    try {
        elementos.camaraEstado.innerHTML = '<p>🎥 Iniciando cámara...</p>';
        
        AppState.stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        
        elementos.video.srcObject = AppState.stream;
        elementos.video.setAttribute('playsinline', true);
        
        elementos.video.onloadedmetadata = () => {
            elementos.video.play();
            AppState.camaraActiva = true;
            elementos.camaraEstado.style.display = 'none';
            escanearQR();
        };
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        elementos.camaraEstado.innerHTML = `
            <p>❌ Error al acceder a la cámara</p>
            <p class="help-text">${error.message}</p>
        `;
    }
}

function detenerCamara() {
    if (AppState.stream) {
        AppState.stream.getTracks().forEach(track => track.stop());
        AppState.stream = null;
    }
    AppState.camaraActiva = false;
    elementos.video.srcObject = null;
    elementos.camaraEstado.innerHTML = '<p>📷 Cámara detenida</p>';
    elementos.camaraEstado.style.display = 'flex';
}

// ==================== ESCANEO DE QR ====================

function escanearQR() {
    if (!AppState.camaraActiva || AppState.procesando) {
        requestAnimationFrame(escanearQR);
        return;
    }
    
    const canvas = elementos.canvas;
    const video = elementos.video;
    const context = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            procesarQR(code.data);
        }
    }
    
    requestAnimationFrame(escanearQR);
}

async function procesarQR(datos) {
    if (AppState.procesando) return;
    
    AppState.procesando = true;
    
    try {
        const response = await fetch('/api/registrar-asistencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qr_data: datos })
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
            mostrarFeedbackExito(resultado);
            reproducirBeep();
        } else if (resultado.duplicado) {
            mostrarFeedbackDuplicado(resultado);
        } else {
            Utils.showNotification(`Error: ${resultado.error}`, 'error');
        }
        
        // Actualizar estadísticas
        await actualizarEstadisticas();
        
    } catch (error) {
        console.error('Error al procesar QR:', error);
        Utils.showNotification('Error al registrar asistencia', 'error');
    }
    
    // Esperar 1 segundo antes de permitir otro escaneo
    setTimeout(() => {
        AppState.procesando = false;
    }, 1000);
}

function mostrarFeedbackExito(resultado) {
    // Ocultar otros feedbacks
    elementos.feedbackVacio.style.display = 'none';
    elementos.feedbackDuplicado.style.display = 'none';
    
    // Llenar datos
    elementos.feedbackHora.textContent = resultado.hora;
    elementos.feedbackFecha.textContent = resultado.fecha;
    elementos.feedbackNombre.textContent = resultado.alumno.nombre;
    elementos.feedbackSeccion.textContent = `${resultado.alumno.nivel} - ${resultado.alumno.grado}${resultado.alumno.seccion}`;
    
    // Mostrar feedback
    elementos.feedbackExito.style.display = 'block';
    
    // Borde verde
    elementos.camaraBox.classList.add('camara-exito');
    setTimeout(() => {
        elementos.camaraBox.classList.remove('camara-exito');
    }, 3000);
    
    // Volver a estado vacío después de 5 segundos
    setTimeout(() => {
        elementos.feedbackExito.style.display = 'none';
        elementos.feedbackVacio.style.display = 'flex';
    }, 5000);
}

function mostrarFeedbackDuplicado(resultado) {
    // Ocultar otros feedbacks
    elementos.feedbackVacio.style.display = 'none';
    elementos.feedbackExito.style.display = 'none';
    
    // Llenar datos
    elementos.feedbackMensajeDup.textContent = resultado.mensaje;
    elementos.feedbackNombreDup.textContent = resultado.alumno.nombre;
    elementos.feedbackSeccionDup.textContent = `${resultado.alumno.nivel} - ${resultado.alumno.grado}${resultado.alumno.seccion}`;
    
    // Mostrar feedback
    elementos.feedbackDuplicado.style.display = 'block';
    
    // Borde amarillo
    elementos.camaraBox.classList.add('camara-duplicado');
    setTimeout(() => {
        elementos.camaraBox.classList.remove('camara-duplicado');
    }, 3000);
    
    // Volver a estado vacío después de 4 segundos
    setTimeout(() => {
        elementos.feedbackDuplicado.style.display = 'none';
        elementos.feedbackVacio.style.display = 'flex';
    }, 4000);
}

// ==================== ESTADÍSTICAS ====================

async function actualizarEstadisticas() {
    try {
        const response = await fetch('/api/estadisticas-hoy');
        const data = await response.json();
        
        if (data.success) {
            elementos.totalHoy.textContent = data.total_hoy;
            actualizarUltimosRegistros(data.ultimos_registros);
        }
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
    }
}

function actualizarUltimosRegistros(registros) {
    if (!registros || registros.length === 0) {
        elementos.ultimosRegistros.innerHTML = '<p class="empty-state">No hay registros aún</p>';
        return;
    }
    
    elementos.ultimosRegistros.innerHTML = registros.map(reg => `
        <div class="registro-item">
            <span class="registro-hora">${reg.HORA}</span>
            <span class="registro-nombre">${reg.NOMBRE_COMPLETO}</span>
            <span class="registro-seccion">(${reg.GRADO}${reg.SECCION})</span>
        </div>
    `).join('');
}

// ==================== RED Y ENVÍO ====================

async function verificarRed() {
    try {
        const response = await fetch('/api/verificar-red');
        const data = await response.json();
        
        if (data.disponible) {
            elementos.redEstado.className = 'red-conectado';
            elementos.redEstado.innerHTML = '<span class="icon">✅</span><span>Red disponible</span>';
            elementos.redInfo.textContent = `Conectado a: ${data.ruta}`;
            elementos.btnEnviarArchivos.disabled = false;
        } else {
            elementos.redEstado.className = 'red-desconectado';
            elementos.redEstado.innerHTML = '<span class="icon">❌</span><span>Sin conexión de red</span>';
            elementos.redInfo.textContent = 'Los registros se guardan localmente';
            elementos.btnEnviarArchivos.disabled = true;
        }
    } catch (error) {
        elementos.redEstado.className = 'red-desconectado';
        elementos.redInfo.textContent = 'Error al verificar red';
    }
}

async function abrirModalEnviar() {
    elementos.modalEnviar.style.display = 'flex';
    
    try {
        const response = await fetch('/api/listar-archivos');
        const data = await response.json();
        
        if (data.success) {
            AppState.archivosDisponibles = data.archivos;
            mostrarListaArchivos(data.archivos);
            
            // Obtener ruta de destino
            const responseRed = await fetch('/api/verificar-red');
            const dataRed = await responseRed.json();
            elementos.rutaDestino.textContent = dataRed.ruta || '---';
        }
    } catch (error) {
        elementos.listaArchivosEnviar.innerHTML = '<p class="empty-state">Error al cargar archivos</p>';
    }
}

function mostrarListaArchivos(archivos) {
    if (!archivos || archivos.length === 0) {
        elementos.listaArchivosEnviar.innerHTML = '<p class="empty-state">No hay archivos disponibles</p>';
        return;
    }
    
    elementos.listaArchivosEnviar.innerHTML = archivos.map((archivo, index) => {
        const estadoIcono = {
            'actual': '📝',
            'pendiente': '⚠️',
            'enviado': '✅'
        }[archivo.estado];
        
        const estadoTexto = {
            'actual': 'Archivo actual',
            'pendiente': 'Pendiente de envío',
            'enviado': `Enviado el ${archivo.fecha_envio}`
        }[archivo.estado];
        
        const disabled = archivo.registros === 0 ? 'disabled' : '';
        
        return `
            <div class="archivo-item ${archivo.estado}">
                <input type="checkbox" 
                       id="archivo_${index}" 
                       value="${archivo.nombre}"
                       ${disabled}
                       onchange="actualizarContadorSeleccionados()">
                <label for="archivo_${index}">
                    <div class="archivo-info">
                        <p class="archivo-nombre">${estadoIcono} ${archivo.nombre}</p>
                        <p class="archivo-detalles">
                            📊 ${archivo.registros} registros | 
                            📅 ${archivo.fecha}
                        </p>
                        <p class="archivo-estado">${estadoTexto}</p>
                    </div>
                </label>
            </div>
        `;
    }).join('');
}

function actualizarContadorSeleccionados() {
    const checkboxes = document.querySelectorAll('#listaArchivosEnviar input[type="checkbox"]:checked');
    elementos.contadorSeleccionados.textContent = checkboxes.length;
}

function seleccionarTodos() {
    const checkboxes = document.querySelectorAll('#listaArchivosEnviar input[type="checkbox"]:not(:disabled)');
    checkboxes.forEach(cb => cb.checked = true);
    actualizarContadorSeleccionados();
}

function deseleccionarTodos() {
    const checkboxes = document.querySelectorAll('#listaArchivosEnviar input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    actualizarContadorSeleccionados();
}

async function enviarArchivosSeleccionados() {
    const checkboxes = document.querySelectorAll('#listaArchivosEnviar input[type="checkbox"]:checked');
    const archivos = Array.from(checkboxes).map(cb => cb.value);
    
    if (archivos.length === 0) {
        Utils.showNotification('No hay archivos seleccionados', 'error');
        return;
    }
    
    try {
        elementos.btnConfirmarEnvio.disabled = true;
        elementos.btnConfirmarEnvio.textContent = 'Enviando...';
        
        const response = await fetch('/api/enviar-archivos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivos })
        });
        
        const resultado = await response.json();
        
        cerrarModalEnviar();
        mostrarModalResultado(resultado);
        
    } catch (error) {
        Utils.showNotification(`Error: ${error.message}`, 'error');
    } finally {
        elementos.btnConfirmarEnvio.disabled = false;
        elementos.btnConfirmarEnvio.innerHTML = '<span class="icon">📤</span> Enviar seleccionados (<span id="contadorSeleccionados">0</span>)';
    }
}

function mostrarModalResultado(resultado) {
    elementos.modalResultado.style.display = 'flex';
    
    if (resultado.success) {
        elementos.resultadoTitulo.textContent = '✅ Envío completado';
        elementos.resultadoContenido.innerHTML = `
            <p>Se enviaron <strong>${resultado.exitosos}</strong> archivos exitosamente.</p>
            <p class="help-text">Total de registros: ${resultado.total}</p>
        `;
    } else {
        elementos.resultadoTitulo.textContent = '⚠️ Envío parcial';
        elementos.resultadoContenido.innerHTML = `
            <p>Exitosos: <strong>${resultado.exitosos}</strong></p>
            <p>Fallidos: <strong>${resultado.fallidos}</strong></p>
            ${resultado.detalles.fallidos.map(f => `
                <p class="error-item">❌ ${f.nombre}: ${f.error}</p>
            `).join('')}
        `;
    }
}

function cerrarModalEnviar() {
    elementos.modalEnviar.style.display = 'none';
}

function cerrarModalResultado() {
    elementos.modalResultado.style.display = 'none';
}

// ==================== EVENTOS ====================

elementos.btnEnviarArchivos.addEventListener('click', abrirModalEnviar);
elementos.btnDetener.addEventListener('click', () => {
    if (confirm('¿Detener la lectura de códigos QR?')) {
        detenerCamara();
    }
});

document.getElementById('btnSeleccionarTodos').addEventListener('click', seleccionarTodos);
document.getElementById('btnDeseleccionarTodos').addEventListener('click', deseleccionarTodos);
document.getElementById('btnConfirmarEnvio').addEventListener('click', enviarArchivosSeleccionados);

// Hacer funciones disponibles globalmente para onclick en HTML
window.cerrarModalEnviar = cerrarModalEnviar;
window.cerrarModalResultado = cerrarModalResultado;
window.actualizarContadorSeleccionados = actualizarContadorSeleccionados;

// ==================== INICIALIZACIÓN ====================

async function inicializar() {
    // Obtener laptop ID desde config
    elementos.laptopId.textContent = 'LAPTOP_A'; // TODO: Obtener desde config
    
    // Iniciar cámara
    await iniciarCamara();
    
    // Actualizar estadísticas iniciales
    await actualizarEstadisticas();
    
    // Verificar red
    await verificarRed();
    
    // Actualizar estadísticas cada 5 segundos
    setInterval(actualizarEstadisticas, 5000);
    
    // Verificar red cada 10 segundos
    setInterval(verificarRed, 10000);
}

// Cargar librería jsQR desde CDN
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
script.onload = () => {
    console.log('jsQR cargado');
    inicializar();
};
document.head.appendChild(script);