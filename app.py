from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_mysqldb import MySQL
from fecha_hora import obtener_hora, obtener_fecha

app = Flask(__name__)
# Configuración de la base de datos
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'db_huellado_v2'

mysql = MySQL(app)

#Pagina principal
@app.route('/')
def home():
    return render_template('registrar.html')

#Entradas
@app.route('/monitorear_entradas')
def monitorear_entradas():
    return render_template('entradas.html')

#Salidas
@app.route('/monitorear_salidas')
def monitorear_salidas():
    return render_template('salidas.html')

#verificar si faltan por vincularse
@app.route('/check_vinculado')
def check_vinculado():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM usuarios WHERE vinculado = 0")
        count = cursor.fetchone()[0]
        cursor.close()
        return jsonify({'blocked': count > 0})
    except Exception as e:
        # Registra el error para depuración y devuelve una respuesta de error
        app.logger.error(f"Error en check_vinculado: {str(e)}")
        return jsonify({'error': str(e)}), 500

#trae los registros de los usuarios de la base de datos
@app.route('/registros_usuarios')
def registros_usuarios():
    cursor = mysql.connection.cursor()
    consulta = "SELECT * FROM usuarios"
    cursor.execute(consulta)
    filas = cursor.fetchall()
    cursor.close()
    usuarios = []
    for fila in filas:
        usuario = {
            'id_usuario':  fila[0],
            'nombre': fila[1],
            'apellidos': fila[2],
            'email': fila[3],
            'vinculado': bool(fila[4][0])
        }
        usuarios.append(usuario)
    return jsonify(usuarios), 200

@app.route('/consultar_entradas', methods=['GET'])
def consultar_entradas():
    cursor = mysql.connection.cursor()
    fecha_actual = obtener_fecha()
    consulta = """
    SELECT u.id_usuario, u.nombre, u.apellidos, u.email, u.vinculado, e.fecha, e.hora
    FROM usuarios u
    INNER JOIN entradas e ON u.id_usuario = e.id_usuario
    WHERE e.fecha = %s
    """
    cursor.execute(consulta, (fecha_actual,))
    filas = cursor.fetchall()
    cursor.close()
    usuarios = []
    for fila in filas:
        usuario = {
            'id_usuario': fila[0],
            'nombre': fila[1],
            'apellidos': fila[2],
            'email': fila[3],
            'vinculado': bool(fila[4][0]),
            'fecha': fila[5].isoformat(),  # Convierte datetime.date a cadena
            'hora': str(fila[6])  # Convierte datetime.timedelta a cadena
        }
        usuarios.append(usuario)
    return jsonify(usuarios), 200

@app.route('/consultar_salidas', methods=['GET'])
def consultar_salidas():
    cursor = mysql.connection.cursor()
    fecha_actual = obtener_fecha()
    consulta = """
    SELECT u.id_usuario, u.nombre, u.apellidos, u.email, u.vinculado, s.fecha, s.hora
    FROM usuarios u
    INNER JOIN salidas s ON u.id_usuario = s.id_usuario
    WHERE s.fecha = %s
    """
    cursor.execute(consulta, (fecha_actual,))
    filas = cursor.fetchall()
    cursor.close()
    usuarios = []
    for fila in filas:
        usuario = {
            'id_usuario': fila[0],
            'nombre': fila[1],
            'apellidos': fila[2],
            'email': fila[3],
            'vinculado': bool(fila[4][0]),
            'fecha': fila[5].isoformat(),  # Convierte datetime.date a cadena
            'hora': str(fila[6])  # Convierte datetime.timedelta a cadena
        }
        usuarios.append(usuario)
    return jsonify(usuarios), 200

#registra un nuevo usuario en la base de datos
@app.route('/registrar_usuario', methods = ['POST'])
def registrar_usuario():
    nombre = request.form['nombre']
    apellidos = request.form['apellidos']
    email = request.form['email']
    cursor = mysql.connection.cursor()
    consulta = "INSERT INTO Usuarios (nombre, apellidos, email, vinculado) VALUES (%s, %s, %s, false)"
    valores = (nombre, apellidos, email)
    cursor.execute(consulta, valores)
    mysql.connection.commit()
    cursor.close()
    return jsonify({'nombre': nombre, 'apellidos': apellidos, 'email': email}), 200

