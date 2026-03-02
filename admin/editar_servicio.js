let servicioID = null;

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    servicioID = params.get("id");

    cargarDatos();
});

function cargarDatos() {
    fetch(`http://localhost:3000/servicios/${servicioID}`)
        .then(res => res.json())
        .then(s => {
            document.getElementById("nombre").value = s.nombre;
            document.getElementById("descripcion").value = s.descripcion;
            document.getElementById("unidad").value = s.unidad;
            document.getElementById("precio_base").value = s.precio_base ?? "";
        });
}

function guardarCambios() {
    const datos = {
        nombre: document.getElementById("nombre").value,
        descripcion: document.getElementById("descripcion").value,
        unidad: document.getElementById("unidad").value,
        precio_base: document.getElementById("precio_base").value || null
    };

    fetch(`http://localhost:3000/servicios/editar/${servicioID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    })
    .then(res => res.json())
    .then(() => {
        alert("Servicio actualizado correctamente.");
        window.location.href = "servicios.html";
    });
}

function volver() {
    window.location.href = "servicios.html";
}
