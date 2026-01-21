"""
Módulo de Consolidación de Reportes
Consolida archivos de asistencia de múltiples laptops
"""

import os
import csv
from datetime import datetime
from collections import defaultdict
from multiprocessing import Pool, cpu_count
import re


class Consolidador:
    """Clase para consolidar archivos de asistencia"""
    
    def __init__(self, carpeta_compartida, carpeta_consolidados):
        self.carpeta_compartida = carpeta_compartida
        self.carpeta_consolidados = carpeta_consolidados
        os.makedirs(carpeta_consolidados, exist_ok=True)
    
    def escanear_archivos(self):
        """
        Escanear carpeta compartida y agrupar archivos por fecha
        Retorna: {fecha: [archivo1, archivo2, ...]}
        """
        archivos_por_fecha = defaultdict(list)
        
        if not os.path.exists(self.carpeta_compartida):
            return archivos_por_fecha
        
        for archivo in os.listdir(self.carpeta_compartida):
            if archivo.startswith('asistencia_') and archivo.endswith('.txt'):
                # Extraer fecha del nombre: asistencia_LAPTOP_A_20260120.txt
                try:
                    partes = archivo.replace('.txt', '').split('_')
                    fecha_str = partes[-1]  # 20260120
                    fecha = datetime.strptime(fecha_str, "%Y%m%d")
                    archivos_por_fecha[fecha].append(archivo)
                except (ValueError, IndexError):
                    continue
        
        return archivos_por_fecha
    
    def leer_archivo(self, nombre_archivo):
        """Leer un archivo de asistencia y retornar registros"""
        ruta = os.path.join(self.carpeta_compartida, nombre_archivo)
        registros = []
        
        try:
            with open(ruta, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for fila in reader:
                    # Crear timestamp para ordenamiento
                    try:
                        fecha_hora = f"{fila['FECHA']} {fila['HORA']}"
                        timestamp = datetime.strptime(fecha_hora, "%Y-%m-%d %H:%M:%S")
                        
                        registro = {
                            'id': fila['ID'],
                            'nombre': fila['NOMBRE_COMPLETO'],
                            'nivel': fila['NIVEL'],
                            'grado': fila['GRADO'],
                            'seccion': fila['SECCION'],
                            'fecha': fila['FECHA'],
                            'hora': fila['HORA'],
                            'laptop': fila['LAPTOP'],
                            'timestamp': timestamp
                        }
                        registros.append(registro)
                    except (KeyError, ValueError):
                        continue
        except Exception as e:
            print(f"Error al leer {nombre_archivo}: {e}")
        
        return registros
    
    def eliminar_duplicados(self, registros):
        """
        Eliminar registros duplicados
        Criterio: mismo ID + misma fecha + hora similar (tolerancia 2 min)
        """
        if not registros:
            return []
        
        # Ordenar por timestamp
        registros_ordenados = sorted(registros, key=lambda x: x['timestamp'])
        
        unicos = []
        vistos = {}  # {id: ultimo_timestamp}
        
        for registro in registros_ordenados:
            id_alumno = registro['id']
            timestamp_actual = registro['timestamp']
            
            if id_alumno not in vistos:
                # Primera vez que vemos este alumno
                unicos.append(registro)
                vistos[id_alumno] = timestamp_actual
            else:
                # Verificar si es duplicado (menos de 2 minutos de diferencia)
                ultimo_timestamp = vistos[id_alumno]
                diferencia = (timestamp_actual - ultimo_timestamp).total_seconds()
                
                if diferencia > 120:  # Más de 2 minutos = registro válido
                    unicos.append(registro)
                    vistos[id_alumno] = timestamp_actual
                # Si es menos de 2 minutos, se ignora (duplicado)
        
        return unicos
    
    def consolidar_dia(self, fecha, archivos):
        """
        Consolidar todos los archivos de un día específico
        Retorna: número de registros consolidados
        """
        registros = []
        
        # Leer todos los archivos del día
        for archivo in archivos:
            registros.extend(self.leer_archivo(archivo))
        
        if not registros:
            return 0
        
        # Eliminar duplicados
        registros_unicos = self.eliminar_duplicados(registros)
        
        # Ordenar por timestamp
        registros_ordenados = sorted(registros_unicos, key=lambda x: x['timestamp'])
        
        # Guardar consolidado
        fecha_str = fecha.strftime("%Y%m%d")
        nombre_consolidado = f"consolidado_{fecha_str}.csv"
        ruta_consolidado = os.path.join(self.carpeta_consolidados, nombre_consolidado)
        
        with open(ruta_consolidado, 'w', encoding='utf-8', newline='') as f:
            fieldnames = ['ID', 'NOMBRE_COMPLETO', 'NIVEL', 'GRADO', 'SECCION', 
                         'FECHA', 'HORA', 'LAPTOP', 'TIMESTAMP']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for registro in registros_ordenados:
                writer.writerow({
                    'ID': registro['id'],
                    'NOMBRE_COMPLETO': registro['nombre'],
                    'NIVEL': registro['nivel'],
                    'GRADO': registro['grado'],
                    'SECCION': registro['seccion'],
                    'FECHA': registro['fecha'],
                    'HORA': registro['hora'],
                    'LAPTOP': registro['laptop'],
                    'TIMESTAMP': registro['timestamp'].strftime("%Y-%m-%d %H:%M:%S")
                })
        
        return len(registros_ordenados)
    
    def necesita_consolidar(self, fecha):
        """
        Verificar si un día necesita ser consolidado
        (no existe o los archivos fuente son más recientes)
        """
        fecha_str = fecha.strftime("%Y%m%d")
        nombre_consolidado = f"consolidado_{fecha_str}.csv"
        ruta_consolidado = os.path.join(self.carpeta_consolidados, nombre_consolidado)
        
        # Si no existe, necesita consolidar
        if not os.path.exists(ruta_consolidado):
            return True
        
        # Verificar si algún archivo fuente es más reciente
        timestamp_consolidado = os.path.getmtime(ruta_consolidado)
        
        archivos_dia = self.escanear_archivos().get(fecha, [])
        for archivo in archivos_dia:
            ruta_archivo = os.path.join(self.carpeta_compartida, archivo)
            if os.path.exists(ruta_archivo):
                timestamp_archivo = os.path.getmtime(ruta_archivo)
                if timestamp_archivo > timestamp_consolidado:
                    return True
        
        return False
    
    def consolidar_todo(self, forzar=False):
        """
        Consolidar todos los días disponibles
        Si forzar=False, solo consolida días que lo necesiten
        Usa procesamiento paralelo
        """
        archivos_por_fecha = self.escanear_archivos()
        
        if not archivos_por_fecha:
            return {
                'success': True,
                'mensaje': 'No hay archivos para consolidar',
                'dias_procesados': 0,
                'total_registros': 0
            }
        
        # Filtrar días que necesitan consolidación
        if not forzar:
            dias_a_procesar = {
                fecha: archivos 
                for fecha, archivos in archivos_por_fecha.items()
                if self.necesita_consolidar(fecha)
            }
        else:
            dias_a_procesar = archivos_por_fecha
        
        if not dias_a_procesar:
            return {
                'success': True,
                'mensaje': 'Todos los consolidados están actualizados',
                'dias_procesados': 0,
                'total_registros': 0
            }
        
        # Procesar en paralelo
        try:
            # Preparar argumentos para multiprocessing
            args = list(dias_a_procesar.items())
            
            # Usar todos los núcleos disponibles
            num_procesos = min(cpu_count(), len(args))
            
            with Pool(num_procesos) as pool:
                resultados = pool.starmap(self.consolidar_dia, args)
            
            total_registros = sum(resultados)
            
            return {
                'success': True,
                'mensaje': f'Consolidación completada',
                'dias_procesados': len(dias_a_procesar),
                'total_registros': total_registros,
                'nucleos_usados': num_procesos
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def cargar_consolidados(self, fecha_inicio, fecha_fin):
        """
        Cargar consolidados en un rango de fechas
        Retorna lista de registros
        """
        registros = []
        
        fecha_actual = fecha_inicio
        while fecha_actual <= fecha_fin:
            fecha_str = fecha_actual.strftime("%Y%m%d")
            nombre_consolidado = f"consolidado_{fecha_str}.csv"
            ruta_consolidado = os.path.join(self.carpeta_consolidados, nombre_consolidado)
            
            if os.path.exists(ruta_consolidado):
                try:
                    with open(ruta_consolidado, 'r', encoding='utf-8') as f:
                        reader = csv.DictReader(f)
                        for fila in reader:
                            registros.append(fila)
                except Exception as e:
                    print(f"Error al leer {nombre_consolidado}: {e}")
            
            # Siguiente día
            from datetime import timedelta
            fecha_actual += timedelta(days=1)
        
        return registros
    
    def listar_consolidados(self):
        """Listar todos los consolidados disponibles"""
        consolidados = []
        
        if not os.path.exists(self.carpeta_consolidados):
            return consolidados
        
        for archivo in os.listdir(self.carpeta_consolidados):
            if archivo.startswith('consolidado_') and archivo.endswith('.csv'):
                try:
                    # Extraer fecha: consolidado_20260120.csv
                    fecha_str = archivo.replace('consolidado_', '').replace('.csv', '')
                    fecha = datetime.strptime(fecha_str, "%Y%m%d")
                    
                    ruta = os.path.join(self.carpeta_consolidados, archivo)
                    
                    # Contar registros
                    num_registros = 0
                    with open(ruta, 'r', encoding='utf-8') as f:
                        num_registros = max(0, len(f.readlines()) - 1)
                    
                    consolidados.append({
                        'nombre': archivo,
                        'fecha': fecha.strftime("%d/%m/%Y"),
                        'fecha_sort': fecha,
                        'registros': num_registros
                    })
                except:
                    continue
        
        # Ordenar por fecha (más reciente primero)
        consolidados.sort(key=lambda x: x['fecha_sort'], reverse=True)
        
        return consolidados
