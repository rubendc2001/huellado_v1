//Para configurar el toast de bootstrap
const toastLiveExample = document.getElementById('liveToast');
const toastHora = document.getElementById('hora_toast');
const toastCuerpo = document.getElementById('cuerpo_toast');

//Funcion para obtener los registros al cargar inicialmente
document.addEventListener('DOMContentLoaded', function () {
    obtenerRegistros(); // Llama a la función para obtener los registros al cargar la página
});

//Funcion para la hora actual
function getFormattedTime() {
    const now = new Date();

    // Obtener horas, minutos y segundos
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    // Formatear con dos dígitos
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    // Retornar la hora formateada
    return `${hours}:${minutes}:${seconds}`;
}

//Funcion para mostrar toast personalizados
function lanzarToast(mensaje) {
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample);
    toastCuerpo.innerHTML = mensaje;
    toastHora.innerHTML = `Hora: ${getFormattedTime()}`
    toastBootstrap.show();
}

//Funcion para unir el comando + ID de usuario
function sendComandoHuellaId() {
    obtenerUltimoRegistro().then(idUsuario => {
        if (idUsuario !== null) {
            id_del_usuario = idUsuario[0];
            vinculado = idUsuario[1];
            console.log('ID del último usuario registrado:', id_del_usuario);
            console.log('Estado de vinculo con huella:', vinculado);
            if (!vinculado) {
                comando = `A:${id_del_usuario}`;
                sendComandoHuella(comando);
                consultarResSensor(id_del_usuario);
            } else {
                mensaje = "El usuario ya tiene huella dactilar vinculada";
                lanzarToast(mensaje);
            }
        } else {
            console.log('No se pudo obtener el ID del último usuario registrado');
        }
    });
}

//Funcion especialmente para buscar huellas
function sendBuscarHuellas(comando1, comando2) {
    resetComandoBuscar(comando1);
    sendComandoHuella(comando2);
}

