/**
 * QR-Asist - Módulo de Consolidación
 * Lógica para consolidación y reportes dinámicos
 */

// Estado de la aplicación
const AppState = {
    datosCompletos: [],
    datosFiltrados: [],
    paginaActual: 1,
    registrosPorPagina: 100,
    horaLimite: '08:00:00'
};

// Elementos del DOM
const elementos = {
    // Consolidación
    btnConsolidar: document.getElementById('btnConsolidar'),
    btnForzarConsolidar: document.getElementById('btnForzarConsolidar'),
    carpetaActiva: document.getElementById('carpetaActiva'),
    totalConsolidados: document.getElementById('totalConsolidados'),
    estadoConsolidacion: document.getElementById('estadoConsolidacion'),
    estadoConsolidacionContenido: document.getElementById('estadoConsolidacionContenido'),

    // Filtros
    fechaInicio: document.getElementById('fechaInicio'),
    fechaFin: document.getElementById('fechaFin'),
    horaLimite: document.getElementById('horaLimite'),
    buscarAlumno: document.getElementById('buscarAlumno'),
    btnCargarDatos: document.getElementById('btnCargarDatos'),
    btnAplicarFiltros: document.getElementById('btnAplicarFiltros'),
    btnLimpiarFiltros: document.getElementById('btnLimpiarFiltros'),

    // Estadísticas
    statTotal: document.getElementById('statTotal'),
    statTardanzas: document.getElementById('statTardanzas'),
    statAlumnos: document.getElementById('statAlumnos'),
    statDias: document.getElementById('statDias'),

    // Tabla
    tablaContainer: document.getElementById('tablaContainer'),
    btnExportar: document.getElementById('btnExportar'),

    // Paginación
    paginacion: document.getElementById('paginacion'),
    btnPaginaAnterior: document.getElementById('btnPaginaAnterior'),
    btnPaginaSiguiente: document.getElementById('btnPaginaSiguiente'),
    infoPagina: document.getElementById('infoPagina')
};

// ==================== EVENTOS ==================== //

// Consolidación
elementos.btnConsolidar.addEventListener('click', () => consolidarTodo(false));
elementos.btnForzarConsolidar.addEventListener('click', () => consolidarTodo(true));

// Filtros
elementos.btnCargarDatos.addEventListener('click', cargarDatos);
elementos.btnAplicarFiltros.addEventListener('click', aplicarFiltros);
elementos.btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
elementos.buscarAlumno.addEventListener('input', aplicarFiltros);
elementos.horaLimite.addEventListener('change', () => {
    AppState.horaLimite = elementos.horaLimite.value + ':00';
    aplicarFiltros();
});

// Exportar
elementos.btnExportar.addEventListener('click', exportarExcel);

// Paginación
elementos.btnPaginaAnterior.addEventListener('click', () => cambiarPagina(-1));
elementos.btnPaginaSiguiente.addEventListener('click', () => cambiarPagina(1));

// ==================== FUNCIONES ==================== //

/**
 * Inicializar fechas por defecto
 */
function inicializarFechas() {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);

    elementos.fechaInicio.value = hace30Dias.toISOString().split('T')[0];
    elementos.fechaFin.value = hoy.toISOString().split('T')[0];
}

/**
 * Cargar información inicial
 */
async function cargarInfoInicial() {
    try {
        // Obtener carpeta activa
        const response = await fetch('/api/verificar-red');
        const result = await response.json();

        if (result.disponible) {
            elementos.carpetaActiva.textContent = result.ruta;

            // Detectar si es carpeta de red o local
            if (result.ruta.startsWith('\\\\')) {
                elementos.carpetaActiva.style.color = 'var(--success)';
                Utils.showNotification('✓ Usando carpeta de red compartida', 'success');
            } else if (result.ruta.startsWith('C:')) {
                elementos.carpetaActiva.style.color = 'var(--warning)';
                Utils.showNotification('⚠️ Usando carpeta local (C:) - No hay conexión de red', 'warning');
            }
        } else {
            elementos.carpetaActiva.textContent = 'No disponible';
            elementos.carpetaActiva.style.color = 'var(--danger)';
            Utils.showNotification('❌ Carpeta compartida no disponible', 'error');
        }

        // Listar consolidados
        await listarConsolidados();

    } catch (error) {
        console.error('Error al cargar info inicial:', error);
    }
}

