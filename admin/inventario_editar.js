const params = new URLSearchParams(window.location.search);
const id = params.get("id");


document.addEventListener("DOMContentLoaded", cargarDatos);

async function cargarDatos() {
    const res = await fetch("http://localhost:3000/inventario/listar");
    const lista = await res.json();

    const item = lista.find(x => x.id == id);

    if (!item) {
        alert("Material no encontrado");
        window.location.href = "inventario.html";
        return;
    }

    document.getElementById("nombre").value = item.nombre;
    document.getElementById("descripcion").value = item.descripcion;
    document.getElementById("unidad").value = item.unidad;
    document.getElementById("precio").value = item.precio;
    document.getElementById("cantidad").value = item.cantidad ?? 0;
}

async function guardarCambios() {
    const body = {
        nombre: document.getElementById("nombre").value,
        descripcion: document.getElementById("descripcion").value,
        unidad: document.getElementById("unidad").value,
        precio: Number(document.getElementById("precio").value),
        cantidad: Number(document.getElementById("cantidad").value)
    };

    const res = await fetch(`http://localhost:3000/inventario/editar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", rol: "admin" },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.msg === "ok") {
        alert("Cambios guardados correctamente");
        window.location.href = "inventario.html";
    } else {
        alert("Error al guardar cambios");
    }
}
