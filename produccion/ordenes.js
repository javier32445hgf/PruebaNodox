document.addEventListener("DOMContentLoaded", () => {
    cargarOrdenes();
});


async function cargarOrdenes() {
    try {
        const res = await fetch("http://localhost:3000/ordenes/listar");
        const data = await res.json();
        pintarTabla(data);
    } catch (e) {
        console.error("Error cargando ordenes:", e);
    }
}


function pintarTabla(lista) {
    const tbody = document.getElementById("tabla-ordenes");
    tbody.innerHTML = "";

    lista.forEach(o => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${o.id}</td>
            <td>${o.estado}</td>
            <td>${o.fecha_creacion}</td>
            <td>${o.descripcion || "—"}</td>
            <td>
                <button class="btn-ver" onclick="verDetalle(${o.id})">Ver</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}


async function verDetalle(id) {
    const res = await fetch(`http://localhost:3000/ordenes/detalle/${id}`);
    const data = await res.json();

 
    let notas = {};

    if (typeof data.notas_produccion === "string") {
        try {
            notas = JSON.parse(data.notas_produccion);
        } catch (e) {
            console.error("Error al parsear notas:", e);
            notas = {};
        }
    } else if (typeof data.notas_produccion === "object" && data.notas_produccion !== null) {
        notas = data.notas_produccion;
    }

  
    let html = `
        <p><strong>ID:</strong> ${data.id}</p>
        <p><strong>Estado actual:</strong> ${data.estado}</p>

        <p><strong>Descripción:</strong> ${data.descripcion || "—"}</p>

        <p><strong>Notas extra:</strong> ${notas.notas_extra || "—"}</p>

        <hr>
        <h3>Materiales:</h3>
    `;

    if (Array.isArray(notas.materiales)) {
        notas.materiales.forEach(m => {
            html += `<p>• ${m.nombre} — Cant: ${m.cantidad} — $${m.total}</p>`;
        });
    }

    html += `
        <hr>
        <p><strong>Subtotal:</strong> $${notas.subtotal || 0}</p>
        <p><strong>IVA:</strong> $${notas.iva || 0}</p>
        <p><strong>Total:</strong> $${notas.total || 0}</p>
    `;

    document.getElementById("detalle-contenido").innerHTML = html;

    
    document.getElementById("estado-select").value = data.estado;

  
    document.getElementById("btn-guardar-estado").onclick = () => guardarEstado(id);

    document.getElementById("modal-detalle").classList.add("show");
}

function cerrarModal() {
    document.getElementById("modal-detalle").classList.remove("show");
}


async function guardarEstado(id) {
    const nuevoEstado = document.getElementById("estado-select").value;

    try {
        const res = await fetch(`http://localhost:3000/ordenes/estado/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        const data = await res.json();

        alert(data.mensaje);
        cerrarModal();
        cargarOrdenes();

    } catch (e) {
        console.error("Error guardando estado:", e);
    }
}
