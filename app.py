"""
QR-Asist - Servidor Flask
Rutas y endpoints de la aplicación
"""

from flask import Flask, render_template, request, jsonify, send_file
import os
import json
from datetime import datetime
import csv

# Importar módulos del proyecto
from modules.generador_qr import GeneradorQR
from modules.lector_qr import LectorQR
import config

app = Flask(__name__)
app.config['SECRET_KEY'] = 'qr-asist-secret-key-2026'

# Configuración de rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATOS_DIR = os.path.join(BASE_DIR, 'datos')
QR_DIR = os.path.join(DATOS_DIR, 'qr_codes')
REGISTROS_DIR = os.path.join(BASE_DIR, 'registro')
REPORTES_DIR = os.path.join(BASE_DIR, 'reportes')

# Asegurar que existan las carpetas
os.makedirs(QR_DIR, exist_ok=True)
os.makedirs(REGISTROS_DIR, exist_ok=True)
os.makedirs(REPORTES_DIR, exist_ok=True)

# Instanciar módulos
generador = GeneradorQR()
lector = LectorQR(laptop_id=config.LAPTOP_ID)

# ==================== RUTAS DE PÁGINAS ====================

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/generar-qr')
def generar_qr_page():
    """Módulo de generación de códigos QR"""
    return render_template('generar_qr.html')

@app.route('/leer-qr')
def leer_qr_page():
    """Módulo de lectura de QR (próximamente)"""
    return render_template('leer_qr.html')

@app.route('/consolidar')
def consolidar_page():
    """Módulo de consolidación (próximamente)"""
    return render_template('consolidar.html')

# ==================== API ENDPOINTS ====================

@app.route('/api/cargar-csv', methods=['POST'])
def cargar_csv():
    """Cargar y leer archivo CSV de alumnos"""
    try:
        if 'archivo' not in request.files:
            return jsonify({'error': 'No se envió ningún archivo'}), 400
        
        archivo = request.files['archivo']
        
        if archivo.filename == '':
            return jsonify({'error': 'Nombre de archivo vacío'}), 400
        
        if not archivo.filename.endswith('.csv'):
            return jsonify({'error': 'El archivo debe ser CSV'}), 400
        
        # Leer contenido del CSV
        contenido = archivo.read().decode('utf-8')
        lineas = contenido.strip().split('\n')
        
        # Parsear CSV
        reader = csv.DictReader(lineas)
        alumnos = []
        
        for fila in reader:
            if 'ID' in fila and 'NOMBRE_COMPLETO' in fila:
                alumnos.append({
                    'id': fila['ID'].strip(),
                    'nombre': fila['NOMBRE_COMPLETO'].strip()
                })
        
        return jsonify({
            'success': True,
            'alumnos': alumnos,
            'total': len(alumnos)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generar-qr', methods=['POST'])
def generar_qr_api():
    """Generar códigos QR"""
    try:
        datos = request.json
        
        nivel = datos.get('nivel')
        grado = datos.get('grado')
        seccion = datos.get('seccion')
        alumnos = datos.get('alumnos', [])
        
        if not all([nivel, grado, seccion, alumnos]):
            return jsonify({'error': 'Faltan datos requeridos'}), 400
        
        # Generar QR para cada alumno
        resultado = generador.generar_codigos_qr(
            alumnos=alumnos,
            nivel=nivel,
            grado=grado,
            seccion=seccion
        )
        
        return jsonify(resultado)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generar-pdf', methods=['POST'])
def generar_pdf_api():
    """Generar PDF con códigos QR"""
    try:
        datos = request.json
        
        nivel = datos.get('nivel')
        grado = datos.get('grado')
        seccion = datos.get('seccion')
        alumnos = datos.get('alumnos', [])
        
        # Generar PDF
        pdf_path = generador.crear_pdf_impresion(
            alumnos=alumnos,
            nivel=nivel,
            grado=grado,
            seccion=seccion
        )
        
        if pdf_path and os.path.exists(pdf_path):
            return send_file(
                pdf_path,
                as_attachment=True,
                download_name=os.path.basename(pdf_path)
            )
        else:
            return jsonify({'error': 'No se pudo generar el PDF'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/agregar-alumno', methods=['POST'])
def agregar_alumno_api():
    """Agregar un alumno individual"""
    try:
        datos = request.json
        
        id_alumno = datos.get('id')
        nombre = datos.get('nombre')
        nivel = datos.get('nivel')
        grado = datos.get('grado')
        seccion = datos.get('seccion')
        
        if not all([id_alumno, nombre, nivel, grado, seccion]):
            return jsonify({'error': 'Faltan datos del alumno'}), 400
        
        # Generar QR para este alumno
        alumno = {'id': id_alumno, 'nombre': nombre}
        
        resultado = generador.generar_qr_individual(
            alumno=alumno,
            nivel=nivel,
            grado=grado,
            seccion=seccion
        )
        
        return jsonify(resultado)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== API MÓDULO 2: LECTOR QR ====================

@app.route('/api/registrar-asistencia', methods=['POST'])
def registrar_asistencia_api():
    """Registrar asistencia desde QR escaneado"""
    try:
        datos = request.json
        datos_qr = datos.get('qr_data')
        
        if not datos_qr:
            return jsonify({'error': 'No se recibieron datos del QR'}), 400
        
        resultado = lector.registrar_asistencia(datos_qr)
        return jsonify(resultado)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/estadisticas-hoy', methods=['GET'])
def estadisticas_hoy_api():
    """Obtener estadísticas del día actual"""
    try:
        total = lector.contar_registros_hoy()
        ultimos = lector.obtener_ultimos_registros(5)
        
        return jsonify({
            'success': True,
            'total_hoy': total,
            'ultimos_registros': ultimos
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/listar-archivos', methods=['GET'])
def listar_archivos_api():
    """Listar archivos de registro disponibles"""
    try:
        archivos = lector.listar_archivos_registro()
        
        return jsonify({
            'success': True,
            'archivos': archivos,
            'total': len(archivos)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/enviar-archivos', methods=['POST'])
def enviar_archivos_api():
    """Enviar archivos seleccionados a PC central"""
    try:
        datos = request.json
        archivos = datos.get('archivos', [])
        
        if not archivos:
            return jsonify({'error': 'No se seleccionaron archivos'}), 400
        
        # Obtener carpeta de destino desde config
        carpeta_destino = config.CARPETA_COMPARTIDA
        
        # Enviar archivos
        resultado = lector.enviar_multiples(archivos, carpeta_destino)
        
        return jsonify(resultado)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/verificar-red', methods=['GET'])
def verificar_red_api():
    """Verificar si la carpeta de red está disponible"""
    try:
        carpeta_destino = config.CARPETA_COMPARTIDA
        disponible = os.path.exists(carpeta_destino)
        
        return jsonify({
            'success': True,
            'disponible': disponible,
            'ruta': carpeta_destino
        })
    
    except Exception as e:
        return jsonify({
            'success': True,
            'disponible': False,
            'error': str(e)
        })

# ==================== MANEJO DE ERRORES ====================

@app.errorhandler(404)
def page_not_found(e):
    """Página no encontrada"""
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(e):
    """Error interno del servidor"""
    return jsonify({'error': 'Error interno del servidor'}), 500

if __name__ == '__main__':
    app.run(debug=True)