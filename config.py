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

# Configuración de red (para Módulo 2 - futuro)
IP_CENTRAL = "169.254.199.214"  # IP de PC central (directora)
CARPETA_COMPARTIDA = f"\\\\{IP_CENTRAL}\\AsistenciasRecibidas"
LAPTOP_ID = "LAPTOP_A"  # Cambiar en cada equipo

# Configuración de QR
QR_SIZE = 300  # Tamaño de imagen QR en píxeles
QR_BORDER = 4  # Borde del QR

# Configuración de asistencia
HORA_INICIO_CLASES = "08:00:00"
MINUTOS_TOLERANCIA_DUPLICADOS = 2

# Flask
FLASK_SECRET_KEY = 'qr-asist-secret-key-2026'
FLASK_DEBUG = False
FLASK_PORT = 5000