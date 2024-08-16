let intervalId;

document.getElementById('startButton').addEventListener('click', () => {
    if (!intervalId) {
        intervalId = setInterval(consultarEntradas, 3000); // Consultar cada 5 segundos
    }
});

document.getElementById('stopButton').addEventListener('click', () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
});

//Funcion para obtener los datos de los usuarios en json
function consultarEntradas() {
    fetch('/consultar_salidas')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            pintarTablaSalidas(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

//Funcion para pintar la tabla con los datos de los usuarios y los botones para las acciones
function pintarTablaSalidas(data) {
    const tableBody = document.getElementById('usuariosSalidaTable').getElementsByTagName('tbody')[0];
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
        let cellFecha = row.insertCell(4);
        cellFecha.textContent = usuario.fecha;
        let cellHora = row.insertCell(5);
        cellHora.textContent = usuario.hora;
    })
}