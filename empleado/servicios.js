document.addEventListener("DOMContentLoaded", () => {
    cargarServicios();
});

async function cargarServicios() {
    try {
        const res = await fetch("http://localhost:3000/servicios/listar");
        const data = await res.json();
        pintarServicios(data);
    } catch (err) {
        console.error("Error cargando servicios:", err);
    }
}

function pintarServicios(lista) {
    const tbody = document.getElementById("tabla-servicios");
    tbody.innerHTML = "";

    lista.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${s.id}</td>
            <td>${s.nombre}</td>
            <td>${s.descripcion || "—"}</td>
            <td>$${Number(s.precio_base || 0).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}
