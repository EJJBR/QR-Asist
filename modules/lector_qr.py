"""
Módulo de Lectura de QR
Lógica para registrar asistencias y gestionar archivos
"""

import os
import csv
from datetime import datetime, timedelta
import shutil

class LectorQR:
    """Clase para gestionar la lectura de QR y registro de asistencias"""
    
    def __init__(self, laptop_id="LAPTOP_A"):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.registro_dir = os.path.join(self.base_dir, 'registro')
        self.laptop_id = laptop_id
        os.makedirs(self.registro_dir, exist_ok=True)
        
        # Cache de últimos escaneos (para prevenir duplicados)
        self.ultimos_escaneos = {}  # {id_alumno: timestamp}
        
    def obtener_archivo_hoy(self):
        """Obtener el nombre del archivo de registro de hoy"""
        fecha_hoy = datetime.now().strftime("%Y%m%d")
        nombre_archivo = f"asistencia_{self.laptop_id}_{fecha_hoy}.txt"
        return os.path.join(self.registro_dir, nombre_archivo)
    
    def parsear_qr(self, datos_qr):
        """Parsear datos del código QR"""
        try:
            # Formato: ID|Nombre|Nivel|Grado|Seccion
            partes = datos_qr.split('|')
            if len(partes) != 5:
                return None
            
            return {
                'id': partes[0].strip(),
                'nombre': partes[1].strip(),
                'nivel': partes[2].strip(),
                'grado': partes[3].strip(),
                'seccion': partes[4].strip()
            }
        except Exception as e:
            print(f"Error al parsear QR: {e}")
            return None
    
    def verificar_duplicado(self, id_alumno, tolerancia_minutos=2):
        """Verificar si el alumno ya fue registrado recientemente"""
        if id_alumno not in self.ultimos_escaneos:
            return False, None
        
        ultimo_escaneo = self.ultimos_escaneos[id_alumno]
        ahora = datetime.now()
        diferencia = ahora - ultimo_escaneo
        
        if diferencia < timedelta(minutes=tolerancia_minutos):
            segundos = int(diferencia.total_seconds())
            return True, segundos
        
        return False, None
    
    def registrar_asistencia(self, datos_qr):
        """Registrar asistencia de un alumno"""
        try:
            # Parsear datos del QR
            alumno = self.parsear_qr(datos_qr)
            if not alumno:
                return {
                    'success': False,
                    'error': 'Código QR inválido'
                }
            
            # Verificar duplicados
            es_duplicado, segundos_desde = self.verificar_duplicado(alumno['id'])
            if es_duplicado:
                minutos = segundos_desde // 60
                segundos = segundos_desde % 60
                return {
                    'success': False,
                    'duplicado': True,
                    'alumno': alumno,
                    'mensaje': f"Ya registrado hace {minutos} min {segundos} seg"
                }
            
            # Obtener archivo de hoy
            archivo = self.obtener_archivo_hoy()
            
            # Crear archivo con cabecera si no existe
            archivo_nuevo = not os.path.exists(archivo)
            
            # Registrar asistencia
            ahora = datetime.now()
            fecha = ahora.strftime("%Y-%m-%d")
            hora = ahora.strftime("%H:%M:%S")
            
            with open(archivo, 'a', encoding='utf-8') as f:
                # Escribir cabecera si es archivo nuevo
                if archivo_nuevo:
                    f.write("ID,NOMBRE_COMPLETO,NIVEL,GRADO,SECCION,FECHA,HORA,LAPTOP\n")
                
                # Escribir registro
                f.write(f"{alumno['id']},{alumno['nombre']},{alumno['nivel']},{alumno['grado']},{alumno['seccion']},{fecha},{hora},{self.laptop_id}\n")
            
            # Actualizar cache de últimos escaneos
            self.ultimos_escaneos[alumno['id']] = ahora
            
            return {
                'success': True,
                'alumno': alumno,
                'fecha': fecha,
                'hora': hora,
                'laptop': self.laptop_id
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def contar_registros_hoy(self):
        """Contar cuántos registros hay en el archivo de hoy"""
        archivo = self.obtener_archivo_hoy()
        
        if not os.path.exists(archivo):
            return 0
        
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                # Contar líneas menos la cabecera
                lineas = f.readlines()
                return max(0, len(lineas) - 1)
        except:
            return 0
    
    def obtener_ultimos_registros(self, cantidad=5):
        """Obtener los últimos N registros"""
        archivo = self.obtener_archivo_hoy()
        
        if not os.path.exists(archivo):
            return []
        
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                registros = list(reader)
                # Retornar los últimos N registros en orden inverso
                return registros[-cantidad:][::-1]
        except:
            return []
    
    def listar_archivos_registro(self):
        """Listar todos los archivos de registro disponibles"""
        archivos = []
        
        if not os.path.exists(self.registro_dir):
            return archivos
        
        for archivo in os.listdir(self.registro_dir):
            if archivo.startswith('asistencia_') and archivo.endswith('.txt'):
                ruta_completa = os.path.join(self.registro_dir, archivo)
                ruta_enviado = ruta_completa + '.enviado'
                
                # Extraer fecha del nombre del archivo
                # Formato: asistencia_LAPTOP_A_20260113.txt
                try:
                    partes = archivo.replace('.txt', '').split('_')
                    fecha_str = partes[-1]  # 20260113
                    fecha = datetime.strptime(fecha_str, "%Y%m%d")
                    fecha_formateada = fecha.strftime("%d/%m/%Y")
                    
                    # Contar registros
                    num_registros = 0
                    try:
                        with open(ruta_completa, 'r', encoding='utf-8') as f:
                            num_registros = max(0, len(f.readlines()) - 1)
                    except:
                        pass
                    
                    # Determinar estado
                    hoy = datetime.now().strftime("%Y%m%d")
                    if fecha_str == hoy:
                        estado = "actual"
                    elif os.path.exists(ruta_enviado):
                        estado = "enviado"
                        # Leer fecha de envío
                        try:
                            with open(ruta_enviado, 'r') as f:
                                fecha_envio = f.read().strip()
                        except:
                            fecha_envio = "Desconocida"
                    else:
                        estado = "pendiente"
                        fecha_envio = None
                    
                    archivos.append({
                        'nombre': archivo,
                        'ruta': ruta_completa,
                        'fecha': fecha_formateada,
                        'fecha_sort': fecha,
                        'registros': num_registros,
                        'estado': estado,
                        'fecha_envio': fecha_envio if estado == "enviado" else None
                    })
                except:
                    continue
        
        # Ordenar por fecha (más reciente primero)
        archivos.sort(key=lambda x: x['fecha_sort'], reverse=True)
        
        return archivos
    
    def enviar_archivo(self, nombre_archivo, carpeta_destino):
        """Enviar un archivo a la carpeta compartida"""
        try:
            ruta_origen = os.path.join(self.registro_dir, nombre_archivo)
            
            if not os.path.exists(ruta_origen):
                return {
                    'success': False,
                    'error': 'Archivo no encontrado'
                }
            
            # Verificar si carpeta destino existe
            if not os.path.exists(carpeta_destino):
                return {
                    'success': False,
                    'error': 'Carpeta de red no disponible'
                }
            
            # Copiar archivo
            ruta_destino = os.path.join(carpeta_destino, nombre_archivo)
            shutil.copy2(ruta_origen, ruta_destino)
            
            # Marcar como enviado
            archivo_marca = ruta_origen + '.enviado'
            with open(archivo_marca, 'w') as f:
                f.write(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            
            return {
                'success': True,
                'archivo': nombre_archivo
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def enviar_multiples(self, nombres_archivos, carpeta_destino):
        """Enviar múltiples archivos"""
        resultados = {
            'exitosos': [],
            'fallidos': []
        }
        
        for nombre in nombres_archivos:
            resultado = self.enviar_archivo(nombre, carpeta_destino)
            
            if resultado['success']:
                resultados['exitosos'].append(nombre)
            else:
                resultados['fallidos'].append({
                    'nombre': nombre,
                    'error': resultado.get('error', 'Error desconocido')
                })
        
        return {
            'success': len(resultados['fallidos']) == 0,
            'total': len(nombres_archivos),
            'exitosos': len(resultados['exitosos']),
            'fallidos': len(resultados['fallidos']),
            'detalles': resultados
        }