//Funcion para enviar los comandos al endpoint
function sendComandoHuella(comando) {
    fetch('/set_comando_huella', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `comando=${comando}`
    })
        .then(response => response.json())
        .then(data => {
            mensaje = `Comando ha cambiado a: ${data['estado']}`;
            lanzarToast(mensaje);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

//Funcion para resetear el comando de los modos (enrolar - buscar)
function resetComandoHuella(comando) {
    fetch('/set_comando_huella', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `comando=${comando}`
    })
        .then(response => response.json())
        .then(data => {
            mensaje = `Comando ha cambiado a: ${data['estado']}`;
            lanzarToast(mensaje);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

//Funcion para resetear  la respuesta del sensor
function resetResSensor(respuesta) {
    fetch('/set_respuesta_sensor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ respuesta: respuesta })
    })
        .then(response => response.json())
        .then(data => {
            mensaje = `la respuesta se ha reseteado a: ${data['estado']}`;
            lanzarToast(mensaje);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

//Función para detener el buscador y resetear el comando principal
function resetComandos(comando1, comando2) {
    resetComandoBuscar(comando1);
    resetComandoHuella(comando2);
}

//Funcion para resetear el comando del ciclo de buscar
function resetComandoBuscar(comando) {
    fetch('/set_comando_buscar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `comando=${comando}`
    })
        .then(response => response.json())
        .then(data => {
            mensaje = `Comando ha cambiado a: ${data['estado']}`;
            lanzarToast(mensaje);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

//Funcion para obtener los datos de los usuarios en json
function obtenerRegistros() {
    fetch('/registros_usuarios')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            pintarTabla(data);
            checkVinculadoStatus();
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

//Funcion para pintar la tabla con los datos de los usuarios y los botones para las acciones
function pintarTabla(data) {
    const tableBody = document.getElementById('usuariosTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    data.forEach(usuario => {
        let row = tableBody.insertRow();
        let cellIdUsuario = row.insertCell(0);
        cellIdUsuario.textContent = usuario.id_usuario;
        let cellNombre = row.insertCell(1);
        cellNombre.textContent = usuario.nombre;
        let cellApellidos = row.insertCell(2);
        cellApellidos.textContent = usuario.apellidos;
        let cellCorreo = row.insertCell(3);
        cellCorreo.textContent = usuario.email;
        let cellVinculado = row.insertCell(4);
        let btnVinculado = document.createElement('button');
        const iconVinculado = document.createElement('i');
        btnVinculado.appendChild(iconVinculado);
        if (usuario.vinculado) {
            iconVinculado.className = 'fas fa-check';
            btnVinculado.className = 'btn btn-success';
        } else {
            iconVinculado.className = 'fas fa-times';
            btnVinculado.className = 'btn btn-danger';
        }
        cellVinculado.appendChild(btnVinculado)
        let cellAcciones = row.insertCell(5);
        let btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-warning';
        const icon = document.createElement('i');
        icon.className = 'fas fa-edit';
        btnEditar.appendChild(icon);
        btnEditar.onclick = function () {
            var myModal = new bootstrap.Modal(document.getElementById('modalFormularioActualizar'), {
                keyboard: true,
            });
            myModal.show();
            editarUsuario(usuario);
        };
        cellAcciones.appendChild(btnEditar);

    })
}

//Función para editar la informacion del usuario
function editarUsuario(usuario) {
    document.getElementById('editarIdUsuario').value = usuario.id_usuario;
    document.getElementById('editarNombre').value = usuario.nombre;
    document.getElementById('editarApellidos').value = usuario.apellidos;
    document.getElementById('editarEmail').value = usuario.email;
}

//Función para actualizar un usuario, una vez editada
function actualizarUsuario() {
    const id_usuario = document.getElementById('editarIdUsuario').value;
    const nombre = document.getElementById('editarNombre').value;
    const apellidos = document.getElementById('editarApellidos').value;
    const email = document.getElementById('editarEmail').value;

    fetch('/actualizar_usuario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'id_usuario': id_usuario,
            'nombre': nombre,
            'apellidos': apellidos,
            'email': email
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                mensaje = `Mensaje: ${data['mensaje']}`;
                lanzarToast(mensaje);
                obtenerRegistros();
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

//Función para obtener el ultimo registro (id y estado del vinculo)
function obtenerUltimoRegistro() {
    return fetch('/ultimo_registro')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error:', data.error);
                return null;
            } else if (data.mensaje) {
                console.log(data.mensaje);
                return null;
            } else {
                mensaje = `El usuario: ${data['nombre']} ${data['apellidos']} fue el ultimo registrado`;
                lanzarToast(mensaje);
                return [data['id_usuario'], data['vinculado']];
            }
        })
        .catch(error => {
            console.error('Error:', error);
            return null;
        });
}

//Funcion para registrar usuarios
document.getElementById('registroForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var formData = new FormData(this);
    fetch('/registrar_usuario', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            mensaje = `El usuario: ${data['nombre']} ${data['apellidos']} ha sido registrado con éxito`;
            lanzarToast(mensaje);
            obtenerRegistros();
            checkVinculadoStatus();
            document.getElementById('registroForm').reset();
        })
        .catch(error => console.error('Error:', error));
});

//Función para consultar las respuestas del sensor
function consultarResSensor(id_usuario) {
    fetch('/get_respuesta_sensor')
        .then(response => response.json())
        .then(data => {
            const estadoModal = new bootstrap.Modal(document.getElementById('estadoModal'));
            const estadoTexto = document.getElementById('estadoTexto');
            if (data.respuesta === "espera") {
                estadoTexto.textContent = "Estado: esperando el sensor de huellas para vincular con el id: " + id_usuario;
                if (!document.querySelector('.modal.show')) {
                    estadoModal.show();
                }
                setTimeout(() => consultarResSensor(id_usuario), 1000);
            } else if (data.respuesta === "no") {
                estadoTexto.textContent = "Estado: error al vincular la huella dactilar, intente de nuevo";
                if (!document.querySelector('.modal.show')) {
                    estadoModal.show();
                }
                setTimeout(() => consultarResSensor(id_usuario), 1000);
            } else if (data.respuesta === "si") {
                estadoTexto.textContent = "Estado: se ha vinculado la huella dactilar con el id: " + id_usuario;
                actualizarVinculado(id_usuario);
                setTimeout(() => {
                    estadoModal.hide();
                }, 1000);
            } else {
                estadoModal.hide();
            }
        })
        .catch(error => {
            console.error('Error al consultar el estado:', error);
        });
}


//Función para actualizar el campo vinculado
function actualizarVinculado(id_usuario) {
    fetch('/actualizar_vinculado', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'id_usuario': id_usuario
        })
    })
        .then(response => response.json())
        .then(data => {
            lanzarToast(data.mensaje);
            resetResSensor("espera")
            obtenerRegistros();
            checkVinculadoStatus();
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function checkVinculadoStatus() {
    fetch('/check_vinculado')
        .then(response => response.json())
        .then(data => {
            const form = document.getElementById('registroForm');
            const statusText = document.getElementById('status');
            const vincularButton = document.getElementById('vincularHuellaButton');

            if (data.blocked) {
                form.querySelectorAll('input').forEach(element => {
                    if (element.id !== 'vincularHuellaButton') {
                        element.disabled = true;
                    }
                });
                form.querySelectorAll('button').forEach(element => {
                    if (element.id !== 'vincularHuellaButton') {
                        element.disabled = true;
                    }
                });
                mensaje = 'Formulario bloqueado: debes vincular la huella del último registro';
                lanzarToast(mensaje);
            } else {
                form.querySelectorAll('input, button').forEach(element => {
                    element.disabled = false;
                });
                mensaje = 'Formulario desbloqueado';
                lanzarToast(mensaje);
            }
        })
        .catch(error => {
            console.error('Error al verificar el estado:', error);
        });
}

checkVinculadoStatus();