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
- Navegador moderno (Chrome, Firefox, Edge)
  - Con soporte para getUserMedia (acceso a cámara)
  - JavaScript habilitado
- Sistema operativo: Windows, Linux o macOS

### Hardware Recomendado
- **Laptops de entrada**: 
  - Procesador Dual-Core mínimo
  - 4GB RAM
  - Cámara web integrada o USB
  - Resolución mínima: 1280x720
- **PC central**: 
  - Procesador Quad-Core
  - 8GB RAM
- **Red local**: 
  - Router WiFi o switch Ethernet
  - Velocidad mínima: 10 Mbps

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

### Módulo 2: Lector de QR ✅ **COMPLETADO**

**Funcionalidades implementadas:**
- ✅ Acceso a cámara web con getUserMedia
- ✅ Detección de QR en tiempo real usando jsQR
- ✅ Registro de asistencias con timestamp automático
- ✅ Prevención de duplicados (tolerancia de 2 minutos)
- ✅ Feedback visual (borde verde para éxito, amarillo para duplicados)
- ✅ Feedback sonoro (beep al registrar)
- ✅ Panel de información del último alumno registrado
- ✅ Contador de asistencias del día
- ✅ Lista de últimos 5 registros en tiempo real
- ✅ Verificación automática de red (cada 10 segundos)
- ✅ Modal de selección de archivos para envío
- ✅ Envío múltiple de archivos a PC central
- ✅ Estados de archivo: Actual, Pendiente, Enviado
- ✅ Gestión inteligente de archivos con marcas .enviado
- ✅ Funcionamiento 100% offline

**Formato del archivo de registro:**
```csv
ID,NOMBRE_COMPLETO,NIVEL,GRADO,SECCION,FECHA,HORA,LAPTOP
A001,Juan Pérez González,Primaria,5,A,2026-01-18,08:15:23,LAPTOP_A
```

**Nombre del archivo:**
```
registro/asistencia_LAPTOP_A_20260118.txt
```

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

## 📁 Archivos Generados por el Sistema

### Códigos QR (Módulo 1):
```
datos/qr_codes/
├── Primaria_5_A/
│   ├── Juan_Pérez_González_QR.png
│   ├── María_García_López_QR.png
│   └── Primaria_5_A.pdf  (9 QR por página)
└── Secundaria_3_B/
    └── ...
```

### Registros de Asistencia (Módulo 2):
```
registro/
├── asistencia_LAPTOP_A_20260118.txt
├── asistencia_LAPTOP_A_20260118.txt.enviado  (marca de enviado)
├── asistencia_LAPTOP_B_20260118.txt
└── ...
```

### Reportes Consolidados (Módulo 3 - próximamente):
```
reportes/
└── Asistencia_2026-01-18.xlsx
```

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
| **Lector de QR** | ✅ Completado | 100% |
| **Consolidador** | ⏳ Pendiente | 0% |
| **Compilación (.exe)** | ⏳ Pendiente | 0% |

### Próximos pasos:
1. Implementar Módulo 3 (Consolidador de reportes)
2. Pruebas integradas con múltiples laptops
3. Compilación a ejecutable portable con PyInstaller
4. Documentación de usuario final
5. Manual de instalación y configuración

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

## 🔧 Solución de Problemas

### La cámara no funciona

**Problema:** "Error al acceder a la cámara" o pantalla negra

**Soluciones:**
1. Dar permisos de cámara al navegador
   - Chrome: Configuración → Privacidad → Cámara
   - Firefox: Permisos → Cámara → Permitir
2. Verificar que otra aplicación no esté usando la cámara
3. Probar en otro navegador (Chrome es el más compatible)
4. En Linux, verificar permisos: `sudo usermod -a -G video $USER`

### No detecta códigos QR

**Problema:** La cámara funciona pero no lee los QR

**Soluciones:**
1. Mejorar la iluminación
2. Acercar/alejar el QR de la cámara
3. Asegurar que el QR no esté arrugado o borroso
4. Limpiar la lente de la cámara

### "Sin conexión de red"

**Problema:** No puede enviar archivos a la PC central

**Soluciones:**
1. Verificar que ambas máquinas estén en la misma red
2. Hacer ping a la PC central: `ping 192.168.1.100`
3. Verificar que la carpeta esté compartida correctamente
4. En Windows, cambiar red de "Pública" a "Privada"
5. Desactivar temporalmente el firewall para probar

### Los registros no se guardan

**Problema:** Los escaneos no aparecen en el archivo .txt

**Soluciones:**
1. Verificar permisos de escritura en la carpeta `registro/`
2. Verificar que hay espacio en disco
3. Revisar la consola del navegador (F12) para errores

---

<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub ⭐**

Hecho con ❤️ para mejorar la gestión escolar

</div>