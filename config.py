"""
Configuración del Sistema QR-Asist
"""

import os

# Rutas base
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATOS_DIR = os.path.join(BASE_DIR, 'datos')
QR_DIR = os.path.join(DATOS_DIR, 'qr_codes')
REGISTROS_DIR = os.path.join(BASE_DIR, 'registro')
REPORTES_DIR = os.path.join(BASE_DIR, 'reportes')
CONSOLIDADOS_DIR = os.path.join(REPORTES_DIR, 'consolidados')

# Configuración de red (para Módulo 2 - futuro)
IP_CENTRAL = "169.254.199.214"  # IP de PC central (directora)
CARPETA_COMPARTIDA_RED = f"\\\\{IP_CENTRAL}\\AsistenciasRecibidas"
CARPETA_COMPARTIDA_LOCAL = "C:\\AsistenciasRecibidas"  # Fallback local
LAPTOP_ID = "LAPTOP_A"  # Cambiar en cada equipo

# Función para obtener carpeta compartida (con fallback)
def obtener_carpeta_compartida():
    """
    Intenta acceder a la carpeta compartida de red.
    Si no está disponible, usa la carpeta local en C:
    """
    if os.path.exists(CARPETA_COMPARTIDA_RED):
        return CARPETA_COMPARTIDA_RED
    elif os.path.exists(CARPETA_COMPARTIDA_LOCAL):
        return CARPETA_COMPARTIDA_LOCAL
    else:
        # Si ninguna existe, retornar la local (se creará si es necesario)
        return CARPETA_COMPARTIDA_LOCAL

# Carpeta compartida activa
CARPETA_COMPARTIDA = obtener_carpeta_compartida()

# Configuración de QR
QR_SIZE = 300  # Tamaño de imagen QR en píxeles
QR_BORDER = 4  # Borde del QR

# Configuración de asistencia
HORA_INICIO_CLASES = "08:00:00"
HORA_LIMITE_DEFAULT = "08:00:00"  # Para reportes de tardanzas
MINUTOS_TOLERANCIA_DUPLICADOS = 2

# Flask
FLASK_SECRET_KEY = 'qr-asist-secret-key-2026'
FLASK_DEBUG = False
FLASK_PORT = 5000