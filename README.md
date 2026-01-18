# 🎓 QR-Asist

**Sistema de Control de Asistencia Escolar con Códigos QR**

Sistema moderno y eficiente para registrar la asistencia de alumnos utilizando códigos QR. Diseñado para funcionar completamente offline en entornos escolares con conectividad limitada.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Módulos](#-módulos)
- [Configuración](#-configuración)
- [Estado del Proyecto](#-estado-del-proyecto)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### 🎯 Funcionalidades Principales

- **Generación de Códigos QR**: Crea códigos QR únicos para cada alumno
- **Lectura Rápida**: Registro de asistencia mediante escaneo con cámara web
- **100% Offline**: Funciona sin internet en la entrada del colegio
- **Sincronización en Red Local**: Envío de registros a PC central vía WiFi local
- **Reportes Automáticos**: Consolidación y exportación a Excel
- **Interfaz Moderna**: Diseño web responsivo y fácil de usar

### 🚀 Ventajas

✅ **Sin dependencia de internet** durante el registro  
✅ **Múltiples puntos de entrada** (4-5 laptops simultáneas)  
✅ **Rápido y eficiente** (< 1 segundo por alumno)  
✅ **Organizado** por nivel, grado y sección  
✅ **Prevención de duplicados** automática  
✅ **Reportes detallados** con estadísticas  

---

## 🛠️ Tecnologías

### Backend
- **Python 3.10+**
- **Flask** - Framework web
- **OpenCV** - Procesamiento de video
- **PyZBar** - Decodificación de códigos QR
- **qrcode** - Generación de códigos QR
- **openpyxl** - Exportación a Excel
- **ReportLab** - Generación de PDFs

### Frontend
- **HTML5**
- **CSS3** (con variables CSS modernas)
- **JavaScript (Vanilla)**
- **Interfaz responsiva**

---

## 📦 Requisitos

### Software
- Python 3.10 o superior
- Cámara web (para el módulo de lectura)
- Sistema operativo: Windows, Linux o macOS

### Hardware Recomendado
- **Laptops de entrada**: Procesador Dual-Core, 4GB RAM, cámara web
- **PC central**: Procesador Quad-Core, 8GB RAM
- **Red local**: Router WiFi o switch Ethernet

---

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/EJJBR/QR-Asist.git
cd QR-Asist
```

### 2. Crear entorno virtual

**Linux/macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar el sistema

Edita `config.py` con los datos de tu colegio:

```python
# IP de la PC central (directora)
IP_CENTRAL = "192.168.1.100"

# Identificador de cada laptop (cambiar en cada equipo)
LAPTOP_ID = "LAPTOP_A"  # LAPTOP_A, LAPTOP_B, LAPTOP_C, etc.
```

---

## 🚀 Uso

### Iniciar el Sistema

```bash
# Activar entorno virtual
source venv/bin/activate  # Linux/macOS
# o
venv\Scripts\activate     # Windows

# Ejecutar aplicación
python main.py
```

El navegador se abrirá automáticamente en `http://127.0.0.1:5000`

---

## 📂 Estructura del Proyecto

```
QR-Asist/
│
├── main.py                 # Punto de entrada principal
├── app.py                  # Servidor Flask y rutas
├── config.py               # Configuración del sistema
├── requirements.txt        # Dependencias de Python
│
├── datos/
│   ├── alumnos.csv         # Lista de alumnos
│   └── qr_codes/           # Códigos QR generados
│       └── Nivel_Grado_Seccion/
│           ├── Alumno_QR.png
│           └── PDF.pdf
│
├── registro/               # Registros locales de asistencia
│   └── asistencia_LAPTOP_X.txt
│
├── reportes/               # Reportes consolidados (Excel)
│   └── Asistencia_FECHA.xlsx
│
├── modules/                # Módulos de lógica de negocio
│   ├── generador_qr.py     # Generación de códigos QR
│   ├── lector_qr.py        # Lectura de QR (próximamente)
│   └── consolidador.py     # Consolidación de reportes (próximamente)
│
├── templates/              # Plantillas HTML
│   ├── base.html           # Plantilla base
│   ├── index.html          # Página principal
│   ├── generar_qr.html     # Generador de QR
│   ├── leer_qr.html        # Lector de QR
│   └── consolidar.html     # Consolidador
│
└── static/                 # Archivos estáticos
    ├── css/
    │   └── style.css       # Estilos principales
    └── js/
        ├── main.js         # JavaScript global
        └── generar_qr.js   # Lógica del generador
```

---

## 📱 Módulos

### Módulo 1: Generador de QR ✅ **COMPLETADO**

**Funcionalidades:**
- Carga masiva desde archivo CSV
- Agregar alumnos individuales
- Selector de nivel educativo (Primaria/Secundaria)
- Selector de grado (dinámico según nivel)
- Input de sección (1 letra mayúscula)
- Generación de códigos QR con UTF-8 (mantiene tildes)
- Organización automática en carpetas por nivel/grado/sección
- Generación de PDF para imprimir (9 QR por página A4)
- Validaciones de entrada
- Feedback visual

**Formato del CSV:**
```csv
ID,NOMBRE_COMPLETO
A001,Juan Pérez González
A002,María García López
```

**Formato del QR generado:**
```
A001|Juan Pérez González|Primaria|5|A
```

### Módulo 2: Lector de QR ⏳ **EN DESARROLLO**

**Funcionalidades planificadas:**
- Acceso a cámara web
- Detección de QR en tiempo real
- Registro de asistencias con timestamp
- Prevención de duplicados (2 minutos)
- Feedback visual y sonoro
- Contador de asistencias del día
- Envío manual a PC central
- Funcionamiento 100% offline

### Módulo 3: Consolidador ⏳ **PENDIENTE**

**Funcionalidades planificadas:**
- Búsqueda automática de archivos nuevos
- Consolidación de múltiples laptops
- Detección de duplicados
- Ordenamiento cronológico
- Exportación a Excel
- Reportes por grado y sección
- Estadísticas de asistencia

---

## ⚙️ Configuración

### Archivo `config.py`

```python
# Configuración de red
IP_CENTRAL = "192.168.1.100"           # IP de PC central
CARPETA_COMPARTIDA = "AsistenciasRecibidas"
LAPTOP_ID = "LAPTOP_A"                 # Cambiar en cada equipo

# Configuración de QR
QR_SIZE = 300                          # Tamaño en píxeles
QR_BORDER = 4                          # Borde del QR

# Configuración de asistencia
HORA_INICIO_CLASES = "08:00:00"
MINUTOS_TOLERANCIA_DUPLICADOS = 2
```

### Red Local

Para compartir archivos entre laptops:

**En la PC central (Windows):**
1. Crear carpeta: `C:\AsistenciasRecibidas\`
2. Click derecho → Compartir
3. Compartir con "Todos" con permisos de escritura
4. Anotar la IP de la PC (ejecutar `ipconfig` en CMD)

**En las laptops:**
1. Actualizar `IP_CENTRAL` en `config.py`
2. Probar conexión: `\\IP_CENTRAL\AsistenciasRecibidas`

---

## 📊 Estado del Proyecto

| Módulo | Estado | Progreso |
|--------|--------|----------|
| **Generador de QR** | ✅ Completado | 100% |
| **Lector de QR** | ⏳ En desarrollo | 0% |
| **Consolidador** | ⏳ Pendiente | 0% |
| **Compilación (.exe)** | ⏳ Pendiente | 0% |

### Próximos pasos:
1. Implementar Módulo 2 (Lector de QR)
2. Implementar Módulo 3 (Consolidador)
3. Pruebas integradas con múltiples laptops
4. Compilación a ejecutable portable con PyInstaller
5. Documentación de usuario final

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autor

**EJJBR**
- GitHub: [@EJJBR](https://github.com/EJJBR)

---

## 🙏 Agradecimientos

- A las instituciones educativas que inspiraron este proyecto
- A la comunidad de Python y Flask
- A todos los contribuidores

---

## 📞 Soporte

Si encuentras algún bug o tienes sugerencias, por favor abre un [issue](https://github.com/EJJBR/QR-Asist/issues).

---

<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub ⭐**

Hecho con ❤️ para mejorar la gestión escolar

</div>