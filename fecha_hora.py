from datetime import datetime

def obtener_fecha():
    hoy = datetime.now()
    fecha = hoy.date()
    return fecha

def obtener_hora():
    hoy = datetime.now()
    hora = hoy.strftime("%H:%M:%S")
    return hora