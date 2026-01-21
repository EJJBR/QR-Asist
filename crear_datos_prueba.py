"""Script para crear datos de prueba del consolidador"""
import os
import csv
from datetime import datetime, timedelta

carpeta = "C:/AsistenciasRecibidas"
os.makedirs(carpeta, exist_ok=True)

fecha_base = datetime.now()
archivos_creados = []

for i in range(3):
    fecha = fecha_base - timedelta(days=i)
    fecha_str = fecha.strftime('%Y%m%d')
    archivo = f'asistencia_LAPTOP_A_{fecha_str}.txt'
    ruta = os.path.join(carpeta, archivo)
    
    with open(ruta, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['ID', 'NOMBRE_COMPLETO', 'NIVEL', 'GRADO', 'SECCION', 'FECHA', 'HORA', 'LAPTOP'])
        
        for j in range(10):
            hora_num = 7 + (j // 5)
            min_num = (j % 5) * 10 + 15
            hora = f'{hora_num:02d}:{min_num:02d}:00'
            
            writer.writerow([
                f'A{j+1:03d}',
                f'Alumno Prueba {j+1}',
                'Primaria',
                '5',
                'A',
                fecha.strftime('%Y-%m-%d'),
                hora,
                'LAPTOP_A'
            ])
    
    archivos_creados.append(archivo)

print("Archivos de prueba creados en", carpeta)
for archivo in archivos_creados:
    print(" -", archivo)
