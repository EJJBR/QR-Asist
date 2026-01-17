"""
Módulo de Generación de Códigos QR
Lógica para crear códigos QR y PDFs
"""

import qrcode
from PIL import Image, ImageDraw, ImageFont
import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from datetime import datetime
import unicodedata

class GeneradorQR:
    """Clase para generar códigos QR y PDFs"""
    
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.qr_dir = os.path.join(self.base_dir, 'datos', 'qr_codes')
        os.makedirs(self.qr_dir, exist_ok=True)
        self.carpeta_actual = None
    
    def crear_carpeta_grupo(self, nivel, grado, seccion):
        """Crear carpeta específica para el grupo"""
        nombre_carpeta = f"{nivel}_{grado}_{seccion}"
        carpeta_completa = os.path.join(self.qr_dir, nombre_carpeta)
        os.makedirs(carpeta_completa, exist_ok=True)
        self.carpeta_actual = carpeta_completa
        return carpeta_completa
    
    def normalizar_texto_qr(self, texto):
        """Normalizar texto para QR (mantener tildes con encoding correcto)"""
        # Normalizar usando NFC (Canonical Composition)
        # Asegura que los caracteres con tildes se codifiquen de forma estándar
        return unicodedata.normalize('NFC', texto)
    
    def generar_qr_individual(self, alumno, nivel, grado, seccion):
        """Generar código QR para un alumno individual"""
        try:
            # Crear carpeta del grupo si no existe
            if not self.carpeta_actual:
                self.crear_carpeta_grupo(nivel, grado, seccion)
            
            # Formato del QR: ID|Nombre|Nivel|Grado|Seccion
            datos_qr = f"{alumno['id']}|{alumno['nombre']}|{nivel}|{grado}|{seccion}"
            
            # Normalizar el texto para asegurar compatibilidad UTF-8
            datos_qr_normalizados = self.normalizar_texto_qr(datos_qr)
            
            # Crear código QR con modo de datos específico
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,  # Mayor corrección de errores
                box_size=10,
                border=4,
            )
            
            # Agregar datos normalizados
            qr.add_data(datos_qr_normalizados, optimize=0)
            qr.make(fit=True)
            
            # Crear imagen
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Guardar imagen en carpeta del grupo
            nombre_archivo = f"{alumno['nombre'].replace(' ', '_')}_QR.png"
            ruta_completa = os.path.join(self.carpeta_actual, nombre_archivo)
            img.save(ruta_completa)
            
            return {
                'success': True,
                'alumno': alumno['nombre'],
                'archivo': nombre_archivo,
                'ruta': ruta_completa
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'alumno': alumno.get('nombre', 'Desconocido')
            }
    
    def generar_codigos_qr(self, alumnos, nivel, grado, seccion):
        """Generar códigos QR para múltiples alumnos"""
        # Crear carpeta del grupo
        self.crear_carpeta_grupo(nivel, grado, seccion)
        
        resultados = {
            'success': True,
            'generados': [],
            'errores': [],
            'total': len(alumnos),
            'carpeta': self.carpeta_actual
        }
        
        for alumno in alumnos:
            resultado = self.generar_qr_individual(alumno, nivel, grado, seccion)
            
            if resultado['success']:
                resultados['generados'].append(resultado)
            else:
                resultados['errores'].append(resultado)
        
        if resultados['errores']:
            resultados['success'] = False
        
        return resultados
    
    def crear_pdf_impresion(self, alumnos, nivel, grado, seccion):
        """Crear PDF con códigos QR para imprimir (9 por página)"""
        try:
            # Crear carpeta del grupo
            self.crear_carpeta_grupo(nivel, grado, seccion)
            
            # Generar todos los QR primero
            resultado_qr = self.generar_codigos_qr(alumnos, nivel, grado, seccion)
            
            if not resultado_qr['generados']:
                return None
            
            # Crear PDF en la carpeta del grupo
            nombre_pdf = f"{nivel}_{grado}_{seccion}.pdf"
            ruta_pdf = os.path.join(self.carpeta_actual, nombre_pdf)
            
            c = canvas.Canvas(ruta_pdf, pagesize=A4)
            ancho, alto = A4
            
            # Configuración de layout (3x3 = 9 QR por página)
            qr_por_fila = 3
            qr_por_columna = 3
            qr_por_pagina = qr_por_fila * qr_por_columna
            
            margen = 40
            espacio_x = (ancho - 2 * margen) / qr_por_fila
            espacio_y = (alto - 2 * margen) / qr_por_columna
            
            qr_size = min(espacio_x, espacio_y) * 0.8
            
            # Iterar sobre los QR generados
            for idx, qr_info in enumerate(resultado_qr['generados']):
                # Nueva página si es necesario
                if idx > 0 and idx % qr_por_pagina == 0:
                    c.showPage()
                
                # Calcular posición
                pos_en_pagina = idx % qr_por_pagina
                fila = pos_en_pagina // qr_por_fila
                columna = pos_en_pagina % qr_por_fila
                
                x = margen + columna * espacio_x + (espacio_x - qr_size) / 2
                y = alto - margen - (fila + 1) * espacio_y + (espacio_y - qr_size) / 2
                
                # Dibujar imagen QR
                c.drawImage(
                    qr_info['ruta'],
                    x, y,
                    width=qr_size,
                    height=qr_size
                )
                
                # Agregar nombre del alumno debajo del QR
                c.setFont("Helvetica", 8)
                nombre = qr_info['alumno']
                # Truncar nombre si es muy largo
                if len(nombre) > 25:
                    nombre = nombre[:22] + "..."
                
                texto_x = x + qr_size / 2
                texto_y = y - 12
                c.drawCentredString(texto_x, texto_y, nombre)
            
            # Guardar PDF
            c.save()
            
            return ruta_pdf
        
        except Exception as e:
            print(f"Error al crear PDF: {e}")
            return None
    
    def validar_id(self, id_alumno):
        """Validar formato de ID"""
        # Debe tener al menos 1 carácter
        if not id_alumno or len(id_alumno) < 1:
            return False, "El ID no puede estar vacío"
        
        # No debe tener caracteres especiales problemáticos
        caracteres_invalidos = ['|', ',', '\n', '\r']
        for char in caracteres_invalidos:
            if char in id_alumno:
                return False, f"El ID no puede contener '{char}'"
        
        return True, "OK"
    
    def validar_nombre(self, nombre):
        """Validar formato de nombre"""
        if not nombre or len(nombre) < 3:
            return False, "El nombre debe tener al menos 3 caracteres"
        
        caracteres_invalidos = ['|', '\n', '\r']
        for char in caracteres_invalidos:
            if char in nombre:
                return False, f"El nombre no puede contener '{char}'"
        
        return True, "OK"
    
    def limpiar_qr_antiguos(self):
        """Eliminar códigos QR antiguos (opcional)"""
        try:
            archivos_eliminados = 0
            for archivo in os.listdir(self.qr_dir):
                if archivo.endswith('.png'):
                    ruta = os.path.join(self.qr_dir, archivo)
                    os.remove(ruta)
                    archivos_eliminados += 1
            
            return {
                'success': True,
                'archivos_eliminados': archivos_eliminados
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }