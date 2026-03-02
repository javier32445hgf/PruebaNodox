let servicioID = null;

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    servicioID = params.get("id");

    cargarRangos();
});

// ========================
// Cargar rangos del servicio
// ========================
function cargarRangos() {
    fetch(`http://localhost:3000/servicios/rangos/${servicioID}`)
        .then(res => res.json())
        .then(rangos => {
            const tbody = document.getElementById("tablaRangos");
            tbody.innerHTML = "";

            rangos.forEach(r => {
                tbody.innerHTML += `
                    <tr>
                        <td>${r.cantidad_min}</td>
                        <td>${r.cantidad_max}</td>
                        <td>$${parseFloat(r.precio).toFixed(2)}</td>
                        <td>
                            <button class="btn-edit" onclick="editarRango(${r.id})">Editar</button>
                            <button class="btn-delete" onclick="eliminarRango(${r.id})">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        });
}

// ========================
// Abrir pantalla nuevo rango
// ========================
function abrirNuevoRango() {
    const min = prompt("Cantidad mínima:");
    const max = prompt("Cantidad máxima:");
    const precio = prompt("Precio ($):");

    if (!min || !max || !precio) return;

    fetch("http://localhost:3000/servicios/rangos/agregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            servicio_id: servicioID,
            cantidad_min: min,
            cantidad_max: max,
            precio: precio
        })
    })
    .then(res => res.json())
    .then(() => cargarRangos());
}

function editarRango(id) {
    const min = prompt("Nuevo mínimo:");
    const max = prompt("Nuevo máximo:");
    const precio = prompt("Nuevo precio:");

    fetch(`http://localhost:3000/servicios/rangos/editar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad_min: min, cantidad_max: max, precio })
    })
    .then(res => res.json())
    .then(() => cargarRangos());
}

function eliminarRango(id) {
    if (!confirm("¿Eliminar rango?")) return;

    fetch(`http://localhost:3000/servicios/rangos/eliminar/${id}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(() => cargarRangos());
}
