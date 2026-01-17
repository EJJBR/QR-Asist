#!/usr/bin/env python3
"""
QR-Asist - Sistema de Control de Asistencia Escolar
Punto de entrada principal del programa
"""

import webbrowser
import threading
import time
import sys
import os

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app

def abrir_navegador():
    """Espera y abre el navegador automáticamente"""
    time.sleep(1.5)
    webbrowser.open('http://127.0.0.1:5000')

def main():
    """Función principal"""
    print("=" * 50)
    print("🎓 QR-Asist - Sistema de Asistencia Escolar")
    print("=" * 50)
    print()
    print("🚀 Iniciando servidor local...")
    print("📱 El navegador se abrirá automáticamente")
    print("🌐 URL: http://127.0.0.1:5000")
    print()
    print("⚠️  Para cerrar el programa: presiona Ctrl+C")
    print("=" * 50)
    print()
    
    # Abrir navegador en un hilo separado
    threading.Thread(target=abrir_navegador, daemon=True).start()
    
    # Iniciar servidor Flask
    try:
        app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
    except KeyboardInterrupt:
        print("\n\n👋 Cerrando QR-Asist...")
        print("✅ Programa cerrado correctamente")

if __name__ == '__main__':
    main()