/**
 * Listar consolidados disponibles
 */
async function listarConsolidados() {
    try {
        const response = await fetch('/api/listar-consolidados');
        const result = await response.json();

        if (result.success) {
            elementos.totalConsolidados.textContent = result.total;
        }
    } catch (error) {
        console.error('Error al listar consolidados:', error);
    }
}

/**
 * Consolidar todos los archivos
 */
async function consolidarTodo(forzar = false) {
    const btn = forzar ? elementos.btnForzarConsolidar : elementos.btnConsolidar;
    btn.disabled = true;

    mostrarEstadoConsolidacion('Consolidando archivos...', 'info');

    try {
        const response = await fetch('/api/consolidar-todo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forzar })
        });

        const result = await response.json();

        if (result.success) {
            const mensaje = `✓ Consolidación completada
                <br>Días procesados: ${result.dias_procesados}
                <br>Total registros: ${result.total_registros}
                <br>Núcleos usados: ${result.nucleos_usados || 'N/A'}`;
            mostrarEstadoConsolidacion(mensaje, 'success');
            Utils.showNotification(result.mensaje, 'success');
            await listarConsolidados();
        } else {
            mostrarEstadoConsolidacion(`Error: ${result.error}`, 'error');
            Utils.showNotification(`Error: ${result.error}`, 'error');
        }

    } catch (error) {
        mostrarEstadoConsolidacion(`Error: ${error.message}`, 'error');
        Utils.showNotification(`Error: ${error.message}`, 'error');
    } finally {
        btn.disabled = false;
    }
}

/**
 * Mostrar estado de consolidación
 */
function mostrarEstadoConsolidacion(mensaje, tipo) {
    elementos.estadoConsolidacion.style.display = 'block';
    elementos.estadoConsolidacionContenido.innerHTML = `<p class="estado-${tipo}">${mensaje}</p>`;
}

/**
 * Cargar datos del rango de fechas
 */
async function cargarDatos() {
    const fechaInicio = elementos.fechaInicio.value;
    const fechaFin = elementos.fechaFin.value;

    if (!fechaInicio || !fechaFin) {
        Utils.showNotification('Selecciona un rango de fechas', 'error');
        return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
        Utils.showNotification('La fecha de inicio debe ser anterior a la fecha fin', 'error');
        return;
    }

    elementos.btnCargarDatos.disabled = true;
    elementos.tablaContainer.innerHTML = '<p class="empty-state">Cargando datos...</p>';

    try {
        const response = await fetch('/api/cargar-consolidados', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fechaInicio, fechaFin })
        });

        const result = await response.json();

        if (result.success) {
            AppState.datosCompletos = result.registros;
            AppState.datosFiltrados = result.registros;
            AppState.paginaActual = 1;

            actualizarTabla();
            actualizarEstadisticas();

            elementos.btnAplicarFiltros.disabled = false;
            elementos.btnLimpiarFiltros.disabled = false;
            elementos.btnExportar.disabled = false;

            Utils.showNotification(`✓ ${result.total} registros cargados`, 'success');
        } else {
            elementos.tablaContainer.innerHTML = `<p class="empty-state">Error: ${result.error}</p>`;
            Utils.showNotification(`Error: ${result.error}`, 'error');
        }

    } catch (error) {
        elementos.tablaContainer.innerHTML = `<p class="empty-state">Error al cargar datos</p>`;
        Utils.showNotification(`Error: ${error.message}`, 'error');
    } finally {
        elementos.btnCargarDatos.disabled = false;
    }
}

/**
 * Aplicar filtros a los datos
 */
function aplicarFiltros() {
    if (AppState.datosCompletos.length === 0) return;

    const busqueda = elementos.buscarAlumno.value.toLowerCase();

    AppState.datosFiltrados = AppState.datosCompletos.filter(registro => {
        // Filtro de búsqueda (este sí filtra)
        if (busqueda) {
            const nombre = registro.NOMBRE_COMPLETO.toLowerCase();
            const id = registro.ID.toLowerCase();
            if (!nombre.includes(busqueda) && !id.includes(busqueda)) {
                return false;
            }
        }

        // La hora límite NO filtra, solo resalta visualmente en la tabla
        return true;
    });

    AppState.paginaActual = 1;
    actualizarTabla();
    actualizarEstadisticas();
}

