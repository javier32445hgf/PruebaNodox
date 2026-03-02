document.addEventListener("DOMContentLoaded", () => {
    cargarInventario();
});


async function cargarInventario() {
    try {
        const res = await fetch("http://localhost:3000/inventario/listar");
        const data = await res.json();
        pintarTabla(data);
    } catch (e) {
        console.error("Error cargando inventario:", e);
    }
}


function pintarTabla(lista) {
    const tbody = document.getElementById("tabla-inventario");
    tbody.innerHTML = "";

    lista.forEach(mat => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${mat.id}</td>
            <td>${mat.nombre}</td>
            <td>$${mat.precio}</td>
            <td>${mat.cantidad}</td>
        `;

        tbody.appendChild(tr);
    });
}
