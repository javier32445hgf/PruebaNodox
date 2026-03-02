document.addEventListener("DOMContentLoaded", () => {
    cargarServicios();
});


async function cargarServicios() {
    try {
        const res = await fetch("http://localhost:3000/servicios/listar");
        const data = await res.json();
        pintarTabla(data);
    } catch (e) {
        console.error("Error cargando servicios:", e);
    }
}


function pintarTabla(lista) {
    const tbody = document.getElementById("tabla-servicios");
    tbody.innerHTML = "";

    lista.forEach(s => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${s.id}</td>
            <td>${s.nombre}</td>
            <td>${s.descripcion}</td>
            <td>$${s.precio_base}</td>
        `;

        tbody.appendChild(tr);
    });
}