/**
 * Limpiar filtros
 */
function limpiarFiltros() {
    elementos.buscarAlumno.value = '';
    elementos.horaLimite.value = '08:00';
    AppState.horaLimite = '08:00:00';

    AppState.datosFiltrados = AppState.datosCompletos;
    AppState.paginaActual = 1;

    actualizarTabla();
    actualizarEstadisticas();
}

/**
 * Actualizar tabla con paginación
 */
function actualizarTabla() {
    if (AppState.datosFiltrados.length === 0) {
        elementos.tablaContainer.innerHTML = '<p class="empty-state">No hay registros que mostrar</p>';
        elementos.paginacion.style.display = 'none';
        return;
    }

    // Calcular paginación
    const inicio = (AppState.paginaActual - 1) * AppState.registrosPorPagina;
    const fin = inicio + AppState.registrosPorPagina;
    const registrosPagina = AppState.datosFiltrados.slice(inicio, fin);

    // Generar tabla
    let html = `
        <table class="tabla-reportes">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Nivel</th>
                    <th>Grado</th>
                    <th>Sección</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Tardanza</th>
                    <th>Laptop</th>
                </tr>
            </thead>
            <tbody>
    `;

    registrosPagina.forEach(registro => {
        const esTardanza = registro.HORA >= AppState.horaLimite;
        const claseTardanza = esTardanza ? 'tardanza' : '';

        html += `
            <tr class="${claseTardanza}">
                <td>${registro.ID}</td>
                <td>${registro.NOMBRE_COMPLETO}</td>
                <td>${registro.NIVEL}</td>
                <td>${registro.GRADO}</td>
                <td>${registro.SECCION}</td>
                <td>${registro.FECHA}</td>
                <td>${registro.HORA}</td>
                <td>${esTardanza ? '⚠️ Sí' : '✓ No'}</td>
                <td>${registro.LAPTOP}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    elementos.tablaContainer.innerHTML = html;

    // Actualizar paginación
    actualizarPaginacion();
}

/**
 * Actualizar controles de paginación
 */
function actualizarPaginacion() {
    const totalPaginas = Math.ceil(AppState.datosFiltrados.length / AppState.registrosPorPagina);

    if (totalPaginas <= 1) {
        elementos.paginacion.style.display = 'none';
        return;
    }

    elementos.paginacion.style.display = 'block';
    elementos.infoPagina.textContent = `Página ${AppState.paginaActual} de ${totalPaginas}`;
    elementos.btnPaginaAnterior.disabled = AppState.paginaActual === 1;
    elementos.btnPaginaSiguiente.disabled = AppState.paginaActual === totalPaginas;
}

/**
 * Cambiar página
 */
function cambiarPagina(direccion) {
    AppState.paginaActual += direccion;
    actualizarTabla();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Actualizar estadísticas
 */
function actualizarEstadisticas() {
    const datos = AppState.datosFiltrados;

    // Total registros
    elementos.statTotal.textContent = datos.length;

    // Tardanzas (basado en hora límite actual)
    const tardanzas = datos.filter(r => r.HORA >= AppState.horaLimite).length;
    elementos.statTardanzas.textContent = tardanzas;

    // Alumnos únicos
    const alumnosUnicos = new Set(datos.map(r => r.ID)).size;
    elementos.statAlumnos.textContent = alumnosUnicos;

    // Días únicos
    const diasUnicos = new Set(datos.map(r => r.FECHA)).size;
    elementos.statDias.textContent = diasUnicos;
}

/**
 * Exportar a Excel
 */
async function exportarExcel() {
    if (AppState.datosFiltrados.length === 0) {
        Utils.showNotification('No hay datos para exportar', 'error');
        return;
    }

    elementos.btnExportar.disabled = true;

    try {
        const response = await fetch('/api/exportar-reporte', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registros: AppState.datosFiltrados })
        });

        if (!response.ok) {
            throw new Error('Error al generar Excel');
        }

        // Descargar archivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        Utils.showNotification('✓ Excel descargado exitosamente', 'success');

    } catch (error) {
        Utils.showNotification(`Error: ${error.message}`, 'error');
    } finally {
        elementos.btnExportar.disabled = false;
    }
}

// ==================== INICIALIZACIÓN ==================== //

inicializarFechas();
cargarInfoInicial();