#actualiza un usuario en la base de datos
@app.route('/actualizar_usuario', methods=['POST'])
def actualizar_usuario():
    try:
        id_usuario = request.form['id_usuario']
        nombre = request.form['nombre']
        apellidos = request.form['apellidos']
        email = request.form['email']
        cursor = mysql.connection.cursor()
        consulta = "UPDATE usuarios SET nombre = %s, apellidos = %s, email = %s WHERE id_usuario = %s"
        valores = nombre, apellidos, email, id_usuario
        cursor.execute(consulta, valores)
        mysql.connection.commit()
        return jsonify({'mensaje': 'Usuario actualizado exitosamente'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()

#trae los datos del ultimo usuario registrado
@app.route('/ultimo_registro', methods=['GET'])
def ultimo_registro():
    try:
        cursor = mysql.connection.cursor()
        consulta = "SELECT * FROM usuarios ORDER BY id_usuario DESC LIMIT 1"
        cursor.execute(consulta)
        fila = cursor.fetchone()
        if fila:
            usuario = {
                'id_usuario': fila[0],
                'nombre': fila[1],
                'apellidos': fila[2],
                'email': fila[3],
                'vinculado': bool(fila[4][0])
            }
            return jsonify(usuario), 200
        else:
            return jsonify({'mensaje': 'No se encontraron registros'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
    
#Realiza la actualización del vínculo en la bd
@app.route('/actualizar_vinculado', methods = ['POST'])
def actualizar_vinculado():
    id_usuario = request.form['id_usuario']
    cursor = mysql.connection.cursor()
    consulta_actualizar = "UPDATE usuarios SET vinculado = 1 WHERE id_usuario = %s"
    cursor.execute(consulta_actualizar, (id_usuario,))
    mysql.connection.commit()
    mensaje = "Registro actualizado exitosamente."
    cursor.close()
    return jsonify({'mensaje': mensaje}), 200

# Almacena el último comando enviado
ultimo_comando = ""

#Almacena el comando más actual
comando_final = ""

#comando para el ciclo buscar
ultimo_buscar = ""

#Almacena la respuesta del sensor al enrolar una huella
respuesta_huella = "espera"

#Almacena los id encontrados por el sensor
id_encontrado = ""

#Para establecer el comando (para el ciclo de buscar)
@app.route('/set_comando_buscar', methods = ['POST'])
def set_comando_buscar():
    global comando_buscar
    comando_buscar = request.form['comando']
    return jsonify({'estado': comando_buscar}), 200

#Para que la esp32 lea el comando para detener la busqueda de huellas
@app.route('/get_comando_buscar', methods = ['GET'])
def get_comando_buscar():
    return jsonify({'comando': comando_buscar}), 200

#Para establecer las respuestas desde la esp32
@app.route('/set_respuesta_sensor', methods = ['POST'])
def set_respuesta_sensor():
    global respuesta_huella
    data = request.json
    respuesta_huella = data.get('respuesta')
    return jsonify({'estado': respuesta_huella}), 200

#Para que se vaya monitoreando la respuesta del sensor al enrolar huella
@app.route('/get_respuesta_sensor', methods = ['GET'])
def get_respuesta_sensor():
    return jsonify({'respuesta': respuesta_huella}), 200

#Para establecer los ids desde la esp32 y al mismo tiempo irlos guardando en la base de datos entrada
@app.route('/set_id_encontrado_ent', methods = ['POST'])
def set_id_encontrado_ent():
    global id_encontrado
    data = request.json
    id_encontrado = data.get('id_huella')
    cursor = mysql.connection.cursor()
    consulta = "INSERT INTO entradas (id_usuario, fecha, hora) VALUES (%s, %s, %s)"
    valores = (id_encontrado, obtener_fecha(), obtener_hora())
    cursor.execute(consulta, valores)
    mysql.connection.commit()
    cursor.close()
    return jsonify({'estado': id_encontrado}), 200

#Para establecer los ids desde la esp32 y al mismo tiempo irlos guardando en la base de datos salida
@app.route('/set_id_encontrado_sal', methods = ['POST'])
def set_id_encontrado_sal():
    global id_encontrado
    data = request.json
    id_encontrado = data.get('id_huella')
    cursor = mysql.connection.cursor()
    consulta = "INSERT INTO salidas (id_usuario, fecha, hora) VALUES (%s, %s, %s)"
    valores = (id_encontrado, obtener_fecha(), obtener_hora())
    cursor.execute(consulta, valores)
    mysql.connection.commit()
    cursor.close()
    return jsonify({'estado': id_encontrado}), 200

#Para que se monitoreen los ids que vaya encontrando el sensor por si se usa
@app.route('/get_id_encontrado', methods = ['GET'])
def get_id_encontrado():
    return jsonify({'id_huella': id_encontrado}), 200

#establece los comandos (para entrar en modo de enrolar huella o modo buscar huella)
@app.route('/set_comando_huella', methods=['POST'])
def set_comando_huella():
    global ultimo_comando
    ultimo_comando = request.form['comando']
    return jsonify({'estado': ultimo_comando}), 200

#establece los comandos (para entrar en modo de enrolar huella o modo buscar huella) para que la esp32 lo lea
@app.route('/get_comando_huella', methods=['GET'])
def get_comando_huella():
    global comando_final
    if ultimo_comando != comando_final:
        comando_final = ultimo_comando
        return jsonify({'comando': comando_final}), 200
    else:
        return jsonify({'comando': "X"}), 400
    
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port= 5000, threaded = True)